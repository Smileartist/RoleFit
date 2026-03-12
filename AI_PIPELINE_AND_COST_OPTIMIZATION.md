# AI_PIPELINE_AND_COST_OPTIMIZATION.md

This document describes the AI processing pipeline used by RoleFit and the strategies implemented to minimize API costs.

The goal is to ensure the system remains scalable while maintaining high-quality resume generation.

---

# Overview

RoleFit uses AI to perform the following tasks:

* job description analysis
* resume tailoring
* project relevance detection
* ATS scoring
* application email generation

Directly sending full resumes and job descriptions to large language models for every request would be inefficient and expensive.

To avoid unnecessary cost, RoleFit uses a structured pipeline combined with caching and embeddings.

---

# High-Level AI Pipeline

User submits job link or opens extension on job page.

↓

Job description extracted.

↓

Keywords and required skills identified.

↓

Project relevance engine selects matching projects.

↓

Resume sections prepared.

↓

AI rewrites resume bullets.

↓

ATS score calculated.

↓

Application email generated.

---

# Detailed Processing Flow

Step 1: Job Input

Job descriptions can enter the system through three methods.

Browser Extension

The extension automatically reads job details from job pages.

Web Dashboard

User pastes job URL into the job input field.

Mobile Workflow

User copies job link from job app and pastes it into RoleFit.

---

Step 2: Job Description Extraction

The backend fetches the job page and extracts readable text.

Extraction techniques may include:

HTML parsing
Readability extraction
AI fallback parsing

The result is structured job data:

Job title
Company name
Job description text

---

Step 3: Keyword Extraction

A lightweight AI model extracts important job keywords.

Example output

Required skills
Technologies
Experience keywords

These keywords are stored in the database for reuse.

---

Step 4: Embedding Generation

Embeddings are generated for:

Job descriptions
User projects
Resume skills

Embeddings allow fast similarity search.

This avoids sending large text blocks to AI models repeatedly.

---

Step 5: Project Relevance Detection

Using vector similarity search, RoleFit selects the most relevant projects.

Example

Frontend job → UI projects selected

Backend job → API projects selected

This step does not require expensive LLM calls.

---

Step 6: Resume Structuring

Instead of sending the full resume text to the AI model every time, resumes are stored in structured format.

Example structure

Name
Skills
Experience
Projects
Education

Only relevant sections are sent to the AI model.

---

Step 7: Resume Tailoring

The AI model rewrites resume sections to match the job description.

Only selected sections are processed.

Example sections sent to AI:

Relevant projects
Experience bullets
Skill highlights

This dramatically reduces token usage.

---

Step 8: ATS Score Generation

A smaller AI model analyzes resume compatibility.

The output includes:

ATS score
Missing skills
Improvement suggestions

---

Step 9: Application Email Generation

AI generates a professional job application email.

Inputs include:

Job title
Company name
Candidate summary

---

# API Cost Reduction Strategies

Several techniques are used to minimize AI costs.

---

## Structured Resume Storage

Resumes are converted to structured JSON during upload.

Example

Skills
Projects
Experience

This prevents sending the entire resume text repeatedly.

---

## Section-Level Processing

Only relevant resume sections are sent to the AI model.

Example

Instead of sending:

Entire resume

Send:

Selected projects
Relevant experience

---

## Embedding-Based Similarity

Project matching uses embeddings instead of LLM prompts.

Vector similarity determines project relevance.

This replaces expensive AI calls with fast database queries.

---

## Multi-Model Strategy

Different models are used for different tasks.

Example pipeline

Cheap model

Keyword extraction
ATS scoring

Mid-level model

Resume rewriting

Optional advanced model

Complex reasoning tasks

---

## Caching Strategy

Repeated requests should not trigger new AI calls.

RoleFit implements several caching layers.

---

### Job Description Cache

If a job description has already been analyzed, reuse stored results.

Cache key

Job URL hash

Stored data

Extracted keywords
Embeddings

---

### Resume Tailoring Cache

If the same resume and job combination is requested again, return the cached tailored resume.

Cache key

User ID
Resume ID
Job ID

---

### Embedding Cache

Embeddings for projects and resumes are stored permanently.

This avoids regenerating embeddings repeatedly.

---

### API Response Cache

AI outputs such as ATS scores and email templates can be cached for reuse.

Example

If multiple users apply to the same job, results can be reused.

---

# Token Reduction Techniques

Several practices reduce token usage.

Remove unnecessary resume text.

Compress prompts.

Send structured JSON instead of raw text.

Limit AI outputs to specific formats.

---

# Example Token Usage

Without optimization

Resume + job description

≈ 8000 tokens

With optimization

Relevant sections only

≈ 2500 tokens

Token reduction

≈ 70 percent

---

# Example Cost Calculation

Using a mid-tier AI model

Input tokens

3000

Output tokens

1500

Total tokens

4500

Estimated cost per request

≈ $0.005

If 1000 resumes are generated

Estimated AI cost

≈ $5

---

# Scaling Strategy

As user volume increases, the system should add additional optimizations.

Queue-based processing

Batch job analysis

Background resume generation

AI worker services

---

# Summary

RoleFit minimizes AI costs by combining:

Structured resume storage
Embedding-based matching
Multi-model pipelines
Caching strategies

This architecture allows the system to remain scalable while keeping API costs extremely low.
