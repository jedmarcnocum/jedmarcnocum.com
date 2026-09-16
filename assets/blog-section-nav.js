(() => {
  const article = document.querySelector("article");
  const siteNav = document.querySelector(".site-nav");
  const headings = article
    ? [...article.querySelectorAll("h2")].filter(
        (heading) => !heading.closest('[aria-hidden="true"], [hidden], .hidden'),
      )
    : [];

  if (!article || headings.length < 2) return;

  const usedIds = new Set(
    [...document.querySelectorAll("[id]")].map((element) => element.id),
  );

  const makeId = (heading, index) => {
    if (heading.id) return heading.id;

    const base = heading.textContent
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `section-${index + 1}`;
    let id = base;
    let suffix = 2;

    while (usedIds.has(id)) id = `${base}-${suffix++}`;

    usedIds.add(id);
    heading.id = id;
    return id;
  };

  const toc = document.createElement("nav");
  toc.className = "blog-toc";
  toc.setAttribute("aria-label", "On this page");

  const inner = document.createElement("div");
  inner.className = "blog-toc__inner";

  const label = document.createElement("span");
  label.className = "blog-toc__label";
  label.textContent = "On this page";

  const links = document.createElement("div");
  links.className = "blog-toc__links";

  headings.forEach((heading, index) => {
    const id = makeId(heading, index);
    heading.classList.add("blog-section-anchor");
    heading.tabIndex = -1;

    const link = document.createElement("a");
    link.className = "blog-toc__link";
    link.href = `#${id}`;
    link.textContent = heading.textContent.trim();
    links.append(link);
  });

  inner.append(label, links);
  toc.append(inner);
  document.body.append(toc);

  toc.addEventListener("click", (event) => {
    const link = event.target.closest(".blog-toc__link");

    if (!(link instanceof HTMLAnchorElement)) return;

    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));

    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    history.pushState(null, "", link.hash);
    target.focus({ preventScroll: true });
  });

  if (!siteNav) return;

  let queued = false;

  const syncStickyState = () => {
    const shouldStick = window.scrollY > siteNav.offsetHeight;
    const isSticky = toc.classList.contains("is-sticky");

    if (shouldStick === isSticky) return;

    toc.classList.toggle("is-sticky", shouldStick);
  };

  const queueStickyState = () => {
    if (queued) return;

    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncStickyState();
    });
  };

  window.addEventListener("scroll", queueStickyState, { passive: true });
  window.addEventListener("resize", queueStickyState);
  syncStickyState();
})();
