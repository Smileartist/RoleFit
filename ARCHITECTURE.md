# ARCHITECTURE.md

This document describes the system architecture of the RoleFit platform.

---

# System Overview

RoleFit consists of several layers.

Browser Extension

↓

Web Dashboard

↓

Backend API

↓

AI Processing Layer

↓

Database + Vector Store

---

# Browser Extension Layer

The browser extension integrates directly with job listing websites.

Responsibilities

Detect job pages automatically
Extract job details from DOM
Send extracted data to backend

Supported platforms

LinkedIn
Indeed
Internshala
Unstop
Company portals

Technology

Plasmo
React
Chrome Extension APIs

---

# Web Dashboard

The dashboard provides the main user interface.

Users can:

Upload resumes
Paste job URLs
View ATS score
Download tailored resumes
Track job applications

---

# Backend API

The backend handles application logic.

Responsibilities

Resume parsing
Job description analysis
AI orchestration
Resume generation
Application tracking

Technology

Node.js
Express

---

# AI Processing Layer

The AI layer performs intelligent tasks.

Job description analysis
Resume rewriting
Project selection
ATS scoring
Email generation

Embeddings should be used for similarity comparisons.

---

# Resume Processing Pipeline

Resume Upload

↓

Text Extraction

↓

Structured JSON Conversion

↓

AI Resume Optimization

↓

LaTeX Resume Generation

↓

PDF Compilation

---

# Job Description Extraction

There are two input flows.

Extension Flow

Job page opened

↓

Extension detects page

↓

Extract job description

↓

Send to backend

Manual Flow

User pastes job URL

↓

Backend fetches page

↓

Extract job description

↓

AI processing

---

# Database Architecture

Tables include

Users
Projects
Resumes
Jobs
Applications
TailoredResumes

---

# Deployment Architecture

Frontend

Vercel

Backend

Node.js server

Database

Supabase PostgreSQL

---

# Scalability

Future improvements include

Distributed AI workers
Queue-based resume generation
Job recommendation system
