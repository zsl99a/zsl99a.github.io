/* ========================================================
   zsl99a · 个人主页交互脚本
   - 打字机 / 粒子背景 / 滚动揭示 / 数字递增 / 技能条 / 导航高亮 / 移动端菜单
   ======================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 年份 ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 导航：滚动阴影 + 高亮 ---------- */
  const nav = document.getElementById("nav");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const onScroll = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
    const y = window.scrollY + 120;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;
    navLinks.forEach((a) =>
      a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id)
    );
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  /* ---------- 打字机 ---------- */
  const typedEl = document.getElementById("typed");
  const phrases = [
    "React / Vue / TypeScript 前端架构",
    "Rust(Axum·Tokio) 高并发系统",
    "微秒级高频交易系统构建者",
    "AI 辅助编程践行者",
    "既懂业务，又懂底层",
  ];
  if (typedEl && !reduceMotion) {
    let pi = 0, ci = 0, deleting = false;
    const tick = () => {
      const full = phrases[pi];
      typedEl.textContent = deleting ? full.slice(0, ci--) : full.slice(0, ci++);
      let delay = deleting ? 45 : 90;
      if (!deleting && ci > full.length) {
        delay = 1600; deleting = true;
      } else if (deleting && ci < 0) {
        deleting = false; ci = 0; pi = (pi + 1) % phrases.length; delay = 400;
      }
      setTimeout(tick, delay);
    };
    tick();
  } else if (typedEl) {
    typedEl.textContent = phrases[0];
  }

  /* ---------- 滚动揭示 + 数字递增 + 技能条 ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1400; const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const fillBars = (card) => {
    card.querySelectorAll(".bar-track i").forEach((i) => {
      i.style.width = (i.dataset.w || 0) + "%";
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        el.querySelectorAll(".stat-num[data-count]").forEach(animateCount);
        if (el.classList.contains("skill-card")) fillBars(el);
        if (el.classList.contains("skills-grid")) el.querySelectorAll(".skill-card").forEach(fillBars);
        io.unobserve(el);
      });
    },
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => io.observe(el));
  // 技能网格整体兜底（避免卡片未单独触发）
  const skillsGrid = document.querySelector(".skills-grid");
  if (skillsGrid) io.observe(skillsGrid);

  /* ---------- 粒子网络背景 ---------- */
  const canvas = document.getElementById("bg-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles, raf;
    const COUNT = 64;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
    };
    const init = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * dpr,
        vy: (Math.random() - 0.5) * 0.35 * dpr,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(54,224,200,.55)";
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          const max = 130 * dpr;
          if (dist < max) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(124,92,255," + (0.16 * (1 - dist / max)) + ")";
            ctx.lineWidth = dpr;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); init(); }, 200);
    });
    // 离开页面时暂停，省电
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }
})();
