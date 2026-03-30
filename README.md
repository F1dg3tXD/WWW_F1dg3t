# WWW_F1dg3t

Dashboard for f1dg3t to update status.

## What works now

- Loads current profile from `data.json` (or `/api/data` when server is running).
- Saves profile to the real filesystem via `PUT /api/data` when running locally with Node.
- Supports static hosting (such as GitHub Pages) using GitHub's Contents API to write `data.json` back to your repo.
- Always keeps a local browser backup in `localStorage`.

## Run locally (filesystem write mode)

```bash
npm start
```

Then open http://localhost:3000.

In this mode, the **Save** button writes directly to the repo's `data.json` file on disk.

## Static hosting mode (GitHub Pages)

Because static hosts cannot write files directly, configure these settings in the app:

- **Save Mode**: `GitHub API only` (or `Auto`)
- **GitHub Repo**: `owner/repo`
- **GitHub Branch**: e.g. `main`
- **File Path**: `data.json`
- **GitHub Token**: Fine-grained PAT with `Contents: Read and write`

Click **Save** and the app will commit updated JSON using GitHub's API.
