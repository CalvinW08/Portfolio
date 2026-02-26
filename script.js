"use strict";


const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

(function setupTheme() {
  const root = document.documentElement;
  const switchEl = document.getElementById("themeSwitch");
  const saved = localStorage.getItem("theme");
  const current = saved || "dark";
  root.setAttribute("data-theme", current);
  if (switchEl) switchEl.checked = current === "light";

  function toggleTheme() {
    const next = switchEl && switchEl.checked ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }
  switchEl?.addEventListener("change", toggleTheme);

  
  window.__toggleTheme = () => {
    if (!switchEl) return;
    switchEl.checked = !switchEl.checked;
    switchEl.dispatchEvent(new Event("change"));
  };
})();


(function setupMobileNav() {
  const nav = document.querySelector(".nav");
  const btn = document.querySelector(".nav-toggle");
  const list = document.getElementById("primary-menu");
  if (!nav || !btn || !list) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  list.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest("a")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();


(function smoothAnchorScroll() {
  const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  if (!links.length) return;

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", href);
    });
  });
})();


(function setupScrollProgress() {
  const span = document.querySelector(".progress-bar span");
  if (!span) return;

  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    span.style.width = pct.toFixed(2) + "%";
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();


(function setupReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
})();


(function setupCardTilt() {
  if (prefersReducedMotion) return;
  const cards = document.querySelectorAll(".project");
  if (!cards.length) return;

  cards.forEach((card) => {
    let raf;
    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 10;
      const ry = (x - 0.5) * 12;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    }
    function onLeave() {
      card.style.transform = "";
    }
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("blur", onLeave);
  });
})();


(function setupProjectModal() {
  const modal = document.getElementById("projectModal");
  if (!modal) return;

  const titleEl = document.getElementById("modalTitle");
  const tagsEl = document.getElementById("modalTags");
  const descEl = document.getElementById("modalDesc");
  const linkEl = document.getElementById("modalLink");
  const closeBtn = modal.querySelector(".modal-close");
  const backdrop = modal.querySelector(".modal-backdrop");
  let lastFocus = null;

  function openModal(data = {}) {
    lastFocus = document.activeElement;
    if (titleEl) titleEl.textContent = data.title || "";
    if (descEl) descEl.textContent = data.description || "";

    if (tagsEl) {
      tagsEl.innerHTML = "";
      (data.tags || []).forEach((t) => {
        const span = document.createElement("span");
        span.textContent = t;
        tagsEl.appendChild(span);
      });
    }

    if (linkEl) {
      if (data.link && data.link !== "#") {
        linkEl.href = data.link;
        linkEl.style.display = "";
      } else {
        linkEl.style.display = "none";
      }
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  document.querySelectorAll(".project").forEach((card) => {
    function getData() {
      try {
        const raw = card.getAttribute("data-project") || "{}";
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    card.addEventListener("click", () => openModal(getData()));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(getData());
      }
    });
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });
})();


(function setupForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const status = document.getElementById("formStatus");
  const showError = (id, msg) => {
    const el = document.getElementById(`err-${id}`);
    if (el) el.textContent = msg;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (status) status.textContent = "";

    let valid = true;
    const name = form.name?.value?.trim() || "";
    const email = form.email?.value?.trim() || "";
    const message = form.message?.value?.trim() || "";

    showError("name", "");
    showError("email", "");
    showError("message", "");

    if (name.length < 2) {
      showError("name", "Please enter your name.");
      valid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showError("email", "Invalid email format.");
      valid = false;
    }
    if (message.length < 10) {
      showError("message", "Message must be at least 10 characters.");
      valid = false;
    }

    if (!valid) return;

    if (status) status.textContent = "Sending...";
    setTimeout(() => {
      if (status) status.textContent = "Message sent!";
      form.reset();
    }, 700);
  });
})();


(function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();


(function lavaLamp() {
  const reduced = prefersReducedMotion;

  let canvas = document.getElementById("lavaCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "lavaCanvas";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0",
      filter: "blur(28px) contrast(1.15) saturate(1.25) brightness(1.06)",
    });
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function applyBlendMode() {
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    canvas.style.mixBlendMode = theme === "light" ? "multiply" : "screen";
  }
  applyBlendMode();
  new MutationObserver(applyBlendMode).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* Perlin-ish noise */
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(hash, x, y) {
    switch (hash & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }
  function noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    );
  }

  const blobs = [];
  const COLORS = [
    [124, 92, 255],
    [34, 211, 238],
    [255, 99, 164],
  ];
  const BLOB_COUNT = 7;
  const BASE_RADIUS = 170;

  const mouse = { x: null, y: null, inside: false };

  function initBlobs() {
    blobs.length = 0;
    for (let i = 0; i < BLOB_COUNT; i++) {
      const [r, g, b] = COLORS[i % COLORS.length];
      blobs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: BASE_RADIUS * (0.6 + Math.random() * 1.0),
        baseR: BASE_RADIUS,
        nx: Math.random() * 500,
        ny: Math.random() * 500,
        rgb: [r, g, b],
      });
    }
  }

  function update() {
    const t = performance.now() * 0.0002;
    for (const b of blobs) {
      const n1 = noise2D(b.nx + t, b.ny);
      const n2 = noise2D(b.nx, b.ny + t);
      b.vx += n1 * 0.08;
      b.vy += n2 * 0.08;

      if (mouse.inside && mouse.x != null && mouse.y != null) {
        const dx = mouse.x - b.x;
        const dy = mouse.y - b.y;
        b.vx += dx * 0.0004;
        b.vy += dy * 0.0004;
      }

      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -250 || b.x > w + 250) b.vx *= -1;
      if (b.y < -250 || b.y > h + 250) b.vy *= -1;

      b.r = b.baseR * (0.8 + 0.12 * Math.sin((b.nx + t) * 2.4));

      b.vx *= 0.985;
      b.vy *= 0.985;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const b of blobs) {
      const [r, g, bl] = b.rgb;
      const grd = ctx.createRadialGradient(b.x, b.y, b.r * 0.2, b.x, b.y, b.r);
      grd.addColorStop(0, `rgba(${r},${g},${bl},0.55)`);
      grd.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  let raf;
  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function bindEvents() {
    window.addEventListener("resize", () => {
      resize();
      initBlobs();
      if (!reduced && !document.hidden) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else {
        draw();
      }
    }, { passive: true });

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.inside = true;
    });

    canvas.addEventListener("mouseleave", () => {
      mouse.inside = false;
      mouse.x = mouse.y = null;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(loop);
    });
  }

  resize();
  initBlobs();
  bindEvents();
  if (reduced) {
    draw();
  } else {
    raf = requestAnimationFrame(loop);
  }
})();


(function magneticButtons() {
  if (prefersReducedMotion) return;
  const btns = document.querySelectorAll(".btn");
  if (!btns.length) return;

  btns.forEach((btn) => {
    const strength = 25;
    function onMove(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    }
    function onLeave() {
      btn.style.transform = "";
    }
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
  });
})();


(function accentPulse() {
  if (prefersReducedMotion) return;
  let t = 0;
  function update() {
    t += 0.015;
    const amt = (Math.sin(t) + 1) / 2;
    const hue = 260 + amt * 40;
    document.documentElement.style.setProperty("--accent", `hsl(${hue}, 80%, 65%)`);
    requestAnimationFrame(update);
  }
  update();
})();


(function projectSearch() {
  const input = document.getElementById("projectSearch");
  const cards = document.querySelectorAll(".project");
  if (!input || !cards.length) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    cards.forEach((card) => {
      const data = (card.getAttribute("data-project") || "").toLowerCase();
      const text = (card.textContent || "").toLowerCase();
      const haystack = data + " " + text;
      card.style.display = haystack.includes(q) ? "" : "none";
    });
  });
})();


(function cursorOrbs() {
  if (prefersReducedMotion) return;
  let last = 0;
  const minDelta = 18; 
  const colors = ["var(--accent)", "var(--accent-2)"];

  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - last < minDelta) return;
    last = now;

    const orb = document.createElement("div");
    orb.className = "cursor-orb";
    orb.style.left = e.clientX + "px";
    orb.style.top = e.clientY + "px";
    orb.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(orb);
    setTimeout(() => orb.remove(), 600);
  }, { passive: true });
})();


(function minimap() {
  const map = document.getElementById("minimap");
  const sections = Array.from(document.querySelectorAll("main section"));
  if (!map || !sections.length) return;

  map.innerHTML = "";
  sections.forEach((s, i) => {
    const bar = document.createElement("div");
    bar.setAttribute("data-idx", String(i));
    bar.title = s.id || `Section ${i + 1}`;
    bar.addEventListener("click", () => {
      s.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    map.appendChild(bar);
  });

  const bars = Array.from(map.children);
  function update() {
    let idx = sections.findIndex((s) => s.getBoundingClientRect().top > 0) - 1;
    if (idx < 0) idx = 0;
    bars.forEach((b, i) => b.classList.toggle("active", i === idx));
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();


(function smartProjectSearch() {
  const btn = document.getElementById("smartSearchBtn");
  const modal = document.getElementById("smartSearchModal");
  const closeBtn = modal?.querySelector(".smart-close");
  const backdrop = modal?.querySelector(".smart-backdrop");
  const input = document.getElementById("smartQuery");
  const list = document.getElementById("smartResults");

  if (!btn || !modal || !input || !list) return;

  const open = () => {
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    input.focus();
  };
  const close = () => {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    input.value = "";
    list.innerHTML = "";
  };

  btn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  const cards = Array.from(document.querySelectorAll(".project"));
  const index = cards.map((card) => ({
    el: card,
    data: (card.getAttribute("data-project") || "").toLowerCase(),
    text: (card.textContent || "").toLowerCase(),
  }));

  function score(query, content) {
    let s = 0;
    query.split(/\s+/).forEach((word) => {
      if (!word) return;
      if (content.includes(word)) s += 1;
      if (content.startsWith(word)) s += 2;
      if (content === word) s += 3;
    });
    return s;
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    list.innerHTML = "";
    if (!q) return;

    const results = index
      .map((item) => ({ item, score: score(q, item.data + " " + item.text) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (results.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No matching projects found.";
      list.appendChild(li);
      return;
    }

    results.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = r.item.el.querySelector("h3")?.textContent || "Untitled Project";
      li.addEventListener("click", () => {
        r.item.el.scrollIntoView({ behavior: "smooth", block: "start" });
        close();
      });
      list.appendChild(li);
    });
  });
})();


(function copyToClipboard() {
  const boxes = document.querySelectorAll(".copy-box");
  if (!boxes.length) return;

  
  let live = document.getElementById("live-copy");
  if (!live) {
    live = document.createElement("div");
    live.id = "live-copy";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    Object.assign(live.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(1px, 1px, 1px, 1px)",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
    });
    document.body.appendChild(live);
  }

  boxes.forEach((box) => {
    if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "0");
    box.setAttribute("role", "button");

    box.addEventListener("click", (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest(".copy-btn")) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleCopy(box);
    });

    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCopy(box);
      }
    });
  });

  async function handleCopy(box) {
    const text =
      box.getAttribute("data-copy")?.trim() ||
      (box.querySelector(".copy-text")?.textContent || "").trim();

    if (!text) return;

    const success = await writeClipboard(text);

    if (success) {
      box.classList.add("copied");
      live.textContent = "Copied";
      setTimeout(() => {
        box.classList.remove("copied");
        live.textContent = "";
      }, 1200);
    } else {
      const prev = box.querySelector(".copy-badge");
      if (prev) prev.textContent = "Press Ctrl+C";
      box.classList.add("copied");
      live.textContent = "Copy failed. Press Control C to copy.";
      setTimeout(() => {
        if (prev) prev.textContent = "Copied!";
        box.classList.remove("copied");
        live.textContent = "";
      }, 1800);
      selectTextForManualCopy(box);
    }
  }

  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        
      }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  function selectTextForManualCopy(box) {
    const el = box.querySelector(".copy-text");
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
})();


(function headerElevationOnScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    header.classList.toggle("is-elevated", y > 48);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function navScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = navLinks
    .map((a) => {
      const sel = a.getAttribute("href");
      if (!sel) return null;
      const el = document.querySelector(sel);
      return el ? { id: sel, el, link: a } : null;
    })
    .filter(Boolean);
  if (!sections.length) return;

  function updateActive() {
    let activeId = sections[0].id;
    for (const s of sections) {
      const rect = s.el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.33) activeId = s.id;
    }
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === activeId));
  }
  updateActive();
  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
})();

(function backToTop() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn top-fab";
  btn.setAttribute("aria-label", "Back to top");
  btn.textContent = "↑";
  Object.assign(btn.style, {
    position: "fixed",
    right: "1rem",
    bottom: "1.2rem",
    zIndex: "50",
    opacity: "0",
    transform: "translateY(12px)",
    transition: "opacity .2s ease, transform .2s ease",
    pointerEvents: "none",
  });
  document.body.appendChild(btn);

  function update() {
    const show = window.scrollY > 400;
    btn.style.opacity = show ? "1" : "0";
    btn.style.transform = show ? "translateY(0)" : "translateY(12px)";
    btn.style.pointerEvents = show ? "auto" : "none";
  }
  update();
  window.addEventListener("scroll", update, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();


(function keyboardShortcuts() {
  const jump = (sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const focusSearch = () => {
    const input = document.getElementById("projectSearch");
    if (input) {
      input.focus();
      input.select?.();
    }
  };

  document.addEventListener("keydown", (e) => {
    
    const target = e.target;
    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    if (isFormField) return;

    switch (e.key.toLowerCase()) {
      case "p":
        jump("#projects");
        break;
      case "a":
        jump("#about");
        break;
      case "s":
        jump("#skills");
        break;
      case "c":
        jump("#contact");
        break;
      case "t":
        e.preventDefault();
        window.__toggleTheme?.();
        break;
      case "/":
        e.preventDefault();
        focusSearch();
        break;
      default:
        break;
    }
  });
})();






(function setupSkillBars() {
  const meters = document.querySelectorAll(".skill-meter");
  if (!meters.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateMeter(meter) {
    const target = Number(meter.getAttribute("data-percent") || 0);
    const fill = meter.querySelector(".skill-fill");
    const value = meter.querySelector(".skill-value");

    if (!fill || !value) return;

    
    if (reduced) {
      fill.style.width = clamp(target, 0, 100) + "%";
      value.textContent = clamp(target, 0, 100) + "%";
      meter.setAttribute("aria-valuenow", String(clamp(target, 0, 100)));
      return;
    }

    
    const start = 0;
    const end = clamp(target, 0, 100);
    const duration = 900; 
    let startTs = null;

    function step(ts) {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / duration); 
      
      const eased = 1 - Math.pow(1 - t, 3);
      const curr = Math.round(start + (end - start) * eased);
      fill.style.width = curr + "%";
      value.textContent = curr + "%";
      meter.setAttribute("aria-valuenow", String(curr));
      if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateMeter(entry.target);
          obs.unobserve(entry.target); 
        }
      });
    },
    { threshold: 0.35 }
  );

  meters.forEach((m) => io.observe(m));
})();




(function heroParallaxSmooth() {
  const hero = document.querySelector(".hero-content");
  if (!hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  let mouseX = 0, mouseY = 0;
  let currX = 0, currY = 0;

  function onMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 16;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 16;
  }

  function loop() {
    currX += (mouseX - currX) * 0.08;
    currY += (mouseY - currY) * 0.08;

    hero.style.transform = `translate(${currX}px, ${currY}px)`;
    requestAnimationFrame(loop);
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseleave", () => {
    mouseX = mouseY = 0;
  });

  loop();
})();