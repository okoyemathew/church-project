import { db, COLLECTIONS } from "../firebase/firebase-config.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { escapeHtml, formatDate, getParam, paragraphs, renderMessage } from "./shared.js";

const fallbackImage = "images/Church-Entrance-Main.jpg";

function articleCard(article) {
  const image = article.featuredImage || fallbackImage;
  return `
    <div class="col-md-6 col-lg-4">
      <a class="content-card" href="article-details.html?slug=${encodeURIComponent(article.slug)}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}">
        <div class="content-card-body">
          <span class="content-meta">${escapeHtml(formatDate(article.createdAt))}</span>
          <h3>${escapeHtml(article.title)}</h3>
          <p>${escapeHtml(article.excerpt || "")}</p>
        </div>
      </a>
    </div>`;
}

async function loadPublishedArticles(container, maxItems) {
  if (!container) return;
  try {
    const articleQuery = query(
      collection(db, COLLECTIONS.articles),
      where("published", "==", true),
      limit(maxItems || 50)
    );
    const snapshot = await getDocs(articleQuery);
    const articles = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!articles.length) {
      renderMessage(container, "No published articles are available yet.");
      return;
    }

    container.innerHTML = articles.map(articleCard).join("");
  } catch (error) {
    renderMessage(container, "Unable to load articles right now.", "status-message text-danger");
  }
}

async function loadArticleDetails() {
  const container = document.querySelector("[data-article-details]");
  if (!container) return;

  const slug = getParam("slug");
  if (!slug) {
    container.innerHTML = `<div class="empty-state">Article not found.</div>`;
    return;
  }

  try {
    const detailQuery = query(
      collection(db, COLLECTIONS.articles),
      where("slug", "==", slug),
      where("published", "==", true),
      limit(1)
    );
    const snapshot = await getDocs(detailQuery);

    if (snapshot.empty) {
      container.innerHTML = `<div class="empty-state">Article not found or not published.</div>`;
      return;
    }

    const article = snapshot.docs[0].data();
    container.innerHTML = `
      <span class="content-meta">${escapeHtml(article.author || "Parish Office")} | ${escapeHtml(formatDate(article.createdAt))}</span>
      <h2>${escapeHtml(article.title)}</h2>
      ${article.featuredImage ? `<img class="article-detail-image mb-5" src="${escapeHtml(article.featuredImage)}" alt="${escapeHtml(article.title)}">` : ""}
      <div class="article-content">${paragraphs(article.content || "")}</div>`;
  } catch (error) {
    container.innerHTML = `<div class="status-message text-danger">Unable to load this article.</div>`;
  }
}

loadPublishedArticles(document.getElementById("articles-list"));
loadPublishedArticles(document.getElementById("home-articles"), 3);
loadArticleDetails();
