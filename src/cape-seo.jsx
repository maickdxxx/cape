import { useEffect } from "react";
import defaults from "./coruja-template/defaults.json";
import { fetchCorujaBlogPost, fetchCorujaContent } from "./coruja-template/api.js";

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObject(value) {
  return isObject(value) ? value : {};
}

function currentRoute() {
  let pathname = window.location.pathname || "/";
  const rawBase = String(window.__CORUJA_PREVIEW_BASE_PATH__ || "").trim();
  const base = rawBase && rawBase !== "/" ? `/${rawBase.replace(/^\/+|\/+$/g, "")}` : "";
  if (base && pathname.startsWith(base)) pathname = pathname.slice(base.length) || "/";
  return pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
}

function currentBlogSlug(route) {
  const match = route.match(/^\/blog\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function absoluteUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  try {
    return new URL(raw, window.location.origin).toString();
  } catch {
    return "";
  }
}

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function splitServiceAreas(value) {
  if (typeof value !== "string") return [];
  return value
    .split(/,|\se\s/iu)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ "@type": "City", name }));
}

function structuredAddress(value) {
  const address = typeof value === "string" ? value.trim() : "";
  if (!address) return undefined;
  const cep = address.match(/CEP\s*:?\s*([0-9]{5}-?[0-9]{3})/i)?.[1];
  const localityRegion = address.match(/,\s*([^,–—-]+?)\s*[–—-]\s*([A-Z]{2})\s*,?\s*CEP/i);
  const result = {
    "@type": "PostalAddress",
    streetAddress: address.replace(/,?\s*CEP\s*:?\s*[0-9]{5}-?[0-9]{3}\s*$/i, "").trim(),
    addressCountry: "BR",
  };
  if (localityRegion?.[1]) result.addressLocality = localityRegion[1].trim();
  if (localityRegion?.[2]) result.addressRegion = localityRegion[2].trim();
  if (cep) result.postalCode = cep;
  return result;
}

function routePageId(route) {
  if (route === "/servicos") return "services";
  if (route === "/projetos") return "projects";
  if (route === "/sobre") return "about";
  if (route === "/contato") return "contact";
  if (route.startsWith("/blog")) return "blog";
  return "home";
}

function pageSchemaType(route, post) {
  if (post) return "BlogPosting";
  if (route === "/") return "WebSite";
  if (route === "/projetos") return "CollectionPage";
  if (route === "/sobre") return "AboutPage";
  if (route === "/contato") return "ContactPage";
  if (route === "/blog") return "Blog";
  return "WebPage";
}

function chooseShareImage(content, page, post) {
  const global = readObject(content.global);
  const seo = readObject(global.seo);
  const brand = readObject(global.brand);
  const pageSeo = readObject(page.seo);
  const explicitClientImage = seo.clientOgImageUrl || seo.clientOgImage || "";
  const primary = post?.coverImage || explicitClientImage || pageSeo.ogImage || seo.ogImage || "";
  if (typeof primary === "string" && primary.trim() && !/\.svg(?:$|[?#])/i.test(primary.trim())) {
    return absoluteUrl(primary);
  }
  return absoluteUrl(brand.logoUrl || primary);
}

function buildSchema(content, route, page, post, canonical, image, title, description) {
  const global = readObject(content.global);
  const brand = readObject(global.brand);
  const contact = readObject(global.contact);
  const social = readObject(global.social);
  const businessId = `${canonical || window.location.origin}/#business`;
  const websiteId = `${window.location.origin}/#website`;
  const sameAs = [social.instagram, social.facebook, social.linkedin]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  const logo = absoluteUrl(brand.logoUrl);
  const areaServed = splitServiceAreas(contact.serviceArea);
  const phoneRaw = String(contact.phoneRaw || contact.whatsappRaw || contact.phone || "").trim();
  const telephone = /^\d{10,15}$/.test(phoneRaw) ? `+${phoneRaw}` : phoneRaw;

  const business = {
    "@type": ["HVACBusiness", "Electrician"],
    "@id": businessId,
    name: brand.name || "CAPE Serviços e Consultoria",
    legalName: brand.legalName || undefined,
    description: brand.description || undefined,
    url: canonical ? new URL(canonical).origin : window.location.origin,
    logo: logo || undefined,
    image: image || logo || undefined,
    telephone: telephone || undefined,
    email: contact.email || undefined,
    address: structuredAddress(contact.address),
    areaServed: areaServed.length ? areaServed : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  if (post) {
    const publishedAt = post.publishedAt || undefined;
    return {
      "@context": "https://schema.org",
      "@graph": [
        business,
        {
          "@type": "BlogPosting",
          "@id": `${canonical}#article`,
          headline: post.title || title,
          description: post.seoDescription || post.excerpt || description || undefined,
          image: image || undefined,
          datePublished: publishedAt,
          dateModified: publishedAt,
          author: post.author
            ? { "@type": "Person", name: post.author }
            : { "@id": businessId },
          publisher: { "@id": businessId },
          mainEntityOfPage: canonical || undefined,
          url: canonical || undefined,
        },
      ],
    };
  }

  const type = pageSchemaType(route, null);
  const pageNode = {
    "@type": type,
    "@id": canonical ? `${canonical}#page` : undefined,
    url: canonical || undefined,
    name: title || undefined,
    description: description || undefined,
    image: image || undefined,
    publisher: { "@id": businessId },
  };

  if (type === "WebSite") {
    pageNode["@id"] = websiteId;
    pageNode.inLanguage = "pt-BR";
  }

  if (type === "Blog") {
    pageNode.blogPost = undefined;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [business, pageNode],
  };
}

function applySeo(content, post) {
  const route = currentRoute();
  const pageId = routePageId(route);
  const pages = readObject(content.pages);
  const page = readObject(pages[pageId]);
  const global = readObject(content.global);
  const globalSeo = readObject(global.seo);
  const pageSeo = readObject(page.seo);
  const title = post?.seoTitle || post?.title || pageSeo.title || globalSeo.title || document.title;
  const description =
    post?.seoDescription || post?.excerpt || pageSeo.description || globalSeo.description || "";
  const image = chooseShareImage(content, page, post);
  const canonicalTag = document.head.querySelector('link[rel="canonical"]');
  const canonical = canonicalTag?.href || window.location.href.split(/[?#]/)[0];

  setMeta("og:locale", "pt_BR", "property");
  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:type", post ? "article" : "website", "property");
  setMeta("og:url", canonical, "property");
  if (image) {
    setMeta("og:image", image, "property");
    setMeta("og:image:alt", brandAlt(content), "property");
  }
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  if (image) setMeta("twitter:image", image);

  document.getElementById("coruja-cape-schema")?.remove();
  document.getElementById("coruja-cape-schema-enhanced")?.remove();
  const script = document.createElement("script");
  script.id = "coruja-cape-schema-enhanced";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(
    buildSchema(content, route, page, post, canonical, image, title, description),
  );
  document.head.appendChild(script);
}

function brandAlt(content) {
  const brand = readObject(readObject(content.global).brand);
  return brand.name || "CAPE Serviços e Consultoria";
}

export default function CapeSeoEnhancer() {
  useEffect(() => {
    let active = true;
    let timer;

    async function enhance() {
      const route = currentRoute();
      const content = (await fetchCorujaContent()) || defaults;
      if (!active) return;
      const slug = currentBlogSlug(route);
      const post = slug ? await fetchCorujaBlogPost(slug) : null;
      if (!active) return;
      // O SeoManager do App roda no mesmo commit. Aplicar no próximo ciclo
      // garante que o schema enriquecido e os metadados sociais sejam a versão final.
      timer = window.setTimeout(() => {
        if (active) applySeo(content, post);
      }, 0);
    }

    enhance();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
