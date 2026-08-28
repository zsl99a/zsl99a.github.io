/* ========================================================
   zsl99a · 个人主页交互脚本
   - 打字机 / 粒子背景 / 滚动揭示 / 技能条 / 导航高亮 / 移动端菜单
   - GitHub 数据实时同步（直连官方 API + 动态图片），页面零写死数据
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
  let revealObserver = null;

  const fillBars = (card) => {
    card.querySelectorAll(".bar-track i").forEach((i) => {
      i.style.width = (i.dataset.w || 0) + "%";
    });
  };

  // 动态渲染出的元素也接入滚动揭示动画
  const observeReveal = (root) => {
    const els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (revealObserver) {
      els.forEach((el) => revealObserver.observe(el));
    } else {
      els.forEach((el) => el.classList.add("in"));
    }
  };

  const revealAll = () => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    document.querySelectorAll(".skill-card").forEach(fillBars);
  };

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("in");
          if (el.classList.contains("skill-card")) fillBars(el);
          if (el.classList.contains("skills-grid")) el.querySelectorAll(".skill-card").forEach(fillBars);
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.18 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    // 技能网格整体兜底（避免卡片未单独触发）
    const skillsGrid = document.querySelector(".skills-grid");
    if (skillsGrid) revealObserver.observe(skillsGrid);
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

  /* ========================================================
     GitHub 实时同步（直连官方 API，数字不写死）
     项目列表 / 统计面板 / 语言分布 / 统计条全部动态渲染；
     徽章与贡献图为服务端实时生成的动态图片。
     ======================================================== */
  const GH_USER = "zsl99a";
  const GH_HOME = "https://github.com/" + GH_USER;
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 精选仓库介绍（仅文案；Star / 语言 / 更新时间 / 仓库列表全部来自 API）
  const PROJ_DESC = {
    "zsl99a.github.io": "个人主页仓库：纯静态实现，GitHub 数据实时同步。",
    websocket: "高性能异步 WebSocket 客户端库：自动重连(指数退避)、心跳、消息路由、事件驱动，基于 Tokio。",
    netz: "高性能网络层（netz-core / netz-quic），面向低延迟通信与闪电网络方向的基础组件。",
    "quark-im": "基于 Rust 的即时通讯系统：消息处理模块、链路测速与路径查找，附时序图设计文档。",
    ztopic: '"Helium" 主题消息组件：Rust 消息中间件方向的探索。',
    nitrogen: "Rust 网络 / QUIC 工具库：workspace 结构（macro / quic / utils / extra），含 CI 工作流。",
    "oxygen-ui": "Leptos + Axum Rust 全栈 Web 模板：Rust 编译至 WASM 的前端工程化实践。",
    nvim: "个人 Neovim 配置：沉淀高频开发工作流与键位体系，提升日常编码效率。",
  };

  // GitHub 官方语言色（与代码仓库展示一致）
  const LANG_COLOR = {
    Rust: "#dea584",
    Lua: "#59a6d6",
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Go: "#00add8",
    Python: "#3572a5",
  };

  const fetchJSON = (url) =>
    fetch(url, { headers: { Accept: "application/vnd.github+json" } }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });

  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

  // 数字递增动画（尊重减少动效偏好）
  const animateNumber = (el, target) => {
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    const dur = 900;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- 项目卡片（动态渲染） ---------- */
  function renderProjects(repos) {
    const grid = document.getElementById("projects-grid");
    const loading = document.getElementById("projects-loading");
    if (!grid) return;
    if (loading) loading.remove();

    // 排除主页仓库自身与 fork；排序：有语言标识 > 精选描述 > Star > 更新时间
    const mine = repos
      .filter((r) => !r.fork && r.name !== "zsl99a.github.io")
      .sort((a, b) =>
        ((b.language ? 1 : 0) - (a.language ? 1 : 0)) ||
        ((PROJ_DESC[b.name] ? 1 : 0) - (PROJ_DESC[a.name] ? 1 : 0)) ||
        (b.stargazers_count - a.stargazers_count) ||
        (new Date(b.pushed_at) - new Date(a.pushed_at))
      )
      .slice(0, 6);

    grid.innerHTML = mine
      .map((r) => {
        const lang = r.language || "其他";
        const color = LANG_COLOR[lang] || "var(--accent-3)";
        const desc = PROJ_DESC[r.name] || r.description || "开源项目，持续迭代中。";
        return (
          '<a class="proj reveal" href="' + GH_HOME + "/" + r.name +
          '" target="_blank" rel="noopener">' +
          '<div class="proj-top"><h3>' + esc(r.name) + '</h3><span class="lang">' +
          '<i class="dot" style="background:' + color + '"></i>' + esc(lang) + "</span></div>" +
          "<p>" + esc(desc) + "</p>" +
          '<div class="proj-foot"><span class="star">★ ' + r.stargazers_count + "</span>" +
          '<span class="go">查看仓库 →</span></div></a>'
        );
      })
      .join("") +
      '<a class="proj reveal" href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">' +
      '<div class="proj-top"><h3>更多仓库 →</h3><span class="lang">GitHub</span></div>' +
      "<p>访问 GitHub 主页查看全部 " + repos.filter((r) => !r.fork).length + " 个原创仓库（含 fork 共 " + repos.length + " 个）。</p>" +
      '<div class="proj-foot"><span class="star">profile</span><span class="go">前往 →</span></div></a>';

    observeReveal(grid);
  }

  /* ---------- 统计面板 + 语言分布 + 统计条 ---------- */
  function renderGitHubStats(u, repos) {
    const statsEl = document.getElementById("gh-stats");
    const langsEl = document.getElementById("gh-langs");
    const stripEl = document.getElementById("gh-strip");
    if (!statsEl || !langsEl) return;

    const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const bio = u.bio ? '<p class="gh-bio">' + esc(u.bio) + "</p>" : "";

    statsEl.innerHTML =
      "<h3>GitHub 概览</h3>" + bio + '<div class="gh-metrics">' +
      '<div class="gh-metric"><b data-n="' + u.public_repos + '">0</b><span>公开仓库</span></div>' +
      '<div class="gh-metric"><b data-n="' + stars + '">0</b><span>累计 Star</span></div>' +
      '<div class="gh-metric"><b data-n="' + u.followers + '">0</b><span>Followers</span></div>' +
      '<div class="gh-metric"><b data-n="' + u.following + '">0</b><span>Following</span></div>' +
      "</div>";
    statsEl.querySelectorAll("b[data-n]").forEach((b) => animateNumber(b, +b.dataset.n));

    // 语言分布按仓库主语言计数（fork 不计入）
    const counts = {};
    repos.forEach((r) => { if (!r.fork) { const l = r.language; if (l) counts[l] = (counts[l] || 0) + 1; } });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    langsEl.innerHTML =
      "<h3>主要语言</h3>" +
      (sorted.length
        ? sorted
            .map(([name, n]) => {
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                '<div class="gh-lang"><div class="gh-lang-top"><span class="l-name">' + esc(name) +
                '</span><span class="l-pct">' + pct + "%</span></div>" +
                '<div class="gh-lang-bar"><i style="width:' + pct + '%"></i></div></div>'
              );
            })
            .join("")
        : '<span class="gh-loading">暂无数据</span>');

    // 动态统计条
    const topLang = sorted[0] ? sorted[0][0] : "—";
    const latest = repos
      .filter((r) => !r.fork && r.name !== "zsl99a.github.io")
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];
    stripEl.innerHTML =
      '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">📦 ' + u.public_repos + " 个公开仓库</a>" +
      '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">⭐ 累计 ' + stars + " Star</a>" +
      '<a href="' + GH_HOME + '" target="_blank" rel="noopener">👥 ' + u.followers + " Followers</a>" +
      '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">🦀 主力语言：' + esc(topLang) + "</a>" +
      (latest ? '<a href="' + GH_HOME + "/" + latest.name + '" target="_blank" rel="noopener">🚀 最近更新：' + esc(latest.name) + "</a>" : "");
  }

  /* ---------- 入口：拉取用户 + 仓库数据并渲染 ---------- */
  Promise.all([
    fetchJSON("https://api.github.com/users/" + GH_USER),
    fetchJSON("https://api.github.com/users/" + GH_USER + "/repos?per_page=100&sort=updated"),
  ])
    .then(([u, repos]) => {
      renderProjects(repos);
      renderGitHubStats(u, repos);
    })
    .catch(() => {
      document.querySelectorAll(".gh-loading").forEach((el) => {
        el.textContent = "同步失败，请稍后刷新重试";
      });
    });
})();