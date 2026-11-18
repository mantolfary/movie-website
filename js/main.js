(function () {
  const root = Cinevault.root;
  document.documentElement.dataset.theme =
    localStorage.getItem("cinevault-theme") || "dark";

  document.getElementById("site-nav").innerHTML =
    `<nav class="navbar navbar-expand-lg fixed-top"><div class="container"><a class="navbar-brand" href="${root}index.html"><span class="brand-mark"><i class="bi bi-film"></i></span><span>MovieVibe</span></a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-label="Toggle navigation"><i class="bi bi-list"></i></button><div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav me-auto mb-2 mb-lg-0"><li class="nav-item"><a class="nav-link" href="${root}index.html">Home</a></li><li class="nav-item"><a class="nav-link" href="${root}pages/movies.html">Movies</a></li><li class="nav-item"><a class="nav-link" href="${root}pages/about.html">About</a></li></ul><div class="nav-actions"><form class="nav-search" action="${root}pages/movies.html" method="GET"><i class="bi bi-search"></i><input name="q" type="search" placeholder="Search movies, cast, director..." aria-label="Search movies"></form><a class="nav-icon-link" href="${root}pages/favorites.html" aria-label="Favorites"><i class="bi bi-heart"></i><span id="favorite-count" class="favorite-count">0</span></a><button id="theme-toggle" class="nav-icon-btn" type="button" aria-label="Toggle theme"><i class="bi bi-sun"></i></button></div></div></div></nav>`;

  document.getElementById("site-footer").innerHTML =
    `<footer class="site-footer"><div class="container d-flex flex-column flex-md-row justify-content-between gap-3"><div><a class="navbar-brand" href="${root}index.html"><span class="brand-mark"><i class="bi bi-film"></i></span><span>MovieVibe</span></a><p class="mb-0 mt-2">A modern movie discovery website with trailers, ratings, and details.</p></div><div class="footer-links"><a href="${root}pages/movies.html">Browse Movies</a><a href="${root}pages/favorites.html">Favorites</a><a href="${root}pages/about.html">About</a><span class="socials"><i class="bi bi-instagram"></i><i class="bi bi-twitter-x"></i><i class="bi bi-youtube"></i></span></div></div><div class="container copyright">© 2026 MovieVibe. All movie media & trailers belong to their respective copyright owners.</div></footer>`;

  const updateCount = () => {
    const count = Cinevault.getFavorites().length;
    const badge = document.getElementById("favorite-count");
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle("d-none", !count);
    }
  };
  updateCount();

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("cinevault-theme", next);
      themeToggle.innerHTML = `<i class="bi bi-${next === "dark" ? "sun" : "moon"}"></i>`;
    });
    themeToggle.innerHTML = `<i class="bi bi-${document.documentElement.dataset.theme === "dark" ? "sun" : "moon"}"></i>`;
  }

  // Favorite toggle listener
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorite]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const active = Cinevault.toggleFavorite(button.dataset.favorite);
    button.classList.toggle("active", active);
    button.innerHTML = `<i class="bi ${active ? "bi-heart-fill" : "bi-heart"}"></i>`;
    button.setAttribute(
      "aria-label",
      active ? "Remove from favorites" : "Add to favorites",
    );
    updateCount();
    Cinevault.toast(
      active ? "Added to your favorites" : "Removed from favorites",
    );
    if (window.refreshFavorites) window.refreshFavorites();
  });

  // User 5-star rating listener
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rate]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const movieId = button.dataset.rate;
    const rating = Number(button.dataset.value);
    Cinevault.setUserRating(movieId, rating);
    document
      .querySelectorAll(`[data-rate-movie="${movieId}"] [data-rate]`)
      .forEach((star) => {
        const value = Number(star.dataset.value);
        star.classList.toggle("active", value <= rating);
        star.innerHTML = `<i class="bi bi-star${value <= rating ? "-fill" : ""}"></i>`;
      });
    Cinevault.toast(`Rated ${rating} out of 5 stars`);
  });

  // Global YouTube Trailer listener
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-trailer]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const trailerId = button.dataset.trailer;
    const title = button.dataset.title || "";
    if (trailerId && window.Cinevault?.openTrailer) {
      window.Cinevault.openTrailer(trailerId, title);
    }
  });
})();
