import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, renderMessage } from "./shared.js";

const container = document.getElementById("gallery-grid");
const lightbox = document.querySelector("[data-lightbox]");

function openLightbox(imageUrl, caption) {
  if (!lightbox) return;
  lightbox.querySelector("img").src = imageUrl;
  lightbox.querySelector("img").alt = caption || "Gallery image";
  lightbox.querySelector("p").textContent = caption || "";
  lightbox.classList.add("show");
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.matches("[data-lightbox-close]")) {
      lightbox.classList.remove("show");
    }
  });
}

if (container) {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.gallery));
    const images = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));

    if (!images.length) {
      container.innerHTML = `<div class="empty-state">No gallery images have been uploaded yet.</div>`;
    } else {
      container.innerHTML = images.map((image) => `
        <button class="gallery-item" type="button" data-image="${escapeHtml(image.imageUrl)}" data-caption="${escapeHtml(image.caption || "")}">
          <span class="gallery-image-frame">
            <img class="gallery-image" src="${escapeHtml(image.imageUrl)}" alt="${escapeHtml(image.caption || "Gallery image")}">
          </span>
          <div class="gallery-caption">${escapeHtml(image.caption || "Parish gallery")}</div>
        </button>`).join("");

      container.querySelectorAll(".gallery-item").forEach((button) => {
        button.addEventListener("click", () => openLightbox(button.dataset.image, button.dataset.caption));
      });
    }
  } catch (error) {
    console.error("[Gallery] Public gallery load failed", {
      code: error?.code,
      message: error?.message,
      collection: COLLECTIONS.gallery
    }, error);
    renderMessage(container, "Unable to load gallery images right now.", "status-message text-danger");
  }
}
