/**
 * MovieVibe Utility Functions & Global Helpers
 */
import { createMovieCard } from "./api.js";

const root =
  typeof window !== "undefined" && window.location?.pathname?.includes("/pages/")
    ? "../"
    : "";
const normalizeId = (id) => String(id);

export const getFavorites = () =>
  JSON.parse(localStorage.getItem("cinevault-favorites") || "[]").map(
    normalizeId
  );

export const isFavorite = (id) => getFavorites().includes(normalizeId(id));

export const setFavorites = (ids) =>
  localStorage.setItem("cinevault-favorites", JSON.stringify(ids.map(normalizeId)));

export const toggleFavorite = (id) => {
  const normalizedId = normalizeId(id);
  const favorites = getFavorites();
  const next = favorites.includes(normalizedId)
    ? favorites.filter((item) => item !== normalizedId)
    : [...favorites, normalizedId];
  setFavorites(next);
  return next.includes(normalizedId);
};

export const getRatings = () =>
  JSON.parse(localStorage.getItem("cinevault-ratings") || "{}");

export const getUserRating = (id) => Number(getRatings()[normalizeId(id)] || 0);

export const setUserRating = (id, rating) => {
  const normalizedId = normalizeId(id);
  const ratings = getRatings();
  ratings[normalizedId] = Math.max(1, Math.min(5, Number(rating)));
  localStorage.setItem("cinevault-ratings", JSON.stringify(ratings));
};

export const renderStars = (rating) =>
  Number(rating) > 0
    ? `<span class="rating"><i class="bi bi-star-fill"></i> ${rating}</span>`
    : '<span class="rating rating-muted">N/A</span>';

const stopTrailer = () => {
  const frame = document.getElementById("trailer-frame");
  if (frame) {
    try {
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "stopVideo", args: "" }),
        "*"
      );
    } catch (e) {
      // Ignore cross-origin error
    }
    // Clear src immediately so audio and video stop the moment close is clicked
    frame.src = "";
  }
};

export const ensureTrailerModal = () => {
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
  }

  // Ensure close listeners are bound (attaches to both static HTML and dynamic modals)
  if (!modal.dataset.trailerInitialized) {
    modal.dataset.trailerInitialized = "true";
    modal.addEventListener("hide.bs.modal", stopTrailer);
    modal.addEventListener("hidden.bs.modal", stopTrailer);
    modal.querySelectorAll('[data-bs-dismiss="modal"], .btn-close').forEach((btn) => {
      btn.addEventListener("click", stopTrailer);
    });
  }

  return modal;
};

export const openTrailer = (trailerId, movieTitle) => {
  if (!trailerId) {
    toast("Trailer unavailable for this movie");
    return;
  }
  const modal = ensureTrailerModal();
  const titleEl = document.getElementById("trailer-modal-title") || modal.querySelector(".modal-title");
  if (titleEl) {
    titleEl.innerHTML = `<i class="bi bi-youtube text-danger me-2"></i> ${
      movieTitle ? `${movieTitle} — Trailer` : "Movie Trailer"
    }`;
  }
  const frame = document.getElementById("trailer-frame");
  if (frame) {
    frame.src = `https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&rel=0&enablejsapi=1`;
  }
  if (window.bootstrap) {
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }
};

export const toast = (message) => {
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

// Global Cinevault namespace
if (typeof window !== "undefined") {
  window.Cinevault = {
    root,
    getFavorites,
    isFavorite,
    setFavorites,
    toggleFavorite,
    getUserRating,
    setUserRating,
    renderStars,
    ensureTrailerModal,
    openTrailer,
    stopTrailer,
    createMovieCard,
    toast,
  };
}

export { createMovieCard, root, stopTrailer };
