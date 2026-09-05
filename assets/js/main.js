(function () {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const documentElement = document.documentElement;
  let maxScroll = 1;
  let scrollFrame = 0;

  function updateScrollState() {
    const hasScrolled = window.scrollY > 24;
    if (header) header.classList.toggle("is-scrolled", hasScrolled);
    if (backToTop) {
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const trackTravel = window.innerWidth <= 700 ? 61 : 96;
      backToTop.classList.toggle("is-visible", window.scrollY >= 250);
      if (window.scrollY < 250) backToTop.classList.remove("is-launching");
      backToTop.style.setProperty("--scroll-progress", (progress * 100).toFixed(2) + "%");
      backToTop.style.setProperty("--scroll-travel", (-10 - progress * trackTravel).toFixed(2) + "px");
    }
    scrollFrame = 0;
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  }

  function refreshScrollRange() {
    maxScroll = Math.max(1, documentElement.scrollHeight - window.innerHeight);
    requestScrollUpdate();
  }

  refreshScrollRange();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", refreshScrollRange, { passive: true });
  window.addEventListener("load", refreshScrollRange, { once: true });

  if ("ResizeObserver" in window) {
    const pageResizeObserver = new ResizeObserver(refreshScrollRange);
    pageResizeObserver.observe(document.body);
  }

  if (backToTop) {
    let launchTimer = 0;
    let pointerFrame = 0;
    let controlRect = null;
    let magneticX = 0;
    let magneticY = 0;
    let targetX = 0;
    let targetY = 0;

    function updateMagneticPosition() {
      magneticX += (targetX - magneticX) * 0.22;
      magneticY += (targetY - magneticY) * 0.22;
      backToTop.style.setProperty("--magnetic-x", magneticX.toFixed(2) + "px");
      backToTop.style.setProperty("--magnetic-y", magneticY.toFixed(2) + "px");

      if (Math.abs(targetX - magneticX) > 0.05 || Math.abs(targetY - magneticY) > 0.05) {
        pointerFrame = window.requestAnimationFrame(updateMagneticPosition);
      } else {
        pointerFrame = 0;
      }
    }

    function requestMagneticUpdate() {
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(updateMagneticPosition);
    }

    backToTop.addEventListener("pointerenter", function () {
      if (!finePointer.matches || reducedMotion.matches) return;
      controlRect = backToTop.getBoundingClientRect();
    });

    backToTop.addEventListener("pointermove", function (event) {
      if (!finePointer.matches || reducedMotion.matches || !controlRect) return;
      const relativeX = Math.min(1, Math.max(0, (event.clientX - controlRect.left) / controlRect.width));
      const relativeY = Math.min(1, Math.max(0, (event.clientY - controlRect.top) / controlRect.height));
      targetX = (relativeX - 0.5) * 6;
      targetY = (relativeY - 0.5) * 6;
      backToTop.style.setProperty("--mouse-x", (relativeX * 100).toFixed(1) + "%");
      backToTop.style.setProperty("--mouse-y", (relativeY * 100).toFixed(1) + "%");
      requestMagneticUpdate();
    });

    backToTop.addEventListener("pointerleave", function () {
      controlRect = null;
      targetX = 0;
      targetY = 0;
      backToTop.style.setProperty("--mouse-x", "50%");
      backToTop.style.setProperty("--mouse-y", "50%");
      requestMagneticUpdate();
    });

    backToTop.addEventListener("click", function () {
      window.clearTimeout(launchTimer);
      backToTop.classList.remove("is-launching");
      void backToTop.offsetWidth;
      backToTop.classList.add("is-launching");
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      launchTimer = window.setTimeout(function () {
        backToTop.classList.remove("is-launching");
      }, 2500);
    });
  }

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
