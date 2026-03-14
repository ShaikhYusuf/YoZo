# YoZo — Unified Learning Platform

A comprehensive educational platform combining enterprise-grade school management with AI-powered content generation, voice interaction, and gamification.

## Architecture

```
YoZo/
├── client/          # Angular 20 + Material + Chart.js + Tailwind
├── server/          # Node.js + Express + TypeScript + Inversify DI + Sequelize
├── ai-service/      # Python Flask + LangChain + Ollama + SentenceTransformers
├── data-generation/ # LangGraph pipeline for textbook generation
└── database/        # Unified PostgreSQL schema
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- PostgreSQL ≥ 16
- Ollama (for AI features)

### 1. Database Setup
```bash
# Create the database
createdb -U postgres yozo

# Run the schema
psql -U postgres -d yozo -f database/schema.sql
```

### 2. Node.js Server
```bash
cd server
cp environment/env src/.env    # Configure your DB credentials
npm install
npm run build
npm start                      # Runs on http://localhost:3000
```

### 3. AI Service (Python)
```bash
cd ai-service
python -m venv .env
source .env/Scripts/activate   # Windows: .env\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Configure your DB credentials
python app.py                  # Runs on http://localhost:5000
```

### 4. Angular Client
```bash
cd client
npm install
npm start                      # Runs on http://localhost:4200
```

## Key Features

| Feature | Source |
|---|---|
| Multi-tenant school management | Test/ (Node.js) |
| 5-role auth (admin/principal/teacher/student/parent) | Merged |
| AI content generation (lessons, quizzes, T/F, short Q) | Dip-Project/ (Python) |
| Voice interaction (TTS + STT) | Dip-Project/ (Browser APIs) |
| Gamification (XP, streaks, badges, levels) | Dip-Project/ → TypeScript |
| Data visualization (Chart.js) | Merged |
| Rate limiting | Added |
| bcrypt password hashing | Dip-Project/ |
| Health monitoring | Test/ |

## Tech Stack

- **Frontend:** Angular 20, Material Design, Chart.js, Tailwind CSS
- **Primary Backend:** Node.js, Express, TypeScript, Inversify, Sequelize
- **AI Backend:** Python, Flask, LangChain, Ollama, SentenceTransformers
- **Database:** PostgreSQL
- **Auth:** bcrypt + JWT
