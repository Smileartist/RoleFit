# TASKS.md

This document defines the development roadmap for RoleFit.

---

# Phase 1 — Project Setup

Initialize repository.

Create project structure.

rolefit
frontend
backend
extension
database

---

# Phase 2 — Resume Processing

Implement resume upload.

Parse supported formats

PDF
DOCX

Extract text from resumes.

Convert resume text to structured JSON.

Store parsed resume data.

---

# Phase 3 — Project Knowledge Base

Create project CRUD APIs.

Allow users to store project information.

Fields include

Project name
Description
Tech stack
Features
Metrics

---

# Phase 4 — Job Input

Add job URL input field.

Allow users to paste job links.

Backend must fetch job page content.

Extract job description.

Store job data.

---

# Phase 5 — AI Job Analysis

Extract required skills from job description.

Generate embeddings for job text.

Store embeddings for comparison.

---

# Phase 6 — Project Matching

Compare job embeddings with project embeddings.

Rank projects by relevance.

Select top projects for resume.

---

# Phase 7 — Resume Tailoring

Rewrite resume bullets.

Highlight relevant technologies.

Generate ATS compatibility score.

---

# Phase 8 — Resume Generation

Create LaTeX templates.

Inject tailored content.

Compile PDF resume.

Store resume versions.

---

# Phase 9 — Job Tracker

Create job tracking system.

Application stages

Saved
Applied
Interview
Offer
Rejected

---

# Phase 10 — Email Generator

Generate application emails.

Allow copy-to-clipboard.

---

# Phase 11 — Browser Extension

Create RoleFit extension.

Detect job pages automatically.

Extract job descriptions.

Send job data to backend.

Display resume generation button.

---

# Phase 12 — Deployment

Deploy frontend.

Deploy backend.

Configure domain

rolefit.smileartist.org
