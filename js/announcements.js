import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, formatDate, renderMessage } from "./shared.js";

const container = document.getElementById("home-announcements");

if (container) {
  try {
    const announcementQuery = query(
      collection(db, COLLECTIONS.announcements),
      where("published", "==", true),
      limit(4)
    );
    const snapshot = await getDocs(announcementQuery);
    const announcements = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!announcements.length) {
      renderMessage(container, "No announcements are available yet.");
    } else {
      container.innerHTML = announcements.map((item) => `
        <div class="col-md-6">
          <div class="content-card">
            <div class="content-card-body">
              <span class="content-meta">${escapeHtml(formatDate(item.createdAt))}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description || "")}</p>
            </div>
          </div>
        </div>`).join("");
    }
  } catch (error) {
    renderMessage(container, "Unable to load announcements right now.", "status-message text-danger");
  }
}
