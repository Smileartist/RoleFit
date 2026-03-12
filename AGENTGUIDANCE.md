# AGENTGUIDANCE.md

This document defines development guidelines for AI agents and developers contributing to the RoleFit platform.

RoleFit is an AI-powered resume tailoring system designed to generate optimized resumes based on job descriptions.

---

# Project Goal

The primary goal of RoleFit is to automatically align user resumes with job descriptions.

The system should:

Analyze job descriptions
Detect required skills
Match relevant user projects
Rewrite resume sections
Generate ATS-compatible resumes
Generate application emails

---

# Platform Modes

RoleFit must function in three modes.

### Web Application

The main user interface where users manage resumes and generate tailored resumes.

### Browser Extension

A browser extension that automatically reads job details from job listing pages.

### Mobile Job Link Input

A mobile-compatible workflow where users paste job links from job apps.

---

# Browser Extension Requirements

The extension must automatically detect job listings.

Responsibilities:

Detect job pages
Extract job title
Extract job description
Extract company name

Supported platforms include:

LinkedIn
Indeed
Internshala
Unstop
Company career portals

Once data is extracted, the extension sends job data to the backend API.

---

# Web Dashboard Requirements

The web dashboard must allow users to manually input job links.

UI requirement:

Paste Job URL field

Example flow:

User uploads resume
User pastes job URL
Backend fetches job page
Job description extracted
Resume generated

This ensures RoleFit works without the extension.

---

# Resume Processing Rules

All uploaded resumes must be converted into structured data.

Processing pipeline:

Upload Resume

↓

Extract Resume Text

↓

Convert to JSON structure

↓

AI resume optimization

↓

Generate LaTeX template

↓

Compile final PDF

---

# AI Responsibilities

The AI layer performs the following tasks.

Job skill extraction
Resume bullet rewriting
Project relevance detection
ATS scoring
Application email generation

AI prompts must return structured outputs whenever possible.

---

# AI Cost Optimization

To reduce token usage:

Use embeddings for similarity search
Cache repeated job analysis results
Avoid sending entire resumes when structured data exists

Only the final resume rewrite should require a large AI call.

---

# Security Requirements

Agents must implement:

Authentication and authorization
Input validation
Secure file uploads
Rate limiting

Sensitive data must never be logged.

---

# Code Organization

Controllers

Handle HTTP request routing.

Services

Handle business logic.

AI Modules

Handle AI interactions.

Database Layer

Handles persistent storage.

---

# Development Principles

Code should be:

Modular
Maintainable
Well documented

New features must include documentation updates.
