import { readFile, mkdir, writeFile } from "node:fs/promises";
process.env.NODE_ENV = "production";
const { render } = await import("../.prerender/prerender.js");
const routes = JSON.parse(await readFile("scripts/routes.json", "utf8"));
const shell = await readFile("dist/index.html", "utf8");
for (const route of [...routes, "/404"]) {
  let { html, head } = render(route);if(route==="/404")head+='<meta name="robots" content="noindex,nofollow"/>';
  if (!html.includes("<h1") || !head.includes("<title"))
    throw Error("Missing page markup " + route);
  const page = shell
    .replace(/<!-- site-head-start -->[\s\S]*?<!-- site-head-end -->/, head)
    .replace('<div id="root"></div>', '<div id="root">' + html + "</div>");
  const dir = "dist" + (route === "/" ? "" : route);
  await mkdir(dir, { recursive: true });
  await writeFile(dir + "/index.html", page);
  if (route === "/404") await writeFile("dist/404.html", page);
}
await writeFile(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    routes.map((r) => "<url><loc>https://www.grupocape.com.br" + r + "</loc></url>").join("") +
    "</urlset>",
);
await writeFile(
  "dist/robots.txt",
  "User-agent: *\nAllow: /\nSitemap: https://www.grupocape.com.br/sitemap.xml\n",
);
console.log("Rendered " + routes.length + " public pages.");
