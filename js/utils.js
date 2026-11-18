(function () {
  const root = window.location.pathname.includes("/pages/") ? "../" : "";
  const normalizeId = (id) => String(id);

  const getFavorites = () =>
    JSON.parse(localStorage.getItem("cinevault-favorites") || "[]").map(
      normalizeId,
    );

  const isFavorite = (id) => getFavorites().includes(normalizeId(id));

  const setFavorites = (ids) =>
    localStorage.setItem("cinevault-favorites", JSON.stringify(ids));

  const toggleFavorite = (id) => {
    const normalizedId = normalizeId(id);
    const favorites = getFavorites();
    const next = favorites.includes(normalizedId)
      ? favorites.filter((item) => item !== normalizedId)
      : [...favorites, normalizedId];
    setFavorites(next);
    return next.includes(normalizedId);
  };

  const getRatings = () =>
    JSON.parse(localStorage.getItem("cinevault-ratings") || "{}");

  const getUserRating = (id) => Number(getRatings()[normalizeId(id)] || 0);

  const setUserRating = (id, rating) => {
    const normalizedId = normalizeId(id);
    const ratings = getRatings();
    ratings[normalizedId] = Math.max(1, Math.min(5, Number(rating)));
    localStorage.setItem("cinevault-ratings", JSON.stringify(ratings));
  };

  const renderStars = (rating) =>
    Number(rating) > 0
      ? `<span class="rating"><i class="bi bi-star-fill"></i> ${rating}</span>`
      : '<span class="rating rating-muted">N/A</span>';

  const ensureTrailerModal = () => {
    let modal = document.getElementById("trailer-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "trailer-modal";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content trailer-modal">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title" id="trailer-modal-title">Watch Trailer</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="ratio ratio-16x9">
                <iframe id="trailer-frame" src="" title="Movie trailer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener("hidden.bs.modal", () => {
        const frame = document.getElementById("trailer-frame");
        if (frame) frame.src = "";
      });
    }
    return modal;
  };

  const openTrailer = (trailerId, movieTitle) => {
    if (!trailerId) {
      toast("Trailer unavailable for this movie");
      return;
    }
    const modal = ensureTrailerModal();
    const titleEl = document.getElementById("trailer-modal-title");
    if (titleEl) {
      titleEl.innerHTML = `<i class="bi bi-youtube text-danger me-2"></i> ${movieTitle ? `${movieTitle} — Trailer` : "Movie Trailer"}`;
    }
    const frame = document.getElementById("trailer-frame");
    if (frame) {
      frame.src = `https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&rel=0`;
    }
    if (window.bootstrap) {
      bootstrap.Modal.getOrCreateInstance(modal).show();
    }
  };

  const createMovieCard = (movie) => {
    const fallbackTitle = encodeURIComponent(movie.title || "Movie");
    const favActive = isFavorite(movie.id);
    const userRate = getUserRating(movie.id);

    return `
      <div class="col-12 col-md-6 col-lg-4 col-xl-3">
        <article class="movie-card" data-movie-id="${movie.id}">
          <!-- Movie Poster -->
          <div class="poster-wrap">
            <a href="${root}pages/movie-details.html?id=${movie.id}" aria-label="View details for ${movie.title}">
              <img src="${movie.poster}" alt="${movie.title} poster" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/500x750/1f1f1f/ffffff?text=${fallbackTitle}';">
            </a>
            
            <!-- Genre & Rating Badges -->
            <span class="genre-badge">${movie.genre}</span>
            <span class="card-rating-badge"><i class="bi bi-star-fill"></i> ${movie.rating}</span>

            <!-- Favorite Button -->
            <button class="favorite-btn ${favActive ? "active" : ""}" data-favorite="${movie.id}" aria-label="${favActive ? "Remove from favorites" : "Add to favorites"}">
              <i class="bi ${favActive ? "bi-heart-fill" : "bi-heart"}"></i>
            </button>

            <!-- Quick trailer play button on poster hover -->
            ${
              movie.trailer
                ? `
              <button type="button" class="poster-trailer-btn" data-trailer="${movie.trailer}" data-title="${movie.title}" aria-label="Play trailer for ${movie.title}">
                <i class="bi bi-play-circle-fill"></i>
              </button>
            `
                : ""
            }
          </div>

          <!-- Movie Card Body -->
          <div class="movie-card-body">
            <!-- Movie Title & Release Year -->
            <div class="movie-card-header">
              <h3 class="movie-title">
                <a href="${root}pages/movie-details.html?id=${movie.id}" title="${movie.title}">${movie.title}</a>
              </h3>
              <span class="movie-year-badge">${movie.year}</span>
            </div>

            <!-- Movie Description -->
            <p class="movie-card-desc" title="${movie.description}">
              ${movie.description}
            </p>

            <!-- Metadata: Duration, Language, Director, Cast -->
            <div class="movie-card-meta">
              <div class="meta-row">
                <span class="meta-label"><i class="bi bi-clock"></i> Duration:</span>
                <span class="meta-value">${movie.duration}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label"><i class="bi bi-translate"></i> Language:</span>
                <span class="meta-value">${movie.language}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label"><i class="bi bi-camera-reels"></i> Director:</span>
                <span class="meta-value text-truncate" title="${movie.director}">${movie.director}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label"><i class="bi bi-people"></i> Cast:</span>
                <span class="meta-value text-truncate" title="${movie.cast}">${movie.cast}</span>
              </div>
            </div>

            <!-- Action Buttons: Trailer & Details -->
            <div class="movie-card-actions">
              ${
                movie.trailer
                  ? `
                <button type="button" class="btn btn-trailer" data-trailer="${movie.trailer}" data-title="${movie.title}">
                  <i class="bi bi-youtube"></i> Trailer
                </button>
              `
                  : `
                <button type="button" class="btn btn-trailer disabled" disabled>
                  <i class="bi bi-slash-circle"></i> Trailer
                </button>
              `
              }
              <a href="${root}pages/movie-details.html?id=${movie.id}" class="btn btn-card-details">
                Details <i class="bi bi-chevron-right"></i>
              </a>
            </div>

            <!-- User 5-star Rating -->
            <div class="card-user-rating" data-rate-movie="${movie.id}" aria-label="Rate ${movie.title}">
              <span class="card-rating-label">Your rating</span>
              <div class="rating-stars">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (value) => `
                  <button type="button" class="${value <= userRate ? "active" : ""}" data-rate="${movie.id}" data-value="${value}" aria-label="Rate ${value} out of 5">
                    <i class="bi bi-star${value <= userRate ? "-fill" : ""}"></i>
                  </button>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  };

  const toast = (message) => {
    let el = document.getElementById("site-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-toast";
      el.className =
        "toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-4";
      el.setAttribute("role", "status");
      el.innerHTML =
        '<div class="d-flex"><div class="toast-body"></div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
      document.body.appendChild(el);
    }
    el.querySelector(".toast-body").textContent = message;
    if (window.bootstrap) new bootstrap.Toast(el, { delay: 2200 }).show();
    else {
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 2200);
    }
  };

  window.Cinevault = {
    root,
    getFavorites,
    isFavorite,
    setFavorites,
    toggleFavorite,
    getUserRating,
    setUserRating,
    renderStars,
    openTrailer,
    createMovieCard,
    toast,
  };
})();
