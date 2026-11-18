(function () {
  const search = document.getElementById("movie-search"),
    genre = document.getElementById("genre-filter"),
    sort = document.getElementById("sort-select"),
    grid = document.getElementById("movies-grid"),
    count = document.getElementById("results-count"),
    empty = document.getElementById("empty-results"),
    showMore = document.getElementById("show-more"),
    clear = document.getElementById("clear-filters");

  moviesReady
    .then((movies) => {
      const genres = [...new Set(movies.map((movie) => movie.genre))].sort();
      genres.forEach((item) =>
        genre.insertAdjacentHTML(
          "beforeend",
          `<option value="${item}">${item}</option>`,
        ),
      );

      const params = new URLSearchParams(location.search);
      if (params.has("q")) search.value = params.get("q");
      if (params.has("genre")) genre.value = params.get("genre");
      if (params.has("sort")) sort.value = params.get("sort");

      let visible = 8;

      const render = () => {
        const query = (search.value || "").toLowerCase().trim();
        const selectedGenre = genre.value;

        let result = movies.filter((movie) => {
          const matchesQuery =
            !query ||
            `${movie.title} ${movie.genre} ${movie.director} ${movie.cast} ${movie.language} ${movie.year} ${movie.description}`
              .toLowerCase()
              .includes(query);
          const matchesGenre =
            selectedGenre === "all" || movie.genre === selectedGenre;
          return matchesQuery && matchesGenre;
        });

        if (sort.value !== "default") {
          if (sort.value === "rating-desc") {
            result.sort((a, b) => b.rating - a.rating);
          } else if (sort.value === "rating-asc") {
            result.sort((a, b) => a.rating - b.rating);
          } else if (sort.value === "year-desc") {
            result.sort((a, b) => b.year - a.year);
          } else if (sort.value === "year-asc") {
            result.sort((a, b) => a.year - b.year);
          }
        }

        count.textContent = `${result.length} movie${result.length === 1 ? "" : "s"} found`;
        grid.innerHTML = result
          .slice(0, visible)
          .map(Cinevault.createMovieCard)
          .join("");

        empty.classList.toggle("d-none", result.length !== 0);
        showMore.classList.toggle("d-none", visible >= result.length);
        clear.classList.toggle(
          "d-none",
          !query && selectedGenre === "all" && sort.value === "default",
        );
      };

      [search, genre, sort].forEach((el) =>
        el.addEventListener("input", () => {
          visible = 8;
          render();
        }),
      );

      showMore.addEventListener("click", () => {
        visible += 8;
        render();
      });

      clear.addEventListener("click", () => {
        search.value = "";
        genre.value = "all";
        sort.value = "default";
        visible = 8;
        render();
      });

      render();
    })
    .catch(() => {
      count.textContent = "Movies unavailable";
      empty.classList.remove("d-none");
      showMore.classList.add("d-none");
    });
})();
