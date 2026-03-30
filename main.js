const DEFAULT_DATA = {
  timezone: "America/Los_Angeles",
  location: "Somewhere",
  why: "Because I can",
  what: "I made an app that is specifically used so people can have all their questions about me answered.",
};

const STORAGE_KEY = "profileJsonData";
const SETTINGS_KEY = "profileJsonSettings";

const TIMEZONES = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const LOCATIONS = [
  "Somewhere",
  "Los Angeles, USA",
  "San Francisco, USA",
  "Seattle, USA",
  "Vancouver, Canada",
  "Denver, USA",
  "Chicago, USA",
  "New York, USA",
  "Toronto, Canada",
  "Mexico City, Mexico",
  "São Paulo, Brazil",
  "Buenos Aires, Argentina",
  "London, UK",
  "Paris, France",
  "Berlin, Germany",
  "Amsterdam, Netherlands",
  "Madrid, Spain",
  "Rome, Italy",
  "Johannesburg, South Africa",
  "Nairobi, Kenya",
  "Cairo, Egypt",
  "Dubai, UAE",
  "Riyadh, Saudi Arabia",
  "Mumbai, India",
  "Delhi, India",
  "Singapore, Singapore",
  "Hong Kong, China",
  "Shanghai, China",
  "Tokyo, Japan",
  "Seoul, South Korea",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Auckland, New Zealand",
];

let currentData = { ...DEFAULT_DATA };

let settings = {
  saveMode: "auto",
  githubRepo: "",
  githubBranch: "main",
  githubPath: "data.json",
  githubToken: "",
};

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initSelects();
  loadSettings();
  bindEvents();
  loadInitialData();
  render();
});

function cacheDom() {
  dom.timezoneSelect = document.getElementById("timezoneSelect");
  dom.locationSelect = document.getElementById("locationSelect");
  dom.whyInput = document.getElementById("whyInput");
  dom.whatInput = document.getElementById("whatInput");
  dom.jsonPreview = document.getElementById("jsonPreview");
  dom.autoDetectBtn = document.getElementById("autoDetectBtn");
  dom.copyBtn = document.getElementById("copyBtn");
  dom.downloadBtn = document.getElementById("downloadBtn");
  dom.saveBtn = document.getElementById("saveBtn");
  dom.statusMsg = document.getElementById("statusMsg");

  dom.saveModeSelect = document.getElementById("saveModeSelect");
  dom.githubRepoInput = document.getElementById("githubRepoInput");
  dom.githubBranchInput = document.getElementById("githubBranchInput");
  dom.githubPathInput = document.getElementById("githubPathInput");
  dom.githubTokenInput = document.getElementById("githubTokenInput");
}

function initSelects() {
  fillSelect(dom.timezoneSelect, TIMEZONES);
  fillSelect(dom.locationSelect, LOCATIONS);
}

function fillSelect(selectEl, values) {
  selectEl.innerHTML = "";
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      settings = { ...settings, ...parsed };
    }
  } catch {
    // ignore malformed storage
  }

  dom.saveModeSelect.value = settings.saveMode;
  dom.githubRepoInput.value = settings.githubRepo;
  dom.githubBranchInput.value = settings.githubBranch;
  dom.githubPathInput.value = settings.githubPath;
  dom.githubTokenInput.value = settings.githubToken;
}

function persistSettings() {
  settings = {
    saveMode: dom.saveModeSelect.value,
    githubRepo: dom.githubRepoInput.value.trim(),
    githubBranch: dom.githubBranchInput.value.trim() || "main",
    githubPath: dom.githubPathInput.value.trim() || "data.json",
    githubToken: dom.githubTokenInput.value.trim(),
  };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage failure
  }
}

async function loadInitialData() {
  currentData = { ...DEFAULT_DATA };

  const remoteData = await loadFromApi().catch(() => null);
  if (remoteData && typeof remoteData === "object") {
    currentData = { ...currentData, ...remoteData };
  } else {
    const fileData = await loadFromFile().catch(() => null);
    if (fileData && typeof fileData === "object") {
      currentData = { ...currentData, ...fileData };
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        currentData = { ...currentData, ...parsed };
      }
    }
  } catch {
    // ignore malformed local storage
  }

  applyDataToForm();
  render();
}

async function loadFromApi() {
  const res = await fetch("/api/data", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("/api/data unavailable");
  }

  return res.json();
}

async function loadFromFile() {
  const res = await fetch("./data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("data.json unavailable");
  }

  return res.json();
}

function applyDataToForm() {
  ensureOption(dom.timezoneSelect, currentData.timezone);
  ensureOption(dom.locationSelect, currentData.location);

  dom.timezoneSelect.value = currentData.timezone;
  dom.locationSelect.value = currentData.location;
  dom.whyInput.value = currentData.why ?? "";
  dom.whatInput.value = currentData.what ?? "";
}

function ensureOption(select, value) {
  const exists = Array.from(select.options).some((o) => o.value === value);
  if (!exists && value != null && `${value}`.trim() !== "") {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  }
}

function bindEvents() {
  dom.timezoneSelect.addEventListener("change", () => {
    currentData.timezone = dom.timezoneSelect.value;
    render();
  });

  dom.locationSelect.addEventListener("change", () => {
    currentData.location = dom.locationSelect.value;
    render();
  });

  dom.whyInput.addEventListener("input", () => {
    currentData.why = dom.whyInput.value;
    render();
  });

  dom.whatInput.addEventListener("input", () => {
    currentData.what = dom.whatInput.value;
    render();
  });

  [
    dom.saveModeSelect,
    dom.githubRepoInput,
    dom.githubBranchInput,
    dom.githubPathInput,
    dom.githubTokenInput,
  ].forEach((el) => {
    el.addEventListener("change", persistSettings);
    el.addEventListener("input", persistSettings);
  });

  dom.autoDetectBtn.addEventListener("click", handleAutoDetect);
  dom.copyBtn.addEventListener("click", handleCopy);
  dom.downloadBtn.addEventListener("click", handleDownload);
  dom.saveBtn.addEventListener("click", handleSave);
}

function render() {
  dom.jsonPreview.textContent = JSON.stringify(currentData, null, 4);
}

function setStatus(message, kind = "") {
  dom.statusMsg.textContent = message;
  dom.statusMsg.className = `status ${kind}`.trim();
}

function handleAutoDetect() {
  if (!navigator.geolocation) {
    applyTimezoneFromBrowser();
    return;
  }

  dom.autoDetectBtn.disabled = true;
  dom.autoDetectBtn.textContent = "Finding…";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      applyTimezoneFromBrowser();
      const { latitude, longitude } = pos.coords;
      const loc = guessLocationZone(latitude, longitude);
      ensureOption(dom.locationSelect, loc);
      dom.locationSelect.value = loc;
      currentData.location = loc;
      render();
      resetAutoButton();
    },
    () => {
      applyTimezoneFromBrowser();
      resetAutoButton();
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

function applyTimezoneFromBrowser() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      ensureOption(dom.timezoneSelect, tz);
      dom.timezoneSelect.value = tz;
      currentData.timezone = tz;
      render();
    }
  } catch {
    // ignore if unavailable
  }
}

function resetAutoButton() {
  dom.autoDetectBtn.disabled = false;
  dom.autoDetectBtn.textContent = "Auto";
}

function guessLocationZone(lat, lon) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return currentData.location || "Somewhere";
  }

  if (lat > 32 && lat < 36 && lon > -120 && lon < -116) return "Los Angeles, USA";
  if (lat > 37 && lat < 39 && lon > -123 && lon < -121) return "San Francisco, USA";
  if (lat > 47 && lat < 49 && lon > -123 && lon < -121) return "Seattle, USA";
  if (lat > 49 && lat < 50 && lon > -124 && lon < -122) return "Vancouver, Canada";
  if (lat > 39 && lat < 41 && lon > -106 && lon < -103) return "Denver, USA";
  if (lat > 41 && lat < 43 && lon > -89 && lon < -86) return "Chicago, USA";
  if (lat > 40 && lat < 42 && lon > -75 && lon < -72) return "New York, USA";
  if (lat > 43 && lat < 44 && lon > -80 && lon < -78) return "Toronto, Canada";
  if (lat > 18 && lat < 21 && lon > -100 && lon < -98) return "Mexico City, Mexico";

  if (lat > -25 && lat < -22 && lon > -47 && lon < -44) return "São Paulo, Brazil";
  if (lat > -35 && lat < -33 && lon > -59 && lon < -57) return "Buenos Aires, Argentina";

  if (lat > 51 && lat < 52 && lon > -1 && lon < 1) return "London, UK";
  if (lat > 48 && lat < 49 && lon > 1 && lon < 3) return "Paris, France";
  if (lat > 52 && lat < 53 && lon > 12 && lon < 14) return "Berlin, Germany";
  if (lat > 52 && lat < 53 && lon > 4 && lon < 6) return "Amsterdam, Netherlands";
  if (lat > 40 && lat < 41 && lon > -4 && lon < -2) return "Madrid, Spain";
  if (lat > 41 && lat < 43 && lon > 11 && lon < 13) return "Rome, Italy";

  if (lat > -27 && lat < -25 && lon > 27 && lon < 29) return "Johannesburg, South Africa";
  if (lat > -2 && lat < 2 && lon > 36 && lon < 38) return "Nairobi, Kenya";
  if (lat > 29 && lat < 31 && lon > 30 && lon < 32) return "Cairo, Egypt";
  if (lat > 24 && lat < 26 && lon > 54 && lon < 56) return "Dubai, UAE";
  if (lat > 24 && lat < 26 && lon > 45 && lon < 47) return "Riyadh, Saudi Arabia";

  if (lat > 18 && lat < 21 && lon > 72 && lon < 75) return "Mumbai, India";
  if (lat > 27 && lat < 29 && lon > 76 && lon < 78) return "Delhi, India";
  if (lat > 1 && lat < 2 && lon > 103 && lon < 105) return "Singapore, Singapore";
  if (lat > 22 && lat < 23 && lon > 113 && lon < 115) return "Hong Kong, China";
  if (lat > 30 && lat < 32 && lon > 120 && lon < 122) return "Shanghai, China";
  if (lat > 35 && lat < 36 && lon > 139 && lon < 141) return "Tokyo, Japan";
  if (lat > 37 && lat < 38 && lon > 126 && lon < 128) return "Seoul, South Korea";

  if (lat > -34 && lat < -32 && lon > 150 && lon < 152) return "Sydney, Australia";
  if (lat > -38 && lat < -36 && lon > 144 && lon < 146) return "Melbourne, Australia";
  if (lat > -37 && lat < -35 && lon > 174 && lon < 176) return "Auckland, New Zealand";

  return "Somewhere";
}

async function handleCopy() {
  const text = JSON.stringify(currentData, null, 4);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      flashButton(dom.copyBtn);
      setStatus("Copied JSON to clipboard.", "ok");
    }
  } catch {
    setStatus("Unable to copy to clipboard.", "error");
  }
}

async function handleSave() {
  persistSettings();
  dom.saveBtn.disabled = true;
  setStatus("Saving…");

  const text = JSON.stringify(currentData, null, 4);

  const attempts = {
    auto: ["api", "github", "local"],
    api: ["api"],
    github: ["github"],
    local: ["local"],
  }[settings.saveMode] || ["api", "github", "local"];

  let savedVia = "";
  let errorMessage = "";

  for (const mode of attempts) {
    try {
      if (mode === "api") {
        await saveToApi(text);
        savedVia = "server filesystem API";
        break;
      }

      if (mode === "github") {
        await saveToGitHub(text);
        savedVia = "GitHub repository commit";
        break;
      }

      if (mode === "local") {
        saveToLocal(text);
        savedVia = "local browser storage";
        break;
      }
    } catch (error) {
      errorMessage = error?.message || "Unknown save error";
    }
  }

  if (savedVia) {
    flashButton(dom.saveBtn);
    setStatus(`Saved via ${savedVia}.`, "ok");
  } else {
    setStatus(`Save failed: ${errorMessage}`, "error");
  }

  dom.saveBtn.disabled = false;
}

async function saveToApi(text) {
  const res = await fetch("/api/data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: text,
  });

  if (!res.ok) {
    throw new Error("Filesystem API unavailable or rejected write.");
  }

  saveToLocal(text);
}

async function saveToGitHub(text) {
  if (!settings.githubRepo || !settings.githubToken) {
    throw new Error("GitHub repo and token are required for GitHub mode.");
  }

  const [owner, repo] = settings.githubRepo.split("/");
  if (!owner || !repo) {
    throw new Error("GitHub repo must be in owner/name format.");
  }

  const path = encodeURIComponent(settings.githubPath || "data.json");
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha;
  const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(settings.githubBranch)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (existing.ok) {
    const existingJson = await existing.json();
    sha = existingJson.sha;
  }

  const payload = {
    message: `Update ${settings.githubPath || "data.json"} via web editor`,
    content: btoa(unescape(encodeURIComponent(text))),
    branch: settings.githubBranch,
    sha,
  };

  const writeRes = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!writeRes.ok) {
    const errorBody = await writeRes.text();
    throw new Error(`GitHub write failed (${writeRes.status}): ${errorBody.slice(0, 120)}`);
  }

  saveToLocal(text);
}

function saveToLocal(text) {
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    throw new Error("Local storage is unavailable.");
  }
}

function handleDownload() {
  const text = JSON.stringify(currentData, null, 4);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  flashButton(dom.downloadBtn);
  setStatus("Downloaded data.json.", "ok");
}

function flashButton(btn) {
  const original = btn.textContent;
  btn.textContent = "Done";
  setTimeout(() => {
    btn.textContent = original;
  }, 900);
}
