# WWW_F1dg3t

Dashboard for f1dg3t to update status.

## Features

- Loads current profile from `data.json` (or `/api/data` when server is running).
- Saves profile to the real filesystem via `PUT /api/data` when running locally with Node.
- Supports static hosting (such as GitHub Pages) using GitHub's Contents API to write `data.json` back to your repo.
- Keeps a local browser backup in `localStorage`.

## Local runtime (real filesystem writes)

```bash
npm start
```

Open http://localhost:3000 and click **Save** to write directly to `data.json` on disk through `/api/data`.

## GitHub Pages setup (following the Node.js GitHub Pages deployment guide)

This repo is configured with:

- `homepage` in `package.json`
- `build`, `predeploy`, and `deploy` scripts
- `gh-pages` dev dependency
- an optional workflow at `.github/workflows/deploy-pages.yml`

### 1) Update homepage

In `package.json`, replace:

```json
"homepage": "https://[your-github-username].github.io/[repo-name]"
```

with your actual GitHub username and repository name.

### 2) Install and deploy

```bash
npm install
npm run deploy
```

This publishes the static app from `build/` to the `gh-pages` branch.

### 3) Configure repository Pages source

In your GitHub repo:

1. Go to **Settings → Pages**
2. Set **Source** to deploy from branch
3. Select branch `gh-pages` and folder `/ (root)`

Your app will be available at:

```text
https://<your-github-username>.github.io/<repo-name>
```

## Notes for static hosting mode

Because GitHub Pages is static-only, direct filesystem writes are not possible there.
Use the app's **Save Mode** `GitHub API only` (or `Auto`) and provide a token with **Contents: Read and write** so the app can commit updates to `data.json` via GitHub API.
