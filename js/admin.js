import { auth, db, COLLECTIONS, getFirestoreDiagnostics } from "../firebase/firebase-config.js";
import { CLOUDINARY_CONFIG } from "../firebase/cloudinary-config.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { escapeHtml, formatDate, slugify } from "./shared.js";

const adminStatus = document.querySelector("[data-admin-status]");
const uploadProgress = document.querySelector("[data-upload-progress]");
let debugPanel;

function showAdminStatus(message, isError = false) {
  if (!adminStatus) return;
  adminStatus.textContent = message;
  adminStatus.className = `status-message my-4 ${isError ? "text-danger" : "text-success"}`;
}

function ensureDebugPanel() {
  if (debugPanel) return debugPanel;
  debugPanel = document.createElement("pre");
  debugPanel.setAttribute("data-debug-panel", "");
  debugPanel.style.background = "#111827";
  debugPanel.style.border = "2px solid #caa052";
  debugPanel.style.borderRadius = "8px";
  debugPanel.style.color = "#e5e7eb";
  debugPanel.style.fontSize = "13px";
  debugPanel.style.lineHeight = "1.5";
  debugPanel.style.margin = "16px 0";
  debugPanel.style.maxHeight = "320px";
  debugPanel.style.overflow = "auto";
  debugPanel.style.padding = "16px";
  debugPanel.style.whiteSpace = "pre-wrap";
  adminStatus?.insertAdjacentElement("afterend", debugPanel);
  return debugPanel;
}

function debugValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      code: value.code,
      message: value.message,
      stack: value.stack
    };
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function debugStep(message, data = undefined) {
  const panel = ensureDebugPanel();
  const time = new Date().toLocaleTimeString();
  const line = data === undefined
    ? `[${time}] ${message}`
    : `[${time}] ${message}\n${JSON.stringify(debugValue(data), null, 2)}`;

  panel.textContent += `${line}\n\n`;
  panel.scrollTop = panel.scrollHeight;
  console.log(`[Admin Debug] ${message}`, data ?? "");
}

function clearDebugPanel() {
  ensureDebugPanel().textContent = "";
}

function ensureSignedIn() {
  if (!auth.currentUser) {
    throw new Error("Your admin session is not active. Please log in again before saving.");
  }
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function getTextValue(values, fieldName) {
  return String(values[fieldName] || "").trim();
}

function resetForm(form) {
  form.reset();
  const idField = form.querySelector("[name='id']");
  if (idField) idField.value = "";
  form.querySelectorAll("[data-image-preview]").forEach((image) => {
    image.src = "";
    image.classList.add("d-none");
  });
}

function updateProgress(percent, visible = true) {
  if (!uploadProgress) return;
  uploadProgress.classList.toggle("d-none", !visible);
  uploadProgress.querySelector(".progress-bar").style.width = `${percent}%`;
}

function setImageField(form, fieldName, imageUrl) {
  const field = form.elements[fieldName];
  if (!field) throw new Error(`Upload field "${fieldName}" was not found in this form.`);
  if (!imageUrl) throw new Error("Cloudinary did not return an image URL.");
  if (field) field.value = imageUrl;

  const preview = form.querySelector(`[data-image-preview="${fieldName}"]`);
  if (preview) {
    preview.src = imageUrl;
    preview.classList.remove("d-none");
  }
}

function ensureCloudinaryReady() {
  if (!window.cloudinary) throw new Error("Cloudinary Upload Widget is not loaded.");
  if (
    CLOUDINARY_CONFIG.cloudName.includes("YOUR_")
    || CLOUDINARY_CONFIG.uploadPreset.includes("YOUR_")
  ) {
    throw new Error("Add your Cloudinary cloud name and unsigned upload preset in firebase/cloudinary-config.js.");
  }
}

function activatePanel(panelId) {
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
  document.querySelectorAll("[data-admin-nav]").forEach((link) => link.classList.toggle("active", link.dataset.adminNav === panelId));
}

document.querySelectorAll("[data-admin-nav]").forEach((link) => {
  link.addEventListener("click", () => activatePanel(link.dataset.adminNav));
});

function describeFirestoreQuery(collectionName, operation, constraints = []) {
  const diagnostics = getFirestoreDiagnostics();
  const documentPath = `${diagnostics.expectedDatabasePath}/documents/${collectionName}`;

  return {
    operation,
    collection: collectionName,
    constraints,
    projectId: diagnostics.projectId,
    databaseId: diagnostics.databaseId,
    documentPath,
    sdkCall: `${operation}(collection(db, "${collectionName}"))`
  };
}

function logFirestoreFailure(target, error) {
  console.error("[Firestore] Query failed", {
    ...target,
    errorCode: error?.code,
    errorMessage: error?.message,
    firestore: getFirestoreDiagnostics()
  }, error);
}

async function fetchCollectionDocs(collectionName, options = {}) {
  const {
    operation = "getDocs",
    constraints = [],
    constraintLabels = []
  } = options;
  const collectionRef = collection(db, collectionName);
  const firestoreQuery = constraints.length ? query(collectionRef, ...constraints) : collectionRef;
  const target = describeFirestoreQuery(collectionName, operation, constraintLabels);

  console.info("[Firestore] Query starting", target);

  try {
    const snapshot = await getDocs(firestoreQuery);
    console.info("[Firestore] Query succeeded", { ...target, documentCount: snapshot.size });
    return snapshot;
  } catch (error) {
    logFirestoreFailure(target, error);
    throw error;
  }
}

function setStat(key, count) {
  if (!key) return;
  const node = document.querySelector(`[data-stat="${key}"]`);
  if (node) node.textContent = count;
}

async function loadCollection(collectionName, tableBody, rowTemplate, statKey = "") {
  const body = document.querySelector(tableBody);
  if (!body) return;
  const snapshot = await fetchCollectionDocs(collectionName, {
    operation: "dashboard table getDocs",
    constraints: [orderBy("__name__")],
    constraintLabels: ['orderBy("__name__")']
  });
  const docs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  setStat(statKey, docs.length);
  body.innerHTML = docs.length ? docs.map(rowTemplate).join("") : `<tr><td colspan="6">No records yet.</td></tr>`;
  return docs;
}

async function refreshAll() {
  const loaders = [
    ["articles", loadArticles],
    ["announcements", () => loadSimple(COLLECTIONS.announcements, "#announcements-table", "announcement")],
    ["notices", () => loadSimple(COLLECTIONS.notices, "#notices-table", "notice")],
    ["events", loadEvents],
    ["mass schedules", loadMasses],
    ["gallery", loadGallery]
  ];

  const results = await Promise.allSettled(loaders.map(([, loader]) => loader()));
  const failedLoads = results
    .map((result, index) => ({ result, label: loaders[index][0] }))
    .filter(({ result }) => result.status === "rejected");

  if (failedLoads.length) {
    failedLoads.forEach(({ label, result }) => {
      console.error(`[Admin] Unable to load ${label}`, result.reason);
    });
    showAdminStatus(
      `Some dashboard sections could not load: ${failedLoads.map(({ label }) => label).join(", ")}. You can still use sections that loaded successfully.`,
      true
    );
  }
}

async function refreshChanged(type) {
  if (type === "articles") return loadArticles();
  if (type === "announcements") return loadSimple(COLLECTIONS.announcements, "#announcements-table", "announcement");
  if (type === "notices") return loadSimple(COLLECTIONS.notices, "#notices-table", "notice");
  if (type === "events") return loadEvents();
  if (type === "masses") return loadMasses();
  if (type === "gallery") return loadGallery();
  return refreshAll();
}

async function refreshDeletedCollection(collectionName) {
  if (collectionName === COLLECTIONS.articles) return loadArticles();
  if (collectionName === COLLECTIONS.announcements) return loadSimple(COLLECTIONS.announcements, "#announcements-table", "announcement");
  if (collectionName === COLLECTIONS.notices) return loadSimple(COLLECTIONS.notices, "#notices-table", "notice");
  if (collectionName === COLLECTIONS.events) return loadEvents();
  if (collectionName === COLLECTIONS.massSchedules) return loadMasses();
  if (collectionName === COLLECTIONS.gallery) return loadGallery();
  return refreshAll();
}

async function saveArticle(form) {
  const values = getFormValues(form);
  const featuredImage = getTextValue(values, "featuredImage");

  if (!values.id && !featuredImage) throw new Error("Please upload a featured image to Cloudinary first.");

  const payload = {
    title: getTextValue(values, "title"),
    slug: getTextValue(values, "slug") || slugify(getTextValue(values, "title")),
    excerpt: getTextValue(values, "excerpt"),
    content: getTextValue(values, "content"),
    featuredImage,
    author: getTextValue(values, "author") || "Parish Office",
    published: values.published === "on",
    updatedAt: serverTimestamp()
  };

  if (values.id) {
    await updateDoc(doc(db, COLLECTIONS.articles, values.id), payload);
  } else {
    await addDoc(collection(db, COLLECTIONS.articles), { ...payload, createdAt: serverTimestamp() });
  }
}

async function loadArticles() {
  await loadCollection(COLLECTIONS.articles, "#articles-table", (item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.author || "")}</td>
      <td>${item.published ? "Published" : "Draft"}</td>
      <td>${escapeHtml(formatDate(item.createdAt))}</td>
      <td class="text-end">
        <button class="btn btn-sm main-btn" data-edit-article='${escapeHtml(JSON.stringify(item))}'>Edit</button>
        <button class="btn btn-sm btn-outline-secondary" data-toggle-article="${item.id}" data-published="${item.published ? "false" : "true"}">${item.published ? "Unpublish" : "Publish"}</button>
        <button class="btn btn-sm btn-danger" data-delete="${COLLECTIONS.articles}" data-id="${item.id}" data-image="${escapeHtml(item.featuredImage || "")}">Delete</button>
      </td>
    </tr>`, "articles");
}

async function saveSimple(form, collectionName, hasDate = false) {
  const values = getFormValues(form);
  const payload = {
    title: getTextValue(values, "title"),
    description: getTextValue(values, "description"),
    published: values.published === "on"
  };

  if (hasDate) payload.date = values.date;
  if (values.id) {
    await updateDoc(doc(db, collectionName, values.id), payload);
  } else {
    await addDoc(collection(db, collectionName), { ...payload, createdAt: serverTimestamp() });
  }
}

async function loadSimple(collectionName, tableBody, type) {
  await loadCollection(collectionName, tableBody, (item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(type === "notice" ? formatDate(item.date) : formatDate(item.createdAt))}</td>
      <td>${item.published ? "Published" : "Draft"}</td>
      <td class="text-end">
        <button class="btn btn-sm main-btn" data-edit-${type}='${escapeHtml(JSON.stringify(item))}'>Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${collectionName}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`, type === "announcement" ? "announcements" : "notices");
}

async function saveEvent(form) {
  const values = getFormValues(form);
  const imageUrl = getTextValue(values, "imageUrl");

  if (!values.id && !imageUrl) throw new Error("Please upload an event image to Cloudinary first.");

  const payload = {
    title: getTextValue(values, "title"),
    description: getTextValue(values, "description"),
    eventDate: values.eventDate,
    location: getTextValue(values, "location"),
    imageUrl,
    published: values.published === "on"
  };

  if (values.id) {
    await updateDoc(doc(db, COLLECTIONS.events, values.id), payload);
  } else {
    await addDoc(collection(db, COLLECTIONS.events), payload);
  }
}

async function loadEvents() {
  await loadCollection(COLLECTIONS.events, "#events-table", (item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(formatDate(item.eventDate))}</td>
      <td>${escapeHtml(item.location || "")}</td>
      <td>${item.published ? "Published" : "Draft"}</td>
      <td class="text-end">
        <button class="btn btn-sm main-btn" data-edit-event='${escapeHtml(JSON.stringify(item))}'>Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${COLLECTIONS.events}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`, "events");
}

async function saveMass(form) {
  const values = getFormValues(form);
  const diagnostics = getFirestoreDiagnostics();
  const payload = {
    day: getTextValue(values, "day"),
    massTime: getTextValue(values, "massTime"),
    language: getTextValue(values, "language"),
    description: getTextValue(values, "description")
  };

  clearDebugPanel();
  debugStep("saveMass entered");
  debugStep("Mass form values", values);
  debugStep("Mass schedule payload", payload);
  debugStep("db object summary", {
    appName: db.app?.name,
    firestoreProjectId: db.app?.options?.projectId,
    firestoreDatabaseId: diagnostics.databaseId
  });
  console.log("DEBUG db object", db);
  debugStep("currentUser", {
    exists: Boolean(auth.currentUser),
    uid: auth.currentUser?.uid || null,
    email: auth.currentUser?.email || null
  });
  console.log("DEBUG currentUser", auth.currentUser);
  debugStep("projectId", diagnostics.projectId);
  debugStep("collection path", {
    collectionRefPath: COLLECTIONS.massSchedules,
    expectedFullPath: `${diagnostics.expectedDatabasePath}/documents/${COLLECTIONS.massSchedules}`
  });
  console.log("DEBUG BEFORE save massSchedules", {
    db,
    currentUser: auth.currentUser,
    projectId: diagnostics.projectId,
    collectionPath: COLLECTIONS.massSchedules,
    payload
  });

  if (values.id) {
    await updateDoc(doc(db, COLLECTIONS.massSchedules, values.id), payload);
    debugStep("AFTER await updateDoc(doc(db, COLLECTIONS.massSchedules, values.id), payload)", {
      documentId: values.id,
      payload
    });
  } else {
    const result = await addDoc(collection(db, COLLECTIONS.massSchedules), { ...payload, createdAt: serverTimestamp() });
    debugStep("AFTER await addDoc(collection(db, COLLECTIONS.massSchedules), payload)", {
      documentId: result.id,
      documentPath: result.path,
      payload
    });
  }

  console.log("DEBUG MASS SCHEDULE WRITE SUCCESS");
  debugStep("DEBUG WRITE SUCCESS");
}

async function loadMasses() {
  await loadCollection(COLLECTIONS.massSchedules, "#masses-table", (item) => `
    <tr>
      <td>${escapeHtml(item.day || "Not specified")}</td>
      <td>${escapeHtml(item.massTime || "Not specified")}</td>
      <td>${escapeHtml(item.language || "Not specified")}</td>
      <td class="text-end">
        <button class="btn btn-sm main-btn" data-edit-mass='${escapeHtml(JSON.stringify(item))}'>Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${COLLECTIONS.massSchedules}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`);
}

async function saveGallery(form) {
  const values = getFormValues(form);
  const imageUrl = getTextValue(values, "imageUrl");

  if (!values.id && !imageUrl) throw new Error("Please upload an image to Cloudinary first.");

  const payload = {
    imageUrl,
    caption: getTextValue(values, "caption")
  };

  if (values.id) {
    await updateDoc(doc(db, COLLECTIONS.gallery, values.id), payload);
  } else {
    await addDoc(collection(db, COLLECTIONS.gallery), { ...payload, uploadedAt: serverTimestamp() });
  }
}

async function loadGallery() {
  await loadCollection(COLLECTIONS.gallery, "#gallery-table", (item) => `
    <tr>
      <td><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.caption || "Gallery image")}" style="width:80px;height:56px;object-fit:cover;border-radius:8px;"></td>
      <td>${escapeHtml(item.caption || "")}</td>
      <td>${escapeHtml(formatDate(item.uploadedAt))}</td>
      <td class="text-end">
        <button class="btn btn-sm main-btn" data-edit-gallery='${escapeHtml(JSON.stringify(item))}'>Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${COLLECTIONS.gallery}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`, "gallery");
}

function fillForm(formSelector, data) {
  const form = document.querySelector(formSelector);
  if (!form) return;
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value || "";
  });
  if (data.featuredImage) setImageField(form, "featuredImage", data.featuredImage);
  if (data.imageUrl) setImageField(form, "imageUrl", data.imageUrl);
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("[data-admin-form]")) return;
  event.preventDefault();

  try {
    ensureSignedIn();
    showAdminStatus("Saving...");
    updateProgress(0, false);

    const type = form.dataset.adminForm;
    if (type === "masses") {
      clearDebugPanel();
      debugStep("submit handler started", { type });
    }

    if (type === "articles") await saveArticle(form);
    if (type === "announcements") await saveSimple(form, COLLECTIONS.announcements);
    if (type === "notices") await saveSimple(form, COLLECTIONS.notices, true);
    if (type === "events") await saveEvent(form);
    if (type === "masses") {
      debugStep("BEFORE await saveMass(form)");
      await saveMass(form);
      debugStep("AFTER await saveMass(form)");
    }
    if (type === "gallery") await saveGallery(form);

    resetForm(form);
    if (type === "masses") debugStep("BEFORE await refreshChanged(\"masses\")");
    await refreshChanged(type);
    if (type === "masses") debugStep("AFTER await refreshChanged(\"masses\")");
    showAdminStatus("Saved successfully.");
    if (type === "masses") debugStep("showAdminStatus(\"Saved successfully.\") completed");
  } catch (error) {
    if (form.dataset.adminForm === "masses") debugStep("submit handler caught error", error);
    showAdminStatus(error.message || "Unable to save this item.", true);
  } finally {
    updateProgress(0, false);
    if (form.dataset.adminForm === "masses") debugStep("submit handler finally completed");
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target;

  if (target.matches("[data-cloudinary-upload]")) {
    try {
      ensureSignedIn();
      ensureCloudinaryReady();
      const form = target.closest("form");
      const fieldName = target.dataset.cloudinaryField;
      if (!form || !fieldName) throw new Error("Upload button is missing its form or Cloudinary field mapping.");
      updateProgress(10);
      showAdminStatus("Opening Cloudinary upload widget...");

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
          sources: ["local", "camera"],
          multiple: false,
          resourceType: "image",
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          maxFileSize: 10000000
        },
        (error, result) => {
          if (error) {
            console.error("[Cloudinary] Upload failed", {
              fieldName,
              error
            });
            updateProgress(0, false);
            showAdminStatus(error.message || "Cloudinary upload failed.", true);
            return;
          }

          if (result.event === "upload-added" || result.event === "queues-start") {
            updateProgress(40);
            showAdminStatus("Uploading image to Cloudinary...");
          }

          if (result.event === "success") {
            try {
              const imageUrl = result.info?.secure_url || result.info?.url;
              console.info("[Cloudinary] Upload succeeded", {
                fieldName,
                imageUrl,
                publicId: result.info?.public_id
              });
              setImageField(form, fieldName, imageUrl);
              updateProgress(100);
              showAdminStatus("Image uploaded. Preview it below, then save to publish.");
            } catch (uploadError) {
              console.error("[Cloudinary] Unable to apply uploaded image", uploadError);
              updateProgress(0, false);
              showAdminStatus(uploadError.message || "Unable to apply uploaded image.", true);
            }
          }

          if (result.event === "close") {
            setTimeout(() => updateProgress(0, false), 900);
          }
        }
      );

      widget.open();
    } catch (error) {
      console.error("[Cloudinary] Unable to open upload widget", error);
      showAdminStatus(error.message || "Unable to open Cloudinary upload widget.", true);
    }
  }

  if (target.dataset.delete) {
    try {
      ensureSignedIn();
      if (!confirm("Delete this item?")) return;
      showAdminStatus("Deleting...");
      await deleteDoc(doc(db, target.dataset.delete, target.dataset.id));
      await refreshDeletedCollection(target.dataset.delete);
      showAdminStatus("Deleted successfully.");
    } catch (error) {
      console.error("[Admin] Delete failed", {
        collection: target.dataset.delete,
        id: target.dataset.id,
        error
      });
      showAdminStatus(error.message || "Unable to delete this item.", true);
    }
  }

  if (target.dataset.toggleArticle) {
    try {
      ensureSignedIn();
      showAdminStatus("Updating article...");
      await updateDoc(doc(db, COLLECTIONS.articles, target.dataset.toggleArticle), { published: target.dataset.published === "true", updatedAt: serverTimestamp() });
      await loadArticles();
      showAdminStatus("Article updated successfully.");
    } catch (error) {
      console.error("[Admin] Article publish toggle failed", {
        id: target.dataset.toggleArticle,
        published: target.dataset.published,
        error
      });
      showAdminStatus(error.message || "Unable to update this article.", true);
    }
  }

  if (target.dataset.editArticle) fillForm("[data-admin-form='articles']", JSON.parse(target.dataset.editArticle));
  if (target.dataset.editAnnouncement) fillForm("[data-admin-form='announcements']", JSON.parse(target.dataset.editAnnouncement));
  if (target.dataset.editNotice) fillForm("[data-admin-form='notices']", JSON.parse(target.dataset.editNotice));
  if (target.dataset.editEvent) fillForm("[data-admin-form='events']", JSON.parse(target.dataset.editEvent));
  if (target.dataset.editMass) fillForm("[data-admin-form='masses']", JSON.parse(target.dataset.editMass));
  if (target.dataset.editGallery) fillForm("[data-admin-form='gallery']", JSON.parse(target.dataset.editGallery));
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  console.info("[Admin] Auth state resolved", {
    signedIn: true,
    uid: user.uid,
    email: user.email,
    firestore: getFirestoreDiagnostics()
  });
  try {
    await refreshAll();
  } catch (error) {
    console.error("[Admin] Dashboard refresh failed", {
      errorCode: error?.code,
      errorMessage: error?.message,
      firestore: getFirestoreDiagnostics()
    }, error);
    showAdminStatus("Unable to load dashboard data. Check Firebase config and security rules.", true);
  }
});
