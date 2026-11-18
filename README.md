# MovieVibe

MovieVibe is a modern, responsive, static movie discovery website built with semantic HTML5, custom CSS, Bootstrap 5.3, and vanilla ES6 JavaScript.

## Features

- **Pure Static Architecture**: Fully self-contained static movie catalog requiring zero external API keys or flaky live endpoints.
- **Rich Movie Cards**:
  - **Movie Poster (រូបភាពភាពយន្ត)**: Official high-resolution poster with responsive 2:3 aspect ratio and hover effects.
  - **Movie Title (ចំណងជើង)**: Full movie title linked to complete detail view.
  - **Release Year (ឆ្នាំចេញផ្សាយ)**: Official theatrical release year badge.
  - **Genre (ប្រភេទភាពយន្ត)**: Categorical badge (Action, Sci-Fi, Drama, Animation, Crime, Comedy, Horror, Romance, etc.).
  - **Rating (ពិន្ទុ)**: Official rating score with star icon.
  - **Movie Description (ការពិពណ៌នា)**: Engaging summary of the film's storyline.
  - **Duration (រយៈពេលភាពយន្ត)**: Formatted runtime (e.g. 2h 49m, 3h 00m).
  - **Director & Cast (អ្នកដឹកនាំរឿង និងតួសំខាន់ៗ)**: Labeled director and key cast members.
  - **Language (ភាសាដើមនៃភាពយន្ត)**: Original spoken language (English, Korean, Japanese, Spanish, etc.).
  - **YouTube Trailer (វីដេអូ Trailer ពី YouTube)**: Dedicated trailer button that opens a responsive video modal directly from any movie card.
- **Search Movie (ស្វែងរកភាពយន្ត)**:
  - Global top navbar search input.
  - Dedicated interactive filter panel on `movies.html` with real-time multi-field search (title, genre, director, cast, language, and year).
  - Genre filter dropdown and sorting (Rating: High to Low, Rating: Low to High, Newest First, Oldest First).
- **Movie Details Page**: Deep dive view with backdrop, full metadata, synopsis, YouTube trailer, and related movies.
- **Interactive Features**: Persistent favorites and user star ratings stored in `localStorage`, plus light/dark theme toggle.

## Link Deployed
