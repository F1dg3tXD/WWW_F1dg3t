const DEFAULT_DATA = {
  timezone: "America/Los_Angeles",
  location: "Somewhere",
  why: "Because I can",
  what: "I made an app that is specifically used so people can have all their questions about me answered.",
};

const STORAGE_KEY = "profileJsonData";

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

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initSelects();
  loadInitialData();
  bindEvents();
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

async function loadInitialData() {
  // Start from defaults
  currentData = { ...DEFAULT_DATA };

  // Try server data.json
  try {
    const res = await fetch("/data.json", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      currentData = { ...currentData, ...json };
    }
  } catch {
    // ignore network / CORS errors and keep defaults
  }

  // Override with any locally saved data
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        currentData = { ...currentData, ...parsed };
      }
    }
  } catch {
    // ignore malformed or unavailable storage
  }

  applyDataToForm();
  render();
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

  dom.autoDetectBtn.addEventListener("click", handleAutoDetect);
  dom.copyBtn.addEventListener("click", handleCopy);
  dom.downloadBtn.addEventListener("click", handleDownload);
  dom.saveBtn.addEventListener("click", handleSave);
}

function render() {
  dom.jsonPreview.textContent = JSON.stringify(currentData, null, 4);
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

  // Very rough city approximation based on lat/lon
  // North America
  if (lat > 32 && lat < 36 && lon > -120 && lon < -116) return "Los Angeles, USA";
  if (lat > 37 && lat < 39 && lon > -123 && lon < -121) return "San Francisco, USA";
  if (lat > 47 && lat < 49 && lon > -123 && lon < -121) return "Seattle, USA";
  if (lat > 49 && lat < 50 && lon > -124 && lon < -122) return "Vancouver, Canada";
  if (lat > 39 && lat < 41 && lon > -106 && lon < -103) return "Denver, USA";
  if (lat > 41 && lat < 43 && lon > -89 && lon < -86) return "Chicago, USA";
  if (lat > 40 && lat < 42 && lon > -75 && lon < -72) return "New York, USA";
  if (lat > 43 && lat < 44 && lon > -80 && lon < -78) return "Toronto, Canada";
  if (lat > 18 && lat < 21 && lon > -100 && lon < -98) return "Mexico City, Mexico";

  // South America
  if (lat > -25 && lat < -22 && lon > -47 && lon < -44) return "São Paulo, Brazil";
  if (lat > -35 && lat < -33 && lon > -59 && lon < -57) return "Buenos Aires, Argentina";

  // Europe
  if (lat > 51 && lat < 52 && lon > -1 && lon < 1) return "London, UK";
  if (lat > 48 && lat < 49 && lon > 1 && lon < 3) return "Paris, France";
  if (lat > 52 && lat < 53 && lon > 12 && lon < 14) return "Berlin, Germany";
  if (lat > 52 && lat < 53 && lon > 4 && lon < 6) return "Amsterdam, Netherlands";
  if (lat > 40 && lat < 41 && lon > -4 && lon < -2) return "Madrid, Spain";
  if (lat > 41 && lat < 43 && lon > 11 && lon < 13) return "Rome, Italy";

  // Africa & Middle East
  if (lat > -27 && lat < -25 && lon > 27 && lon < 29) return "Johannesburg, South Africa";
  if (lat > -2 && lat < 2 && lon > 36 && lon < 38) return "Nairobi, Kenya";
  if (lat > 29 && lat < 31 && lon > 30 && lon < 32) return "Cairo, Egypt";
  if (lat > 24 && lat < 26 && lon > 54 && lon < 56) return "Dubai, UAE";
  if (lat > 24 && lat < 26 && lon > 45 && lon < 47) return "Riyadh, Saudi Arabia";

  // Asia
  if (lat > 18 && lat < 21 && lon > 72 && lon < 75) return "Mumbai, India";
  if (lat > 27 && lat < 29 && lon > 76 && lon < 78) return "Delhi, India";
  if (lat > 1 && lat < 2 && lon > 103 && lon < 105) return "Singapore, Singapore";
  if (lat > 22 && lat < 23 && lon > 113 && lon < 115) return "Hong Kong, China";
  if (lat > 30 && lat < 32 && lon > 120 && lon < 122) return "Shanghai, China";
  if (lat > 35 && lat < 36 && lon > 139 && lon < 141) return "Tokyo, Japan";
  if (lat > 37 && lat < 38 && lon > 126 && lon < 128) return "Seoul, South Korea";

  // Oceania
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
    }
  } catch {
    // fail silently
  }
}

async function handleSave() {
  const text = JSON.stringify(currentData, null, 4);

  let savedToServer = false;

  // Try PUT first
  try {
    const res = await fetch("/data.json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: text,
    });
    savedToServer = res.ok;
  } catch {
    // ignore network / CORS errors and fall through to POST / local
  }

  // If PUT failed, try POST
  if (!savedToServer) {
    try {
      const res = await fetch("/data.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: text,
      });
      savedToServer = res.ok;
    } catch {
      // ignore and fall through to local storage
    }
  }

  // Always persist locally so changes survive reload even if server can't write data.json
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // localStorage may be unavailable (private mode, etc); ignore
  }

  flashButton(dom.saveBtn);
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
}

function flashButton(btn) {
  const original = btn.textContent;
  btn.textContent = "Done";
  setTimeout(() => {
    btn.textContent = original;
  }, 900);
}