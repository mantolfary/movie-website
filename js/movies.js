/**
 * Browse Movies Controller - TMDB live data integration
 */
import {
  getPopularMovies,
  getTopRatedMovies,
  searchMovies,
  getMovieGenres,
  getDirector,
  getCast,
  formatLanguage,
  getMovieGenre,
  createMovieCard,
} from "./api.js";

const searchInput = document.getElementById("movie-search");
const genreSelect = document.getElementById("genre-filter");
const sortSelect = document.getElementById("sort-select");
const grid = document.getElementById("movies-grid");
const countEl = document.getElementById("results-count");
const emptyEl = document.getElementById("empty-results");
const showMoreBtn = document.getElementById("show-more");
const clearBtn = document.getElementById("clear-filters");

let allMovies = [];
let visibleCount = 8;
let currentPage = 1;
let activeSearchQuery = "";
let isFetchingMore = false;

async function initMovies() {
  try {
    // 1. Fetch initial live movies and genres from TMDB
    const [popular, genres] = await Promise.all([
      getPopularMovies(1),
      getMovieGenres(),
    ]);

    allMovies = popular;

    // 2. Populate Genre Filter dropdown
    if (genreSelect && genres.length > 0) {
      genres.forEach((g) => {
        const option = document.createElement("option");
        option.value = g.name;
        option.textContent = g.name;
        genreSelect.appendChild(option);
      });
    }

    // 3. Parse URL search parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has("q") && searchInput) {
      searchInput.value = params.get("q");
      activeSearchQuery = params.get("q").trim();
    }
    if (params.has("genre") && genreSelect) {
      genreSelect.value = params.get("genre");
    }
    if (params.has("sort") && sortSelect) {
      const sortParam = params.get("sort");
      if (sortParam === "rating") sortSelect.value = "rating-desc";
      else sortSelect.value = sortParam;
    }

    // If query exists on load, execute search immediately
    if (activeSearchQuery) {
      const searchResults = await searchMovies(activeSearchQuery, 1);
      if (searchResults && searchResults.length > 0) {
        allMovies = searchResults;
      }
    }

    // 4. Attach event listeners
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const query = searchInput.value.trim();
          if (query !== activeSearchQuery) {
            activeSearchQuery = query;
            visibleCount = 8;
            if (activeSearchQuery.length >= 2) {
              const results = await searchMovies(activeSearchQuery, 1);
              allMovies = results;
            } else if (activeSearchQuery.length === 0) {
              allMovies = await getPopularMovies(1);
            }
            render();
          }
        }, 350);
      });
    }

    if (genreSelect) {
      genreSelect.addEventListener("change", () => {
        visibleCount = 8;
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        visibleCount = 8;
        render();
      });
    }

    if (showMoreBtn) {
      showMoreBtn.addEventListener("click", async () => {
        const currentFiltered = getFilteredMovies();
        if (visibleCount < currentFiltered.length) {
          visibleCount += 8;
          render();
        } else if (!activeSearchQuery && !isFetchingMore) {
          // Fetch next page from TMDB
          try {
            isFetchingMore = true;
            showMoreBtn.disabled = true;
            showMoreBtn.textContent = "Loading...";
            currentPage += 1;
            const nextMovies = await getPopularMovies(currentPage);
            if (nextMovies && nextMovies.length > 0) {
              const existingIds = new Set(allMovies.map((m) => String(m.id)));
              const uniqueNew = nextMovies.filter((m) => !existingIds.has(String(m.id)));
              allMovies = [...allMovies, ...uniqueNew];
              visibleCount += 8;
            }
          } catch (e) {
            console.error("Could not fetch more movies:", e);
          } finally {
            isFetchingMore = false;
            showMoreBtn.disabled = false;
            showMoreBtn.textContent = "Show more movies";
            render();
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        if (searchInput) searchInput.value = "";
        if (genreSelect) genreSelect.value = "all";
        if (sortSelect) sortSelect.value = "default";
        activeSearchQuery = "";
        visibleCount = 8;
        allMovies = await getPopularMovies(1);
        render();
      });
    }

    render();
  } catch (error) {
    console.error("Error initializing movies page:", error);
    if (countEl) countEl.textContent = "Movies unavailable";
    if (emptyEl) emptyEl.classList.remove("d-none");
    if (showMoreBtn) showMoreBtn.classList.add("d-none");
  }
}

function getFilteredMovies() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  const selectedGenre = genreSelect?.value || "all";
  const selectedSort = sortSelect?.value || "default";

  let results = allMovies.filter((movie) => {
    // Search query filter (checks title, director, cast, language, year, overview)
    const director = getDirector(movie);
    const cast = getCast(movie);
    const lang = formatLanguage(movie.original_language || movie.language);
    const year = movie.release_date?.slice(0, 4) || movie.year || "";
    const overview = movie.overview || movie.description || "";
    const genre = getMovieGenre(movie);

    const matchesQuery =
      !query ||
      `${movie.title} ${genre} ${director} ${cast} ${lang} ${year} ${overview}`
        .toLowerCase()
        .includes(query);

    // Genre filter
    let matchesGenre = selectedGenre === "all";
    if (!matchesGenre) {
      if (movie.genres && Array.isArray(movie.genres)) {
        matchesGenre = movie.genres.some(
          (g) => g.name.toLowerCase() === selectedGenre.toLowerCase()
        );
      } else {
        matchesGenre =
          (movie.genre || "").toLowerCase() === selectedGenre.toLowerCase();
      }
    }

    return matchesQuery && matchesGenre;
  });

  // Sorting
  if (selectedSort !== "default") {
    results = [...results].sort((a, b) => {
      const ratingA = typeof a.vote_average === "number" ? a.vote_average : Number(a.rating || 0);
      const ratingB = typeof b.vote_average === "number" ? b.vote_average : Number(b.rating || 0);
      const yearA = parseInt(a.release_date?.slice(0, 4) || a.year || 0, 10);
      const yearB = parseInt(b.release_date?.slice(0, 4) || b.year || 0, 10);

      switch (selectedSort) {
        case "rating-desc":
          return ratingB - ratingA;
        case "rating-asc":
          return ratingA - ratingB;
        case "year-desc":
          return yearB - yearA;
        case "year-asc":
          return yearA - yearB;
        default:
          return 0;
      }
    });
  }

  return results;
}

function render() {
  const filtered = getFilteredMovies();
  const query = (searchInput?.value || "").trim();
  const selectedGenre = genreSelect?.value || "all";
  const selectedSort = sortSelect?.value || "default";

  if (countEl) {
    countEl.textContent = `${filtered.length} movie${filtered.length === 1 ? "" : "s"} found`;
  }

  if (grid) {
    grid.innerHTML = filtered
      .slice(0, visibleCount)
      .map(createMovieCard)
      .join("");
  }

  if (emptyEl) {
    emptyEl.classList.toggle("d-none", filtered.length !== 0);
  }

  if (showMoreBtn) {
    showMoreBtn.classList.toggle("d-none", visibleCount >= filtered.length);
  }

  if (clearBtn) {
    const isFiltered = Boolean(query) || selectedGenre !== "all" || selectedSort !== "default";
    clearBtn.classList.toggle("d-none", !isFiltered);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMovies);
} else {
  initMovies();
}
