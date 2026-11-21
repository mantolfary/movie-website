/**
 * Live TMDB Data Module
 * Replaces static mock data with live data from The Movie Database (TMDB) v3 API
 */
import { getPopularMovies, getTrendingMovies } from "../js/api.js";

export let MOVIES = [];

export const moviesReady = (async () => {
  try {
    const [popular, trending] = await Promise.all([
      getPopularMovies(1),
      getTrendingMovies("week", 1),
    ]);
    const map = new Map();
    [...popular, ...trending].forEach((movie) => {
      if (movie && movie.id && !map.has(String(movie.id))) {
        map.set(String(movie.id), movie);
      }
    });
    MOVIES = Array.from(map.values());
    if (typeof window !== "undefined") {
      window.MOVIES = MOVIES;
      window.moviesReady = Promise.resolve(MOVIES);
    }
    return MOVIES;
  } catch (error) {
    console.error("Failed to fetch live TMDB movies for movies-data.js:", error);
    return [];
  }
})();

if (typeof window !== "undefined") {
  window.moviesReady = moviesReady;
}
