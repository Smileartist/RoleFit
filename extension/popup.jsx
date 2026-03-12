import { useState, useEffect } from "react"

// RoleFit API configuration
const API_BASE = "http://localhost:3000/api"

function IndexPopup() {
  const [token, setToken] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [jobData, setJobData] = useState(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Load token from storage on mount
  useEffect(() => {
    chrome.storage.local.get(["rolefit_token"], (result) => {
      if (result.rolefit_token) {
        setToken(result.rolefit_token)
        setLoggedIn(true)
      }
    })
  }, [])

  // Login
  async function handleLogin(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      chrome.storage.local.set({ rolefit_token: data.token })
      setToken(data.token)
      setLoggedIn(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Logout
  function handleLogout() {
    chrome.storage.local.remove("rolefit_token")
    setToken("")
    setLoggedIn(false)
    setJobData(null)
  }

  // Extract job from current page
  async function extractJob() {
    setStatus("Extracting job data...")
    setError("")

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJobFromPage,
      })

      const extracted = results[0]?.result
      if (extracted && extracted.description) {
        setJobData(extracted)
        setStatus("Job extracted successfully!")
      } else {
        setError("Could not detect a job listing on this page.")
        setStatus("")
      }
    } catch (err) {
      setError("Failed to extract job data: " + err.message)
      setStatus("")
    }
  }

  // Send job to backend and trigger tailoring
  async function sendToRoleFit() {
    if (!jobData) return
    setLoading(true)
    setStatus("Sending job to RoleFit...")

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          source_url: jobData.url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStatus("✅ Job saved! Open RoleFit dashboard to tailor your resume.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: 360,
      fontFamily: "'Inter', sans-serif",
      background: "#0f172a",
      color: "#f1f5f9",
      padding: "1.25rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.5rem" }}>🎯</span>
        <h1 style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          background: "linear-gradient(135deg, #6366f1, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          RoleFit
        </h1>
      </div>

      {!loggedIn ? (
        /* Login Form */
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>Sign in to your RoleFit account</p>
          {error && <div style={{ padding: "0.5rem", background: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: "0.375rem", fontSize: "0.8125rem" }}>{error}</div>}
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        /* Main Panel */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {error && <div style={{ padding: "0.5rem", background: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: "0.375rem", fontSize: "0.8125rem" }}>{error}</div>}
          {status && <div style={{ padding: "0.5rem", background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: "0.375rem", fontSize: "0.8125rem" }}>{status}</div>}

          <button onClick={extractJob} style={btnPrimary} disabled={loading}>
            🔍 Extract Job from Page
          </button>

          {jobData && (
            <div style={{ background: "#1e293b", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.8125rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{jobData.title || "Job Detected"}</div>
              {jobData.company && <div style={{ color: "#818cf8", marginBottom: "0.25rem" }}>🏢 {jobData.company}</div>}
              <div style={{ color: "#94a3b8" }}>{jobData.description?.substring(0, 150)}...</div>
            </div>
          )}

          {jobData && (
            <button onClick={sendToRoleFit} style={btnPrimary} disabled={loading}>
              ✨ Send to RoleFit & Tailor Resume
            </button>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a href="http://localhost:3000/dashboard" target="_blank" rel="noopener"
              style={{ ...btnSecondary, flex: 1, textAlign: "center", textDecoration: "none" }}>
              Open Dashboard
            </a>
            <button onClick={handleLogout} style={{ ...btnSecondary, flex: 0 }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* Styles */
const inputStyle = {
  padding: "0.5rem 0.75rem",
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "0.5rem",
  color: "#f1f5f9",
  fontSize: "0.875rem",
  outline: "none",
}

const btnPrimary = {
  padding: "0.5rem 1rem",
  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "white",
  border: "none",
  borderRadius: "0.5rem",
  fontWeight: 600,
  fontSize: "0.8125rem",
  cursor: "pointer",
}

const btnSecondary = {
  padding: "0.5rem 0.75rem",
  background: "#1e293b",
  color: "#f1f5f9",
  border: "1px solid #334155",
  borderRadius: "0.5rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
}

export default IndexPopup

/**
 * This function runs in the context of the job listing page.
 * It attempts to extract job title, company, and description from the DOM.
 */
function extractJobFromPage() {
  const url = window.location.href
  const hostname = window.location.hostname

  let title = ""
  let company = ""
  let description = ""

  // --- LinkedIn ---
  if (hostname.includes("linkedin.com")) {
    title = document.querySelector(".job-details-jobs-unified-top-card__job-title, .top-card-layout__title, h1")?.innerText?.trim() || ""
    company = document.querySelector(".job-details-jobs-unified-top-card__company-name, .topcard__org-name-link, a[data-tracking-control-name*='company']")?.innerText?.trim() || ""
    description = document.querySelector(".jobs-description__content, .description__text, .show-more-less-html__markup")?.innerText?.trim() || ""
  }
  // --- Indeed ---
  else if (hostname.includes("indeed.com")) {
    title = document.querySelector(".jobsearch-JobInfoHeader-title, h1[data-testid='jobsearch-JobInfoHeader-title']")?.innerText?.trim() || ""
    company = document.querySelector("[data-testid='inlineHeader-companyName'], .jobsearch-CompanyInfoContainer a")?.innerText?.trim() || ""
    description = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText")?.innerText?.trim() || ""
  }
  // --- Internshala ---
  else if (hostname.includes("internshala.com")) {
    title = document.querySelector(".profile_on_detail_page, .heading_4_5")?.innerText?.trim() || ""
    company = document.querySelector(".company_name a, .link_display_header")?.innerText?.trim() || ""
    description = document.querySelector(".text-container, .internship_details .section_heading ~ div")?.innerText?.trim() || ""
  }
  // --- Unstop ---
  else if (hostname.includes("unstop.com")) {
    title = document.querySelector("h1")?.innerText?.trim() || ""
    company = document.querySelector(".organisation-name, .host-name")?.innerText?.trim() || ""
    description = document.querySelector(".detail-section, .about-section, .content-section")?.innerText?.trim() || ""
  }
  // --- Generic fallback ---
  else {
    title = document.querySelector("h1")?.innerText?.trim() || document.title
    const bodyText = document.body.innerText
    description = bodyText.substring(0, 8000)
  }

  return { title, company, description, url }
}
