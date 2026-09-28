# Published websites

This repository publishes CAPE Serviços e Consultoria. It no longer uses the retired visual template editor or loads company content from the editor API.

## Build

Run `npm ci` and `npm run quality` to build static HTML and validate the public routes, canonical URLs, sitemap, contact links and local assets.

The existing `VITE_CORUJA_PROJECT_ID` build setting selects the saved publication from `sites/published.json`. A missing setting uses the primary customer website for local development; an unknown project ID stops the build. Each saved publication retains its own content, branding, routes, colors and real blog posts.

Update the selected publication in `sites/published.json`; generated files in `src/data`, the HTML shell and the CSS are refreshed during the build. Images are bundled with the website.
