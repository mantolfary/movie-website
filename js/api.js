/**
 * MovieVibe - TMDB v3 API Client & Enrichment Layer
 */
import {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE,
  TMDB_BACKDROP_BASE,
} from "./config.js";

export { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE, TMDB_BACKDROP_BASE };

// In-memory cache for movie details to prevent duplicate network calls
const movieDetailsCache = new Map();

/**
 * Format runtime (in minutes) to "Xh YYm" format (e.g., 180 -> "3h 00m", or "N/A" if missing)
 * @param {number|string} runtime
 * @returns {string}
 */
export function formatRuntime(runtime) {
  if (runtime === null || runtime === undefined || runtime === "") return "N/A";
  if (typeof runtime === "string" && /^\d+h\s+\d+m$/i.test(runtime.trim())) {
    return runtime.trim();
  }
  const minutes = Number(runtime);
  if (isNaN(minutes) || minutes <= 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

/**
 * Convert ISO language code (e.g., "en") into full English name (e.g., "English")
 * using Intl.DisplayNames(['en'], { type: 'language' })
 * @param {string} langCode
 * @returns {string}
 */
export function formatLanguage(langCode) {
  if (!langCode || typeof langCode !== "string") return "N/A";
  const clean = langCode.trim();
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    const name = displayNames.of(clean.toLowerCase());
    if (name) return name;
  } catch (err) {
    // Fallback if code is unsupported by Intl
  }
  if (clean.length > 3) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean.toUpperCase();
}

/**
 * Find the crew member in movie.credits.crew where job === "Director"
 * @param {Object} movie
 * @returns {string} Director's name or "N/A"
 */
export function getDirector(movie) {
  if (movie?.credits?.crew && Array.isArray(movie.credits.crew)) {
    const director = movie.credits.crew.find(
      (person) => person && person.job === "Director"
    );
    if (director && director.name) return director.name;
  }
  return movie?.director || "N/A";
}

/**
 * Take the top 3-4 actors from movie.credits.cast, joined with commas
 * @param {Object} movie
 * @returns {string}
 */
export function getCast(movie) {
  if (movie?.credits?.cast && Array.isArray(movie.credits.cast) && movie.credits.cast.length > 0) {
    const topActors = movie.credits.cast
      .slice(0, 4)
      .map((actor) => actor?.name)
      .filter(Boolean);
    if (topActors.length > 0) return topActors.join(", ");
  }
  return movie?.cast || "N/A";
}

/**
 * Find the official YouTube trailer in movie.videos.results (site === "YouTube" and type === "Trailer")
 * @param {Object} movie
 * @returns {string|null} YouTube key or null
 */
export function getTrailerKey(movie) {
  if (movie?.videos?.results && Array.isArray(movie.videos.results)) {
    // Look for official trailer first
    const officialTrailer = movie.videos.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official === true && v.key
    );
    if (officialTrailer) return officialTrailer.key;

    // Fallback to any YouTube trailer
    const anyTrailer = movie.videos.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.key
    );
    if (anyTrailer) return anyTrailer.key;

    // Fallback to any YouTube video (Teaser / Clip)
    const anyVideo = movie.videos.results.find(
      (v) => v.site === "YouTube" && v.key
    );
    if (anyVideo) return anyVideo.key;
  }
  return movie?.trailer || null;
}

/**
 * Extract primary genre name
 * @param {Object} movie
 * @returns {string}
 */
export function getMovieGenre(movie) {
  if (movie?.genres && Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres[0].name;
  }
  if (typeof movie?.genre === "string" && movie.genre) {
    return movie.genre;
  }
  return "Featured";
}

/**
 * Escape HTML to prevent XSS in template literals
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate movie card HTML conforming to the exact card design
 * @param {Object} movie
 * @returns {string} HTML string
 */
export function createMovieCard(movie) {
  if (!movie) return "";

  const root =
    typeof window !== "undefined" && window.location?.pathname?.includes("/pages/")
      ? "../"
      : "";
  const localFallback = `${root}images/no-poster.svg`;

  // 1. Poster: ${TMDB_IMAGE_BASE}${movie.poster_path} (with local fallback if null)
  let posterSrc = localFallback;
  if (movie.poster_path) {
    posterSrc = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
  } else if (movie.poster) {
    posterSrc = movie.poster;
  }

  // 2. Rating Badge: movie.vote_average.toFixed(1) (e.g., 8.9)
  let ratingStr = "N/A";
  if (typeof movie.vote_average === "number" && !isNaN(movie.vote_average)) {
    ratingStr = movie.vote_average.toFixed(1);
  } else if (movie.rating !== undefined && movie.rating !== null) {
    const num = Number(movie.rating);
    ratingStr = !isNaN(num) ? num.toFixed(1) : String(movie.rating);
  }

  // 3. Title: movie.title
  const title = movie.title || "Untitled";

  // 4. Release Year Badge: movie.release_date.slice(0, 4) (e.g., 2023)
  let year = "N/A";
  if (movie.release_date && typeof movie.release_date === "string" && movie.release_date.length >= 4) {
    year = movie.release_date.slice(0, 4);
  } else if (movie.year) {
    year = String(movie.year);
  }

  // 5. Overview / Description: movie.overview (keep existing CSS line-clamp/truncation)
  const overview = movie.overview || movie.description || "No overview available.";

  // 6. Duration: Convert movie.runtime (in minutes) into Xh YYm format
  const duration = formatRuntime(movie.runtime !== undefined ? movie.runtime : movie.duration);

  // 7. Language: Convert movie.original_language into full English name
  const language = formatLanguage(movie.original_language || movie.language);

  // 8. Director: Find crew where job === "Director"
  const director = getDirector(movie);

  // 9. Cast: Top 3-4 actors joined with commas
  const cast = getCast(movie);

  // 10. Trailer Button: Find official YouTube trailer in movie.videos.results
  const trailerKey = getTrailerKey(movie);

  // 11. Details Button: Link to pages/movie-details.html?id=${movie.id}
  const detailsUrl = `${root}pages/movie-details.html?id=${encodeURIComponent(movie.id)}`;

  // 12. Interactive Features:
  const isFav =
    typeof window !== "undefined" && window.Cinevault?.isFavorite
      ? window.Cinevault.isFavorite(movie.id)
      : false;
  const userRate =
    typeof window !== "undefined" && window.Cinevault?.getUserRating
      ? window.Cinevault.getUserRating(movie.id)
      : 0;
  const genre = getMovieGenre(movie);

  return `
    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
      <article class="movie-card" data-movie-id="${movie.id}">
        <!-- Movie Poster -->
        <div class="poster-wrap">
          <a href="${detailsUrl}" aria-label="View details for ${escapeHtml(title)}">
            <img src="${posterSrc}" alt="${escapeHtml(title)} poster" loading="lazy" onerror="this.onerror=null;this.src='${localFallback}';">
          </a>
          
          <!-- Genre & Rating Badges -->
          <span class="genre-badge">${escapeHtml(genre)}</span>
          <span class="card-rating-badge"><i class="bi bi-star-fill"></i> ${ratingStr}</span>

          <!-- Favorite Button -->
          <button class="favorite-btn ${isFav ? "active" : ""}" data-favorite="${movie.id}" aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}">
            <i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>

          <!-- Quick trailer play button on poster hover -->
          ${
            trailerKey
              ? `
            <button type="button" class="poster-trailer-btn" data-trailer="${trailerKey}" data-title="${escapeHtml(title)}" aria-label="Play trailer for ${escapeHtml(title)}">
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
              <a href="${detailsUrl}" title="${escapeHtml(title)}">${escapeHtml(title)}</a>
            </h3>
            <span class="movie-year-badge">${year}</span>
          </div>

          <!-- Movie Description -->
          <p class="movie-card-desc" title="${escapeHtml(overview)}">
            ${escapeHtml(overview)}
          </p>

          <!-- Metadata: Duration, Language, Director, Cast -->
          <div class="movie-card-meta">
            <div class="meta-row">
              <span class="meta-label"><i class="bi bi-clock"></i> Duration:</span>
              <span class="meta-value">${duration}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label"><i class="bi bi-translate"></i> Language:</span>
              <span class="meta-value">${escapeHtml(language)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label"><i class="bi bi-camera-reels"></i> Director:</span>
              <span class="meta-value text-truncate" title="${escapeHtml(director)}">${escapeHtml(director)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label"><i class="bi bi-people"></i> Cast:</span>
              <span class="meta-value text-truncate" title="${escapeHtml(cast)}">${escapeHtml(cast)}</span>
            </div>
          </div>

          <!-- Action Buttons: Trailer & Details -->
          <div class="movie-card-actions">
            ${
              trailerKey
                ? `
              <button type="button" class="btn btn-trailer" data-trailer="${trailerKey}" data-title="${escapeHtml(title)}">
                <i class="bi bi-youtube"></i> Trailer
              </button>
            `
                : `
              <button type="button" class="btn btn-trailer disabled" disabled>
                <i class="bi bi-slash-circle"></i> Trailer
              </button>
            `
            }
            <a href="${detailsUrl}" class="btn btn-card-details">
              Details <i class="bi bi-chevron-right"></i>
            </a>
          </div>

          <!-- User 5-star Rating -->
          <div class="card-user-rating" data-rate-movie="${movie.id}" aria-label="Rate ${escapeHtml(title)}">
            <span class="card-rating-label">Your rating</span>
            <div class="rating-stars">
              ${[1, 2, 3, 4, 5]
                .map(
                  (value) => `
                <button type="button" class="${value <= userRate ? "active" : ""}" data-rate="${movie.id}" data-value="${value}" aria-label="Rate ${value} out of 5">
                  <i class="bi bi-star${value <= userRate ? "-fill" : ""}"></i>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

// Expose createMovieCard on window.Cinevault if Cinevault exists
if (typeof window !== "undefined") {
  window.Cinevault = window.Cinevault || {};
  window.Cinevault.createMovieCard = createMovieCard;
}

/**
 * Fetch full movie details including credits and videos from TMDB v3
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getMovieDetails(id) {
  const cacheKey = String(id);
  if (movieDetailsCache.has(cacheKey)) {
    return movieDetailsCache.get(cacheKey);
  }

  // If using placeholder key, return fallback immediately
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    const fallback = getFallbackMovieById(id);
    if (fallback) {
      movieDetailsCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        console.warn(`TMDB responded with status ${res.status} for movie ID ${id}. Checking fallback data.`);
        const fallback = getFallbackMovieById(id);
        if (fallback) {
          movieDetailsCache.set(cacheKey, fallback);
          return fallback;
        }
      }
      throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    movieDetailsCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error in getMovieDetails for ID ${id}:`, error);
    const fallback = getFallbackMovieById(id);
    if (fallback) return fallback;
    throw error;
  }
}

/**
 * Enriches a list of movies by calling TMDB /movie/{id}?append_to_response=credits,videos via Promise.all
 * @param {Array<Object>} movieList
 * @returns {Promise<Array<Object>>}
 */
export async function enrichMovies(movieList) {
  if (!Array.isArray(movieList) || movieList.length === 0) {
    return [];
  }

  try {
    const enriched = await Promise.all(
      movieList.map(async (movie) => {
        if (!movie || !movie.id) return movie;
        try {
          const details = await getMovieDetails(movie.id);
          return {
            ...movie,
            ...details,
            runtime: details.runtime ?? movie.runtime,
            credits: details.credits || movie.credits,
            videos: details.videos || movie.videos,
          };
        } catch (err) {
          console.warn(`Could not enrich movie ${movie.id} (${movie.title}):`, err);
          return movie;
        }
      })
    );
    return enriched;
  } catch (error) {
    console.error("Error in enrichMovies:", error);
    return movieList;
  }
}

/**
 * Fetch trending movies from TMDB and enrich them
 * @param {"day"|"week"} [timeWindow="week"]
 * @param {number} [page=1]
 * @returns {Promise<Array<Object>>}
 */
export async function getTrendingMovies(timeWindow = "week", page = 1) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    warnPlaceholderKey();
    return getFallbackMovies().slice(0, 8);
  }

  try {
    const url = `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        warnPlaceholderKey();
        return getFallbackMovies().slice(0, 8);
      }
      throw new Error(`TMDB error ${res.status}`);
    }
    const data = await res.json();
    return await enrichMovies(data.results || []);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return getFallbackMovies().slice(0, 8);
  }
}

/**
 * Fetch popular movies from TMDB and enrich them
 * @param {number} [page=1]
 * @returns {Promise<Array<Object>>}
 */
export async function getPopularMovies(page = 1) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    warnPlaceholderKey();
    return getFallbackMovies().slice(0, 12);
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        warnPlaceholderKey();
        return getFallbackMovies().slice(0, 12);
      }
      throw new Error(`TMDB error ${res.status}`);
    }
    const data = await res.json();
    return await enrichMovies(data.results || []);
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return getFallbackMovies().slice(0, 12);
  }
}

/**
 * Fetch top rated movies from TMDB and enrich them
 * @param {number} [page=1]
 * @returns {Promise<Array<Object>>}
 */
export async function getTopRatedMovies(page = 1) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    warnPlaceholderKey();
    return [...getFallbackMovies()].sort((a, b) => b.vote_average - a.vote_average);
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        warnPlaceholderKey();
        return [...getFallbackMovies()].sort((a, b) => b.vote_average - a.vote_average);
      }
      throw new Error(`TMDB error ${res.status}`);
    }
    const data = await res.json();
    return await enrichMovies(data.results || []);
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    return [...getFallbackMovies()].sort((a, b) => b.vote_average - a.vote_average);
  }
}

/**
 * Search movies by keyword from TMDB and enrich them
 * @param {string} query
 * @param {number} [page=1]
 * @returns {Promise<Array<Object>>}
 */
export async function searchMovies(query, page = 1) {
  if (!query || !query.trim()) return [];

  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    const q = query.toLowerCase().trim();
    return getFallbackMovies().filter((movie) => {
      const hay = `${movie.title} ${getDirector(movie)} ${getCast(movie)} ${movie.overview} ${formatLanguage(movie.original_language)}`.toLowerCase();
      return hay.includes(q);
    });
  }

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        const q = query.toLowerCase().trim();
        return getFallbackMovies().filter((m) => m.title.toLowerCase().includes(q));
      }
      throw new Error(`TMDB error ${res.status}`);
    }
    const data = await res.json();
    return await enrichMovies(data.results || []);
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

/**
 * Discover movies by options (genre, sort, year, etc.) and enrich them
 * @param {Object} [options={}]
 * @returns {Promise<Array<Object>>}
 */
export async function discoverMovies(options = {}) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    return getFallbackMovies();
  }

  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      page: options.page || 1,
      ...options,
    });
    const url = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return await enrichMovies(data.results || []);
  } catch (error) {
    console.error("Error in discoverMovies:", error);
    return getFallbackMovies();
  }
}

/**
 * Fetch official genre list from TMDB
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export async function getMovieGenres() {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_V3_API_KEY") {
    return [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 18, name: "Drama" },
      { id: 27, name: "Horror" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Sci-Fi" },
      { id: 53, name: "Thriller" },
    ];
  }

  try {
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return data.genres || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

function warnPlaceholderKey() {
  if (!warnPlaceholderKey.warned) {
    console.warn(
      "[MovieVibe TMDB API] TMDB_API_KEY is currently set to 'YOUR_TMDB_V3_API_KEY'. Using rich fallback dataset. Replace TMDB_API_KEY in js/config.js with your valid TMDB v3 API key to fetch live data."
    );
    warnPlaceholderKey.warned = true;
  }
}

/**
 * Internal fallback dataset structured identically to enriched TMDB responses
 */
const FALLBACK_MOVIES = [
  {
    id: 872585,
    title: "Oppenheimer",
    release_date: "2023-07-19",
    vote_average: 8.9,
    runtime: 180,
    original_language: "en",
    overview: "The story of American scientist J. Robert Oppenheimer and his pivotal role in developing the atomic bomb during World War II.",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/rLb2cw0iwACaarAcafvQw7GFv1k.jpg",
    genres: [{ id: 18, name: "Drama" }],
    credits: {
      crew: [{ job: "Director", name: "Christopher Nolan" }],
      cast: [{ name: "Cillian Murphy" }, { name: "Emily Blunt" }, { name: "Matt Damon" }, { name: "Robert Downey Jr." }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "uYPbbksJxIg" }],
    },
  },
  {
    id: 693134,
    title: "Dune: Part Two",
    release_date: "2024-02-27",
    vote_average: 8.6,
    runtime: 166,
    original_language: "en",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking vengeance against the conspirators who destroyed his noble family.",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520Wio.jpg",
    genres: [{ id: 878, name: "Sci-Fi" }],
    credits: {
      crew: [{ job: "Director", name: "Denis Villeneuve" }],
      cast: [{ name: "Timothée Chalamet" }, { name: "Zendaya" }, { name: "Rebecca Ferguson" }, { name: "Javier Bardem" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "Way9Dexny3w" }],
    },
  },
  {
    id: 157336,
    title: "Interstellar",
    release_date: "2014-11-05",
    vote_average: 8.7,
    runtime: 169,
    original_language: "en",
    overview: "When Earth faces catastrophic crop blights, a team of courageous astronauts ventures through a wormhole to find a habitable new home.",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/rAiYTggZ7qzlMU9f0wh846qjTXQ.jpg",
    genres: [{ id: 878, name: "Sci-Fi" }],
    credits: {
      crew: [{ job: "Director", name: "Christopher Nolan" }],
      cast: [{ name: "Matthew McConaughey" }, { name: "Anne Hathaway" }, { name: "Jessica Chastain" }, { name: "Michael Caine" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "zSWdZVtXT7E" }],
    },
  },
  {
    id: 155,
    title: "The Dark Knight",
    release_date: "2008-07-16",
    vote_average: 9.0,
    runtime: 152,
    original_language: "en",
    overview: "Batman confronts the chaotic criminal mastermind known as the Joker, who plunges Gotham into psychological terror and anarchy.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
    genres: [{ id: 28, name: "Action" }],
    credits: {
      crew: [{ job: "Director", name: "Christopher Nolan" }],
      cast: [{ name: "Christian Bale" }, { name: "Heath Ledger" }, { name: "Aaron Eckhart" }, { name: "Michael Caine" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "EXeTwQWrcwY" }],
    },
  },
  {
    id: 27205,
    title: "Inception",
    release_date: "2010-07-15",
    vote_average: 8.8,
    runtime: 148,
    original_language: "en",
    overview: "A master extractor who infiltrates targets' subconscious dreams is offered a clean slate if he can successfully plant an idea instead.",
    poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    genres: [{ id: 878, name: "Sci-Fi" }],
    credits: {
      crew: [{ job: "Director", name: "Christopher Nolan" }],
      cast: [{ name: "Leonardo DiCaprio" }, { name: "Joseph Gordon-Levitt" }, { name: "Elliot Page" }, { name: "Tom Hardy" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "YoHD9XEInc0" }],
    },
  },
  {
    id: 496243,
    title: "Parasite",
    release_date: "2019-05-30",
    vote_average: 8.5,
    runtime: 132,
    original_language: "ko",
    overview: "A destitute family schemes to become employed by an affluent household, unravelling unexpected secrets and class deception.",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_path: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    genres: [{ id: 53, name: "Thriller" }],
    credits: {
      crew: [{ job: "Director", name: "Bong Joon-ho" }],
      cast: [{ name: "Song Kang-ho" }, { name: "Lee Sun-kyun" }, { name: "Cho Yeo-jeong" }, { name: "Choi Woo-shik" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "5xH0Rqa1VDg" }],
    },
  },
  {
    id: 129,
    title: "Spirited Away",
    release_date: "2001-07-20",
    vote_average: 8.6,
    runtime: 125,
    original_language: "ja",
    overview: "Ten-year-old Chihiro enters a magical realm of spirits and witches, determined to rescue her transformed parents and return home.",
    poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop_path: "/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
    genres: [{ id: 16, name: "Animation" }],
    credits: {
      crew: [{ job: "Director", name: "Hayao Miyazaki" }],
      cast: [{ name: "Rumi Hiiragi" }, { name: "Miyu Irino" }, { name: "Mari Natsuki" }, { name: "Takashi Naito" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "ByXuk9QqQkk" }],
    },
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    release_date: "2023-05-31",
    vote_average: 8.7,
    runtime: 140,
    original_language: "en",
    overview: "Miles Morales journeys across the Multiverse where he must redefine what it truly means to be a hero against other Spider-Heroes.",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdrop_path: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    genres: [{ id: 16, name: "Animation" }],
    credits: {
      crew: [{ job: "Director", name: "Joaquim Dos Santos" }],
      cast: [{ name: "Shameik Moore" }, { name: "Hailee Steinfeld" }, { name: "Oscar Isaac" }, { name: "Daniel Kaluuya" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "cqGjhVJWtEg" }],
    },
  },
  {
    id: 603692,
    title: "John Wick: Chapter 4",
    release_date: "2023-03-22",
    vote_average: 7.7,
    runtime: 169,
    original_language: "en",
    overview: "Legendary hitman John Wick takes his fight against the High Table global as he seeks ultimate freedom from relentless bounties.",
    poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    backdrop_path: "/7I6VUdPj6tQECNHdviJkUHD2389.jpg",
    genres: [{ id: 28, name: "Action" }],
    credits: {
      crew: [{ job: "Director", name: "Chad Stahelski" }],
      cast: [{ name: "Keanu Reeves" }, { name: "Donnie Yen" }, { name: "Bill Skarsgård" }, { name: "Laurence Fishburne" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "qEVUtrk8_B4" }],
    },
  },
  {
    id: 558449,
    title: "Gladiator II",
    release_date: "2024-11-13",
    vote_average: 7.0,
    runtime: 148,
    original_language: "en",
    overview: "Years after Maximus' heroic sacrifice, Lucius enters the brutal Colosseum to battle tyrannical emperors and restore glory to Rome.",
    poster_path: "/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    backdrop_path: "/euYIwmwkmz95mnExvufEmbLqvDc.jpg",
    genres: [{ id: 28, name: "Action" }],
    credits: {
      crew: [{ job: "Director", name: "Ridley Scott" }],
      cast: [{ name: "Paul Mescal" }, { name: "Pedro Pascal" }, { name: "Denzel Washington" }, { name: "Connie Nielsen" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "4rgYUipGJNo" }],
    },
  },
  {
    id: 238,
    title: "The Godfather",
    release_date: "1972-03-14",
    vote_average: 9.2,
    runtime: 175,
    original_language: "en",
    overview: "The aging patriarch of a powerful mafia dynasty passes the torch of his empire to his reluctant youngest war-hero son.",
    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    genres: [{ id: 80, name: "Crime" }],
    credits: {
      crew: [{ job: "Director", name: "Francis Ford Coppola" }],
      cast: [{ name: "Marlon Brando" }, { name: "Al Pacino" }, { name: "James Caan" }, { name: "Robert Duvall" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "UaVTIH8mujA" }],
    },
  },
  {
    id: 666277,
    title: "Past Lives",
    release_date: "2023-06-02",
    vote_average: 7.9,
    runtime: 105,
    original_language: "ko",
    overview: "Nora and Hae Sung, two childhood sweethearts separated by migration, reunite in New York decades later to ponder love and destiny.",
    poster_path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    backdrop_path: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    genres: [{ id: 10749, name: "Romance" }],
    credits: {
      crew: [{ job: "Director", name: "Celine Song" }],
      cast: [{ name: "Greta Lee" }, { name: "Teo Yoo" }, { name: "John Magaro" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "kA244xewjcI" }],
    },
  },
  {
    id: 945961,
    title: "Alien: Romulus",
    release_date: "2024-08-13",
    vote_average: 7.2,
    runtime: 119,
    original_language: "en",
    overview: "Young scavengers exploring a desolate space outpost come face-to-face with the universe's most horrific extraterrestrial predator.",
    poster_path: "/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
    backdrop_path: "/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg",
    genres: [{ id: 27, name: "Horror" }],
    credits: {
      crew: [{ job: "Director", name: "Fede Álvarez" }],
      cast: [{ name: "Cailee Spaeny" }, { name: "David Jonsson" }, { name: "Archie Renaux" }, { name: "Isabela Merced" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "x0XDEhP4MQs" }],
    },
  },
  {
    id: 244786,
    title: "Whiplash",
    release_date: "2014-10-10",
    vote_average: 8.5,
    runtime: 107,
    original_language: "en",
    overview: "An ambitious jazz drummer enrolls in a prestigious music conservatory, pushed to his absolute breaking point by an abusive conductor.",
    poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop_path: "/6bbZ6XyvgfjhQwbpl3HG3t69qqu.jpg",
    genres: [{ id: 18, name: "Drama" }],
    credits: {
      crew: [{ job: "Director", name: "Damien Chazelle" }],
      cast: [{ name: "Miles Teller" }, { name: "J.K. Simmons" }, { name: "Paul Reiser" }, { name: "Melissa Benoist" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "7d_jQycdQGo" }],
    },
  },
  {
    id: 299534,
    title: "Avengers: Endgame",
    release_date: "2019-04-24",
    vote_average: 8.4,
    runtime: 181,
    original_language: "en",
    overview: "Following Thanos' devastating snap, the remaining Avengers rally one last time across time to undo the universe's catastrophe.",
    poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdrop_path: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    genres: [{ id: 28, name: "Action" }],
    credits: {
      crew: [{ job: "Director", name: "Anthony Russo" }],
      cast: [{ name: "Robert Downey Jr." }, { name: "Chris Evans" }, { name: "Mark Ruffalo" }, { name: "Chris Hemsworth" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "TcMBFSGVi1c" }],
    },
  },
  {
    id: 680,
    title: "Pulp Fiction",
    release_date: "1994-09-10",
    vote_average: 8.9,
    runtime: 154,
    original_language: "en",
    overview: "The interrelated stories of two hitmen, a mobster's wife, a prizefighter, and diner robbers weave through violence and redemption in Los Angeles.",
    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    genres: [{ id: 80, name: "Crime" }],
    credits: {
      crew: [{ job: "Director", name: "Quentin Tarantino" }],
      cast: [{ name: "John Travolta" }, { name: "Uma Thurman" }, { name: "Samuel L. Jackson" }, { name: "Bruce Willis" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "s7EdQ4FqbhY" }],
    },
  },
  {
    id: 354912,
    title: "Coco",
    release_date: "2017-10-27",
    vote_average: 8.4,
    runtime: 105,
    original_language: "es",
    overview: "Young musician Miguel crosses into the stunning Land of the Dead on Día de los Muertos to unlock his family's mysterious musical ancestry.",
    poster_path: "/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
    backdrop_path: "/askg3SMvhqEl4OL52YuvdtY40Yb.jpg",
    genres: [{ id: 16, name: "Animation" }],
    credits: {
      crew: [{ job: "Director", name: "Lee Unkrich" }],
      cast: [{ name: "Anthony Gonzalez" }, { name: "Gael García Bernal" }, { name: "Benjamin Bratt" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "Rvr68u6k5sI" }],
    },
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    release_date: "2024-07-24",
    vote_average: 7.7,
    runtime: 128,
    original_language: "en",
    overview: "Wade Wilson's quiet retirement is shattered when the TVA recruits him for a multiverse-saving mission alongside a weary Wolverine.",
    poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop_path: "/yDHYTjA3R0jFYba16jBB1jv8AmC.jpg",
    genres: [{ id: 35, name: "Comedy" }],
    credits: {
      crew: [{ job: "Director", name: "Shawn Levy" }],
      cast: [{ name: "Ryan Reynolds" }, { name: "Hugh Jackman" }, { name: "Emma Corrin" }, { name: "Matthew Macfadyen" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "73_1biulkYk" }],
    },
  },
  {
    id: 278,
    title: "The Shawshank Redemption",
    release_date: "1994-09-23",
    vote_average: 9.3,
    runtime: 142,
    original_language: "en",
    overview: "Banker Andy Dufresne is wrongly convicted of murder and forms an inspiring, lifelong bond of hope and resilience behind prison bars.",
    poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    backdrop_path: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    genres: [{ id: 18, name: "Drama" }],
    credits: {
      crew: [{ job: "Director", name: "Frank Darabont" }],
      cast: [{ name: "Tim Robbins" }, { name: "Morgan Freeman" }, { name: "Bob Gunton" }, { name: "William Sadler" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "PLl99DlL6b4" }],
    },
  },
  {
    id: 550,
    title: "Fight Club",
    release_date: "1999-10-15",
    vote_average: 8.8,
    runtime: 139,
    original_language: "en",
    overview: "A disillusioned corporate worker joins forces with an eccentric soapmaker to start an underground fight club that spirals out of control.",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    genres: [{ id: 18, name: "Drama" }],
    credits: {
      crew: [{ job: "Director", name: "David Fincher" }],
      cast: [{ name: "Brad Pitt" }, { name: "Edward Norton" }, { name: "Helena Bonham Carter" }, { name: "Meat Loaf" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "qtRKdVHc-cE" }],
    },
  },
  {
    id: 372058,
    title: "Your Name.",
    release_date: "2016-08-26",
    vote_average: 8.4,
    runtime: 107,
    original_language: "ja",
    overview: "Two high school students living separate lives mysteriously begin swapping bodies, setting off a search across time and memory.",
    poster_path: "/aWeKITRFbbwY8txG5uCj4rMCfSP.jpg",
    backdrop_path: "/vfvy4Y27q6X13p3Z9G4Kq7aYwXv.jpg",
    genres: [{ id: 16, name: "Animation" }],
    credits: {
      crew: [{ job: "Director", name: "Makoto Shinkai" }],
      cast: [{ name: "Ryunosuke Kamiki" }, { name: "Mone Kamishiraishi" }, { name: "Ryo Narita" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "xU47nhruN-Q" }],
    },
  },
  {
    id: 603,
    title: "The Matrix",
    release_date: "1999-03-30",
    vote_average: 8.7,
    runtime: 136,
    original_language: "en",
    overview: "Computer hacker Neo uncovers the shocking reality that humankind is trapped in a simulated world ruled by sentient cybernetic machines.",
    poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_path: "/icmm587lQ2NZC9YsIgZux4DT4y2.jpg",
    genres: [{ id: 878, name: "Sci-Fi" }],
    credits: {
      crew: [{ job: "Director", name: "Lana Wachowski" }],
      cast: [{ name: "Keanu Reeves" }, { name: "Laurence Fishburne" }, { name: "Carrie-Anne Moss" }, { name: "Hugo Weaving" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "vKQi3bBA1y8" }],
    },
  },
  {
    id: 13,
    title: "Forrest Gump",
    release_date: "1994-06-23",
    vote_average: 8.8,
    runtime: 142,
    original_language: "en",
    overview: "The heartwarming life of Forrest Gump, a kind-hearted man whose optimism inadvertently shapes major moments in twentieth-century history.",
    poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdrop_path: "/qdIMwi4ABG7rwL559pgb1rQh8q9.jpg",
    genres: [{ id: 35, name: "Comedy" }],
    credits: {
      crew: [{ job: "Director", name: "Robert Zemeckis" }],
      cast: [{ name: "Tom Hanks" }, { name: "Robin Wright" }, { name: "Gary Sinise" }, { name: "Sally Field" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "bLvqoHBptjg" }],
    },
  },
  {
    id: 545611,
    title: "Everything Everywhere All at Once",
    release_date: "2022-03-24",
    vote_average: 7.8,
    runtime: 139,
    original_language: "en",
    overview: "An overwhelmed laundromat owner is pulled into an existential multiverse quest where only she can defeat an all-consuming cosmic threat.",
    poster_path: "/w3LxiVYPqRLexPasp0786idvnAh.jpg",
    backdrop_path: "/f2J8DpT5bqV0AiI9VVcfiuqKo5l.jpg",
    genres: [{ id: 35, name: "Comedy" }],
    credits: {
      crew: [{ job: "Director", name: "Daniel Kwan" }],
      cast: [{ name: "Michelle Yeoh" }, { name: "Stephanie Hsu" }, { name: "Ke Huy Quan" }, { name: "Jamie Lee Curtis" }],
    },
    videos: {
      results: [{ site: "YouTube", type: "Trailer", official: true, key: "wxN1T1uxQ2g" }],
    },
  },
];

// Map lookup support by both numeric and string IDs (e.g. "oppenheimer" or 872585)
const fallbackSlugMap = {
  oppenheimer: 872585,
  "dune-part-two": 693134,
  interstellar: 157336,
  "the-dark-knight": 155,
  inception: 27205,
  parasite: 496243,
  "spirited-away": 129,
  "spider-man-across-the-spider-verse": 569094,
  "john-wick-chapter-4": 603692,
  "gladiator-2": 558449,
  "the-godfather": 238,
  "past-lives": 666277,
  "alien-romulus": 945961,
  whiplash: 244786,
  "avengers-endgame": 299534,
  "pulp-fiction": 680,
  coco: 354912,
  "deadpool-and-wolverine": 533535,
  "the-shawshank-redemption": 278,
  "fight-club": 550,
  "your-name": 372058,
  "the-matrix": 603,
  "forrest-gump": 13,
  "everything-everywhere-all-at-once": 545611,
};

export function getFallbackMovies() {
  return FALLBACK_MOVIES;
}

export function getFallbackMovieById(id) {
  const norm = String(id).toLowerCase();
  const numericId = fallbackSlugMap[norm] || Number(norm);
  return (
    FALLBACK_MOVIES.find((m) => String(m.id) === norm || m.id === numericId) ||
    FALLBACK_MOVIES[0]
  );
}
