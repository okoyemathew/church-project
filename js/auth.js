import { auth, FIREBASE_CONFIG } from "../firebase/firebase-config.js";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const loginForm = document.querySelector("[data-login-form]");
const logoutButtons = document.querySelectorAll("[data-logout]");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#loginBtn");
const errorMessage = document.querySelector("#errorMessage");
const passwordToggle = document.querySelector("[data-password-toggle]");
const protectedPage = document.body.dataset.protected === "admin";

function setError(message) {
  if (!errorMessage) return;
  errorMessage.textContent = message;
  errorMessage.className = message ? "status-message mt-4 text-danger" : "status-message mt-4";
}

function getAuthDebugInfo(email) {
  return {
    email,
    firebaseProjectId: FIREBASE_CONFIG.projectId,
    firebaseAuthDomain: FIREBASE_CONFIG.authDomain,
    appProjectId: auth.app?.options?.projectId,
    appAuthDomain: auth.app?.options?.authDomain,
    authConfig: auth.config
  };
}

function getFriendlyAuthError(error) {
  const messages = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-password": "Enter your password.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many login attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection and try again."
  };

  return messages[error.code] || error.message || "Unable to sign in.";
}

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener("click", () => {
    const shouldShowPassword = passwordInput.type === "password";
    passwordInput.type = shouldShowPassword ? "text" : "password";
    passwordToggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
    passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
    passwordToggle.innerHTML = `<i class="fas ${shouldShowPassword ? "fa-eye-slash" : "fa-eye"}"></i>`;
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      setError("");
      loginButton.disabled = true;
      console.info("[Auth] Login attempt starting", getAuthDebugInfo(email));
      console.info("[Auth] Email entered", email);
      console.info("[Auth] Firebase project ID", FIREBASE_CONFIG.projectId);
      console.info("[Auth] Firebase authDomain", FIREBASE_CONFIG.authDomain);
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "admin.html";
    } catch (error) {
      const debugReport = {
        ...getAuthDebugInfo(email),
        error,
        errorCode: error.code,
        errorMessage: error.message,
        expectedProjectId: "holy-family-church-karad-da9de",
        expectedAuthDomain: "holy-family-church-karad-da9de.firebaseapp.com",
        matchesExpectedProject: FIREBASE_CONFIG.projectId === "holy-family-church-karad-da9de",
        matchesExpectedAuthDomain: FIREBASE_CONFIG.authDomain === "holy-family-church-karad-da9de.firebaseapp.com"
      };

      console.error("[Auth] Login failed full error object", error);
      console.error("[Auth] Login failed error.code", error.code);
      console.error("[Auth] Login failed error.message", error.message);
      console.error("[Auth] auth.config", auth.config);
      console.error("[Auth] current Firebase project ID", FIREBASE_CONFIG.projectId);
      console.error("[Auth] current authDomain", FIREBASE_CONFIG.authDomain);
      console.error("[Auth] Structured login debug report", debugReport);
      setError(`${error.code || "auth/unknown"}: ${getFriendlyAuthError(error)}`);
      loginButton.disabled = false;
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "admin.html";
  });
}

logoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin-login.html";
  });
});

if (protectedPage) {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "admin-login.html";
  });
}
