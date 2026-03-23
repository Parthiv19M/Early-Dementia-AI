# Workspace

## Overview

Early Dementia Detection via Speech Analysis — a full-stack AI web application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI (Replit AI Integrations) — gpt-4o-mini-transcribe for STT, gpt-5.2 for chatbot
- **Frontend**: React + Vite + TailwindCSS + framer-motion + recharts + lucide-react

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── dementia-detection/ # React frontend (at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server integration
│   └── integrations-openai-ai-react/   # OpenAI React integration
```

## Features

- **Voice Recording**: Microphone recording with waveform visualization
- **Audio Upload**: Upload audio files for analysis
- **Speech-to-Text**: OpenAI Whisper (gpt-4o-mini-transcribe)
- **NLP Analysis**: Word repetition, vocabulary diversity, pause detection, coherence scoring
- **Risk Classification**: Normal / Mild Cognitive Impairment / High Risk
- **History Tracking**: Store and retrieve past reports per patient ID
- **Cognitive Trend Chart**: Line chart showing risk scores over time (recharts)
- **Doctor Dashboard**: Patient-centric view for healthcare providers
- **AI Chatbot**: CognoCare Assistant for cognitive health tips (gpt-5.2)
- **Multilingual**: English + Telugu (తెలుగు)

## API Endpoints

- `GET /api/healthz` — health check
- `POST /api/analysis/transcribe` — multipart audio upload → transcribe + analyze
- `POST /api/analysis/text` — text body → analyze
- `GET /api/reports?userId=xxx` — fetch reports for a user
- `POST /api/reports` — save a report
- `GET /api/reports/:id` — get single report
- `DELETE /api/reports/:id` — delete a report
- `POST /api/chatbot/message` — cognitive health chatbot

## Database Schema

- `reports` table: id, userId, transcript, riskLevel, riskScore, confidence, features (jsonb), problematicPatterns (jsonb), recommendations (jsonb), language, createdAt
