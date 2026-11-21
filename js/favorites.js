/**
 * Favorites Page Controller - TMDB live data integration
 */
import { getMovieDetails, createMovieCard } from "./api.js";
import { getFavorites, setFavorites, toast } from "./utils.js";

const grid = document.getElementById("favorites-grid");
const empty = document.getElementById("empty-favorites");
const clearBtn = document.getElementById("clear-all");

// Memory cache of loaded favorite movies
const favoriteCache = new Map();

export async function refreshFavorites() {
  const favIds = getFavorites();

  if (!favIds || favIds.length === 0) {
    if (grid) grid.innerHTML = "";
    if (empty) empty.classList.remove("d-none");
    if (clearBtn) clearBtn.classList.add("d-none");
    return;
  }

  try {
    const movies = await Promise.all(
      favIds.map(async (id) => {
        if (favoriteCache.has(String(id))) {
          return favoriteCache.get(String(id));
        }
        try {
          const movie = await getMovieDetails(id);
          if (movie) favoriteCache.set(String(id), movie);
          return movie;
        } catch (err) {
          console.warn(`Could not load details for favorite movie ID ${id}:`, err);
          return null;
        }
      })
    );

    const validMovies = movies.filter(Boolean);

    if (grid) {
      grid.innerHTML = validMovies.map(createMovieCard).join("");
    }

    if (empty) {
      empty.classList.toggle("d-none", validMovies.length !== 0);
    }

    if (clearBtn) {
      clearBtn.classList.toggle("d-none", validMovies.length === 0);
    }
  } catch (error) {
    console.error("Error refreshing favorites:", error);
    if (empty) empty.classList.remove("d-none");
    if (clearBtn) clearBtn.classList.add("d-none");
  }
}

// Assign to window for main.js favorite toggle updates
window.refreshFavorites = refreshFavorites;

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    setFavorites([]);
    refreshFavorites();
    toast("All favorites cleared");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", refreshFavorites);
} else {
  refreshFavorites();
}
