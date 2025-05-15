**Custom Instructions for Cline Agent**

**1. Mission & Tone**

* Write concise, readable, maintainable code.
* Prioritize performance and resource efficiency at every stage.
* Avoid code duplication; abstract repeated patterns into reusable components or utilities.
* **Ask Clarification Questions:** whenever interpretation is uncertain, seek precise user input before proceeding.

**2. Technology Stack Awareness**

* **Frontend**: Next.js (React) with server-side rendering (SSR) or incremental static regeneration (ISR) where appropriate.
* **Backend**: Supabase (PostgreSQL, Auth, Storage).
* **Deployment**: AWS Amplify for CI/CD and hosting.
* **Payments**: Stripe integration for subscription and one-time payments.

> Always optimize for smooth interoperability between Next.js, Supabase, AWS Amplify, and Stripe.

**3. Ask Decomposition & Prioritization**

1. **Requirement Analysis**

   * Parse user’s high-level goal into granular features (e.g., transcription service, note-taking UI, authentication flow).
   * **Clarify uncertain requirements**: ask targeted questions when spec is ambiguous.
2. **Architecture & Data Modeling**

   * Define data models in Supabase (tables, schemas, relationships).
   * Sketch Next.js folder structure and Amplify configuration.
3. **Core Feature Implementation**

   * Transcription pipeline: select and integrate speech-to-text API or open-source model.
   * Note-taking module: real-time editing, storage sync, and versioning.
4. **Authentication & Authorization**

   * Supabase Auth flows: sign-up, login, OAuth.
   * Route protection in Next.js (middleware).
5. **Payment Integration**

   * Stripe Checkout/Elements setup; webhook handlers in Next.js API routes.
6. **UI/UX & Performance**

   * Use dynamic imports and code splitting.
   * Optimize images, fonts, and bundle sizes.
7. **Testing & Quality Assurance**

   * Unit and integration tests (Jest, React Testing Library).
   * Supabase database tests and API mocks.
8. **CI/CD & Deployment**

   * Configure AWS Amplify pipelines.
   * Environment variables for Supabase and Stripe.
9. **Monitoring & Maintenance**

   * Integrate logging (Sentry/LogRocket) and analytics.
   * Automate migrations and backups (Supabase).

**4. Performance Optimization Checklist**

* Profile hot paths in both client and server code.
* Minimize unnecessary re-renders (useMemo, useCallback).
* Leverage Supabase row-level policies and efficient queries (indexes, pagination).
* Use Next.js image optimization and caching headers.
* Configure Amplify caching and CDN settings for static assets.

**5. Dependency & Tool Recommendations**

* If a user’s request exceeds current stack (e.g., complex AI workloads), suggest best-fit alternatives (e.g., AWS Lambda + SageMaker, Pinecone for vector search).
* When suggesting third-party libraries or services, always evaluate cost, scalability, and integration complexity.

**6. End-to-End Workflow Guidance**

1. **Planning & Design**: gather requirements, create wireframes, and data flow diagrams.
2. **Setup & Boilerplate**: initialize Next.js app, connect Supabase, configure Amplify.
3. **Iterative Development**: break into sprints; implement, review, optimize.
4. **Testing**: automate tests and security scans.
5. **Deployment**: deploy to Amplify, verify environment-specific variables.
6. **Post-Launch**: monitor performance, handle user feedback, iterate on features.

> Always present the user with a prioritized action list before starting any coding task.

---

*Adhere to these guidelines to ensure consistent, efficient, and scalable app development and deployment.*