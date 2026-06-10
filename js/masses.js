import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, renderMessage } from "./shared.js";

const container = document.getElementById("masses-list");
const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

if (container) {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.massSchedules));
    const schedules = snapshot.docs
      .map((docSnap) => {
        console.log("Mass Schedule Document:", docSnap.data());
        return { id: docSnap.id, ...docSnap.data() };
      })
      .sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        return dayDiff || String(a.massTime || a.time || "").localeCompare(String(b.massTime || b.time || ""));
      });

    if (!schedules.length) {
      renderMessage(container, "Mass schedules are not available yet.");
    } else {
      container.innerHTML = schedules.map((schedule) => {
        const massTime = schedule.massTime || schedule.time || "Not specified";
        const language = schedule.language || schedule.lang || "Not specified";
        const description = schedule.description || schedule.details || "";

        return `
          <div class="col-md-6">
            <div class="schedule-row">
              <span class="content-meta">${escapeHtml(schedule.day || "Not specified")}</span>
              <h3>${escapeHtml(massTime)}</h3>
              <p>${escapeHtml(language)}</p>
              ${description ? `<p>${escapeHtml(description)}</p>` : ""}
            </div>
          </div>`;
      }).join("");
    }
  } catch (error) {
    renderMessage(container, "Unable to load Mass schedules right now.", "status-message text-danger");
  }
}
