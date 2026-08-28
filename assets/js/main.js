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

  /* ---------- 导航：滚动阴影 + 高亮（rAF 节流） ---------- */
  const nav = document.getElementById("nav");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let scrollTicking = false;
  const onScroll = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
    const y = window.scrollY + 120;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;
    navLinks.forEach((a) =>
      a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id)
    );
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- 打字机 ---------- */
  const typedEl = document.getElementById("typed");
  const phrases = [
    "React / Vue / TypeScript 前端架构",
    "Rust(Axum·Tokio) 高并发系统",
    "微秒级高频交易系统构建者",
    "老旧系统重构 · 性能瓶颈攻坚",
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

  /* ---------- 滚动揭示 + 技能条 ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  const fillBars = (card) => {
    card.querySelectorAll(".bar-track i").forEach((i) => {
      i.style.width = (i.dataset.w || 0) + "%";
    });
  };

  const revealAll = () => {
    revealEls.forEach((el) => el.classList.add("in"));
    document.querySelectorAll(".skill-card").forEach(fillBars);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("in");
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
  } else {
    revealAll();
  }

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
      const max = 130 * dpr;
      const maxSq = max * max;
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
          const distSq = dx * dx + dy * dy;
          if (distSq < maxSq) {
            const dist = Math.sqrt(distSq);
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

  /* ---------- GitHub 实时统计（直连官方 API，无第三方图片依赖） ---------- */
  function renderGitHubStats() {
    const statsEl = document.getElementById("gh-stats");
    const langsEl = document.getElementById("gh-langs");
    if (!statsEl || !langsEl) return;
    const USER = "zsl99a";
    const esc = (s) =>
      String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const fail = (el, msg) => { el.innerHTML = '<span class="gh-err">' + esc(msg) + "</span>"; };

    Promise.all([
      fetch("https://api.github.com/users/" + USER, { headers: { Accept: "application/vnd.github+json" } }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch("https://api.github.com/users/" + USER + "/repos?per_page=100").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    ])
      .then(([u, repos]) => {
        const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        statsEl.innerHTML =
          '<h3>GitHub 概览</h3><div class="gh-metrics">' +
          '<div class="gh-metric"><b>' + u.public_repos + "</b><span>公开仓库</span></div>" +
          '<div class="gh-metric"><b>' + stars + "</b><span>累计 Star</span></div>" +
          '<div class="gh-metric"><b>' + u.followers + "</b><span>Followers</span></div>" +
          '<div class="gh-metric"><b>' + u.following + "</b><span>Following</span></div>" +
          "</div>";

        const counts = {};
        repos.forEach((r) => { const l = r.language; if (l) counts[l] = (counts[l] || 0) + 1; });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
        langsEl.innerHTML =
          "<h3>主要语言</h3>" +
          sorted
            .map(([name, n]) => {
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                '<div class="gh-lang"><div class="gh-lang-top"><span class="l-name">' + esc(name) +
                '</span><span class="l-pct">' + pct + "%</span></div>" +
                '<div class="gh-lang-bar"><i style="width:' + pct + '%"></i></div></div>'
              );
            })
            .join("");
      })
      .catch(() => {
        const msg = "GitHub 数据暂不可获取（网络或 API 限流）";
        fail(statsEl, msg);
        fail(langsEl, msg);
      });
  }
  renderGitHubStats();
})();
