(function () {
  "use strict";

  // Motion tuning lives here; visual tuning lives in :root in main.css.
  const CURSOR_SMOOTHING = 0.14;
  const CORE_SMOOTHING = 0.38;
  const SETTLE_THRESHOLD = 0.08;
  const CARD_SELECTOR = ".featured-project, .project-card";
  const INTERACTIVE_SELECTOR = ".button, .text-link, .primary-nav a, .profile-links a, .creative-links a";

  const root = document.documentElement;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let scanner;
  let pulse;
  let enabled = false;
  let active = false;
  let hasPosition = false;
  let frameId = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let coreX = 0;
  let coreY = 0;
  let activeCard = null;
  let activeCardBounds = null;

  function createScanner() {
    if (scanner) return;

    scanner = document.createElement("div");
    scanner.className = "cursor-scanner";
    scanner.setAttribute("aria-hidden", "true");
    scanner.innerHTML = [
      '<span class="cursor-scanner__grid"></span>',
      '<span class="cursor-scanner__outer-glow"></span>',
      '<span class="cursor-scanner__inner-glow"></span>',
      '<span class="cursor-scanner__hud"><span class="cursor-scanner__ring"></span></span>',
      '<span class="cursor-scanner__core"></span>',
      '<span class="cursor-scanner__pulse"></span>',
    ].join("");

    document.body.appendChild(scanner);
    pulse = scanner.querySelector(".cursor-scanner__pulse");
    pulse.addEventListener("animationend", function () {
      pulse.classList.remove("is-clicking");
    });
  }

  function setActiveCard(card) {
    if (card === activeCard) return;
    if (activeCard) activeCard.classList.remove("is-cursor-active");

    activeCard = card;
    activeCardBounds = activeCard ? activeCard.getBoundingClientRect() : null;
    if (activeCard) activeCard.classList.add("is-cursor-active");
  }

  function updateZone(element) {
    if (!scanner) return;
    const card = element ? element.closest(CARD_SELECTOR) : null;
    const interactive = element ? element.closest(INTERACTIVE_SELECTOR) : null;

    setActiveCard(card);
    scanner.classList.toggle("is-over-hero", Boolean(element && element.closest(".hero")));
    scanner.classList.toggle("is-over-dark", Boolean(element && element.closest(".services, .site-footer")));
    scanner.classList.toggle("is-over-interactive", Boolean(interactive));
  }

  function writePosition() {
    const normalizedX = (targetX / window.innerWidth) * 2 - 1;
    const normalizedY = -(targetY / window.innerHeight) * 2 + 1;

    root.style.setProperty("--cursor-x", currentX.toFixed(2) + "px");
    root.style.setProperty("--cursor-y", currentY.toFixed(2) + "px");
    root.style.setProperty("--cursor-core-x", coreX.toFixed(2) + "px");
    root.style.setProperty("--cursor-core-y", coreY.toFixed(2) + "px");
    root.style.setProperty("--cursor-normalized-x", normalizedX.toFixed(4));
    root.style.setProperty("--cursor-normalized-y", normalizedY.toFixed(4));

    if (activeCard && activeCardBounds) {
      const localX = Math.max(0, Math.min(activeCardBounds.width, targetX - activeCardBounds.left));
      const localY = Math.max(0, Math.min(activeCardBounds.height, targetY - activeCardBounds.top));
      activeCard.style.setProperty("--card-cursor-x", localX.toFixed(2) + "px");
      activeCard.style.setProperty("--card-cursor-y", localY.toFixed(2) + "px");
    }
  }

  function render() {
    frameId = 0;
    currentX += (targetX - currentX) * CURSOR_SMOOTHING;
    currentY += (targetY - currentY) * CURSOR_SMOOTHING;
    coreX += (targetX - coreX) * CORE_SMOOTHING;
    coreY += (targetY - coreY) * CORE_SMOOTHING;
    writePosition();

    const distance = Math.max(
      Math.abs(targetX - currentX),
      Math.abs(targetY - currentY),
      Math.abs(targetX - coreX),
      Math.abs(targetY - coreY)
    );

    if (active && distance > SETTLE_THRESHOLD && !document.hidden) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function requestRender() {
    if (!frameId && !document.hidden) frameId = window.requestAnimationFrame(render);
  }

  function activate(event) {
    targetX = event.clientX;
    targetY = event.clientY;

    if (!hasPosition) {
      currentX = targetX;
      currentY = targetY;
      coreX = targetX;
      coreY = targetY;
      hasPosition = true;
    }

    active = true;
    scanner.classList.add("is-active");
    updateZone(event.target instanceof Element ? event.target : null);
    requestRender();
  }

  function deactivate() {
    active = false;
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    if (scanner) scanner.classList.remove("is-active", "is-over-hero", "is-over-dark", "is-over-interactive");
    setActiveCard(null);
  }

  function onPointerMove(event) {
    if (event.pointerType === "touch") return;
    activate(event);
  }

  function onPointerOut(event) {
    if (!event.relatedTarget) deactivate();
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !pulse) return;
    targetX = event.clientX;
    targetY = event.clientY;
    coreX = targetX;
    coreY = targetY;
    writePosition();
    pulse.classList.remove("is-clicking");
    void pulse.offsetWidth;
    pulse.classList.add("is-clicking");
  }

  function onViewportChange() {
    // Avoid repeated layout reads while the page is actively scrolling.
    setActiveCard(null);
    if (scanner) scanner.classList.remove("is-over-hero", "is-over-dark", "is-over-interactive");
    requestRender();
  }

  function onVisibilityChange() {
    if (document.hidden) deactivate();
  }

  function enable() {
    if (enabled) return;
    createScanner();
    enabled = true;
    root.classList.add("cursor-effects-enabled");
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("blur", deactivate);
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function disable() {
    if (!enabled) return;
    deactivate();
    enabled = false;
    root.classList.remove("cursor-effects-enabled");
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("blur", deactivate);
    window.removeEventListener("resize", onViewportChange);
    window.removeEventListener("scroll", onViewportChange);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  function syncCapability() {
    if (finePointer.matches && !reducedMotion.matches) enable();
    else disable();
  }

  finePointer.addEventListener("change", syncCapability);
  reducedMotion.addEventListener("change", syncCapability);
  window.addEventListener("pagehide", disable);
  window.addEventListener("pageshow", syncCapability);
  syncCapability();
})();
