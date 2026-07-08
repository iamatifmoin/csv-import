# GrowEasy CSV Importer

AI-powered CSV importer that accepts any CSV layout and extracts structured CRM lead records using Claude AI. Upload a Facebook lead export, a Google Ads download, a real estate CRM dump, or a handmade spreadsheet - the AI figures out the column mapping automatically.

[Frontend Deployment- csv-import-six.vercel.app](https://csv-import-six.vercel.app/)

[Backend Deployment- csv-import-gzdi.onrender.com](https://csv-import-gzdi.onrender.com/)

---

## Features

- Any CSV format - no fixed column names required
- AI field mapping - Claude maps columns intelligently, no manual configuration
- Real-time progress - batch-by-batch extraction streamed live via SSE
- Virtualized tables - preview and results handle thousands of rows without lag
- Download and copy - export extracted records as CSV or copy as JSON
- Stateless - no database, no user accounts, no data retention

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI | Claude (`claude-sonnet-4-6`) via Anthropic SDK |
| Table rendering | TanStack Table v8 + TanStack Virtual |
| CSV parsing | PapaParse (frontend), csv-parse (backend) |
| Tests | Vitest + Testing Library (frontend), Jest + ts-jest (backend) |

---

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- An [Anthropic API key](https://console.anthropic.com/)

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/groweasy-importer.git
cd groweasy-importer
npm install
```

### 2. Set up environment variables

**Backend:**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=4000
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

**Frontend:**

```bash
cp frontend/.env.local.example frontend/.env.local
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000` - no changes needed for local dev.

### 3. Run both servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

---

## Running Tests

```bash
npm run test
```

Or per workspace:

```bash
npm run test --workspace=backend
npm run test --workspace=frontend
```

---

## How AI Extraction Works

The backend sends raw CSV records to Claude in batches of 15. Each batch includes a detailed system prompt specifying the 15 CRM fields, all allowed enum values for `crm_status` and `data_source`, and rules for handling edge cases such as multiple phone numbers, missing fields, and ambiguous column names. Claude returns structured JSON for each batch, which the backend merges into the final result and streams back to the frontend via SSE.

Batch failures retry up to 2 times with exponential backoff. If all retries fail, records in that batch are marked as skipped rather than crashing the whole import.

---

## Project Structure

```text
groweasy-importer/
├── shared/         # Shared TypeScript types (CRMRecord, SSEEvent, etc.)
├── frontend/       # Next.js 14 App Router
│   ├── app/        # Root layout and main page (step state machine)
│   ├── components/ # DropZone, PreviewTable, ResultsTable, etc.
│   └── lib/        # api.ts (SSE client), csv.ts (PapaParse wrapper), types.ts
└── backend/        # Express API
    └── src/
        ├── routes/    # POST /api/extract (SSE), GET /api/health
        ├── services/  # csv.service.ts, ai.service.ts
        └── prompts/   # extraction.ts - the core AI prompt
```

---

## API

### `POST /api/extract`

Accepts a CSV file as `multipart/form-data` with field name `file` and max size 10 MB.

Returns a `text/event-stream` response. Event sequence:

```text
data: {"type":"start","totalBatches":3,"totalRecords":45}
data: {"type":"batch","batchNumber":1,"totalBatches":3,"extractedInBatch":14,"skippedInBatch":1}
data: {"type":"complete","result":{...}}
```

### `GET /api/health`

Returns `{"status":"ok","timestamp":"..."}`.

---