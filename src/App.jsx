import { createContext, useContext, useEffect, useState } from "react";
import { buildWhatsAppHref, getCollection, getValue, useTelHref, useWhatsAppUrl } from "./lib/site-content.js";
import savedPosts from "./data/blog.json";
function collectionPath(collection, index, field) {
    return `collections.${collection}.${index}.${field}`;
}
const RouteContext = createContext('/');
function siteHref(path = '/') { return path; }
function currentRoute() { return useContext(RouteContext); }
function currentSlug() {
    const match = currentRoute().match(/^\/blog\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : "";
}
function setMeta(name, content, attr = "name") {
    if (!content)
        return;
    let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
}
function setLink(rel, href) {
    if (!href)
        return;
    let tag = document.head.querySelector(`link[rel="${rel}"]`);
    if (!tag) {
        tag = document.createElement("link");
        tag.rel = rel;
        document.head.appendChild(tag);
    }
    tag.href = href;
}
function SeoManager({ post }) {
    const route = currentRoute();
    const pageId = route === "/servicos"
        ? "services"
        : route === "/projetos"
            ? "projects"
            : route === "/sobre"
                ? "about"
                : route === "/contato"
                    ? "contact"
                    : route.startsWith("/blog")
                        ? "blog"
                        : "home";
    const globalTitle = getValue("global.seo.title", "");
    const globalDescription = getValue("global.seo.description", "");
    const globalImage = getValue("global.seo.ogImage", "");
    const pageTitle = getValue(`pages.${pageId}.seo.title`, globalTitle);
    const pageDescription = getValue(`pages.${pageId}.seo.description`, globalDescription);
    const pageImage = getValue(`pages.${pageId}.seo.ogImage`, globalImage);
    const canonicalBase = getValue("global.seo.canonicalBase", "");
    const favicon = getValue("global.brand.faviconUrl", "/favicon.svg");
    const brand = getValue("global.brand.name", "");
    const legalName = getValue("global.brand.legalName", "");
    const phone = getValue("global.contact.phoneRaw", "");
    const email = getValue("global.contact.email", "");
    const address = getValue("global.contact.address", "");
    const serviceArea = getValue("global.contact.serviceArea", "");
    const instagram = getValue("global.social.instagram", "");
    useEffect(() => {
        const title = post?.seoTitle || post?.title || pageTitle || globalTitle;
        const description = post?.seoDescription || post?.excerpt || pageDescription || globalDescription;
        const image = post?.coverImage || pageImage;
        document.title = title;
        setMeta("description", description);
        setMeta("og:title", title, "property");
        setMeta("og:description", description, "property");
        setMeta("og:type", post ? "article" : "website", "property");
        if (image)
            setMeta("og:image", image, "property");
        setLink("icon", favicon);
        const suffix = post ? `/blog/${post.slug}` : route;
        if (canonicalBase) {
            const canonical = `${canonicalBase.replace(/\/+$/, "")}${suffix === "/" ? "" : suffix}`;
            setLink("canonical", canonical);
            setMeta("og:url", canonical, "property");
        }
        const id = "coruja-cape-schema";
        document.getElementById(id)?.remove();
        const script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["HVACBusiness", "Electrician"],
            name: brand,
            legalName,
            telephone: phone,
            email,
            address,
            areaServed: serviceArea,
            sameAs: instagram ? [instagram] : undefined,
            url: canonicalBase || undefined,
        });
        document.head.appendChild(script);
        return () => script.remove();
    }, [
        post,
        pageTitle,
        pageDescription,
        pageImage,
        globalTitle,
        globalDescription,
        canonicalBase,
        favicon,
        brand,
        legalName,
        phone,
        email,
        address,
        serviceArea,
        instagram,
        route,
    ]);
    return null;
}
function Brand() {
    const name = getValue("global.brand.name", "");
    const logo = getValue("global.brand.logoUrl", "");
    const logoSrc = logo === "/logo-cape.svg" ? "/logo-cape-oficial.png" : logo;
    return (<a className="brand" href={siteHref("/")} aria-label={name}>
      {logo ? <img src={logoSrc} alt={name}/> : <><span className="brand-fallback">C</span><span>{name}</span></>}
    </a>);
}
function Header() {
    const phone = getValue("global.contact.phone", "");
    const tel = useTelHref();
    const wa = useWhatsAppUrl();
    const services = getValue("global.nav.servicesLabel", "Serviços");
    const projects = getValue("global.nav.projectsLabel", "Projetos");
    const about = getValue("global.nav.aboutLabel", "Sobre");
    const blog = getValue("global.nav.blogLabel", "Blog");
    const contact = getValue("global.nav.contactLabel", "Contato");
    const cta = getValue("global.cta.headerLabel", "Solicitar orçamento");
    const home = getValue("global.nav.homeLabel", "Início");
    const links = [
        ["/", home, "global.nav.homeLabel"],
        ["/servicos", services, "global.nav.servicesLabel"],
        ["/projetos", projects, "global.nav.projectsLabel"],
        ["/sobre", about, "global.nav.aboutLabel"],
        ["/blog", blog, "global.nav.blogLabel"],
        ["/contato", contact, "global.nav.contactLabel"],
    ];
    return (<header className="site-header">
      <div className="header-accent"/>
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map(([href, label, path]) => <a key={href} href={siteHref(href)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="phone-link" href={tel} data-coruja-event="tel_click" data-coruja-event-label="header_phone">{phone}</a>
          <a className="btn btn-accent btn-small" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="header_whatsapp">{cta}</a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Abrir menu"><span /><span /><span /></summary>
          <div className="mobile-panel">
            {links.map(([href, label, path]) => <a key={href} href={siteHref(href)}>{label}</a>)}
            <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="mobile_menu_whatsapp">{cta}</a>
          </div>
        </details>
      </div>
    </header>);
}
function Footer() {
    const legalName = getValue("global.brand.legalName", "");
    const brandDescription = getValue("global.brand.description", "");
    const tagline = getValue("global.footer.tagline", "");
    const copyright = getValue("global.footer.copyright", "");
    const email = getValue("global.contact.email", "");
    const phone = getValue("global.contact.phone", "");
    const address = getValue("global.contact.address", "");
    const cnpj = getValue("global.contact.cnpj", "");
    const instagram = getValue("global.social.instagram", "");
    const instagramLabel = getValue("global.social.instagramLabel", "Instagram");
    const facebook = getValue("global.social.facebook", "");
    const linkedin = getValue("global.social.linkedin", "");
    const tel = useTelHref();
    return (<footer className="footer">
      <div className="footer-top-line"/>
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <small>{legalName}</small>
          <p>{brandDescription}</p>
          <p>{tagline}</p>
        </div>
        <div>
          <h3>Contato</h3>
          <a href={tel} data-coruja-event="tel_click" data-coruja-event-label="footer_phone">{phone}</a>
          <a href={`mailto:${email}`}>{email}</a>
          {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" {...{ "data-coruja-url-path": "global.social.instagram" }}>{instagramLabel}</a>}
          {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" {...{ "data-coruja-url-path": "global.social.facebook" }}>Facebook</a>}
          {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" {...{ "data-coruja-url-path": "global.social.linkedin" }}>LinkedIn</a>}
        </div>
        <div>
          <h3>Endereço</h3>
          <p>{address}</p>
          {cnpj && <small>CNPJ: {cnpj}</small>}
        </div>
        <div>
          <h3>Navegação</h3>
          <a href={siteHref("/")}>Início</a>
          <a href={siteHref("/servicos")}>Serviços</a>
          <a href={siteHref("/projetos")}>Projetos</a>
          <a href={siteHref("/sobre")}>Sobre</a>
          <a href={siteHref("/blog")}>Blog</a>
          <a href={siteHref("/contato")}>Contato</a>
        </div>
      </div>
      <div className="container footer-bottom">{copyright}</div>
    </footer>);
}
function FloatingWhatsapp() {
    const wa = useWhatsAppUrl();
    const title = getValue("global.cta.floatingTitle", "");
    const text = getValue("global.cta.floatingText", "");
    const label = getValue("global.cta.floatingButtonLabel", "Abrir WhatsApp");
    return (<div className="floating-wa">
      <div><strong>{title}</strong><span>{text}</span></div>
      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} data-coruja-event="whatsapp_click" data-coruja-event-label="floating_whatsapp">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3.2A12.7 12.7 0 0 0 5.1 22.34L3.4 28.6l6.41-1.68a12.74 12.74 0 1 0 6.23-23.72Zm0 22.98c-2.04 0-4.03-.55-5.76-1.58l-.41-.24-3.8 1 1.01-3.71-.27-.42a10.24 10.24 0 1 1 9.23 4.95Zm5.62-7.67c-.31-.15-1.82-.9-2.1-1-.28-.1-.49-.16-.69.15-.2.31-.8 1-.98 1.21-.18.2-.36.23-.67.08-.31-.16-1.3-.48-2.48-1.53a9.32 9.32 0 0 1-1.72-2.14c-.18-.31-.02-.48.14-.63.14-.14.3-.36.46-.54.15-.18.2-.31.3-.51.11-.21.06-.39-.02-.54-.08-.16-.7-1.68-.95-2.3-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.39-.28.3-1.08 1.05-1.08 2.57 0 1.51 1.11 2.98 1.26 3.18.15.2 2.18 3.33 5.28 4.67.74.32 1.31.51 1.76.65.74.24 1.41.2 1.94.13.59-.09 1.82-.75 2.08-1.47.25-.72.25-1.34.18-1.47-.08-.13-.28-.2-.59-.36Z"/></svg>
        <span className="sr-only">{label}</span>
      </a>
    </div>);
}
function Layout({ children, post }) {
    return <><SeoManager post={post}/><Header /><main>{children}</main><Footer /><FloatingWhatsapp /></>;
}
function Eyebrow({ children, light = false }) {
    return <span className={`eyebrow ${light ? "eyebrow-light" : ""}`}><i />{children}</span>;
}
function SectionTitle({ eyebrow, title, description, eyebrowPath, titlePath, descriptionPath, light = false, compact = false }) {
    return (<div className={`section-title ${light ? "light" : ""} ${compact ? "compact" : ""}`}>
      <Eyebrow light={light}><span {...(eyebrowPath ? {} : {})}>{eyebrow}</span></Eyebrow>
      <h2 {...(titlePath ? {} : {})}>{title}</h2>
      {description && <p {...(descriptionPath ? {} : {})}>{description}</p>}
    </div>);
}
function Stats() {
    const items = getCollection("collections.stats");
    return (<div className="stats">
      {items.map((item, index) => <div key={item.id}><strong>{item.value}</strong><span>{item.label}</span></div>)}
    </div>);
}
function ServiceCard({ service, index }) {
    const number = getValue("global.contact.whatsappRaw", "");
    const fallback = getValue("global.contact.whatsappMessage", "");
    const wa = buildWhatsAppHref(number, service.whatsappMessage || fallback);
    return (<article className="service-card">
      <div className="service-top">
        <span className="service-icon">{service.icon}</span>
        <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <span className="pill">{service.highlight}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <a href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label={`service_${service.id}_whatsapp`}>{service.ctaLabel}<span>↗</span></a>

    </article>);
}
function ProjectCard({ item, index }) {
    return (<article className="project-card">
      <div className="project-image"><img src={item.image} alt={item.imageAlt || item.title}/></div>
      <div className="project-copy">
        <span className="pill">{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>);
}
function PageHero({ page, mark = "C" }) {
    const eyebrow = getValue(`pages.${page}.hero.eyebrow`, "");
    const title = getValue(`pages.${page}.hero.title`, "");
    const description = getValue(`pages.${page}.hero.description`, "");
    return (<section className="page-hero">
      <div className="page-grid container">
        <div><Eyebrow light><span>{eyebrow}</span></Eyebrow><h1>{title}</h1><p>{description}</p></div>
        <div className="page-mark" aria-hidden="true">{mark}</div>
      </div>
    </section>);
}
function HomePage() {
    const wa = useWhatsAppUrl();
    const services = getCollection("collections.services");
    const credentials = getCollection("collections.credentials");
    const projects = getCollection("collections.projects");
    const clients = getCollection("collections.clients");
    const brands = getCollection("collections.brands");
    const areas = getCollection("collections.serviceAreas");
    const process = getCollection("collections.process");
    const values = getCollection("collections.values");
    const faq = getCollection("collections.faq");
    const finalMessage = getValue("pages.home.finalCta.whatsappMessage", "");
    const finalWa = useWhatsAppUrl(finalMessage);
    return (<Layout>


      {process.slice(0, 1).map((item, index) => <span hidden key={`process-${item.id}`}></span>)}
      {values.slice(0, 1).map((item, index) => <span hidden key={`value-${item.id}`}></span>)}
      {faq.slice(0, 1).map((item, index) => <span hidden key={`faq-${item.id}`}></span>)}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow light><span>{getValue("pages.home.hero.eyebrow", "")}</span></Eyebrow>
            <h1>{getValue("pages.home.hero.title", "")}</h1>
            <strong className="hero-accent">{getValue("pages.home.hero.titleAccent", "")}</strong>
            <p>{getValue("pages.home.hero.description", "")}</p>
            <div className="hero-actions">
              <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="hero_whatsapp">
                {getValue("pages.home.hero.primaryCtaLabel", "")}<span>↗</span>
              </a>
              <a className="btn btn-ghost-light" href={siteHref("/servicos")}>{getValue("pages.home.hero.secondaryCtaLabel", "")}</a>
            </div>
            <Stats />
          </div>
          <div className="hero-visual">
            <img src={getValue("pages.home.hero.image", "")} alt={getValue("pages.home.hero.imageAlt", "")}/>
            <div className="hero-credential">
              <span>{getValue("pages.home.hero.sideLabel", "")}</span>
              <strong>{getValue("pages.home.hero.sideTitle", "")}</strong>
              <p>{getValue("pages.home.hero.sideText", "")}</p>
            </div>
          </div>
        </div>
        <div className="hero-angle"/>
      </section>

      <section className="section service-section">
        <div className="container">
          <div className="split-heading">
            <SectionTitle eyebrow={getValue("pages.home.services.eyebrow", "")} title={getValue("pages.home.services.title", "")} description={getValue("pages.home.services.description", "")} eyebrowPath="pages.home.services.eyebrow" titlePath="pages.home.services.title" descriptionPath="pages.home.services.description"/>
            <a className="text-link" href={siteHref("/servicos")}>{getValue("pages.home.services.ctaLabel", "")} ↗</a>
          </div>
          <div className="services-grid">{services.slice(0, 6).map((service, index) => <ServiceCard key={service.id} service={service} index={index}/>)}</div>
        </div>
      </section>

      <section className="section technical-section">
        <div className="container">
          <SectionTitle light eyebrow={getValue("pages.home.credentials.eyebrow", "")} title={getValue("pages.home.credentials.title", "")} description={getValue("pages.home.credentials.description", "")} eyebrowPath="pages.home.credentials.eyebrow" titlePath="pages.home.credentials.title" descriptionPath="pages.home.credentials.description"/>
          <div className="credential-grid">
            {credentials.map((item, index) => (<article key={item.id}>
                <span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p>
              </article>))}
          </div>
        </div>
      </section>

      <section className="section projects-home">
        <div className="container">
          <div className="split-heading">
            <SectionTitle eyebrow={getValue("pages.home.projects.eyebrow", "")} title={getValue("pages.home.projects.title", "")} description={getValue("pages.home.projects.description", "")} eyebrowPath="pages.home.projects.eyebrow" titlePath="pages.home.projects.title" descriptionPath="pages.home.projects.description"/>
            <a className="text-link" href={siteHref("/projetos")}>{getValue("pages.home.projects.ctaLabel", "")} ↗</a>
          </div>
          <div className="projects-grid">{projects.map((item, index) => <ProjectCard key={item.id} item={item} index={index}/>)}</div>
        </div>
      </section>

      <section className="section clients-section">
        <div className="container">
          <SectionTitle compact eyebrow={getValue("pages.home.clients.eyebrow", "")} title={getValue("pages.home.clients.title", "")} description={getValue("pages.home.clients.description", "")} eyebrowPath="pages.home.clients.eyebrow" titlePath="pages.home.clients.title" descriptionPath="pages.home.clients.description"/>
          <div className="name-grid client-grid">{clients.map((item, index) => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>

      <section className="section brands-section">
        <div className="container brand-band">
          <div>
            <Eyebrow><span>{getValue("pages.home.brands.eyebrow", "")}</span></Eyebrow>
            <h2>{getValue("pages.home.brands.title", "")}</h2>
            <p>{getValue("pages.home.brands.description", "")}</p>
          </div>
          <div className="brand-list">{brands.map((item, index) => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>

      <section className="section areas-home">
        <div className="container areas-grid">
          <SectionTitle eyebrow={getValue("pages.home.areas.eyebrow", "")} title={getValue("pages.home.areas.title", "")} description={getValue("pages.home.areas.description", "")} eyebrowPath="pages.home.areas.eyebrow" titlePath="pages.home.areas.title" descriptionPath="pages.home.areas.description"/>
          <div className="area-list">{areas.map((item, index) => <span key={item.id}>{item.text}</span>)}</div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-grid">
          <div>
            <Eyebrow light><span>{getValue("pages.home.finalCta.eyebrow", "")}</span></Eyebrow>
            <h2>{getValue("pages.home.finalCta.title", "")}</h2>
            <p>{getValue("pages.home.finalCta.description", "")}</p>
          </div>
          <a className="btn btn-accent" href={finalWa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="home_final_whatsapp">
            {getValue("pages.home.finalCta.buttonLabel", "")}<span>↗</span>
          </a>
        </div>
      </section>
    </Layout>);
}
function ServicesPage() {
    const services = getCollection("collections.services");
    const credentials = getCollection("collections.credentials");
    const process = getCollection("collections.process");
    const faq = getCollection("collections.faq");
    return (<Layout>
      <PageHero page="services" mark="S"/>
      <section className="section">
        <div className="container">
          <SectionTitle eyebrow={getValue("pages.services.hero.eyebrow", "")} title={getValue("pages.services.intro.title", "")} description={getValue("pages.services.intro.description", "")} eyebrowPath="pages.services.hero.eyebrow" titlePath="pages.services.intro.title" descriptionPath="pages.services.intro.description"/>
          <div className="services-grid">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index}/>)}</div>
        </div>
      </section>
      <section className="section technical-details">
        <div className="container">
          <h2>{getValue("pages.services.detailsTitle", "")}</h2>
          <div className="credential-grid compact-cards">
            {credentials.map((item, index) => <article key={item.id}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <SectionTitle light eyebrow={getValue("pages.services.process.eyebrow", "")} title={getValue("pages.services.process.title", "")} eyebrowPath="pages.services.process.eyebrow" titlePath="pages.services.process.title"/>
          <div className="process-grid">
            {process.map((item, index) => <article key={item.id}><span>{item.step}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container narrow">
          <h2 className="faq-title">{getValue("pages.services.faqTitle", "")}</h2>
          <div className="faq-list">
            {faq.map((item, index) => <details key={item.id}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
          </div>
        </div>
      </section>
    </Layout>);
}
function ProjectsPage() {
    const projects = getCollection("collections.projects");
    const clients = getCollection("collections.clients");
    const projectMessage = getValue("pages.projects.whatsappMessage", "");
    const wa = useWhatsAppUrl(projectMessage);
    return (<Layout>

      <PageHero page="projects" mark="P"/>
      <section className="section">
        <div className="container">
          <SectionTitle eyebrow={getValue("pages.projects.hero.eyebrow", "")} title={getValue("pages.projects.intro.title", "")} description={getValue("pages.projects.intro.description", "")} eyebrowPath="pages.projects.hero.eyebrow" titlePath="pages.projects.intro.title" descriptionPath="pages.projects.intro.description"/>
          <div className="projects-grid projects-page">{projects.map((item, index) => <ProjectCard key={item.id} item={item} index={index}/>)}</div>
        </div>
      </section>
      <section className="section clients-section">
        <div className="container">
          <h2 className="subsection-title">{getValue("pages.projects.clientsTitle", "")}</h2>
          <div className="name-grid client-grid">{clients.map((item, index) => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>
      <section className="cta-band">
        <div className="container cta-grid">
          <div><h2>{getValue("pages.projects.ctaTitle", "")}</h2><p>{getValue("pages.projects.ctaText", "")}</p></div>
          <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="projects_whatsapp">{getValue("pages.projects.ctaLabel", "")}<span>↗</span></a>
        </div>
      </section>
    </Layout>);
}
function AboutPage() {
    const values = getCollection("collections.values");
    const areas = getCollection("collections.serviceAreas");
    const credentials = getCollection("collections.credentials");
    const wa = useWhatsAppUrl();
    return (<Layout>
      <PageHero page="about" mark="A"/>
      <section className="section">
        <div className="container about-grid">
          <div>
            <SectionTitle eyebrow={getValue("pages.about.hero.eyebrow", "")} title={getValue("pages.about.story.title", "")} eyebrowPath="pages.about.hero.eyebrow" titlePath="pages.about.story.title"/>
            <p className="lead-copy">{getValue("pages.about.story.paragraph1", "")}</p>
            <p className="lead-copy">{getValue("pages.about.story.paragraph2", "")}</p>
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="about_whatsapp">{getValue("pages.about.ctaLabel", "")}</a>
          </div>
          <div className="mission-panel">
            <article><span>01</span><h3>{getValue("pages.about.missionTitle", "")}</h3><p>{getValue("pages.about.missionText", "")}</p></article>
            <article><span>02</span><h3>{getValue("pages.about.visionTitle", "")}</h3><p>{getValue("pages.about.visionText", "")}</p></article>
          </div>
        </div>
      </section>
      <section className="section values-section">
        <div className="container">
          <h2 className="subsection-title">{getValue("pages.about.valuesTitle", "")}</h2>
          <div className="values-grid">{values.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        </div>
      </section>
      <section className="section technical-details">
        <div className="container">
          <div className="credential-grid compact-cards">
            {credentials.map((item, index) => <article key={item.id}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section areas-section">
        <div className="container">
          <h2>{getValue("pages.about.areasTitle", "")}</h2>
          <div className="area-list">{areas.map((item, index) => <span key={item.id}>{item.text}</span>)}</div>
        </div>
      </section>
    </Layout>);
}
function ContactPage() {
    const formEnabled = Boolean(getValue("pages.contact.form.enabled", true));
    const number = getValue("global.contact.whatsappRaw", "");
    const phone = getValue("global.contact.phone", "");
    const email = getValue("global.contact.email", "");
    const address = getValue("global.contact.address", "");
    const area = getValue("global.contact.serviceArea", "");
    const hours = getValue("global.contact.businessHoursWeek", "");
    const cnpj = getValue("global.contact.cnpj", "");
    const instagram = getValue("global.social.instagram", "");
    const instagramLabel = getValue("global.social.instagramLabel", "");
    const tel = useTelHref();
    const services = getCollection("collections.services");
    const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });
    const formTitle = getValue("pages.contact.form.title", "");
    const formDescription = getValue("pages.contact.form.description", "");
    const nameLabel = getValue("pages.contact.form.nameLabel", "");
    const namePlaceholder = getValue("pages.contact.form.namePlaceholder", "");
    const phoneLabel = getValue("pages.contact.form.phoneLabel", "");
    const phonePlaceholder = getValue("pages.contact.form.phonePlaceholder", "");
    const emailLabel = getValue("pages.contact.form.emailLabel", "");
    const emailPlaceholder = getValue("pages.contact.form.emailPlaceholder", "");
    const serviceLabel = getValue("pages.contact.form.serviceLabel", "");
    const servicePlaceholder = getValue("pages.contact.form.servicePlaceholder", "");
    const messageLabel = getValue("pages.contact.form.messageLabel", "");
    const messagePlaceholder = getValue("pages.contact.form.messagePlaceholder", "");
    const submitText = getValue("pages.contact.form.submitText", "");
    const introMessage = getValue("pages.contact.form.whatsappMessage", "");
    const mapTitle = getValue("pages.contact.mapTitle", "");
    const infoTitle = getValue("pages.contact.info.title", "");
    const infoDescription = getValue("pages.contact.info.description", "");
    function submit(e) {
        e.preventDefault();
        const body = [
            introMessage,
            `Nome: ${form.name}`,
            `Telefone: ${form.phone}`,
            form.email ? `E-mail: ${form.email}` : "",
            form.service ? `Serviço: ${form.service}` : "",
            `Mensagem: ${form.message}`,
        ].filter(Boolean).join("\n");
        window.open(buildWhatsAppHref(number, body), "_blank", "noopener,noreferrer");
    }
    const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    return (<Layout>








      <PageHero page="contact" mark="@"/>
      <section className="section">
        <div className="container contact-grid">
          <aside className="contact-info">
            <SectionTitle eyebrow={getValue("pages.contact.hero.eyebrow", "")} title={infoTitle} description={infoDescription}/>
            <div className="contact-items">
              <a href={tel} data-coruja-event="tel_click" data-coruja-event-label="contact_phone"><span>TELEFONE</span><strong>{phone}</strong></a>
              <a href={`mailto:${email}`}><span>E-MAIL</span><strong>{email}</strong></a>
              {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer"><span>INSTAGRAM</span><strong>{instagramLabel}</strong></a>}
              <div><span>REGIÃO</span><strong>{area}</strong></div>
              <div><span>ATENDIMENTO</span><strong>{hours}</strong></div>
              <div><span>CNPJ</span><strong>{cnpj}</strong></div>
            </div>
          </aside>
          {formEnabled && (<form className="quote-form" onSubmit={submit} data-coruja-form="quote-request" data-coruja-event="form_submit" data-coruja-event-label="contact_quote_form">
              <h2>{formTitle}</h2><p>{formDescription}</p>
              <div className="form-row">
                <label>{nameLabel}<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={namePlaceholder}/></label>
                <label>{phoneLabel}<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={phonePlaceholder}/></label>
              </div>
              <label>{emailLabel}<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={emailPlaceholder}/></label>
              <label>{serviceLabel}<select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="">{servicePlaceholder}</option>{services.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}</select></label>
              <label>{messageLabel}<textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={messagePlaceholder}/></label>
              <button className="btn btn-accent" type="submit">{submitText}<span>↗</span></button>
            </form>)}
        </div>
      </section>
      <section className="map-section">
        <div className="container">
          <div className="map-heading"><h2>{mapTitle}</h2><p>{address}</p></div>
          <div className="map-shell"><iframe title={mapTitle} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div>
        </div>
      </section>
    </Layout>);
}
function BlogPage() {
    const posts = savedPosts;
    const loading = false;
    const title = getValue("pages.blog.title", "");
    const eyebrow = getValue("pages.blog.eyebrow", "");
    const description = getValue("pages.blog.description", "");
    const empty = getValue("pages.blog.emptyMessage", "");
    const readMore = getValue("pages.blog.readMoreLabel", "");
    useEffect(() => {
        let active = true;
        fetchCorujaBlogPosts().then(data => { if (active) {
            setPosts(data);
            setLoading(false);
        } });
        return () => { active = false; };
    }, []);
    return (<Layout>



      <section className="page-hero">
        <div className="page-grid container"><div><Eyebrow light><span>{eyebrow}</span></Eyebrow><h1>{title}</h1><p>{description}</p></div><div className="page-mark">B</div></div>
      </section>
      <section className="section">
        <div className="container">
          {loading ? <div className="blog-state">Carregando…</div> : posts.length === 0 ? <div className="blog-state">{empty}</div> : (<div className="blog-grid">
              {posts.map(post => (<article key={post.id || post.slug} className="blog-card">
                  {post.coverImage && <img src={post.coverImage} alt={post.coverImageAlt || post.title}/>}
                  <div>
                    {post.category && <span className="pill">{post.category}</span>}
                    <h2>{post.title}</h2><p>{post.excerpt}</p>
                    <a href={siteHref(`/blog/${encodeURIComponent(post.slug)}`)}>{readMore} ↗</a>
                  </div>
                </article>))}
            </div>)}
        </div>
      </section>
    </Layout>);
}
function BlogPostPage() {
    const slug = currentSlug();
    const post = savedPosts.find(p => p.slug === slug);
    const loading = false;
    const back = getValue("pages.blog.backLabel", "");
    const empty = getValue("pages.blog.emptyMessage", "");
    useEffect(() => {
        let active = true;
        fetchCorujaBlogPost(slug).then(data => { if (active) {
            setPost(data);
            setLoading(false);
        } });
        return () => { active = false; };
    }, [slug]);
    if (loading)
        return <Layout><section className="section"><div className="container blog-state">Carregando…</div></section></Layout>;
    if (!post)
        return <Layout><section className="section"><div className="container blog-state">{empty}</div></section></Layout>;
    return (<Layout post={post}>
      <article className="article">
        <div className="container article-head">
          <a href={siteHref("/blog")}>← {back}</a>
          {post.category && <span className="pill">{post.category}</span>}
          <h1>{post.title}</h1>
          {post.excerpt && <p>{post.excerpt}</p>}
          {post.coverImage && <img src={post.coverImage} alt={post.coverImageAlt || post.title}/>}
        </div>
        <div className="container article-body" dangerouslySetInnerHTML={{ __html: post.contentHtml || String(post.content || "") }}/>
      </article>
    </Layout>);
}
function NotFound() {
    return <Layout><section className="not-found"><div><span>404</span><h1>Página não encontrada</h1><a className="btn btn-primary" href={siteHref("/")}>Voltar ao início</a></div></section></Layout>;
}
function RouterView() {
    const route = currentRoute();
    const blogEnabled = Boolean(getValue("blog.enabled", true));
    if (route === "/")
        return <HomePage />;
    if (route === "/servicos")
        return <ServicesPage />;
    if (route === "/projetos")
        return <ProjectsPage />;
    if (route === "/sobre")
        return <AboutPage />;
    if (route === "/contato")
        return <ContactPage />;
    if (route === "/blog" && blogEnabled)
        return <BlogPage />;
    if (/^\/blog\/[^/]+$/.test(route) && blogEnabled)
        return <BlogPostPage />;
    return <NotFound />;
}
export default function App({path}={}) { const route=(path ?? (typeof window==='undefined'?'/':window.location.pathname)).replace(/\/+$/,'')||'/';return <RouteContext.Provider value={route}><RouterView/></RouteContext.Provider>; }
