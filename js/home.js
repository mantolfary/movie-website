/**
 * Home Page Controller - TMDB live data integration
 */
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  createMovieCard,
} from "./api.js";

async function initHome() {
  const trendingGrid = document.querySelector("#trending-grid");
  const popularGrid = document.querySelector("#popular-grid");

  try {
    // Fetch live trending and popular movies from TMDB
    const [trending, popular] = await Promise.all([
      getTrendingMovies("week"),
      getPopularMovies(1),
    ]);

    if (trendingGrid) {
      trendingGrid.innerHTML = trending.slice(0, 8).map(createMovieCard).join("");
    }

    if (popularGrid) {
      // If popular has items, display top rated / popular picks
      const popularPicks = popular.length > 0 ? popular : await getTopRatedMovies(1);
      popularGrid.innerHTML = popularPicks.slice(0, 8).map(createMovieCard).join("");
    }
  } catch (err) {
    console.error("Failed to load home page movies:", err);
    document
      .querySelectorAll("#trending-grid, #popular-grid")
      .forEach((el) => {
        el.innerHTML =
          '<div class="col-12"><div class="api-error"><i class="bi bi-cloud-slash"></i><p>Movies are temporarily unavailable.</p></div></div>';
      });
  }
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHome);
} else {
  initHome();
}
