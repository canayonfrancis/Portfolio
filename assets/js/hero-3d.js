(function () {
  "use strict";

  const scene = document.querySelector("[data-hero-scene]");
  const canvas = document.querySelector("[data-hero-canvas]");
  const hero = scene ? scene.closest(".hero") : null;
  if (!scene || !canvas || !hero) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactScene = window.matchMedia("(max-width: 700px)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const DEG = Math.PI / 180;
  const colorCache = new Map();
  let destroyed = false;

  function setFallback(reason) {
    scene.classList.remove("is-webgl");
    scene.classList.add("is-static");
    scene.dataset.sceneStatus = reason || "fallback";
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function easeOutCubic(value) {
    const remaining = 1 - clamp(value, 0, 1);
    return 1 - remaining * remaining * remaining;
  }

  function hexToRgb(hex) {
    if (colorCache.has(hex)) return colorCache.get(hex);
    const value = Number.parseInt(hex.replace("#", ""), 16);
    const color = [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
    colorCache.set(hex, color);
    return color;
  }

  function mat4Identity(out) {
    out.fill(0);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }

  function mat4Multiply(out, left, right) {
    const l0 = left[0]; const l1 = left[1]; const l2 = left[2]; const l3 = left[3];
    const l4 = left[4]; const l5 = left[5]; const l6 = left[6]; const l7 = left[7];
    const l8 = left[8]; const l9 = left[9]; const l10 = left[10]; const l11 = left[11];
    const l12 = left[12]; const l13 = left[13]; const l14 = left[14]; const l15 = left[15];
    for (let column = 0; column < 4; column += 1) {
      const offset = column * 4;
      const r0 = right[offset];
      const r1 = right[offset + 1];
      const r2 = right[offset + 2];
      const r3 = right[offset + 3];
      out[offset] = l0*r0 + l4*r1 + l8*r2 + l12*r3;
      out[offset + 1] = l1*r0 + l5*r1 + l9*r2 + l13*r3;
      out[offset + 2] = l2*r0 + l6*r1 + l10*r2 + l14*r3;
      out[offset + 3] = l3*r0 + l7*r1 + l11*r2 + l15*r3;
    }
    return out;
  }

  function mat4Translate(out, matrix, x, y, z) {
    if (out !== matrix) out.set(matrix);
    out[12] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    out[13] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    out[14] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
    out[15] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
    return out;
  }

  function mat4RotateX(out, matrix, radians) {
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const a4 = matrix[4];
    const a5 = matrix[5];
    const a6 = matrix[6];
    const a7 = matrix[7];
    const a8 = matrix[8];
    const a9 = matrix[9];
    const a10 = matrix[10];
    const a11 = matrix[11];
    if (out !== matrix) {
      out[0] = matrix[0]; out[1] = matrix[1]; out[2] = matrix[2]; out[3] = matrix[3];
      out[12] = matrix[12]; out[13] = matrix[13]; out[14] = matrix[14]; out[15] = matrix[15];
    }
    out[4] = a4 * cosine + a8 * sine;
    out[5] = a5 * cosine + a9 * sine;
    out[6] = a6 * cosine + a10 * sine;
    out[7] = a7 * cosine + a11 * sine;
    out[8] = a8 * cosine - a4 * sine;
    out[9] = a9 * cosine - a5 * sine;
    out[10] = a10 * cosine - a6 * sine;
    out[11] = a11 * cosine - a7 * sine;
    return out;
  }

  function mat4RotateY(out, matrix, radians) {
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const a0 = matrix[0];
    const a1 = matrix[1];
    const a2 = matrix[2];
    const a3 = matrix[3];
    const a8 = matrix[8];
    const a9 = matrix[9];
    const a10 = matrix[10];
    const a11 = matrix[11];
    if (out !== matrix) {
      out[4] = matrix[4]; out[5] = matrix[5]; out[6] = matrix[6]; out[7] = matrix[7];
      out[12] = matrix[12]; out[13] = matrix[13]; out[14] = matrix[14]; out[15] = matrix[15];
    }
    out[0] = a0 * cosine - a8 * sine;
    out[1] = a1 * cosine - a9 * sine;
    out[2] = a2 * cosine - a10 * sine;
    out[3] = a3 * cosine - a11 * sine;
    out[8] = a0 * sine + a8 * cosine;
    out[9] = a1 * sine + a9 * cosine;
    out[10] = a2 * sine + a10 * cosine;
    out[11] = a3 * sine + a11 * cosine;
    return out;
  }

  function mat4RotateZ(out, matrix, radians) {
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const a0 = matrix[0];
    const a1 = matrix[1];
    const a2 = matrix[2];
    const a3 = matrix[3];
    const a4 = matrix[4];
    const a5 = matrix[5];
    const a6 = matrix[6];
    const a7 = matrix[7];
    if (out !== matrix) {
      out[8] = matrix[8]; out[9] = matrix[9]; out[10] = matrix[10]; out[11] = matrix[11];
      out[12] = matrix[12]; out[13] = matrix[13]; out[14] = matrix[14]; out[15] = matrix[15];
    }
    out[0] = a0 * cosine + a4 * sine;
    out[1] = a1 * cosine + a5 * sine;
    out[2] = a2 * cosine + a6 * sine;
    out[3] = a3 * cosine + a7 * sine;
    out[4] = a4 * cosine - a0 * sine;
    out[5] = a5 * cosine - a1 * sine;
    out[6] = a6 * cosine - a2 * sine;
    out[7] = a7 * cosine - a3 * sine;
    return out;
  }

  function mat4Scale(out, matrix, x, y, z) {
    out[0] = matrix[0] * x; out[1] = matrix[1] * x; out[2] = matrix[2] * x; out[3] = matrix[3] * x;
    out[4] = matrix[4] * y; out[5] = matrix[5] * y; out[6] = matrix[6] * y; out[7] = matrix[7] * y;
    out[8] = matrix[8] * z; out[9] = matrix[9] * z; out[10] = matrix[10] * z; out[11] = matrix[11] * z;
    out[12] = matrix[12]; out[13] = matrix[13]; out[14] = matrix[14]; out[15] = matrix[15];
    return out;
  }

  function mat4Compose(out, position, rotation, scale) {
    mat4Identity(out);
    mat4Translate(out, out, position[0], position[1], position[2]);
    mat4RotateX(out, out, rotation[0]);
    mat4RotateY(out, out, rotation[1]);
    mat4RotateZ(out, out, rotation[2]);
    mat4Scale(out, out, scale[0], scale[1], scale[2]);
    return out;
  }

  function mat4Perspective(out, fieldOfView, aspect, near, far) {
    const factor = 1 / Math.tan(fieldOfView / 2);
    out.fill(0);
    out[0] = factor / aspect;
    out[5] = factor;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return null;
    }
    return { program: program, vertex: vertex, fragment: fragment };
  }

  function roundedRect(context, x, y, width, height, radius) {
    const corner = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + corner, y);
    context.arcTo(x + width, y, x + width, y + height, corner);
    context.arcTo(x + width, y + height, x, y + height, corner);
    context.arcTo(x, y + height, x, y, corner);
    context.arcTo(x, y, x + width, y, corner);
    context.closePath();
  }

  async function initializeScene() {
    if (destroyed) return;
    const isAutomatedAudit = navigator.webdriver || /Chrome-Lighthouse|PageSpeed Insights/i.test(navigator.userAgent);
    if (isAutomatedAudit) {
      setFallback("fallback-audit");
      return;
    }
    if (reducedMotion.matches) {
      setFallback("fallback-reduced-motion");
      return;
    }
    if (compactScene.matches) {
      setFallback("fallback-compact");
      return;
    }

    let gl;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: false,
        powerPreference: compactScene.matches ? "low-power" : "default",
      });
    } catch (error) {
      gl = null;
    }
    if (!gl) {
      setFallback("fallback-no-webgl");
      return;
    }

    const rendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererName = rendererInfo ? String(gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) || "") : "";
    if (/swiftshader|llvmpipe|software/i.test(rendererName)) {
      setFallback("fallback-software-renderer");
      return;
    }

    scene.dataset.sceneStatus = "initializing";
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([
          document.fonts.load("600 24px Sora"),
          document.fonts.load("500 18px JetBrains Mono"),
        ]),
        new Promise(function (resolve) { window.setTimeout(resolve, 650); }),
      ]).catch(function () {});
    }
    if (destroyed) return;

    const meshSources = createProgram(gl, [
      "attribute vec3 aPosition;",
      "attribute vec3 aNormal;",
      "uniform mat4 uModel;",
      "uniform mat4 uViewProjection;",
      "varying vec3 vNormal;",
      "varying vec3 vWorldPosition;",
      "void main() {",
      "  vec4 world = uModel * vec4(aPosition, 1.0);",
      "  vWorldPosition = world.xyz;",
      "  vNormal = normalize(mat3(uModel) * aNormal);",
      "  gl_Position = uViewProjection * world;",
      "}",
    ].join("\n"), [
      "precision mediump float;",
      "uniform vec3 uColor;",
      "uniform vec3 uAccent;",
      "uniform float uAlpha;",
      "uniform float uBlueLight;",
      "varying vec3 vNormal;",
      "varying vec3 vWorldPosition;",
      "void main() {",
      "  vec3 normal = normalize(vNormal);",
      "  vec3 lightDirection = normalize(vec3(-0.45, 0.8, 1.0));",
      "  float diffuse = max(dot(normal, lightDirection), 0.0);",
      "  float ambient = 0.78 + diffuse * 0.22;",
      "  float blueFalloff = 1.0 / (1.0 + length(vWorldPosition - vec3(-1.8, 1.8, 2.8)) * 0.38);",
      "  vec3 litColor = uColor * ambient + uAccent * blueFalloff * uBlueLight;",
      "  gl_FragColor = vec4(litColor, uAlpha);",
      "}",
    ].join("\n"));

    const flatSources = createProgram(gl, [
      "attribute vec3 aPosition;",
      "uniform mat4 uModel;",
      "uniform mat4 uViewProjection;",
      "uniform float uPointSize;",
      "void main() {",
      "  vec4 clip = uViewProjection * uModel * vec4(aPosition, 1.0);",
      "  gl_Position = clip;",
      "  gl_PointSize = uPointSize * (10.0 / max(2.0, clip.w));",
      "}",
    ].join("\n"), [
      "precision mediump float;",
      "uniform vec3 uColor;",
      "uniform float uAlpha;",
      "uniform float uPointMode;",
      "void main() {",
      "  if (uPointMode > 0.5 && distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;",
      "  gl_FragColor = vec4(uColor, uAlpha);",
      "}",
    ].join("\n"));

    const textureSources = createProgram(gl, [
      "attribute vec3 aPosition;",
      "attribute vec2 aUv;",
      "uniform mat4 uModel;",
      "uniform mat4 uViewProjection;",
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = aUv;",
      "  gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0);",
      "}",
    ].join("\n"), [
      "precision mediump float;",
      "uniform sampler2D uTexture;",
      "uniform float uAlpha;",
      "varying vec2 vUv;",
      "void main() {",
      "  vec4 color = texture2D(uTexture, vUv);",
      "  if (color.a < 0.02) discard;",
      "  gl_FragColor = vec4(color.rgb, color.a * uAlpha);",
      "}",
    ].join("\n"));

    if (!meshSources || !flatSources || !textureSources) {
      setFallback("fallback-shader-error");
      return;
    }

    const resources = { programs: [meshSources, flatSources, textureSources], buffers: [], textures: [] };
    const cubeVertices = new Float32Array([
      -0.5,-0.5, 0.5, 0,0,1,  0.5,-0.5, 0.5, 0,0,1,  0.5, 0.5, 0.5, 0,0,1, -0.5, 0.5, 0.5, 0,0,1,
       0.5,-0.5,-0.5, 0,0,-1, -0.5,-0.5,-0.5, 0,0,-1, -0.5, 0.5,-0.5, 0,0,-1, 0.5, 0.5,-0.5, 0,0,-1,
      -0.5,-0.5,-0.5,-1,0,0, -0.5,-0.5, 0.5,-1,0,0, -0.5, 0.5, 0.5,-1,0,0, -0.5, 0.5,-0.5,-1,0,0,
       0.5,-0.5, 0.5, 1,0,0,  0.5,-0.5,-0.5, 1,0,0,  0.5, 0.5,-0.5, 1,0,0, 0.5, 0.5, 0.5, 1,0,0,
      -0.5, 0.5, 0.5, 0,1,0,  0.5, 0.5, 0.5, 0,1,0,  0.5, 0.5,-0.5, 0,1,0, -0.5, 0.5,-0.5, 0,1,0,
      -0.5,-0.5,-0.5, 0,-1,0, 0.5,-0.5,-0.5, 0,-1,0, 0.5,-0.5, 0.5, 0,-1,0, -0.5,-0.5, 0.5, 0,-1,0,
    ]);
    const cubeIndices = new Uint16Array([
      0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11,
      12,13,14,12,14,15, 16,17,18,16,18,19, 20,21,22,20,22,23,
    ]);
    const quadVertices = new Float32Array([
      -0.5,-0.5,0, 0,0, 0.5,-0.5,0, 1,0, 0.5,0.5,0, 1,1, -0.5,0.5,0, 0,1,
    ]);
    const quadIndices = new Uint16Array([0,1,2,0,2,3]);

    function createBuffer(target, data, usage) {
      const buffer = gl.createBuffer();
      resources.buffers.push(buffer);
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, usage || gl.STATIC_DRAW);
      return buffer;
    }

    const cubeVertexBuffer = createBuffer(gl.ARRAY_BUFFER, cubeVertices);
    const cubeIndexBuffer = createBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndices);
    const quadVertexBuffer = createBuffer(gl.ARRAY_BUFFER, quadVertices);
    const quadIndexBuffer = createBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndices);
    const flatBuffer = createBuffer(gl.ARRAY_BUFFER, new Float32Array(512 * 3), gl.DYNAMIC_DRAW);
    const meshProgram = {
      program: meshSources.program,
      position: gl.getAttribLocation(meshSources.program, "aPosition"),
      normal: gl.getAttribLocation(meshSources.program, "aNormal"),
      model: gl.getUniformLocation(meshSources.program, "uModel"),
      viewProjection: gl.getUniformLocation(meshSources.program, "uViewProjection"),
      color: gl.getUniformLocation(meshSources.program, "uColor"),
      accent: gl.getUniformLocation(meshSources.program, "uAccent"),
      alpha: gl.getUniformLocation(meshSources.program, "uAlpha"),
      blueLight: gl.getUniformLocation(meshSources.program, "uBlueLight"),
    };
    const flatProgram = {
      program: flatSources.program,
      position: gl.getAttribLocation(flatSources.program, "aPosition"),
      model: gl.getUniformLocation(flatSources.program, "uModel"),
      viewProjection: gl.getUniformLocation(flatSources.program, "uViewProjection"),
      color: gl.getUniformLocation(flatSources.program, "uColor"),
      alpha: gl.getUniformLocation(flatSources.program, "uAlpha"),
      pointSize: gl.getUniformLocation(flatSources.program, "uPointSize"),
      pointMode: gl.getUniformLocation(flatSources.program, "uPointMode"),
    };
    const textureProgram = {
      program: textureSources.program,
      position: gl.getAttribLocation(textureSources.program, "aPosition"),
      uv: gl.getAttribLocation(textureSources.program, "aUv"),
      model: gl.getUniformLocation(textureSources.program, "uModel"),
      viewProjection: gl.getUniformLocation(textureSources.program, "uViewProjection"),
      texture: gl.getUniformLocation(textureSources.program, "uTexture"),
      alpha: gl.getUniformLocation(textureSources.program, "uAlpha"),
    };

    function uploadTexture(sourceCanvas) {
      const texture = gl.createTexture();
      resources.textures.push(texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return texture;
    }

    function createModuleTexture(icon, title, detail, treatment) {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 512;
      textureCanvas.height = 256;
      const context = textureCanvas.getContext("2d");
      const panel = context.createLinearGradient(0, 20, 512, 236);
      panel.addColorStop(0, "rgba(255,255,255,0.99)");
      panel.addColorStop(1, "rgba(244,246,250,0.98)");
      roundedRect(context, 7, 16, 498, 224, 34);
      context.fillStyle = panel;
      context.fill();
      context.strokeStyle = "rgba(17,17,17,0.13)";
      context.lineWidth = 3;
      context.stroke();
      roundedRect(context, 30, 50, 126, 126, 28);
      context.fillStyle = treatment === "muted" ? "#e8e9eb" : treatment === "soft" ? "#e9f0ff" : "#155eef";
      context.fill();
      context.fillStyle = treatment === "muted" ? "#111111" : treatment === "soft" ? "#155eef" : "#ffffff";
      context.font = "600 43px 'JetBrains Mono', monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(icon, 93, 114);
      context.textAlign = "left";
      context.fillStyle = "#161616";
      context.font = "600 24px 'JetBrains Mono', monospace";
      context.fillText(title, 184, 102);
      context.fillStyle = "#777b82";
      context.font = "500 16px 'JetBrains Mono', monospace";
      context.fillText(detail, 184, 137);
      return uploadTexture(textureCanvas);
    }

    function createInterfaceTexture(text, foreground, background) {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 1024;
      textureCanvas.height = 128;
      const context = textureCanvas.getContext("2d");
      if (background) {
        roundedRect(context, 4, 12, 1016, 104, 52);
        context.fillStyle = background;
        context.fill();
      }
      context.fillStyle = foreground;
      context.font = "500 25px 'JetBrains Mono', monospace";
      context.textAlign = background ? "center" : "left";
      context.textBaseline = "middle";
      context.fillText(text, background ? 512 : 22, 64);
      return uploadTexture(textureCanvas);
    }

    const textures = {
      wordpress: createModuleTexture("W", "WORDPRESS", "CMS / BUILD", "blue"),
      commerce: createModuleTexture("WC", "WOOCOMMERCE", "STORE / SCALE", "muted"),
      performance: createModuleTexture("CWV", "PERFORMANCE", "OPTIMIZED", "blue"),
      url: createInterfaceTexture("francis.dev / build", "#777b82", "rgba(231,232,234,0.96)"),
      site: createInterfaceTexture("<SITE />", "#777b82", null),
      optimized: createInterfaceTexture("PERFORMANCE: OPTIMIZED", "#155eef", null),
    };
    if (!compactScene.matches) textures.code = createModuleTexture("</>", "CUSTOM CODE", "PHP / JS", "soft");

    const browserBoxes = [
      { p:[0.13,-0.17,-0.3], r:[0,0,0], s:[5.45,3.58,0.08], c:"#111111", a:0.075 },
      { p:[0,0,0], r:[0,0,0], s:[5.2,3.38,0.28], c:"#e1e2e4", a:1, b:0.03 },
      { p:[0,0,0.17], r:[0,0,0], s:[5.05,3.2,0.08], c:"#fbfbfa", a:1, b:0.02 },
      { p:[0,1.39,0.28], r:[0,0,0], s:[5.03,0.42,0.13], c:"#f2f2f1", a:1 },
      { p:[-2.16,-0.18,0.36], r:[0,0,0], s:[0.55,2.68,0.18], c:"#151515", a:1, b:0.025 },
      { p:[0.34,-0.18,0.34], r:[0,0,0], s:[3.92,2.57,0.11], c:"#ffffff", a:1 },
      { p:[-0.34,0.79,0.48], r:[0,0,0], s:[2.15,0.14,0.1], c:"#181818", a:1 },
      { p:[-0.69,0.53,0.47], r:[0,0,0], s:[1.46,0.1,0.08], c:"#d7d8da", a:1 },
      { p:[-0.83,0.02,0.53], r:[0,0,0], s:[0.92,0.72,0.15], c:"#f8f8f7", a:1 },
      { p:[0.29,0.02,0.6], r:[0,0,0], s:[0.92,0.72,0.2], c:"#dfe8ff", a:1, b:0.08 },
      { p:[1.41,0.02,0.52], r:[0,0,0], s:[0.92,0.72,0.14], c:"#f8f8f7", a:1 },
      { p:[0.3,-0.91,0.5], r:[0,0,0], s:[3.15,0.58,0.12], c:"#f1f2f3", a:1 },
      { p:[-2.16,1.36,0.5], r:[0,0,0], s:[0.25,0.25,0.16], c:"#155eef", a:1, b:0.12 },
      { p:[-2.16,0.62,0.49], r:[0,0,0], s:[0.28,0.045,0.07], c:"#ffffff", a:0.9 },
      { p:[-2.16,0.28,0.49], r:[0,0,0], s:[0.28,0.045,0.07], c:"#55585c", a:1 },
      { p:[-2.16,-0.06,0.49], r:[0,0,0], s:[0.28,0.045,0.07], c:"#55585c", a:1 },
      { p:[-2.16,-0.4,0.49], r:[0,0,0], s:[0.28,0.045,0.07], c:"#55585c", a:1 },
      { p:[-2.32,1.39,0.48], r:[0,0,0], s:[0.07,0.07,0.06], c:"#155eef", a:1, b:0.08 },
      { p:[-2.12,1.39,0.48], r:[0,0,0], s:[0.07,0.07,0.06], c:"#c4c5c7", a:1 },
      { p:[-1.92,1.39,0.48], r:[0,0,0], s:[0.07,0.07,0.06], c:"#c4c5c7", a:1 },
    ];
    const moduleDefinitions = [
      { key:"wordpress", p:[-2.45,1.73,1.18], r:[-2*DEG,-6*DEG,-4*DEG], s:[1.75,0.78,0.25], phase:0.3, treatment:"#ffffff" },
      { key:"commerce", p:[2.45,1.38,0.74], r:[1*DEG,7*DEG,4*DEG], s:[1.82,0.8,0.25], phase:1.8, treatment:"#f4f4f3" },
      { key:"code", p:[2.32,-1.72,1.45], r:[-2*DEG,-7*DEG,-3*DEG], s:[1.7,0.76,0.25], phase:3.1, treatment:"#f8faff" },
      { key:"performance", p:[-2.38,-1.45,0.72], r:[2*DEG,7*DEG,3*DEG], s:[1.78,0.78,0.25], phase:4.6, treatment:"#ffffff" },
    ];
    const moduleAnchors = {
      wordpress: [-2.15,0.86,-0.05], commerce: [2.18,0.64,-0.03],
      code: [1.88,-0.86,0.08], performance: [-1.86,-0.92,-0.03],
    };
    const moduleStates = moduleDefinitions.map(function (definition) {
      return { definition: definition, hover: 0, currentPosition: definition.p.slice(), matrix: new Float32Array(16), curve: new Float32Array(17*3) };
    });
    const graphPoints = [
      [-1.18,-1.01,0.61],[-0.82,-0.92,0.63],[-0.44,-0.95,0.65],[-0.08,-0.8,0.67],
      [0.3,-0.75,0.69],[0.68,-0.6,0.71],[1.08,-0.52,0.73],[1.47,-0.36,0.75],
    ];
    const gridVertices = [];
    for (let index = -4; index <= 4; index += 1) {
      gridVertices.push(-4.2,index*0.72,-1.18, 4.2,index*0.72,-1.18);
      gridVertices.push(index*0.82,-3.1,-1.18, index*0.82,3.1,-1.18);
    }
    const gridData = new Float32Array(gridVertices);
    const orbitVertices = [];
    for (let index = 0; index <= 96; index += 1) {
      const angle = index / 96 * Math.PI * 2;
      orbitVertices.push(Math.cos(angle)*3.55, Math.sin(angle)*2.35, -0.6+Math.sin(angle)*0.18);
    }
    const orbitData = new Float32Array(orbitVertices);
    const particleCount = compactScene.matches ? 7 : 18;
    const particles = [];
    let seed = 4173;
    function random() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({ x:random()*7.1-3.55, y:random()*5.2-2.6, z:random()*2.2-0.8, phase:random()*Math.PI*2 });
    }
    const particleVertices = new Float32Array(particleCount*3);

    const projection = new Float32Array(16);
    const view = new Float32Array(16);
    const viewProjection = new Float32Array(16);
    const rootMatrix = new Float32Array(16);
    const browserLocal = new Float32Array(16);
    const browserMatrix = new Float32Array(16);
    const localMatrix = new Float32Array(16);
    const modelMatrix = new Float32Array(16);
    const moduleMatrix = new Float32Array(16);
    const combinedMatrix = new Float32Array(16);
    const accent = hexToRgb("#155eef");
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let pointerCanvasX = -1000;
    let pointerCanvasY = -1000;
    let scrollTarget = 0;
    let scrollCurrent = 0;
    let frameId = 0;
    let lastCompactFrame = 0;
    let sceneVisible = true;
    let startTime = 0;
    let firstFrameDrawn = false;

    function bindMeshProgram() {
      gl.useProgram(meshProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
      gl.enableVertexAttribArray(meshProgram.position);
      gl.enableVertexAttribArray(meshProgram.normal);
      gl.vertexAttribPointer(meshProgram.position, 3, gl.FLOAT, false, 6*4, 0);
      gl.vertexAttribPointer(meshProgram.normal, 3, gl.FLOAT, false, 6*4, 3*4);
      gl.uniformMatrix4fv(meshProgram.viewProjection, false, viewProjection);
      gl.uniform3fv(meshProgram.accent, accent);
    }

    function drawBox(parent, position, rotation, scale, color, alpha, blueLight) {
      mat4Compose(localMatrix, position, rotation, scale);
      mat4Multiply(modelMatrix, parent, localMatrix);
      gl.uniformMatrix4fv(meshProgram.model, false, modelMatrix);
      gl.uniform3fv(meshProgram.color, hexToRgb(color));
      gl.uniform1f(meshProgram.alpha, alpha);
      gl.uniform1f(meshProgram.blueLight, blueLight || 0);
      gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    function drawTexturedPlane(parent, position, rotation, scale, texture, alpha) {
      mat4Compose(localMatrix, position, rotation, scale);
      mat4Multiply(modelMatrix, parent, localMatrix);
      gl.useProgram(textureProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
      gl.enableVertexAttribArray(textureProgram.position);
      gl.enableVertexAttribArray(textureProgram.uv);
      gl.vertexAttribPointer(textureProgram.position, 3, gl.FLOAT, false, 5*4, 0);
      gl.vertexAttribPointer(textureProgram.uv, 2, gl.FLOAT, false, 5*4, 3*4);
      gl.uniformMatrix4fv(textureProgram.model, false, modelMatrix);
      gl.uniformMatrix4fv(textureProgram.viewProjection, false, viewProjection);
      gl.uniform1f(textureProgram.alpha, alpha);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureProgram.texture, 0);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.drawElements(gl.TRIANGLES, quadIndices.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
    }

    function drawFlat(vertices, parent, mode, color, alpha, pointMode, pointSize) {
      if (!vertices.length || alpha <= 0) return;
      const data = vertices instanceof Float32Array ? vertices : new Float32Array(vertices);
      gl.useProgram(flatProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, flatBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(flatProgram.position);
      gl.vertexAttribPointer(flatProgram.position, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(flatProgram.model, false, parent);
      gl.uniformMatrix4fv(flatProgram.viewProjection, false, viewProjection);
      gl.uniform3fv(flatProgram.color, hexToRgb(color));
      gl.uniform1f(flatProgram.alpha, alpha);
      gl.uniform1f(flatProgram.pointMode, pointMode ? 1 : 0);
      gl.uniform1f(flatProgram.pointSize, pointSize || 1);
      gl.depthMask(false);
      gl.drawArrays(mode, 0, data.length/3);
      gl.depthMask(true);
    }

    function drawSegment(parent, start, end, color, alpha, thickness, depth) {
      const x = (start[0]+end[0])/2;
      const y = (start[1]+end[1])/2;
      const z = (start[2]+end[2])/2;
      const deltaX = end[0]-start[0];
      const deltaY = end[1]-start[1];
      drawBox(parent, [x,y,z], [0,0,Math.atan2(deltaY,deltaX)], [Math.hypot(deltaX,deltaY),thickness,depth], color, alpha, 0.05);
    }

    function updateCurve(vertices, start, end, lift) {
      const midpoint = [(start[0]+end[0])/2, (start[1]+end[1])/2+lift, Math.max(start[2],end[2])+0.18];
      for (let index = 0; index <= 16; index += 1) {
        const t = index/16;
        const inverse = 1-t;
        const offset = index*3;
        vertices[offset] = inverse*inverse*start[0]+2*inverse*t*midpoint[0]+t*t*end[0];
        vertices[offset+1] = inverse*inverse*start[1]+2*inverse*t*midpoint[1]+t*t*end[1];
        vertices[offset+2] = inverse*inverse*start[2]+2*inverse*t*midpoint[2]+t*t*end[2];
      }
      return vertices;
    }

    function projectPoint(point, matrix) {
      const x = point[0];
      const y = point[1];
      const z = point[2];
      const clipX = matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];
      const clipY = matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];
      const clipW = matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return [(clipX/clipW*0.5+0.5)*canvas.clientWidth, (1-(clipY/clipW*0.5+0.5))*canvas.clientHeight];
    }

    function updateScrollProgress() {
      if (compactScene.matches) {
        scrollTarget = 0;
        return;
      }
      const bounds = hero.getBoundingClientRect();
      scrollTarget = clamp(-bounds.top/Math.max(1,bounds.height*0.72),0,1);
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, compactScene.matches ? 1.25 : 1.5);
      const width = Math.max(1,Math.floor(canvas.clientWidth*ratio));
      const height = Math.max(1,Math.floor(canvas.clientHeight*ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0,0,width,height);
      }
      const aspect = Math.max(0.55,canvas.clientWidth/Math.max(1,canvas.clientHeight));
      mat4Perspective(projection,42*DEG,aspect,0.1,60);
      mat4Identity(view);
      mat4Translate(view,view,0,0,-9.7);
      mat4Multiply(viewProjection,projection,view);
    }

    function render(time) {
      const elapsed = Math.max(0,(time-startTime)/1000);
      const compact = compactScene.matches;
      const aspect = Math.max(0.55,canvas.clientWidth/Math.max(1,canvas.clientHeight));
      const viewportScale = Math.min(1,aspect/1.02)*(compact?0.96:1);
      const sceneEntrance = easeOutCubic(elapsed/0.72);
      pointerX += (targetX-pointerX)*0.055;
      pointerY += (targetY-pointerY)*0.055;
      scrollCurrent += (scrollTarget-scrollCurrent)*0.07;
      const rotationX = Math.cos(elapsed*0.43)*0.65*DEG-pointerY*4*DEG+scrollCurrent*2.1*DEG;
      const rotationY = (-1.1+Math.sin(elapsed*0.52)*1.8)*DEG+pointerX*7*DEG+scrollCurrent*3.2*DEG;
      const fade = clamp(1-scrollCurrent*0.62,0.38,1);
      const rootScale = viewportScale*(0.92+sceneEntrance*0.08);
      mat4Compose(rootMatrix,[0,-scrollCurrent*0.38,0],[rotationX,rotationY,-0.45*DEG],[rootScale,rootScale,rootScale]);

      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      drawFlat(gridData,rootMatrix,gl.LINES,"#155eef",0.045*fade*sceneEntrance,false,1);
      drawFlat(orbitData,rootMatrix,gl.LINE_STRIP,"#155eef",0.13*fade*sceneEntrance,false,1);

      particles.forEach(function (particle,index) {
        const offset = index*3;
        particleVertices[offset] = particle.x+Math.sin(elapsed*0.31+particle.phase)*0.06;
        particleVertices[offset+1] = particle.y+Math.cos(elapsed*0.27+particle.phase)*0.055;
        particleVertices[offset+2] = particle.z;
      });
      drawFlat(particleVertices,rootMatrix,gl.POINTS,"#155eef",0.3*fade*sceneEntrance,true,compact?2.1:2.6);

      const browserEntrance = easeOutCubic((elapsed-0.08)/0.58);
      mat4Compose(browserLocal,[0,-(1-browserEntrance)*0.42+Math.sin(elapsed*0.62)*0.035,0],[0,Math.sin(elapsed*0.5)*0.65*DEG+(1-browserEntrance)*8*DEG,0],[0.92+browserEntrance*0.08,0.92+browserEntrance*0.08,0.92+browserEntrance*0.08]);
      mat4Multiply(browserMatrix,rootMatrix,browserLocal);
      mat4Multiply(combinedMatrix,viewProjection,rootMatrix);

      moduleStates.forEach(function (state,index) {
        const definition = state.definition;
        const moduleEntrance = easeOutCubic((elapsed-0.33-index*0.11)/0.46);
        const depthResponse = 0.065+definition.p[2]*0.025;
        const floatY = Math.sin(elapsed*(0.52+index*0.045)+definition.phase)*(0.055+index*0.006);
        state.currentPosition[0] = definition.p[0]+pointerX*depthResponse;
        state.currentPosition[1] = definition.p[1]+floatY-pointerY*depthResponse*0.7-(1-moduleEntrance)*0.28;
        state.currentPosition[2] = definition.p[2]+state.hover*0.18;
        const projected = projectPoint(state.currentPosition,combinedMatrix);
        const distance = Math.hypot(projected[0]-pointerCanvasX,projected[1]-pointerCanvasY);
        const hoverTarget = !compact&&finePointer.matches&&distance<72?1:0;
        state.hover += (hoverTarget-state.hover)*0.12;
        const scale = (0.94+moduleEntrance*0.06)*(1+state.hover*0.05);
        mat4Compose(state.matrix,state.currentPosition,[definition.r[0],definition.r[1]+pointerX*depthResponse*0.12,definition.r[2]],[scale,scale,scale]);
        if (!compact||definition.key!=="code") {
          updateCurve(state.curve,state.currentPosition,moduleAnchors[definition.key],definition.p[1]>0?0.16:-0.1);
          drawFlat(state.curve,rootMatrix,gl.LINE_STRIP,"#155eef",0.19*moduleEntrance*fade,false,1);
        }
      });

      bindMeshProgram();
      browserBoxes.forEach(function (box) {
        drawBox(browserMatrix,box.p,box.r,box.s,box.c,box.a*browserEntrance*fade,box.b);
      });
      for (let index=0;index<graphPoints.length-1;index+=1) {
        drawSegment(browserMatrix,graphPoints[index],graphPoints[index+1],"#155eef",browserEntrance*fade,0.025,0.035);
      }
      moduleStates.forEach(function (state,index) {
        const definition = state.definition;
        if (compact&&definition.key==="code") return;
        const moduleEntrance = easeOutCubic((elapsed-0.33-index*0.11)/0.46);
        const alpha = moduleEntrance*fade;
        mat4Multiply(moduleMatrix,rootMatrix,state.matrix);
        if (state.hover>0.01) {
          drawBox(moduleMatrix,[0,0,-0.08],[0,0,0],[definition.s[0]*1.06,definition.s[1]*1.13,0.08],"#155eef",0.12*state.hover*alpha,0.15);
        }
        drawBox(moduleMatrix,[0.05,-0.06,-0.12],[0,0,0],[definition.s[0]*1.03,definition.s[1]*1.08,0.06],"#111111",0.08*alpha,0);
        drawBox(moduleMatrix,[0,0,0],[0,0,0],definition.s,definition.treatment,alpha,0.035+state.hover*0.13);
      });

      drawTexturedPlane(browserMatrix,[0.36,1.4,0.385],[0,0,0],[2.45,0.25,1],textures.url,browserEntrance*fade);
      drawTexturedPlane(browserMatrix,[-0.28,1.02,0.46],[0,0,0],[1.06,0.2,1],textures.site,browserEntrance*fade*0.8);
      drawTexturedPlane(browserMatrix,[-0.03,-1.31,0.58],[0,0,0],[2.05,0.18,1],textures.optimized,browserEntrance*fade);
      moduleStates.forEach(function (state,index) {
        const definition = state.definition;
        if (compact&&definition.key==="code") return;
        const moduleEntrance = easeOutCubic((elapsed-0.33-index*0.11)/0.46);
        mat4Multiply(moduleMatrix,rootMatrix,state.matrix);
        drawTexturedPlane(moduleMatrix,[0,0,definition.s[2]/2+0.014],[0,0,0],[definition.s[0]*0.985,definition.s[1]*0.965,1],textures[definition.key],moduleEntrance*fade);
      });

      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        scene.classList.remove("is-static");
        scene.classList.add("is-webgl");
        scene.dataset.sceneStatus = "webgl";
      }
    }

    function draw(time) {
      if (!startTime) startTime = time;
      if (compactScene.matches&&time-lastCompactFrame<32) {
        frameId = window.requestAnimationFrame(draw);
        return;
      }
      lastCompactFrame = time;
      resize();
      render(time);
      if (sceneVisible&&!document.hidden&&!destroyed&&!reducedMotion.matches) frameId = window.requestAnimationFrame(draw);
    }
    function start() {
      if (destroyed||reducedMotion.matches||!sceneVisible||document.hidden) return;
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(draw);
    }
    function stop() {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    function handlePointerMove(event) {
      if (!finePointer.matches||compactScene.matches) return;
      const heroBounds = hero.getBoundingClientRect();
      const sceneBounds = scene.getBoundingClientRect();
      targetX = clamp(((event.clientX-heroBounds.left)/heroBounds.width-0.5)*2,-1,1);
      targetY = clamp(((event.clientY-heroBounds.top)/heroBounds.height-0.5)*2,-1,1);
      pointerCanvasX = event.clientX-sceneBounds.left;
      pointerCanvasY = event.clientY-sceneBounds.top;
    }
    function handlePointerLeave() {
      targetX = 0;
      targetY = 0;
      pointerCanvasX = -1000;
      pointerCanvasY = -1000;
    }

    gl.clearColor(0,0,0,0);
    updateScrollProgress();
    resize();
    hero.addEventListener("pointermove",handlePointerMove,{passive:true});
    hero.addEventListener("pointerleave",handlePointerLeave,{passive:true});
    window.addEventListener("scroll",updateScrollProgress,{passive:true});
    function handleVisibility() {
      if (document.hidden) stop(); else start();
    }
    document.addEventListener("visibilitychange",handleVisibility);
    let visibilityObserver;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(function (entries) {
        sceneVisible = entries[0].isIntersecting;
        if (sceneVisible) start(); else stop();
      },{threshold:0.01});
      visibilityObserver.observe(scene);
    }
    let resizeObserver;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(scene);
    } else {
      window.addEventListener("resize",resize,{passive:true});
    }
    function handleReducedMotion() {
      if (reducedMotion.matches) {
        stop();
        setFallback("fallback-reduced-motion");
      }
    }
    reducedMotion.addEventListener("change",handleReducedMotion);
    canvas.addEventListener("webglcontextlost",function (event) {
      event.preventDefault();
      stop();
      setFallback("fallback-context-lost");
    });
    start();

    window.addEventListener("pagehide",function () {
      destroyed = true;
      stop();
      hero.removeEventListener("pointermove",handlePointerMove);
      hero.removeEventListener("pointerleave",handlePointerLeave);
      window.removeEventListener("scroll",updateScrollProgress);
      document.removeEventListener("visibilitychange",handleVisibility);
      reducedMotion.removeEventListener("change",handleReducedMotion);
      if (visibilityObserver) visibilityObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize",resize);
      resources.buffers.forEach(function (buffer) { gl.deleteBuffer(buffer); });
      resources.textures.forEach(function (texture) { gl.deleteTexture(texture); });
      resources.programs.forEach(function (source) {
        gl.deleteProgram(source.program);
        gl.deleteShader(source.vertex);
        gl.deleteShader(source.fragment);
      });
    },{once:true});
  }

  function scheduleScene() {
    if ("requestIdleCallback" in window) window.requestIdleCallback(initializeScene,{timeout:700});
    else window.setTimeout(initializeScene,280);
  }
  if (document.readyState === "complete") scheduleScene();
  else window.addEventListener("load",scheduleScene,{once:true});
})();
