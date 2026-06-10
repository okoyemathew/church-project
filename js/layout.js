const isAdminPage = document.body.dataset.protected === "admin";

function pagePath(path) {
  return path;
}

function renderHeader() {
  const header = document.querySelector("#full_nav");
  if (!header) return;

  header.innerHTML = `
    <div class="header fixed-top">
      <div class="container">
        <nav class="navbar navbar-expand-lg">
          <a class="navbar-brand d-flex align-items-center" href="${pagePath("index.html")}">
            <img src="${pagePath("images/saintign-300x169.jpg")}" alt="Holy Family Church Karad logo" />
            <span class="church-title ms-3"><span>Holy Family Church Karad</span><small>Sub-station Satara</small></span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-nav" aria-controls="main-nav" aria-expanded="false" aria-label="Toggle navigation">
            <i class="fas fa-stream navbar-toggler-icon"></i>
          </button>
          <div class="collapse navbar-collapse" id="main-nav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item"><a class="nav-link" href="${pagePath("index.html")}">Home</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("index.html#about")}">About</a></li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" id="sacramentsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Sacraments</a>
                <ul class="dropdown-menu" aria-labelledby="sacramentsDropdown">
                  <li><a class="dropdown-item" href="${pagePath("masses.html")}">Mass Schedules</a></li>
                </ul>
              </li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("index.html#parish-info")}">Parish Info</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("index.html#associations")}">Associations</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("index.html#community")}">Community</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("articles.html")}">Articles</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("notices.html")}">Notices</a></li>
              <li class="nav-item"><a class="nav-link" href="${pagePath("gallery.html")}">Gallery</a></li>
              ${
                isAdminPage
                  ? `<li class="nav-item"><button class="btn main-btn ms-lg-3" type="button" data-logout>Logout</button></li>`
                  : `<li class="nav-item"><a class="btn main-btn ms-lg-3" href="${pagePath("admin-login.html")}">Admin Login</a></li>`
              }
            </ul>
          </div>
        </nav>
      </div>
    </div>`;
}

function renderFooter() {
  const footer = document.querySelector(".footer_wrapper");
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="row align-items-start mb-5">
        <div class="col-lg-4 col-sm-6 mb-5 mb-lg-0 footer-logo">
          <img src="${pagePath("images/saintign-300x169.jpg")}" alt="Holy Family Church Karad logo" />
          <p class="mt-3 church-name">Holy Family Church Karad</p>
          <p class="church-subname">Sub-station Satara</p>
        </div>
        <div class="col-lg-4 col-sm-6 mb-5 mb-lg-0">
          <h5><a href="${pagePath("index.html")}">Home</a></h5>
          <h5><a href="${pagePath("masses.html")}">Mass Schedules</a></h5>
          <h5><a href="${pagePath("notices.html")}">Notices</a></h5>
          <h5><a href="${pagePath("articles.html")}">Articles</a></h5>
          <h5><a href="${pagePath("gallery.html")}">Gallery</a></h5>
        </div>
        <div class="col-lg-4 col-sm-6 mb-5 mb-lg-0">
          <h5><a href="tel:+917972892582">+91 7972892582</a></h5>
          <h5><a href="mailto:eruditecoder9@gmail.com">eruditecoder9@gmail.com</a></h5>
          <h5>A-wing, 2nd Floor TMV</h5>
          <ul class="link-widget p-0 mt-4">
            <li><span><img src="${pagePath("images/squarfacebook-logo.webp")}" alt="Facebook" /></span></li>
            <li><span><img src="${pagePath("images/instagram-logo.webp")}" alt="Instagram" /></span></li>
            <li><span><img src="${pagePath("images/youtube-icon.webp")}" alt="YouTube" /></span></li>
            <li><span><img src="${pagePath("images/x-twitter.webp")}" alt="X" /></span></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="container-fluid copyright-section"><p>&copy; 2025 Eruditecoder. All Rights Reserved</p></div>`;
}

renderHeader();
renderFooter();
