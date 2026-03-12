# PROMPTS.md

This file defines prompts used by the RoleFit AI system.

---

# Resume Structuring Prompt

Convert resume text into structured JSON.

Required fields

name
skills
experience
projects
education

Return only valid JSON.

---

# Job Skill Extraction Prompt

Analyze the job description and extract required skills.

Return JSON.

Example output

skills
technologies
keywords

---

# Resume Tailoring Prompt

Rewrite the following resume bullets to match the job description.

Focus on

Skill alignment
Action verbs
Measurable impact

Return bullet points only.

---

# Project Bullet Generator

Convert project description into resume bullet points.

Requirements

Use action verbs
Highlight technologies
Limit to 3–4 bullets

---

# ATS Score Prompt

Compare resume and job description.

Return

ATS score
Missing skills
Improvement suggestions

---

# Application Email Prompt

Generate a professional job application email.

Input

Job title
Company name
Candidate summary

Output

Subject line
Email body
