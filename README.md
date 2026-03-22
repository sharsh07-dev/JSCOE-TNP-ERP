# JSCOE TNP ERP — Fullstack Management System

A production-ready Enterprise Resource Planning (ERP) system for Training & Placement Cells. Features include campus drive management, AI-powered report generation, statistical analytics, and institutional registry tracking.

## 🚀 Deployment Guide

This project is structured as a Monorepo with a `frontend` (Next.js) and `backend` (Node.js/Express).

### 1. Backend Deployment (Render / Heroku)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Required Environment Variables**:
  - `PORT`: `5000`
  - `NODE_ENV`: `production`
  - `FIREBASE_SERVICE_ACCOUNT`: (Paste the full content of your `serviceAccountKey.json` here)
  - `JWT_SECRET`: (Random secure string)
  - `JWT_EXPIRE`: `7d`
  - `GEMINI_API_KEY`: (Your Google AI API Key)
  - `FRONTEND_URL`: `https://your-frontend.vercel.app` (Your Vercel URL)

### 2. Frontend Deployment (Vercel)
- **Root Directory**: `frontend`
- **Framework Preset**: `Next.js`
- **Start Command**: `npm run build && npm start`
- **Required Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api` (Your Backend URL + /api suffix)

---

## 🛠 Features
- **AI Report Generator**: Convert raw text into professional DOCX/PDF reports using Google Gemini.
- **KPI Analysis**: Automated performance scoring for students and drives.
- **AI Assistant**: Conversational data bot linked to your live placement database.
- **Registry Management**: Track selections, attendance, and branch-wise yield.

## 👥 Contributors
- **Harsh Shinde** (Full Stack Developer)
- **Sham Patil** (Full Stack Developer)

---
© 2026 JSCOE Training & Placement Cell.
