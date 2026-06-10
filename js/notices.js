import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, formatDate, renderMessage } from "./shared.js";

const container = document.getElementById("notices-list");

if (container) {
  try {
    const noticeQuery = query(collection(db, COLLECTIONS.notices), where("published", "==", true));
    const snapshot = await getDocs(noticeQuery);
    const notices = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!notices.length) {
      renderMessage(container, "No parish notices are available yet.");
    } else {
      container.innerHTML = notices.map((notice) => `
        <div class="col-12">
          <div class="notice-row">
            <span class="content-meta">${escapeHtml(formatDate(notice.date))}</span>
            <h3>${escapeHtml(notice.title)}</h3>
            <p>${escapeHtml(notice.description || "")}</p>
          </div>
        </div>`).join("");
    }
  } catch (error) {
    renderMessage(container, "Unable to load parish notices right now.", "status-message text-danger");
  }
}
