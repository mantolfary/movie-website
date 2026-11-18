(function () {
  const render = (selector, movies) => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = movies.map(Cinevault.createMovieCard).join("");
  };

  moviesReady
    .then((movies) => {
      // Trending: first 8 curated movies
      render("#trending-grid", movies.slice(0, 8));

      // Popular: top rated picks
      render(
        "#popular-grid",
        [...movies].sort((a, b) => b.rating - a.rating).slice(0, 8),
      );
    })
    .catch(() => {
      document
        .querySelectorAll("#trending-grid, #popular-grid")
        .forEach((el) => {
          el.innerHTML =
            '<div class="col-12"><div class="api-error"><i class="bi bi-cloud-slash"></i><p>Movies are temporarily unavailable.</p></div></div>';
        });
    });
})();
