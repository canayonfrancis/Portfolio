(function () {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateScrollState() {
    const hasScrolled = window.scrollY > 24;
    if (header) header.classList.toggle("is-scrolled", hasScrolled);
    if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 700);
  }

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  if (nav && navToggle) {
    const focusableSelector = "a[href], button:not([disabled])";

    function setMenu(open, returnFocus) {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      document.body.classList.toggle("menu-open", open);

      if (open) {
        const firstLink = nav.querySelector("a");
        if (firstLink) firstLink.focus();
      } else if (returnFocus) {
        navToggle.focus();
      }
    }

    navToggle.addEventListener("click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true", false);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false, false);
    });

    document.addEventListener("keydown", function (event) {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false, true);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [navToggle].concat(Array.from(nav.querySelectorAll(focusableSelector)));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) setMenu(false, false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && navToggle.getAttribute("aria-expanded") === "true") {
        setMenu(false, false);
      }
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if (revealItems.length && "IntersectionObserver" in window && !reducedMotion.matches) {
    document.documentElement.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  const navLinks = Array.from(document.querySelectorAll(".primary-nav a[href^='#']"));
  const observedSections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);

  if (navLinks.length && observedSections.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -60%", threshold: 0 });
    observedSections.forEach(function (section) { sectionObserver.observe(section); });
  }
})();
