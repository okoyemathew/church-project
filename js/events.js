import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, formatDate, renderMessage } from "./shared.js";

const container = document.getElementById("home-events");

if (container) {
  try {
    const eventQuery = query(
      collection(db, COLLECTIONS.events),
      where("published", "==", true),
      limit(20)
    );
    const snapshot = await getDocs(eventQuery);
    const today = new Date().toISOString().slice(0, 10);
    const events = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((event) => event.eventDate >= today)
      .sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate)))
      .slice(0, 3);

    if (!events.length) {
      renderMessage(container, "No upcoming events are available yet.");
    } else {
      container.innerHTML = events.map((event) => `
        <div class="col-md-6 col-lg-4">
          <div class="content-card">
            ${event.imageUrl ? `<img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)}">` : ""}
            <div class="content-card-body">
              <span class="content-meta">${escapeHtml(formatDate(event.eventDate))}</span>
              <h3>${escapeHtml(event.title)}</h3>
              <p>${escapeHtml(event.description || "")}</p>
              ${event.location ? `<p><strong>Location:</strong> ${escapeHtml(event.location)}</p>` : ""}
            </div>
          </div>
        </div>`).join("");
    }
  } catch (error) {
    renderMessage(container, "Unable to load events right now.", "status-message text-danger");
  }
}
