import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBxEE4kSorRTD5B3t4nyay2kb9iye_c-2k",
  authDomain: "holy-family-church-karad-da9de.firebaseapp.com",
  projectId: "holy-family-church-karad-da9de",
  storageBucket: "holy-family-church-karad-da9de.firebasestorage.app",
  messagingSenderId: "354915915415",
  appId: "1:354915915415:web:e1edb353304a9f52573bd2"
};

const DEFAULT_FIRESTORE_DATABASE_ID = "(default)";

function getInternalFirestoreDatabaseId(firestore) {
  return (
    firestore?._databaseId?.database
    || firestore?._databaseId?.databaseId
    || firestore?._delegate?._databaseId?.database
    || firestore?._delegate?._databaseId?.databaseId
    || DEFAULT_FIRESTORE_DATABASE_ID
  );
}

export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function getFirestoreDiagnostics() {
  const databaseId = getInternalFirestoreDatabaseId(db);
  const encodedDatabasePath = encodeURIComponent(`projects/${app.options.projectId}/databases/${databaseId}`);

  return {
    appName: app.name,
    appConfig: app.options,
    getAppOptions: getApp().options,
    initializedApps: getApps().map((firebaseApp) => ({
      name: firebaseApp.name,
      options: firebaseApp.options
    })),
    projectId: app.options.projectId,
    databaseId,
    expectedDatabasePath: `projects/${app.options.projectId}/databases/${databaseId}`,
    firestoreRestDocumentsEndpoint: `https://firestore.googleapis.com/v1/projects/${app.options.projectId}/databases/${databaseId}/documents`,
    firestoreWebChannelWriteEndpoint: `https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel?database=${encodedDatabasePath}`,
    firestoreAppProjectId: db.app?.options?.projectId || app.options.projectId,
    firestoreInstance: db
  };
}

console.groupCollapsed("[Firebase] Initialization");
console.info("[Firebase] App config being used", FIREBASE_CONFIG);
console.info("[Firebase] Project ID", FIREBASE_CONFIG.projectId);
console.info("[Firebase] getApp().options", getApp().options);
console.info("[Firebase] initialized apps", getApps().map((firebaseApp) => ({ name: firebaseApp.name, options: firebaseApp.options })));
console.info("[Firebase] Firestore instance configuration", getFirestoreDiagnostics());
console.groupEnd();

export const COLLECTIONS = {
  articles: "articles",
  announcements: "announcements",
  notices: "notices",
  events: "events",
  massSchedules: "massSchedules",
  gallery: "gallery"
};
