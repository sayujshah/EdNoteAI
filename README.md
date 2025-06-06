# EdNoteAI

EdNoteAI is an AI-powered web application (and planned Chrome extension) designed to help students and professionals transform video and audio lectures into structured, academic-grade notes. The platform leverages state-of-the-art speech-to-text and language models to generate transcriptions, summaries, and key points, making learning and review more efficient.

---

## 🚀 What Has Been Built

### Core Features

- **User Authentication:** Secure sign-up, login, and account management using Supabase Auth.
- **File Upload:** Upload audio/video files via a dedicated dashboard page. Files are stored in AWS S3.
- **Automated Transcription:** Uploaded media is transcribed using an AWS Lambda function powered by OpenAI Whisper.
- **AI Note Generation:** Transcripts are processed by another Lambda function (using GPT-4o-mini) to generate segmented notes and markdown content.
- **Realtime Updates:** The analysis page uses Supabase Realtime to update the UI as soon as processing is complete.
- **Media Playback:** Users can play back uploaded audio and video files directly in the browser.
- **Notes Display:** Transcriptions and AI-generated notes are rendered in markdown, with support for LaTeX formatting. Users can view summaries and key points.
- **Library:** Users can view and manage all their uploaded media and generated notes in a searchable, filterable library.
- **Pricing & Subscription UI:** Static pricing plans are displayed, with Stripe integration in progress.
- **Modern UI:** Built with Next.js, React, Tailwind CSS, and a custom UI component library.

### Technical Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Supabase Client, `react-markdown`, `react-katex`
- **Backend:** Next.js API Routes, Supabase (PostgreSQL, Auth, Realtime), AWS Lambda, AWS S3, OpenAI API
- **Database:** Videos, transcripts, notes, and user settings are all managed in a relational schema with proper relationships and RLS (Row Level Security) policies.

---

## 🛠️ What's Left To Be Built

### High Priority

- **Chrome Extension:** Build and integrate a Chrome extension that allows users to transcribe audio directly from any video playing in their browser and save notes to their EdNoteAI library. This will enable seamless capture from platforms like YouTube, Coursera, Zoom, and more.
- **Note Editing:** Add UI and backend logic for users to edit and customize generated notes directly in the app.

### Additional Features (Planned)

- **Segment Boundary Adjustment:** Enable users to manually adjust concept segment boundaries in notes.
- **Metadata Management:** Add, edit, and display metadata (course title, professor, date, tags) for each media item.
- **Export Formats:** Complete backend logic for exporting notes in LaTeX, Markdown, Word (.docx), and plain text.
- **Video Capture:** Add the ability to capture video directly from the browser (not just file uploads).
- **Visual Context Extraction:** Analyze on-screen visuals and integrate descriptions into notes.
- **Stripe Integration:** Complete payment processing for subscriptions and one-time billing.
- **Granular Progress Feedback:** Add more detailed real-time progress indicators during upload and processing.
- **Comprehensive Testing:** Implement thorough testing for all features.
- **Automated Deployment:** Set up CI/CD and automated deployment (e.g., with AWS Amplify).
- **Monitoring:** Add monitoring for the application and Lambda functions.

---

## 📝 Project Structure

- `src/app/`: Next.js app directory (pages, API routes, dashboard, analysis, upload, etc.)
- `src/components/`: Reusable UI components (buttons, cards, modals, etc.)
- `src/lib/`: Utility functions and service integrations (Supabase, Stripe, etc.)
- `lambda_function-audio_tran.py`: AWS Lambda for transcription (Python, managed in AWS)
- `lambda_function-note_gen.py`: AWS Lambda for note generation (Python, managed in AWS)

---

## 🧭 Next Steps

1. **Build and launch the Chrome Extension for browser-based video/audio capture and note saving.**
2. **Add note editing and customization features to the web app.**
3. **Continue to expand export, metadata, and progress feedback features.**
4. **Complete Stripe integration and expand testing, deployment, and monitoring.**

---

## 🙌 Contributing

Contributions are welcome! Please open issues or pull requests for bugs, feature requests, or improvements.

---

## 📄 License

[MIT](LICENSE)
