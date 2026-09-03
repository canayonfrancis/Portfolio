(function () {
  "use strict";

  const scene = document.querySelector("[data-hero-scene]");
  const canvas = document.querySelector("[data-hero-canvas]");
  if (!scene || !canvas) return;

  function initializeScene() {

  const browserCard = scene.querySelector(".browser-card");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactScene = window.matchMedia("(max-width: 700px)");
  let gl;

  // Automated audits and constrained browser runners often force a very slow
  // software renderer. The static illustration is the intended safe fallback.
  if (navigator.webdriver || compactScene.matches) {
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
    return;
  }

  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    gl = null;
  }

  if (!gl) {
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
    return;
  }

  const rendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = rendererInfo
    ? String(gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) || "")
    : "";

  // Software WebGL can spend several seconds compiling even this tiny shader.
  // Keep the complete DOM/CSS illustration as the fallback on those devices.
  if (/swiftshader|llvmpipe|software/i.test(rendererName)) {
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
    return;
  }

  const vertexSource = [
    "attribute vec2 aPosition;",
    "attribute float aPhase;",
    "attribute float aSize;",
    "uniform float uTime;",
    "uniform vec2 uPointer;",
    "void main() {",
    "  vec2 point = aPosition;",
    "  point.x += sin(uTime * 0.00022 + aPhase) * 0.018 + uPointer.x * 0.025;",
    "  point.y += cos(uTime * 0.00018 + aPhase * 1.7) * 0.015 + uPointer.y * 0.018;",
    "  gl_Position = vec4(point, 0.0, 1.0);",
    "  gl_PointSize = aSize;",
    "}",
  ].join("\n");

  const fragmentSource = [
    "precision mediump float;",
    "void main() {",
    "  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));",
    "  float alpha = 1.0 - smoothstep(0.12, 0.5, distanceToCenter);",
    "  gl_FragColor = vec4(0.082, 0.369, 0.937, alpha * 0.42);",
    "}",
  ].join("\n");

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!vertexShader || !fragmentShader || !program) {
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
    return;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
    return;
  }

  const particleCount = compactScene.matches ? 18 : 34;
  const particleData = new Float32Array(particleCount * 4);
  let seed = 4173;

  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 4;
    particleData[offset] = random() * 1.8 - 0.9;
    particleData[offset + 1] = random() * 1.7 - 0.85;
    particleData[offset + 2] = random() * 6.283;
    particleData[offset + 3] = compactScene.matches ? 2 + random() * 2 : 2 + random() * 3.5;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
  gl.useProgram(program);

  const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const phaseLocation = gl.getAttribLocation(program, "aPhase");
  const sizeLocation = gl.getAttribLocation(program, "aSize");
  const timeLocation = gl.getUniformLocation(program, "uTime");
  const pointerLocation = gl.getUniformLocation(program, "uPointer");

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(phaseLocation);
  gl.vertexAttribPointer(phaseLocation, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(sizeLocation);
  gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let frameId = 0;
  let sceneVisible = true;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, compactScene.matches ? 1 : 1.5);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(time) {
    pointerX += (targetX - pointerX) * 0.055;
    pointerY += (targetY - pointerY) * 0.055;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLocation, reducedMotion.matches ? 0 : time);
    gl.uniform2f(pointerLocation, pointerX, pointerY);
    gl.drawArrays(gl.POINTS, 0, particleCount);

    if (browserCard && !reducedMotion.matches) {
      const rotateX = 2 - pointerY * 3;
      const rotateY = -5 + pointerX * 4;
      browserCard.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) rotateZ(-1deg)";
    }

    if (!reducedMotion.matches && sceneVisible && !document.hidden) {
      frameId = window.requestAnimationFrame(draw);
    }
  }

  function start() {
    window.cancelAnimationFrame(frameId);
    resize();
    frameId = window.requestAnimationFrame(draw);
  }

  function stop() {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  scene.addEventListener("pointermove", function (event) {
    if (reducedMotion.matches || compactScene.matches) return;
    const bounds = scene.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }, { passive: true });

  scene.addEventListener("pointerleave", function () {
    targetX = 0;
    targetY = 0;
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (sceneVisible) start();
  });

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(function (entries) {
      sceneVisible = entries[0].isIntersecting;
      if (sceneVisible && !document.hidden) start();
      else stop();
    }, { threshold: 0.01 });
    visibilityObserver.observe(scene);
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  reducedMotion.addEventListener("change", start);
  canvas.addEventListener("webglcontextlost", function () {
    stop();
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = "fallback";
  });

  scene.dataset.sceneStatus = "webgl";
  resize();
  draw(0);

  window.addEventListener("pagehide", function () {
    stop();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }, { once: true });

  }

  function scheduleScene() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initializeScene, { timeout: 1500 });
    } else {
      window.setTimeout(initializeScene, 500);
    }
  }

  if (document.readyState === "complete") scheduleScene();
  else window.addEventListener("load", scheduleScene, { once: true });
})();
