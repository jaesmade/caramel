Put your files here:
  assets/chillguy.png          the chill guy image
  assets/caramel.m4a           the song
  assets/notavirus.jpg         the photo that auto-downloads
  assets/                     epsdancing.gif h1.gif h2.gif h3.gif h4.gif h5.gif rickroll.gif
Each new popup (including in-page fallback windows) picks a random GIF. Repeats are possible.
Missing files show a text label instead of breaking. Rename or add GIFs in the POPUP_ASSETS array at the top of prank.js.
Run with: python3 -m http.server  (then open http://localhost:8000)

GitHub Pages hosting:
  1. Push this project to a GitHub repository, including the assets/ folder.
  2. Open the repository's Settings > Pages.
  3. Choose "Deploy from a branch", branch "main", folder "/ (root)", then Save.
  4. Use the site URL shown in Pages settings once deployment finishes.
The .nojekyll file serves the HTML, CSS, JavaScript, and assets directly.
All site links are relative, so repository-based Pages URLs work.

Accounts are stored only in each browser's localStorage. They are not shared
between visitors, browsers, or the local and hosted versions of the site.
