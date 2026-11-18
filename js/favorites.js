(function () {
  const grid = document.getElementById("favorites-grid"),
    empty = document.getElementById("empty-favorites"),
    clear = document.getElementById("clear-all");

  window.refreshFavorites = () => {
    const movies = (window.MOVIES || []).filter((movie) =>
      Cinevault.isFavorite(movie.id),
    );
    if (grid) {
      grid.innerHTML = movies.map(Cinevault.createMovieCard).join("");
    }
    if (empty) empty.classList.toggle("d-none", movies.length !== 0);
    if (clear) clear.classList.toggle("d-none", movies.length === 0);
  };

  if (clear) {
    clear.addEventListener("click", () => {
      Cinevault.setFavorites([]);
      refreshFavorites();
      Cinevault.toast("All favorites cleared");
    });
  }

  moviesReady.then(refreshFavorites).catch(() => {
    if (empty) empty.classList.remove("d-none");
    if (clear) clear.classList.add("d-none");
  });
})();
