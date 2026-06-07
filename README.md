# PrepNow

A small, modern quiz app for practicing multiple-choice questions. Pick a quiz, answer one
question at a time, get immediate feedback with explanations, and see a scored summary at the
end. Your attempts are saved locally so you can review past results.

Built with **React + Vite + TypeScript**. No backend: questions are fetched from a separate
content repo, and history is stored in your browser.

## Features

- Course / quiz picker loaded from a hosted question bank
- One-question-at-a-time runner with a progress bar
- Single- and multi-select questions ("Choose N")
- Immediate correct/incorrect feedback + explanation after submitting
- Results screen: score %, correct count, per-question breakdown
- Attempt history in `localStorage`, with **export / import** to JSON
- Works offline via **local file upload** of a quiz JSON

## Content source

The app fetches questions from the
[servicenow-university-questions](https://github.com/klimenik/servicenow-university-questions)
repo (served via GitHub Pages). The format is generic, so any compatible JSON question bank
works. Change the source URL in **Settings (⚙)**, or use **Load local quiz file** to run a
quiz from disk without any network.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

Until the content repo's GitHub Pages site is live, use **Settings ⚙ → Load local quiz file**
and pick a `*.json` quiz from your local clone of the content repo.

## Build & deploy

```bash
npm run build    # outputs to dist/ (base path /prepnow/ for GitHub Pages)
npm run preview  # preview the production build locally
```

Pushing to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`,
which builds and publishes to GitHub Pages.
