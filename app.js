const root = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initTheme();
initNavigation();
initReveal();
initFilters();

if (!prefersReducedMotion) {
  initHeroParticles();
  initCursorGlow();
  initVisualizer();
} else {
  initVisualizer(true);
}

function initTheme() {
  const stored = localStorage.getItem("portfolio-theme");
  const fallback = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const theme = stored || fallback;
  root.dataset.theme = theme;

  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    localStorage.setItem("portfolio-theme", nextTheme);
  });
}

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("[data-nav-links]");
  const anchors = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const sections = anchors
    .map(anchor => document.querySelector(anchor.getAttribute("href")))
    .filter(Boolean);

  toggle?.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  anchors.forEach(anchor => {
    anchor.addEventListener("click", event => {
      event.preventDefault();
      links?.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
      
      const targetId = anchor.getAttribute("href");
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const headerHeight = document.querySelector(".site-header")?.offsetHeight || 76;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    anchors.forEach(anchor => {
      anchor.classList.toggle("active", anchor.getAttribute("href") === `#${visible.target.id}`);
    });
  }, { rootMargin: "-35% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] });

  sections.forEach(section => observer.observe(section));
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  elements.forEach(el => observer.observe(el));
}

function initFilters() {
  const buttons = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-category]");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      buttons.forEach(item => item.classList.toggle("active", item === button));
      cards.forEach(card => {
        const categories = card.dataset.category.split(/\s+/);
        card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
      });
    });
  });
}

function initHeroParticles() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const pointer = { x: 0, y: 0, active: false };
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = createParticles(Math.max(42, Math.floor((width * height) / 18000)), width, height);
  };

  canvas.parentElement.addEventListener("pointermove", event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  canvas.parentElement.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    drawHeroNetwork(ctx, particles, pointer, width, height);
    requestAnimationFrame(animate);
  };

  resize();
  window.addEventListener("resize", resize);
  animate();
}

function createParticles(count, width, height) {
  return Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    phase: index * 0.37,
  }));
}

function drawHeroNetwork(ctx, particles, pointer, width, height) {
  ctx.lineWidth = 1;
  for (const particle of particles) {
    if (pointer.active) {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 180) {
        particle.vx -= (dx / dist) * 0.018;
        particle.vy -= (dy / dist) * 0.018;
      }
    }

    particle.x += particle.vx + Math.sin(Date.now() * 0.0007 + particle.phase) * 0.08;
    particle.y += particle.vy + Math.cos(Date.now() * 0.0006 + particle.phase) * 0.08;
    particle.vx *= 0.988;
    particle.vy *= 0.988;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;
    particle.x = clamp(particle.x, 0, width);
    particle.y = clamp(particle.y, 0, height);
  }

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 135) continue;
      const alpha = (1 - dist / 135) * 0.32;
      ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for (const particle of particles) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.64)";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initCursorGlow() {
  const canvas = document.getElementById("cursor-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const points = [];
  let dpr = 1;
  let width = 0;
  let height = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  window.addEventListener("pointermove", event => {
    points.push({ x: event.clientX, y: event.clientY, age: 0 });
    if (points.length > 16) points.shift();
  });

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    points.forEach(point => {
      point.age += 1;
      const alpha = Math.max(0, 0.18 - point.age * 0.011);
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 90);
      gradient.addColorStop(0, `rgba(0, 242, 254, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(255, 8, 68, ${alpha * 0.45})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(point.x - 90, point.y - 90, 180, 180);
    });
    for (let i = points.length - 1; i >= 0; i -= 1) {
      if (points[i].age > 18) points.splice(i, 1);
    }
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function initVisualizer(staticMode = false) {
  const canvas = document.getElementById("rhythm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const modeButtons = document.querySelectorAll("[data-mode]");
  let mode = "logic";
  let dpr = 1;
  let width = 0;
  let height = 0;
  let pulses = [];
  let beat = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (staticMode) drawVisualizerFrame(ctx, width, height, pulses, mode, beat);
  };

  const trigger = (x = width * 0.5, y = height * 0.5) => {
    pulses.push({
      x,
      y,
      radius: 0,
      life: 1,
      mode,
      spin: Math.random() * Math.PI * 2,
    });
    if (pulses.length > 28) pulses.shift();
    if (staticMode) drawVisualizerFrame(ctx, width, height, pulses, mode, beat);
  };

  canvas.addEventListener("pointerdown", event => {
    const rect = canvas.getBoundingClientRect();
    trigger(event.clientX - rect.left, event.clientY - rect.top);
    canvas.focus();
  });

  canvas.addEventListener("keydown", event => {
    if (event.key === "Tab") return;
    const x = width * (0.25 + Math.random() * 0.5);
    const y = height * (0.25 + Math.random() * 0.5);
    trigger(x, y);
  });

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      modeButtons.forEach(item => item.classList.toggle("active", item === button));
      trigger(width * 0.5, height * 0.5);
    });
  });

  const animate = () => {
    beat += 0.016;
    drawVisualizerFrame(ctx, width, height, pulses, mode, beat);
    pulses = pulses
      .map(pulse => ({ ...pulse, radius: pulse.radius + (pulse.mode === "logic" ? 5.4 : 7.2), life: pulse.life - 0.014 }))
      .filter(pulse => pulse.life > 0);
    requestAnimationFrame(animate);
  };

  resize();
  window.addEventListener("resize", resize);
  trigger(width * 0.5, height * 0.5);
  if (!staticMode) animate();
}

function drawVisualizerFrame(ctx, width, height, pulses, mode, beat) {
  ctx.clearRect(0, 0, width, height);
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "rgba(0, 242, 254, 0.12)");
  background.addColorStop(0.48, "rgba(79, 172, 254, 0.07)");
  background.addColorStop(1, "rgba(255, 8, 68, 0.13)");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 24; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 24; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (mode === "logic") {
    drawLogicWave(ctx, width, height, beat);
  } else {
    drawRhythmWave(ctx, width, height, beat);
  }

  pulses.forEach(pulse => {
    if (pulse.mode === "logic") drawLogicPulse(ctx, pulse);
    else drawRhythmPulse(ctx, pulse);
  });
}

function drawLogicWave(ctx, width, height, beat) {
  ctx.strokeStyle = "rgba(0, 242, 254, 0.46)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 8) {
    const y = height * 0.5 + Math.sin(x * 0.028 + beat * 2.2) * 28 + Math.sin(x * 0.011) * 18;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawRhythmWave(ctx, width, height, beat) {
  ctx.strokeStyle = "rgba(255, 177, 153, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 8) {
    const y = height * 0.52 + Math.sin(x * 0.02 + beat * 4.4) * 42 + Math.cos(x * 0.04 + beat) * 12;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawLogicPulse(ctx, pulse) {
  ctx.strokeStyle = `rgba(0, 242, 254, ${pulse.life * 0.62})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i += 1) {
    const angle = pulse.spin + i * Math.PI * 0.25;
    const x = pulse.x + Math.cos(angle) * pulse.radius * 0.72;
    const y = pulse.y + Math.sin(angle) * pulse.radius * 0.72;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse.life * 0.48})`;
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

function drawRhythmPulse(ctx, pulse) {
  ctx.strokeStyle = `rgba(255, 8, 68, ${pulse.life * 0.48})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) {
    const t = i / 80;
    const angle = pulse.spin + t * Math.PI * 4;
    const r = pulse.radius * t;
    const x = pulse.x + Math.cos(angle) * r;
    const y = pulse.y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Click diagnostics
window.addEventListener("click", event => {
  console.log("Antigravity click debug - target element:", event.target);
});
