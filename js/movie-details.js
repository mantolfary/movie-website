/**
 * Movie Details Page Controller - TMDB live data integration
 */
import {
  getMovieDetails,
  getPopularMovies,
  formatRuntime,
  formatLanguage,
  getDirector,
  getCast,
  getTrailerKey,
  getMovieGenre,
  createMovieCard,
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE,
} from "./api.js";
import { getUserRating, isFavorite } from "./utils.js";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function initMovieDetails() {
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("id");
  const page = document.getElementById("details-page");

  if (!page) return;

  if (!movieId) {
    showNotFound(page);
    return;
  }

  try {
    const movie = await getMovieDetails(movieId);
    if (!movie) {
      showNotFound(page);
      return;
    }

    document.title = `${movie.title} | MovieVibe`;

    const localFallback = "../images/no-poster.svg";
    const posterSrc = movie.poster_path
      ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
      : movie.poster || localFallback;

    const backdropSrc = movie.backdrop_path
      ? (movie.backdrop_path.startsWith("http") ? movie.backdrop_path : `${TMDB_BACKDROP_BASE}${movie.backdrop_path}`)
      : movie.backdrop || posterSrc;

    const year = movie.release_date?.slice(0, 4) || movie.year || "N/A";
    const duration = formatRuntime(movie.runtime !== undefined ? movie.runtime : movie.duration);
    const language = formatLanguage(movie.original_language || movie.language);
    const director = getDirector(movie);
    const cast = getCast(movie);
    const genre = getMovieGenre(movie);
    const trailerKey = getTrailerKey(movie);
    const ratingStr = typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : (movie.rating ? Number(movie.rating).toFixed(1) : "N/A");
    const userRate = getUserRating(movie.id);
    const isFav = isFavorite(movie.id);

    // Fetch related / popular movies for "More like this"
    let relatedMovies = [];
    try {
      const popular = await getPopularMovies(1);
      relatedMovies = popular.filter((m) => String(m.id) !== String(movie.id)).slice(0, 4);
    } catch (e) {
      console.warn("Could not load related movies:", e);
    }

    page.innerHTML = `
      <section class="details-hero" style="--backdrop:url('${backdropSrc}')">
        <div class="container">
          <a class="back-link" href="movies.html"><i class="bi bi-arrow-left"></i> Back to movies</a>
          <div class="details-layout">
            <div class="details-poster">
              <img src="${posterSrc}" alt="${escapeHtml(movie.title)} poster" onerror="this.onerror=null;this.src='${localFallback}';">
            </div>
            <div class="details-copy">
              <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                <span class="genre-badge">${escapeHtml(genre)}</span>
                <span class="detail-year"><i class="bi bi-calendar3"></i> ${year}</span>
                <span class="detail-year"><i class="bi bi-clock"></i> ${duration}</span>
                <span class="detail-year"><i class="bi bi-translate"></i> ${escapeHtml(language)}</span>
              </div>
              <h1>${escapeHtml(movie.title)}</h1>
              <div class="detail-rating">
                <span class="rating-badge"><i class="bi bi-star-fill"></i> ${ratingStr} / 10</span>
                <span>Audience Rating</span>
              </div>
              <div class="detail-user-rating card-user-rating" data-rate-movie="${movie.id}">
                <span class="card-rating-label">Your rating</span>
                <div class="rating-stars">
                  ${[1, 2, 3, 4, 5]
                    .map(
                      (val) => `
                      <button type="button" class="${val <= userRate ? "active" : ""}" data-rate="${movie.id}" data-value="${val}" aria-label="Rate ${val} out of 5">
                        <i class="bi bi-star${val <= userRate ? "-fill" : ""}"></i>
                      </button>`
                    )
                    .join("")}
                </div>
              </div>
              <p class="lead">${escapeHtml(movie.overview || movie.description || "")}</p>
              <div class="detail-meta">
                <div>
                  <span>Release Year</span>
                  <strong>${year}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>${duration}</strong>
                </div>
                <div>
                  <span>Original Language</span>
                  <strong>${escapeHtml(language)}</strong>
                </div>
                <div>
                  <span>Director</span>
                  <strong>${escapeHtml(director)}</strong>
                </div>
                <div class="grid-span-full">
                  <span>Key Cast</span>
                  <strong>${escapeHtml(cast)}</strong>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-3 mt-4">
                ${
                  trailerKey
                    ? `
                  <button class="btn btn-primary btn-lg" data-trailer="${trailerKey}" data-title="${escapeHtml(movie.title)}">
                    <i class="bi bi-youtube"></i> Watch Trailer
                  </button>
                `
                    : ""
                }
                <button class="btn btn-outline-light btn-lg ${isFav ? "active" : ""}" data-favorite="${movie.id}">
                  <i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"}"></i>
                  <span>${isFav ? "Saved to Favorites" : "Add to Favorites"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="container">
          <div class="section-heading">
            <div>
              <span class="eyebrow"><i class="bi bi-stars"></i> Keep exploring</span>
              <h2>More like this</h2>
            </div>
          </div>
          <div class="row g-4">
            ${relatedMovies.map(createMovieCard).join("")}
          </div>
        </div>
      </section>
    `;
  } catch (error) {
    console.error("Error loading movie details:", error);
    page.innerHTML = `
      <section class="not-found">
        <div class="container text-center">
          <i class="bi bi-film"></i>
          <h1>Movie details unavailable</h1>
          <p>Please try again later.</p>
          <a class="btn btn-primary" href="movies.html"><i class="bi bi-arrow-left"></i> Back to movies</a>
        </div>
      </section>`;
  }
}

function showNotFound(container) {
  container.innerHTML = `
    <section class="not-found">
      <div class="container text-center">
        <i class="bi bi-film"></i>
        <h1>Movie not found</h1>
        <p>We couldn't find the movie you're looking for.</p>
        <a class="btn btn-primary" href="movies.html"><i class="bi bi-arrow-left"></i> Back to movies</a>
      </div>
    </section>`;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMovieDetails);
} else {
  initMovieDetails();
}
