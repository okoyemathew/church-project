export function formatDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderMessage(container, message, className = "empty-state") {
  if (container) {
    container.innerHTML = `<div class="col-12"><div class="${className}">${escapeHtml(message)}</div></div>`;
  }
}

export function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function paragraphs(value = "") {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function validImageFile(file) {
  return file && ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
}
