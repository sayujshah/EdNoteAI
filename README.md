<img src="Logo.png" alt="EdNoteAI" width="200" />

EdNoteAI is an AI-powered web application that helps students and professionals transform video and audio lectures into structured, academic-grade notes. The platform uses speech-to-text and language models to generate transcriptions, summaries, and key points.

---

## Features

- **User authentication:** Sign-up, login, and account management with Supabase Auth (password reset, change password, account deletion).
- **File upload:** Upload audio/video via the dashboard. Files are stored in AWS S3 with presigned URLs.
- **Transcription:** Uploaded media is transcribed by an AWS Lambda function using OpenAI Whisper.
- **AI note generation:** Transcripts are processed by a Lambda function (Google Gemini) to produce Markdown notes with LaTeX math.
- **Real-time updates:** The analysis page uses Supabase Realtime so the UI updates as soon as processing finishes.
- **Media playback:** Playback of uploaded audio and video in the browser.
- **Notes display:** Transcriptions and AI notes are rendered in Markdown with LaTeX (KaTeX). Summaries and key points are shown.
- **Library:** Searchable, filterable library of media and generated notes.
- **Subscriptions & billing:** Stripe integration for plans, checkout, billing portal, webhooks, and usage-based limits.
- **Export:** Export notes/transcripts in multiple formats (e.g. Markdown, plain text).

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, `react-markdown`, `react-katex`
- **Backend:** Next.js API routes, Supabase (PostgreSQL, Auth, Realtime), AWS Lambda, AWS S3, OpenAI API, Google Gemini API, Stripe, Resend
- **Database:** Relational schema for videos, transcripts, notes, library, subscriptions, and user settings, with RLS.

---

## Project Structure

- `src/app/` — Next.js app (pages, API routes, dashboard, analysis, upload, library, subscription, etc.)
- `src/components/` — Reusable UI (buttons, cards, modals, etc.)
- `src/lib/` — Services and utilities (Supabase, Stripe, subscription, email, auth)
- `src/utils/` — Supabase client helpers and shared utilities
- `chrome-extension/` — Chrome extension (experimental; see `chrome-extension/README.md`)
- `lambda_function-audio_trans.py` — AWS Lambda for transcription (OpenAI Whisper)
- `lambda_function-note_gen.py` — AWS Lambda for note generation (Google Gemini)

---

## Environment Variables

Create a `.env.local` file (never commit it). Example variables:

**Next.js app**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://example.com`) |
| `NEXT_PUBLIC_SITE_URL` | Site URL for emails/links |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `REGION_AWS` | AWS region |
| `ACCESS_KEY_ID_AWS` | AWS access key ID |
| `SECRET_ACCESS_KEY_AWS` | AWS secret access key |
| `S3_BUCKET_NAME_AWS` | S3 bucket name |
| `TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS` | Transcription Lambda name |
| `CLEANUP_SERVICE_KEY` | Optional; for batch S3 cleanup service |

**Transcription Lambda** (`lambda_function-audio_trans.py`)

- `SUPABASE_URL`, `SUPABASE_KEY` — Supabase (service role)
- `OPENAI_API_KEY` — OpenAI API key
- `NOTE_GENERATOR_LAMBDA_ARN` — ARN of the note-generation Lambda

**Note-generation Lambda** (`lambda_function-note_gen.py`)

- `SUPABASE_URL`, `SUPABASE_KEY` — Supabase (service role)
- `GEMINI_API_KEY` — Google Gemini API key

---

## Running Locally

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local` with the variables above.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

Deploy the Lambda functions to AWS with the appropriate env vars and wire S3/upload/transcription/note-generation as in the API routes.

---

## Chrome Extension

A Chrome extension lives in `chrome-extension/` for capturing tab audio and sending it to EdNoteAI. It is **not fully functional** at this time. See `chrome-extension/README.md` for details and development setup.

---

## Contributing

Contributions are welcome. Please open issues or pull requests for bugs, features, or improvements.

---

## License

[MIT](LICENSE)
