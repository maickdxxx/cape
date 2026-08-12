import { useEffect, useState } from "react";
import {
  CorujaContentGate,
  CorujaProvider,
  buildWhatsAppHref,
  useCollection,
  useContent,
  useTelHref,
  useWhatsAppUrl,
} from "./coruja-template/content.jsx";
import { fetchCorujaBlogPost, fetchCorujaBlogPosts } from "./coruja-template/api.js";

function previewBase() {
  if (typeof window === "undefined") return "";
  const raw = String(window.__CORUJA_PREVIEW_BASE_PATH__ || "").trim();
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}
function siteHref(path = "/") {
  const base = previewBase();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
function currentRoute() {
  if (typeof window === "undefined") return "/";
  let pathname = window.location.pathname || "/";
  const base = previewBase();
  if (base && pathname.startsWith(base)) pathname = pathname.slice(base.length) || "/";
  return pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
}
function currentSlug() {
  const match = currentRoute().match(/^\/blog\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
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
function setLink(rel, href) {
  if (!href) return;
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
  const pageId =
    route === "/servicos"
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

  const globalTitle = useContent("global.seo.title", "");
  const globalDescription = useContent("global.seo.description", "");
  const globalImage = useContent("global.seo.ogImage", "");
  const pageTitle = useContent(`pages.${pageId}.seo.title`, globalTitle);
  const pageDescription = useContent(`pages.${pageId}.seo.description`, globalDescription);
  const pageImage = useContent(`pages.${pageId}.seo.ogImage`, globalImage);
  const canonicalBase = useContent("global.seo.canonicalBase", "");
  const favicon = useContent("global.brand.faviconUrl", "/favicon.svg");
  const brand = useContent("global.brand.name", "");
  const legalName = useContent("global.brand.legalName", "");
  const phone = useContent("global.contact.phoneRaw", "");
  const email = useContent("global.contact.email", "");
  const address = useContent("global.contact.address", "");
  const serviceArea = useContent("global.contact.serviceArea", "");
  const instagram = useContent("global.social.instagram", "");

  useEffect(() => {
    const title = post?.seoTitle || post?.title || pageTitle || globalTitle;
    const description = post?.seoDescription || post?.excerpt || pageDescription || globalDescription;
    const image = post?.coverImage || pageImage;

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", post ? "article" : "website", "property");
    if (image) setMeta("og:image", image, "property");
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
  const name = useContent("global.brand.name", "");
  const logo = useContent("global.brand.logoUrl", "");
  return (
    <a className="brand" href={siteHref("/")}>
      {logo ? <img src={logo} alt={name} /> : <><span className="brand-fallback">C</span><span>{name}</span></>}
    </a>
  );
}

function Header() {
  const phone = useContent("global.contact.phone", "");
  const tel = useTelHref();
  const wa = useWhatsAppUrl();
  const services = useContent("global.nav.servicesLabel", "Serviços");
  const projects = useContent("global.nav.projectsLabel", "Projetos");
  const about = useContent("global.nav.aboutLabel", "Sobre");
  const blog = useContent("global.nav.blogLabel", "Blog");
  const contact = useContent("global.nav.contactLabel", "Contato");
  const cta = useContent("global.cta.headerLabel", "Solicitar orçamento");
  const links = [
    ["/servicos", services],
    ["/projetos", projects],
    ["/sobre", about],
    ["/blog", blog],
    ["/contato", contact],
  ];

  return (
    <header className="site-header">
      <div className="header-accent" />
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map(([href, label]) => <a key={href} href={siteHref(href)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="phone-link" href={tel} data-coruja-event="tel_click" data-coruja-event-label="header_phone">{phone}</a>
          <a className="btn btn-accent btn-small" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="header_whatsapp" data-coruja-text-path="global.cta.headerLabel">{cta}</a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Abrir menu"><span /><span /><span /></summary>
          <div className="mobile-panel">
            {links.map(([href, label]) => <a key={href} href={siteHref(href)}>{label}</a>)}
            <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="mobile_menu_whatsapp" data-coruja-text-path="global.cta.headerLabel">{cta}</a>
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer() {
  const tagline = useContent("global.footer.tagline", "");
  const copyright = useContent("global.footer.copyright", "");
  const email = useContent("global.contact.email", "");
  const phone = useContent("global.contact.phone", "");
  const address = useContent("global.contact.address", "");
  const cnpj = useContent("global.contact.cnpj", "");
  const instagram = useContent("global.social.instagram", "");
  const instagramLabel = useContent("global.social.instagramLabel", "Instagram");
  const tel = useTelHref();

  return (
    <footer className="footer">
      <div className="footer-top-line" />
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>{tagline}</p>
        </div>
        <div>
          <h3>Contato</h3>
          <a href={tel} data-coruja-event="tel_click" data-coruja-event-label="footer_phone">{phone}</a>
          <a href={`mailto:${email}`}>{email}</a>
          {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer">{instagramLabel}</a>}
        </div>
        <div>
          <h3>Endereço</h3>
          <p>{address}</p>
          {cnpj && <small>CNPJ: {cnpj}</small>}
        </div>
        <div>
          <h3>Navegação</h3>
          <a href={siteHref("/servicos")}>Serviços</a>
          <a href={siteHref("/projetos")}>Projetos</a>
          <a href={siteHref("/sobre")}>Sobre</a>
          <a href={siteHref("/blog")}>Blog</a>
          <a href={siteHref("/contato")}>Contato</a>
        </div>
      </div>
      <div className="container footer-bottom">{copyright}</div>
    </footer>
  );
}

function FloatingWhatsapp() {
  const wa = useWhatsAppUrl();
  const title = useContent("global.cta.floatingTitle", "");
  const text = useContent("global.cta.floatingText", "");
  const label = useContent("global.cta.floatingButtonLabel", "Abrir WhatsApp");
  return (
    <div className="floating-wa">
      <div><strong>{title}</strong><span>{text}</span></div>
      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={label} data-coruja-event="whatsapp_click" data-coruja-event-label="floating_whatsapp">↗</a>
    </div>
  );
}

function Layout({ children, post }) {
  return <><SeoManager post={post} /><Header /><main>{children}</main><Footer /><FloatingWhatsapp /></>;
}

function Eyebrow({ children, light = false }) {
  return <span className={`eyebrow ${light ? "eyebrow-light" : ""}`}><i />{children}</span>;
}
function SectionTitle({ eyebrow, title, description, light = false, compact = false }) {
  return (
    <div className={`section-title ${light ? "light" : ""} ${compact ? "compact" : ""}`}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
function Stats() {
  const items = useCollection("collections.stats");
  return (
    <div className="stats">
      {items.map(item => <div key={item.id}><strong>{item.value}</strong><span>{item.label}</span></div>)}
    </div>
  );
}
function ServiceCard({ service, index }) {
  const number = useContent("global.contact.whatsappRaw", "");
  const fallback = useContent("global.contact.whatsappMessage", "");
  const wa = buildWhatsAppHref(number, service.whatsappMessage || fallback);
  return (
    <article className="service-card">
      <div className="service-top">
        <span className="service-icon">{service.icon}</span>
        <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <span className="pill">{service.highlight}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <a href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label={`service_${service.id}_whatsapp`}>{service.ctaLabel}<span>↗</span></a>
    </article>
  );
}
function ProjectCard({ item }) {
  return (
    <article className="project-card">
      <div className="project-image"><img src={item.image} alt={item.imageAlt || item.title} /></div>
      <div className="project-copy">
        <span className="pill">{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}
function PageHero({ page, mark = "C" }) {
  const eyebrow = useContent(`pages.${page}.hero.eyebrow`, "");
  const title = useContent(`pages.${page}.hero.title`, "");
  const description = useContent(`pages.${page}.hero.description`, "");
  return (
    <section className="page-hero">
      <div className="page-grid container">
        <div><Eyebrow light>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></div>
        <div className="page-mark" aria-hidden="true">{mark}</div>
      </div>
    </section>
  );
}

function HomePage() {
  const wa = useWhatsAppUrl();
  const services = useCollection("collections.services");
  const credentials = useCollection("collections.credentials");
  const projects = useCollection("collections.projects");
  const clients = useCollection("collections.clients");
  const brands = useCollection("collections.brands");
  const areas = useCollection("collections.serviceAreas");
  const finalMessage = useContent("pages.home.finalCta.whatsappMessage", "");
  const finalWa = useWhatsAppUrl(finalMessage);

  return (
    <Layout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow light>{useContent("pages.home.hero.eyebrow", "")}</Eyebrow>
            <h1>{useContent("pages.home.hero.title", "")}</h1>
            <strong className="hero-accent">{useContent("pages.home.hero.titleAccent", "")}</strong>
            <p>{useContent("pages.home.hero.description", "")}</p>
            <div className="hero-actions">
              <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="hero_whatsapp" data-coruja-text-path="pages.home.hero.primaryCtaLabel">
                {useContent("pages.home.hero.primaryCtaLabel", "")}<span>↗</span>
              </a>
              <a className="btn btn-ghost-light" href={siteHref("/servicos")}>{useContent("pages.home.hero.secondaryCtaLabel", "")}</a>
            </div>
            <Stats />
          </div>
          <div className="hero-visual">
            <img src={useContent("pages.home.hero.image", "")} alt={useContent("pages.home.hero.imageAlt", "")} />
            <div className="hero-credential">
              <span>{useContent("pages.home.hero.sideLabel", "")}</span>
              <strong>{useContent("pages.home.hero.sideTitle", "")}</strong>
              <p>{useContent("pages.home.hero.sideText", "")}</p>
            </div>
          </div>
        </div>
        <div className="hero-angle" />
      </section>

      <section className="section service-section">
        <div className="container">
          <div className="split-heading">
            <SectionTitle
              eyebrow={useContent("pages.home.services.eyebrow", "")}
              title={useContent("pages.home.services.title", "")}
              description={useContent("pages.home.services.description", "")}
            />
            <a className="text-link" href={siteHref("/servicos")}>{useContent("pages.home.services.ctaLabel", "")} ↗</a>
          </div>
          <div className="services-grid">{services.slice(0, 6).map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div>
        </div>
      </section>

      <section className="section technical-section">
        <div className="container">
          <SectionTitle
            light
            eyebrow={useContent("pages.home.credentials.eyebrow", "")}
            title={useContent("pages.home.credentials.title", "")}
            description={useContent("pages.home.credentials.description", "")}
          />
          <div className="credential-grid">
            {credentials.map(item => (
              <article key={item.id}>
                <span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section projects-home">
        <div className="container">
          <div className="split-heading">
            <SectionTitle
              eyebrow={useContent("pages.home.projects.eyebrow", "")}
              title={useContent("pages.home.projects.title", "")}
              description={useContent("pages.home.projects.description", "")}
            />
            <a className="text-link" href={siteHref("/projetos")}>{useContent("pages.home.projects.ctaLabel", "")} ↗</a>
          </div>
          <div className="projects-grid">{projects.map(item => <ProjectCard key={item.id} item={item} />)}</div>
        </div>
      </section>

      <section className="section clients-section">
        <div className="container">
          <SectionTitle
            compact
            eyebrow={useContent("pages.home.clients.eyebrow", "")}
            title={useContent("pages.home.clients.title", "")}
            description={useContent("pages.home.clients.description", "")}
          />
          <div className="name-grid client-grid">{clients.map(item => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>

      <section className="section brands-section">
        <div className="container brand-band">
          <div>
            <Eyebrow>{useContent("pages.home.brands.eyebrow", "")}</Eyebrow>
            <h2>{useContent("pages.home.brands.title", "")}</h2>
            <p>{useContent("pages.home.brands.description", "")}</p>
          </div>
          <div className="brand-list">{brands.map(item => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>

      <section className="section areas-home">
        <div className="container areas-grid">
          <SectionTitle
            eyebrow={useContent("pages.home.areas.eyebrow", "")}
            title={useContent("pages.home.areas.title", "")}
            description={useContent("pages.home.areas.description", "")}
          />
          <div className="area-list">{areas.map(item => <span key={item.id}>{item.text}</span>)}</div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-grid">
          <div>
            <Eyebrow light>{useContent("pages.home.finalCta.eyebrow", "")}</Eyebrow>
            <h2>{useContent("pages.home.finalCta.title", "")}</h2>
            <p>{useContent("pages.home.finalCta.description", "")}</p>
          </div>
          <a className="btn btn-accent" href={finalWa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="home_final_whatsapp" data-coruja-text-path="pages.home.finalCta.buttonLabel">
            {useContent("pages.home.finalCta.buttonLabel", "")}<span>↗</span>
          </a>
        </div>
      </section>
    </Layout>
  );
}

function ServicesPage() {
  const services = useCollection("collections.services");
  const credentials = useCollection("collections.credentials");
  const process = useCollection("collections.process");
  const faq = useCollection("collections.faq");
  return (
    <Layout>
      <PageHero page="services" mark="S" />
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow={useContent("pages.services.hero.eyebrow", "")}
            title={useContent("pages.services.intro.title", "")}
            description={useContent("pages.services.intro.description", "")}
          />
          <div className="services-grid">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div>
        </div>
      </section>
      <section className="section technical-details">
        <div className="container">
          <h2>{useContent("pages.services.detailsTitle", "")}</h2>
          <div className="credential-grid compact-cards">
            {credentials.map(item => <article key={item.id}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <SectionTitle light eyebrow={useContent("pages.services.process.eyebrow", "")} title={useContent("pages.services.process.title", "")} />
          <div className="process-grid">
            {process.map(item => <article key={item.id}><span>{item.step}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container narrow">
          <h2 className="faq-title">{useContent("pages.services.faqTitle", "")}</h2>
          <div className="faq-list">
            {faq.map(item => <details key={item.id}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function ProjectsPage() {
  const projects = useCollection("collections.projects");
  const clients = useCollection("collections.clients");
  const projectMessage = useContent("pages.projects.whatsappMessage", "");
  const wa = useWhatsAppUrl(projectMessage);
  return (
    <Layout>
      <PageHero page="projects" mark="P" />
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow={useContent("pages.projects.hero.eyebrow", "")}
            title={useContent("pages.projects.intro.title", "")}
            description={useContent("pages.projects.intro.description", "")}
          />
          <div className="projects-grid projects-page">{projects.map(item => <ProjectCard key={item.id} item={item} />)}</div>
        </div>
      </section>
      <section className="section clients-section">
        <div className="container">
          <h2 className="subsection-title">{useContent("pages.projects.clientsTitle", "")}</h2>
          <div className="name-grid client-grid">{clients.map(item => <span key={item.id}>{item.name}</span>)}</div>
        </div>
      </section>
      <section className="cta-band">
        <div className="container cta-grid">
          <div><h2>{useContent("pages.projects.ctaTitle", "")}</h2><p>{useContent("pages.projects.ctaText", "")}</p></div>
          <a className="btn btn-accent" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="projects_whatsapp" data-coruja-text-path="pages.projects.ctaLabel">{useContent("pages.projects.ctaLabel", "")}<span>↗</span></a>
        </div>
      </section>
    </Layout>
  );
}

function AboutPage() {
  const values = useCollection("collections.values");
  const areas = useCollection("collections.serviceAreas");
  const credentials = useCollection("collections.credentials");
  const wa = useWhatsAppUrl();
  return (
    <Layout>
      <PageHero page="about" mark="A" />
      <section className="section">
        <div className="container about-grid">
          <div>
            <SectionTitle eyebrow={useContent("pages.about.hero.eyebrow", "")} title={useContent("pages.about.story.title", "")} />
            <p className="lead-copy">{useContent("pages.about.story.paragraph1", "")}</p>
            <p className="lead-copy">{useContent("pages.about.story.paragraph2", "")}</p>
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener noreferrer" data-coruja-event="whatsapp_click" data-coruja-event-label="about_whatsapp" data-coruja-text-path="pages.about.ctaLabel">{useContent("pages.about.ctaLabel", "")}</a>
          </div>
          <div className="mission-panel">
            <article><span>01</span><h3>{useContent("pages.about.missionTitle", "")}</h3><p>{useContent("pages.about.missionText", "")}</p></article>
            <article><span>02</span><h3>{useContent("pages.about.visionTitle", "")}</h3><p>{useContent("pages.about.visionText", "")}</p></article>
          </div>
        </div>
      </section>
      <section className="section values-section">
        <div className="container">
          <h2 className="subsection-title">{useContent("pages.about.valuesTitle", "")}</h2>
          <div className="values-grid">{values.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        </div>
      </section>
      <section className="section technical-details">
        <div className="container">
          <div className="credential-grid compact-cards">
            {credentials.map(item => <article key={item.id}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section areas-section">
        <div className="container">
          <h2>{useContent("pages.about.areasTitle", "")}</h2>
          <div className="area-list">{areas.map(item => <span key={item.id}>{item.text}</span>)}</div>
        </div>
      </section>
    </Layout>
  );
}

function ContactPage() {
  const formEnabled = Boolean(useContent("pages.contact.form.enabled", true));
  const number = useContent("global.contact.whatsappRaw", "");
  const phone = useContent("global.contact.phone", "");
  const email = useContent("global.contact.email", "");
  const address = useContent("global.contact.address", "");
  const area = useContent("global.contact.serviceArea", "");
  const hours = useContent("global.contact.businessHoursWeek", "");
  const cnpj = useContent("global.contact.cnpj", "");
  const instagram = useContent("global.social.instagram", "");
  const instagramLabel = useContent("global.social.instagramLabel", "");
  const tel = useTelHref();
  const services = useCollection("collections.services");
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });

  const formTitle = useContent("pages.contact.form.title", "");
  const formDescription = useContent("pages.contact.form.description", "");
  const nameLabel = useContent("pages.contact.form.nameLabel", "");
  const namePlaceholder = useContent("pages.contact.form.namePlaceholder", "");
  const phoneLabel = useContent("pages.contact.form.phoneLabel", "");
  const phonePlaceholder = useContent("pages.contact.form.phonePlaceholder", "");
  const emailLabel = useContent("pages.contact.form.emailLabel", "");
  const emailPlaceholder = useContent("pages.contact.form.emailPlaceholder", "");
  const serviceLabel = useContent("pages.contact.form.serviceLabel", "");
  const servicePlaceholder = useContent("pages.contact.form.servicePlaceholder", "");
  const messageLabel = useContent("pages.contact.form.messageLabel", "");
  const messagePlaceholder = useContent("pages.contact.form.messagePlaceholder", "");
  const submitText = useContent("pages.contact.form.submitText", "");
  const introMessage = useContent("pages.contact.form.whatsappMessage", "");
  const mapTitle = useContent("pages.contact.mapTitle", "");
  const infoTitle = useContent("pages.contact.info.title", "");
  const infoDescription = useContent("pages.contact.info.description", "");

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

  return (
    <Layout>
      <PageHero page="contact" mark="@" />
      <section className="section">
        <div className="container contact-grid">
          <aside className="contact-info">
            <SectionTitle eyebrow={useContent("pages.contact.hero.eyebrow", "")} title={infoTitle} description={infoDescription} />
            <div className="contact-items">
              <a href={tel} data-coruja-event="tel_click" data-coruja-event-label="contact_phone"><span>TELEFONE</span><strong>{phone}</strong></a>
              <a href={`mailto:${email}`}><span>E-MAIL</span><strong>{email}</strong></a>
              {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer"><span>INSTAGRAM</span><strong>{instagramLabel}</strong></a>}
              <div><span>REGIÃO</span><strong>{area}</strong></div>
              <div><span>ATENDIMENTO</span><strong>{hours}</strong></div>
              <div><span>CNPJ</span><strong>{cnpj}</strong></div>
            </div>
          </aside>
          {formEnabled && (
            <form className="quote-form" onSubmit={submit} data-coruja-form="quote-request" data-coruja-event="form_submit" data-coruja-event-label="contact_quote_form">
              <h2>{formTitle}</h2><p>{formDescription}</p>
              <div className="form-row">
                <label>{nameLabel}<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={namePlaceholder} /></label>
                <label>{phoneLabel}<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={phonePlaceholder} /></label>
              </div>
              <label>{emailLabel}<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={emailPlaceholder} /></label>
              <label>{serviceLabel}<select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="">{servicePlaceholder}</option>{services.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}</select></label>
              <label>{messageLabel}<textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={messagePlaceholder} /></label>
              <button className="btn btn-accent" type="submit" data-coruja-text-path="pages.contact.form.submitText">{submitText}<span>↗</span></button>
            </form>
          )}
        </div>
      </section>
      <section className="map-section">
        <div className="container">
          <div className="map-heading"><h2>{mapTitle}</h2><p>{address}</p></div>
          <div className="map-shell"><iframe title={mapTitle} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        </div>
      </section>
    </Layout>
  );
}

function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const title = useContent("pages.blog.title", "");
  const eyebrow = useContent("pages.blog.eyebrow", "");
  const description = useContent("pages.blog.description", "");
  const empty = useContent("pages.blog.emptyMessage", "");
  const readMore = useContent("pages.blog.readMoreLabel", "");

  useEffect(() => {
    let active = true;
    fetchCorujaBlogPosts().then(data => { if (active) { setPosts(data); setLoading(false); } });
    return () => { active = false; };
  }, []);

  return (
    <Layout>
      <section className="page-hero">
        <div className="page-grid container"><div><Eyebrow light>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></div><div className="page-mark">B</div></div>
      </section>
      <section className="section">
        <div className="container">
          {loading ? <div className="blog-state">Carregando…</div> : posts.length === 0 ? <div className="blog-state">{empty}</div> : (
            <div className="blog-grid">
              {posts.map(post => (
                <article key={post.id || post.slug} className="blog-card">
                  {post.coverImage && <img src={post.coverImage} alt={post.coverImageAlt || post.title} />}
                  <div>
                    {post.category && <span className="pill">{post.category}</span>}
                    <h2>{post.title}</h2><p>{post.excerpt}</p>
                    <a href={siteHref(`/blog/${encodeURIComponent(post.slug)}`)}>{readMore} ↗</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function BlogPostPage() {
  const slug = currentSlug();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const back = useContent("pages.blog.backLabel", "");
  const empty = useContent("pages.blog.emptyMessage", "");

  useEffect(() => {
    let active = true;
    fetchCorujaBlogPost(slug).then(data => { if (active) { setPost(data); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <Layout><section className="section"><div className="container blog-state">Carregando…</div></section></Layout>;
  if (!post) return <Layout><section className="section"><div className="container blog-state">{empty}</div></section></Layout>;

  return (
    <Layout post={post}>
      <article className="article">
        <div className="container article-head">
          <a href={siteHref("/blog")}>← {back}</a>
          {post.category && <span className="pill">{post.category}</span>}
          <h1>{post.title}</h1>
          {post.excerpt && <p>{post.excerpt}</p>}
          {post.coverImage && <img src={post.coverImage} alt={post.coverImageAlt || post.title} />}
        </div>
        <div className="container article-body" dangerouslySetInnerHTML={{ __html: post.contentHtml || String(post.content || "") }} />
      </article>
    </Layout>
  );
}

function NotFound() {
  return <Layout><section className="not-found"><div><span>404</span><h1>Página não encontrada</h1><a className="btn btn-primary" href={siteHref("/")}>Voltar ao início</a></div></section></Layout>;
}

function RouterView() {
  const route = currentRoute();
  const blogEnabled = Boolean(useContent("blog.enabled", true));
  if (route === "/") return <HomePage />;
  if (route === "/servicos") return <ServicesPage />;
  if (route === "/projetos") return <ProjectsPage />;
  if (route === "/sobre") return <AboutPage />;
  if (route === "/contato") return <ContactPage />;
  if (route === "/blog" && blogEnabled) return <BlogPage />;
  if (/^\/blog\/[^/]+$/.test(route) && blogEnabled) return <BlogPostPage />;
  return <NotFound />;
}

export default function App() {
  return <CorujaProvider><CorujaContentGate><RouterView /></CorujaContentGate></CorujaProvider>;
}
