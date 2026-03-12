# RoleFit

RoleFit is an AI-powered resume tailoring platform built under the SmileArtist ecosystem.

The system analyzes job descriptions and automatically generates resumes optimized for specific roles.

RoleFit is designed to help job seekers apply faster by automatically aligning their resume with job requirements and improving ATS compatibility.

---

# Platform Modes

RoleFit is designed to work in three modes.

Web Application
Browser Extension
Mobile Job Link Workflow

These modes ensure the system works across all devices and job platforms.

---

# Supported Job Platforms

RoleFit is platform-agnostic and works with any job listing that contains a job description.

Supported platforms include:

LinkedIn
Indeed
Internshala
Unstop
Company career portals
Startup job boards

The system only requires the job description text to function.

---

# Core Features

## AI Resume Tailoring

RoleFit automatically modifies resumes to align with job descriptions.

The system analyzes:

Required skills
Technologies mentioned
Responsibilities
Experience requirements

The AI then rewrites resume sections to match the role.

---

## ATS Optimization

Resumes are standardized using LaTeX templates to ensure clean structure and consistent formatting.

Benefits include:

Improved compatibility with Applicant Tracking Systems
Better keyword visibility
Consistent resume structure

---

## Automatic Project Selection

RoleFit analyzes the job description and identifies which projects from the user's profile are most relevant.

Example:

Frontend job → UI-focused projects
Backend job → API or database projects
AI job → machine learning projects

Only the most relevant projects are included in the tailored resume.

---

## Resume Bullet Optimization

Project descriptions and work experience bullets are rewritten to highlight measurable impact and technical relevance.

Example transformation:

Before

Built a React web app.

After

Developed a scalable React-based web application integrating REST APIs and dynamic state management.

---

## ATS Compatibility Score

RoleFit evaluates how well a resume aligns with a job description.

Example output:

ATS Score: 83 / 100

Suggestions

Add missing keywords
Highlight specific technologies
Improve action verbs

---

## Job Application Email Generator

RoleFit generates professional application emails.

Example:

Subject: Application for Frontend Developer Role

Dear Hiring Manager,

I am writing to express my interest in the Frontend Developer position. My experience building scalable React applications and integrating backend APIs aligns strongly with the requirements of this role.

Best regards
Dhruv Singh Rajpoot

---

# Web Application

The RoleFit web application provides the main dashboard.

Users can:

Upload resumes
Paste job links
Generate tailored resumes
Track job applications

URL

https://rolefit.smileartist.org

---

## Desktop Job URL Workflow

Users can paste job links directly.

Example UI

Paste Job URL
Generate Resume

Workflow

1 User uploads resume
2 User pastes job link
3 Backend extracts job description
4 AI generates tailored resume

This ensures the system works even without the browser extension.

---

# Browser Extension

RoleFit includes an installable browser extension.

Supported browsers

Chrome
Edge
Brave

---

## Extension Behavior

When activated on a job page, the extension automatically:

Detects job listing pages
Extracts job title
Extracts job description
Extracts company name

The user can then click:

Tailor Resume

The extension sends the job data to the backend API, which generates the tailored resume.

---

# Mobile Workflow

Mobile apps such as LinkedIn and Indeed do not support browser extensions.

To solve this, RoleFit supports job link input.

Workflow

1 User opens job post in mobile app
2 User copies job link
3 User pastes job link in RoleFit
4 Resume is generated

---

# Resume Processing Pipeline

Resume Upload

↓

Text Extraction

↓

Structured JSON Conversion

↓

AI Resume Tailoring

↓

LaTeX Template Injection

↓

PDF Resume Generation

---

# High-Level Architecture

Browser Extension

↓

Web Dashboard

↓

Backend API

↓

AI Processing Layer

↓

Database

---

# Technology Stack

Frontend

Next.js
TailwindCSS

Browser Extension

Plasmo
React

Backend

Node.js
Express

Database

Supabase PostgreSQL

AI

OpenAI API

Vector Search

pgvector

Deployment

Vercel

---

# Domain Structure

RoleFit is part of the SmileArtist ecosystem.

smileartist.org
app.smileartist.org
rolefit.smileartist.org

---

# License

MIT License
