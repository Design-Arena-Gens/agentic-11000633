## Agentic Browser Assistant

A Next.js workspace that turns captured Chrome pages into structured task plans. Paste a live URL or copy/paste HTML from your browser, and the agent will extract summaries, action items, and helpful links while persisting everything to Supabase.

### Features

- **Chrome page ingestion** – fetch a public URL or paste raw HTML/text for offline pages.
- **Action item extraction** – deterministic heuristics pull tasks with confidence scoring and context headings.
- **Task tracking dashboard** – toggle completion state and review saved analyses from the timeline.
- **Supabase persistence** – `page_insights` table stores summaries, key points, metadata, and task state.
- **Tailwind CSS experience** – responsive, dark-first layout ready for Vercel deployment.

### Project Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the sample environment file and provide Supabase credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (needed for server-side inserts/updates)

3. Apply the database migration to your Supabase project:

   ```sql
   -- supabase/migrations/0001_create_page_insights.sql
   ```

   You can run the script with the Supabase CLI (`supabase migration up`) or execute it directly in the Supabase SQL editor.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to interact with the agent dashboard.

### Scripts

- `npm run dev` – start the development server
- `npm run build` – generate a production build
- `npm start` – serve the production build
- `npm run lint` – run linting via ESLint

### Deployment

The project is configured for Vercel. Build locally (`npm run build`) before deploying. Once ready, deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-11000633
```

After deployment, confirm the live site:

```bash
curl https://agentic-11000633.vercel.app
```
