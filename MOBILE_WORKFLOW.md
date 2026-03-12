# MOBILE_WORKFLOW.md

This document describes how RoleFit works on mobile devices.

Many job platforms are primarily used through mobile applications such as LinkedIn, Indeed, Internshala, and Unstop. Since browser extensions cannot run inside mobile apps, RoleFit must support a mobile-compatible workflow.

The mobile workflow ensures that users can still generate tailored resumes even when browsing job listings inside mobile applications.

---

# Mobile Constraints

Mobile job platforms usually run inside dedicated apps.

Examples include:

LinkedIn App
Indeed App
Internshala App
Unstop App

These environments do not allow browser extensions to run.

Because of this limitation, RoleFit must support **manual job link input**.

---

# Mobile Job Link Workflow

The primary mobile workflow relies on copying and pasting job links.

Step-by-step process

1. User opens a job listing inside a mobile job app.
2. User taps the **Share** button on the job page.
3. User selects **Copy Link**.
4. User opens the RoleFit web application.
5. User pastes the job link into the **Job URL field**.
6. RoleFit fetches the job page.
7. The backend extracts the job description.
8. The AI system generates a tailored resume.

---

# Mobile User Interface

The mobile dashboard must contain a dedicated job input section.

Example layout

Paste Job URL

[ Job URL Field ]

[ Generate Tailored Resume ]

This interface allows mobile users to quickly generate resumes without requiring extensions.

---

# Job Description Extraction

When a job URL is submitted, the backend performs the following steps.

Fetch job page content

↓

Extract readable content

↓

Identify job title, company, and description

↓

Send extracted content to AI pipeline

↓

Generate tailored resume

Extraction techniques may include:

HTML parsing
Readability algorithms
AI fallback parsing

---

# Supported Job Platforms

The mobile workflow must support job links from:

LinkedIn
Indeed
Internshala
Unstop
Company career portals

The system must remain platform agnostic.

Only the job description text is required for resume tailoring.

---

# Backend Processing Flow

Mobile Job Link

↓

Backend fetch request

↓

HTML content parsing

↓

Job description extraction

↓

AI analysis

↓

Resume tailoring

↓

ATS scoring

↓

Resume generation

---

# Mobile Performance Requirements

The mobile workflow must be optimized for speed.

Requirements include:

Fast job page extraction
Minimal AI token usage
Caching of repeated job descriptions

Typical generation time should remain under 10 seconds.

---

# Future Improvements

Future mobile features may include:

Native mobile application
Share-to-RoleFit integration
Job bookmarking
Push notifications for resume generation

---

# Summary

The mobile workflow ensures RoleFit remains accessible even when browser extensions cannot run.

By supporting job link input, the platform remains compatible with all major job applications used on mobile devices.
