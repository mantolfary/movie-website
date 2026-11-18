(function () {
  const id = new URLSearchParams(location.search).get("id"),
    page = document.getElementById("details-page");

  moviesReady
    .then((movies) => {
      const movie = movies.find((item) => String(item.id) === String(id));
      if (!movie) {
        page.innerHTML = `
          <section class="not-found">
            <div class="container text-center">
              <i class="bi bi-film"></i>
              <h1>Movie not found</h1>
              <p>We couldn't find the movie you're looking for.</p>
              <a class="btn btn-primary" href="movies.html"><i class="bi bi-arrow-left"></i> Back to movies</a>
            </div>
          </section>`;
        return;
      }

      document.title = `${movie.title} | Cinevault`;
      const fallbackTitle = encodeURIComponent(movie.title || "Movie");

      page.innerHTML = `
        <section class="details-hero" style="--backdrop:url('${movie.backdrop}')">
          <div class="container">
            <a class="back-link" href="movies.html"><i class="bi bi-arrow-left"></i> Back to movies</a>
            <div class="details-layout">
              <div class="details-poster">
                <img src="${movie.poster}" alt="${movie.title} poster" onerror="this.onerror=null;this.src='https://placehold.co/500x750/1f1f1f/ffffff?text=${fallbackTitle}';">
              </div>
              <div class="details-copy">
                <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                  <span class="genre-badge">${movie.genre}</span>
                  <span class="detail-year"><i class="bi bi-calendar3"></i> ${movie.year}</span>
                  <span class="detail-year"><i class="bi bi-clock"></i> ${movie.duration}</span>
                  <span class="detail-year"><i class="bi bi-translate"></i> ${movie.language}</span>
                </div>
                <h1>${movie.title}</h1>
                <div class="detail-rating">
                  <span class="rating-badge"><i class="bi bi-star-fill"></i> ${movie.rating} / 10</span>
                  <span>Audience Rating</span>
                </div>
                <div class="detail-user-rating card-user-rating" data-rate-movie="${movie.id}">
                  <span class="card-rating-label">Your rating</span>
                  <div class="rating-stars">
                    ${[1, 2, 3, 4, 5]
                      .map(
                        (value) => `
                        <button type="button" class="${value <= Cinevault.getUserRating(movie.id) ? "active" : ""}" data-rate="${movie.id}" data-value="${value}" aria-label="Rate ${value} out of 5">
                          <i class="bi bi-star${value <= Cinevault.getUserRating(movie.id) ? "-fill" : ""}"></i>
                        </button>`,
                      )
                      .join("")}
                  </div>
                </div>
                <p class="lead">${movie.description}</p>
                <div class="detail-meta">
                  <div>
                    <span>Release Year</span>
                    <strong>${movie.year}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>${movie.duration}</strong>
                  </div>
                  <div>
                    <span>Original Language</span>
                    <strong>${movie.language}</strong>
                  </div>
                  <div>
                    <span>Director</span>
                    <strong>${movie.director}</strong>
                  </div>
                  <div class="grid-span-full">
                    <span>Key Cast</span>
                    <strong>${movie.cast}</strong>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-3 mt-4">
                  ${
                    movie.trailer
                      ? `
                    <button class="btn btn-primary btn-lg" data-trailer="${movie.trailer}" data-title="${movie.title}">
                      <i class="bi bi-youtube"></i> Watch Trailer
                    </button>
                  `
                      : ""
                  }
                  <button class="btn btn-outline-light btn-lg ${Cinevault.isFavorite(movie.id) ? "active" : ""}" data-favorite="${movie.id}">
                    <i class="bi ${Cinevault.isFavorite(movie.id) ? "bi-heart-fill" : "bi-heart"}"></i>
                    <span>${Cinevault.isFavorite(movie.id) ? "Saved to Favorites" : "Add to Favorites"}</span>
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
              ${
                movies
                  .filter(
                    (item) =>
                      item.genre === movie.genre && item.id !== movie.id,
                  )
                  .slice(0, 4)
                  .map(Cinevault.createMovieCard)
                  .join("") ||
                movies
                  .filter((item) => item.id !== movie.id)
                  .slice(0, 4)
                  .map(Cinevault.createMovieCard)
                  .join("")
              }
            </div>
          </div>
        </section>
      `;
    })
    .catch(() => {
      page.innerHTML = `
        <section class="not-found">
          <div class="container text-center">
            <i class="bi bi-film"></i>
            <h1>Movie details unavailable</h1>
            <p>Please try again later.</p>
            <a class="btn btn-primary" href="movies.html">Back to movies</a>
          </div>
        </section>`;
    });
})();
