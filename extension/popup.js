const API_BASE = "http://localhost:3000/api";

let token = "";
let jobData = null;

// Elements
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginError = document.getElementById("loginError");
const mainError = document.getElementById("mainError");
const mainStatus = document.getElementById("mainStatus");
const loginBtn = document.getElementById("loginBtn");
const extractBtn = document.getElementById("extractBtn");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const jobCard = document.getElementById("jobCard");

// Load token on startup
chrome.storage.local.get(["rolefit_token"], (result) => {
  if (result.rolefit_token) {
    token = result.rolefit_token;
    showMain();
  }
});

function showMain() {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
}

function showLogin() {
  mainSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hideError(el) { el.classList.add("hidden"); }
function showStatus(msg) {
  mainStatus.textContent = msg;
  mainStatus.classList.remove("hidden");
}

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) return;

  hideError(loginError);
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    token = data.token;
    chrome.storage.local.set({ rolefit_token: token });
    showMain();
  } catch (err) {
    showError(loginError, err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  chrome.storage.local.remove("rolefit_token");
  token = "";
  jobData = null;
  showLogin();
});

// Extract Job
extractBtn.addEventListener("click", async () => {
  hideError(mainError);
  showStatus("Extracting job data...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobFromPage,
    });

    const extracted = results[0]?.result;
    if (extracted && (extracted.description || extracted.title)) {
      jobData = extracted;
      // If no description was extracted via selectors, use a fallback message
      if (!extracted.description) {
        extracted.description = "Job page detected but description could not be auto-extracted. Please paste the job description manually on the dashboard.";
      }
      document.getElementById("jobTitle").textContent = extracted.title || "Job Detected";
      document.getElementById("jobCompany").textContent = extracted.company ? `🏢 ${extracted.company}` : "";
      document.getElementById("jobDesc").textContent = (extracted.description || "").substring(0, 150) + "...";
      jobCard.classList.remove("hidden");
      sendBtn.classList.remove("hidden");
      showStatus("✅ Job extracted successfully!");
    } else {
      showError(mainError, "Could not detect a job listing. Try reloading the page and clicking Extract again.");
      mainStatus.classList.add("hidden");
    }
  } catch (err) {
    showError(mainError, "Extraction error: " + err.message);
    mainStatus.classList.add("hidden");
  }
});

// Send to RoleFit
sendBtn.addEventListener("click", async () => {
  if (!jobData) return;
  sendBtn.disabled = true;
  showStatus("Sending job to RoleFit...");

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
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showStatus("✅ Job saved! Open RoleFit dashboard to tailor your resume.");
  } catch (err) {
    showError(mainError, err.message);
  } finally {
    sendBtn.disabled = false;
  }
});

/**
 * Runs in the context of the job listing page.
 * Extracts job title, company, and description from the DOM.
 */
function extractJobFromPage() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  let title = "", company = "", description = "";

  // Helper: try multiple selectors, return first match
  function q(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText?.trim()) return el.innerText.trim();
    }
    return "";
  }

  // Helper: collect text from multiple elements
  function qAll(selectors) {
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length) {
        return Array.from(els).map(e => e.innerText?.trim()).filter(Boolean).join('\n\n');
      }
    }
    return "";
  }

  if (hostname.includes("linkedin.com")) {
    title = q([".job-details-jobs-unified-top-card__job-title", ".top-card-layout__title", "h1.t-24", "h1"]);
    company = q([".job-details-jobs-unified-top-card__company-name a", ".topcard__org-name-link", "a[data-tracking-control-name*='company']"]);
    description = q([".jobs-description__content .jobs-box__html-content", ".jobs-description__content", ".description__text", ".show-more-less-html__markup"]);
  }
  else if (hostname.includes("indeed.com")) {
    title = q([".jobsearch-JobInfoHeader-title", "h1[data-testid='jobsearch-JobInfoHeader-title']", "h1"]);
    company = q(["[data-testid='inlineHeader-companyName'] a", "[data-testid='inlineHeader-companyName']", ".jobsearch-CompanyInfoContainer a"]);
    description = q(["#jobDescriptionText", ".jobsearch-jobDescriptionText", "#jobDetailsSection"]);
  }
  else if (hostname.includes("internshala.com")) {
    title = q([
      ".profile_on_detail_page", ".heading_4_5", ".profile",
      "#internship_detail_container h1", ".internship_details h1",
      "h1", ".heading_4_5.profile"
    ]);
    company = q([
      ".company_name a", ".link_display_header", ".company_name",
      ".company-name a", ".internship_other_details_container .company_name",
      "a.link_display_header"
    ]);
    // Internshala: grab all section content
    description = q([
      ".text-container", ".internship_details",
      "#about-internship", ".about_internship_details",
      ".internship_details_container", ".detail-section"
    ]);
    // If still empty, try gathering all visible text from the job detail area
    if (!description) {
      description = qAll([
        ".internship_details .section_heading, .internship_details .text-container",
        ".detail_view .content-container",
        "main", "article"
      ]);
    }
  }
  else if (hostname.includes("unstop.com")) {
    title = q(["h1", ".opportunity-title", ".single-opp-title"]);
    company = q([".organisation-name", ".host-name", ".org-name"]);
    description = q([".detail-section", ".about-section", ".content-section", ".single-opp-detail"]);
  }
  else if (hostname.includes("naukri.com")) {
    title = q([".jd-header-title", "h1.jd-header-title", "h1"]);
    company = q([".jd-header-comp-name a", ".jd-header-comp-name"]);
    description = q([".job-desc", ".dang-inner-html", "#job-desc-container"]);
  }

  // GENERIC FALLBACK — works on any job page
  if (!description) {
    title = title || q(["h1", "[class*='title']", "title"]) || document.title;
    // Try common job description containers
    description = q([
      "[class*='job-description']", "[class*='jobDescription']",
      "[class*='job-detail']", "[class*='jobDetail']",
      "[id*='job-description']", "[id*='jobDescription']",
      "article", "main", "[role='main']"
    ]);
    if (!description) {
      // Last resort: grab body text but skip nav/header/footer
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll("nav, header, footer, script, style, aside, [role='navigation']").forEach(el => el.remove());
      description = clone.innerText.substring(0, 8000);
    }
  }

  return { title, company, description: description.substring(0, 10000), url };
}
