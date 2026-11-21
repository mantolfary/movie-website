# MovieVibe

MovieVibe is a modern, responsive, static movie discovery website built with semantic HTML5, custom CSS, Bootstrap 5.3, and vanilla ES6 JavaScript.

## Features

- **Pure Static Architecture**: Fully self-contained static movie catalog requiring zero external API keys or flaky live endpoints.
- **Rich Movie Cards**:
  - **Movie Poster**: Official high-resolution poster with responsive 2:3 aspect ratio and hover effects.
  - **Movie Title**: Full movie title linked to complete detail view.
  - **Release Year**: Official theatrical release year badge.
  - **Genre**: Categorical badge (Action, Sci-Fi, Drama, Animation, Crime, Comedy, Horror, Romance, etc.).
  - **Rating**: Official rating score with star icon.
  - **Movie Description**: Engaging summary of the film's storyline.
  - **Duration**: Formatted runtime (e.g. 2h 49m, 3h 00m).
  - **Director & Cast**: Labeled director and key cast members.
  - **Language**: Original spoken language (English, Korean, Japanese, Spanish, etc.).
  - **YouTube Trailer**: Dedicated trailer button that opens a responsive video modal directly from any movie card.
- **Search Movie**:
  - Global top navbar search input.
  - Dedicated interactive filter panel on `movies.html` with real-time multi-field search (title, genre, director, cast, language, and year).
  - Genre filter dropdown and sorting (Rating: High to Low, Rating: Low to High, Newest First, Oldest First).
- **Movie Details Page**: Deep dive view with backdrop, full metadata, synopsis, YouTube trailer, and related movies.
- **Interactive Features**: Persistent favorites and user star ratings stored in `localStorage`, plus light/dark theme toggle.

## Link Deployed
- **https://movie-website-hazel-rho.vercel.app/**