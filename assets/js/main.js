/* ========================================================
   zsl99a · 个人主页交互脚本
   - 打字机 / 粒子背景 / 滚动揭示 / 技能条 / 导航高亮 / 移动端菜单
   - GitHub 数据实时同步（直连官方 API + 动态图片），页面零写死数据
   ======================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 快捷复制支持 ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-copy");
      if (!val) return;
      const statusEl = btn.querySelector(".copy-status") || btn;
      const originalText = statusEl.textContent;
      const setCopied = () => {
        statusEl.textContent = "已复制 ✓";
        statusEl.classList.add("copied");
        setTimeout(() => {
          statusEl.textContent = originalText;
          statusEl.classList.remove("copied");
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(setCopied).catch(() => {});
      } else {
        const input = document.createElement("input");
        input.value = val;
        document.body.appendChild(input);
        input.select();
        try { document.execCommand("copy"); setCopied(); } catch (e) {}
        document.body.removeChild(input);
      }
    });
  });

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
    "6 年 React 前端架构与深度演进",
    "4 年 Rust + Axum 高性能后端实战",
    "2 年+ jQuery · Vue · 小程序生态沉淀",
    "Tokio 异步并发 · WebSocket 实时网关",
    "老旧系统现代化重构 · 性能瓶颈攻坚",
    "自研通用组件库 · 前端工程化基建",
    "先想清楚问题，再动手写代码",
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
     GitHub 实时同步（全部数据取自官方 REST API，页面零写死数字）
     - 精选项目：Star / Fork / Issue / 相对更新时间的仓库指标，语言构成条为仓库实际代码
     - 身份档案 + 统计面板 + 语言构成 + 最近公开动态 + 动态统计条
     ======================================================== */
  const GH_USER = "zsl99a";
  const GH_HOME = "https://github.com/" + GH_USER;
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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
    Shell: "#89e051",
    Makefile: "#427819",
  };

  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));
  const starsOf = (repos) => repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const forksOf = (repos) => repos.reduce((s, r) => s + (r.forks_count || 0), 0);

  const timeAgo = (iso) => {
    const s = Math.max(60, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600) return Math.round(s / 60) + " 分钟前";
    if (s < 86400) return Math.round(s / 3600) + " 小时前";
    if (s < 2592000) return Math.round(s / 86400) + " 天前";
    return Math.round(s / 2592000) + " 个月前";
  };

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

  // GitHub Popular Repositories 排序规则：Stars 降序 > Forks 降序 > 最新更新时间 降序
  const sortMine = (repos) =>
    repos
      .filter((r) => !r.fork && r.name !== "zsl99a.github.io" && r.name !== "zsl99a")
      .sort((a, b) =>
        (b.stargazers_count - a.stargazers_count) ||
        (b.forks_count - a.forks_count) ||
        (new Date(b.pushed_at) - new Date(a.pushed_at)) ||
        a.name.localeCompare(b.name)
      );

  /* ---------- 精选项目：卡片 + 语言构成条 + 仓库指标（语言数据由装配层提供） ---------- */
  function renderProjects(repos, langMap) {
    const grid = document.getElementById("projects-grid");
    const loading = document.getElementById("projects-loading");
    if (!grid) return;
    if (loading) loading.remove();
    const mine = sortMine(repos).slice(0, 5);

    grid.innerHTML =
      mine
        .map((r) => {
          const lang = r.language || "其他";
          const color = LANG_COLOR[lang] || "var(--accent-3)";
          const desc = r.description || "开源项目，持续迭代中。";
          const bytes = (langMap && langMap[r.name]) || {};
          const totalB = Object.values(bytes).reduce((a, b) => a + b, 0);
          const bar = totalB
            ? Object.entries(bytes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([l, b]) =>
                  '<i style="width:' + Math.round((b / totalB) * 100) + "%;background:" +
                  (LANG_COLOR[l] || "var(--accent-3)") + '" title="' + esc(l) + " " + Math.round((b / totalB) * 100) + '%"></i>'
                )
                .join("")
            : '<i style="width:100%;background:var(--border)"></i>';
          return (
            '<a class="proj reveal" href="' + GH_HOME + "/" + r.name +
            '" target="_blank" rel="noopener">' +
            '<div class="proj-top"><h3>' + esc(r.name) + '</h3><span class="lang">' +
            '<i class="dot" style="background:' + color + '"></i>' + esc(lang) + "</span></div>" +
            "<p>" + esc(desc) + "</p>" +
            '<div class="proj-langs" title="代码语言构成">' + bar + "</div>" +
            '<div class="proj-foot"><span class="star">★ ' + r.stargazers_count + "</span>" +
            "<span>⑂ " + r.forks_count + "</span>" +
              "<span>⚑ " + r.open_issues_count + "</span>" +
              '<span class="proj-age">' + timeAgo(r.pushed_at) + " 更新</span>" +
              '<span class="go">查看仓库 →</span></div></a>'
            );
          })
          .join("") +
          '<a class="proj reveal" href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">' +
          '<div class="proj-top"><h3>更多仓库 →</h3><span class="lang">GitHub</span></div>' +
          "<p>访问 GitHub 主页查看全部 " + repos.filter((r) => !r.fork).length +
          " 个原创仓库（含 fork 共 " + repos.length + " 个）。</p>" +
          '<div class="proj-foot"><span class="star">profile</span><span class="go">前往 →</span></div></a>';
      observeReveal(grid);
  }

  /* ---------- 身份档案 + 统计面板（同步渲染） ---------- */
  function renderProfile(u) {
    const el = document.getElementById("gh-profile");
    if (!el) return;
    el.innerHTML =
      "<h3>身份档案</h3><div class=\"gh-profile\">" +
      '<img class="gh-avatar" src="' + u.avatar_url + '&s=96" alt="头像" loading="lazy" />' +
      '<div class="gh-profile-txt"><b>' + esc(u.login) + "</b>" +
      (u.bio ? "<p>" + esc(u.bio) + "</p>" : "") +
      '<p class="gh-meta">' + (u.location ? "📍 " + esc(u.location) + " · " : "") +
      "入坑于 " + new Date(u.created_at).getFullYear() + " 年 · " +
      (u.hireable ? "🟢 可接合作" : "🔴 专注自研") + "</p></div></div>";
  }

  function renderStats(u, repos) {
    const el = document.getElementById("gh-stats");
    if (!el) return;
    const stars = starsOf(repos);
    const forks = forksOf(repos);

    el.innerHTML =
      "<h3>GitHub 概览</h3>" + '<div class="gh-metrics">' +
      '<div class="gh-metric"><b data-n="' + u.public_repos + '">0</b><span>公开仓库</span></div>' +
      '<div class="gh-metric"><b data-n="' + stars + '">0</b><span>累计 Star</span></div>' +
      '<div class="gh-metric"><b data-n="' + forks + '">0</b><span>累计 Fork</span></div>' +
      '<div class="gh-metric"><b data-n="' + u.followers + '">0</b><span>Followers</span></div>' +
      "</div>";
    el.querySelectorAll("b[data-n]").forEach((b) => animateNumber(b, +b.dataset.n));
  }

  /* ---------- 语言构成（按字节聚合代码，数据由装配层提供）+ 动态统计条 ---------- */
  function renderLangsAndStrip(u, repos, langMap) {
    const langsEl = document.getElementById("gh-langs");
    const stripEl = document.getElementById("gh-strip");
    if (!langsEl) return;

    const bytes = {};
    sortMine(repos).slice(0, 6).forEach((r) => {
      const m = (langMap && langMap[r.name]) || null;
      if (!m) return;
      Object.entries(m).forEach(([l, b]) => { bytes[l] = (bytes[l] || 0) + b; });
    });
    let sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!sorted.length) {
      // 降级：按仓库主语言计数
      const counts = {};
      repos.forEach((r) => { if (!r.fork && r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
      sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    }
    const total = sorted.reduce((s, [, n]) => s + n, 0);
    langsEl.innerHTML =
      "<h3>代码语言构成</h3>" +
      (sorted.length
        ? sorted
            .map(([name, n]) => {
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                '<div class="gh-lang"><div class="gh-lang-top"><span class="l-name">' +
                '<i class="dot" style="background:' + (LANG_COLOR[name] || "var(--accent-3)") + '"></i>' + esc(name) +
                '</span><span class="l-pct">' + pct + "%</span></div>" +
                '<div class="gh-lang-bar"><i style="width:' + pct + '%"></i></div></div>'
              );
            })
            .join("")
        : '<span class="gh-loading">暂无数据</span>');

    // 动态统计条
    const topLang = sorted[0] ? sorted[0][0] : "—";
    const latest = repos
      .filter((r) => !r.fork && r.name !== "zsl99a.github.io" && r.name !== "zsl99a")
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];
    if (stripEl) {
      stripEl.innerHTML =
        '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">📦 ' + u.public_repos + " 个公开仓库</a>" +
        '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">⭐ 累计 ' + starsOf(repos) + " Star</a>" +
        '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">⑂ 累计 ' + forksOf(repos) + " Fork</a>" +
        '<a href="' + GH_HOME + '" target="_blank" rel="noopener">👥 ' + u.followers + " Followers</a>" +
        '<a href="' + GH_HOME + '?tab=repositories" target="_blank" rel="noopener">🦀 主力语言：' + esc(topLang) + "</a>" +
        (latest ? '<a href="' + GH_HOME + "/" + latest.name + '" target="_blank" rel="noopener">🚀 最近更新：' + esc(latest.name) + "</a>" : "");
    }
  }

  /* ---------- 最近公开动态（events API，独立降级） ----------
     注意：/users/{user}/events 是该用户“自己做过的事”（WatchEvent = Star 了别人） */
  const EV_STYLE = {
    PushEvent: ["🔨", "推送代码至 "],
    CreateEvent: ["✨", "创建了 "],
    WatchEvent: ["⭐", "Star 了 "],
    ForkEvent: ["⑂", "Fork 了 "],
    IssuesEvent: ["🐛", "处理 Issue："],
    ReleaseEvent: ["📦", "发布版本："],
    PublicEvent: ["🎉", "开源了 "],
    PullRequestEvent: ["🔀", "提交 PR："],
    DeleteEvent: ["✂️", "删除了 "],
  };

  function renderActivity(evs) {
    const el = document.getElementById("gh-activity");
    if (!el) return;
    const items = [];
    let lastKey = null;
    for (const e of evs || []) {
      const rawRepo = typeof e.repo === "string" ? e.repo : (e.repo && e.repo.name) || "";
      const repo = rawRepo.replace(new RegExp("^" + GH_USER + "/"), "");
      // 仅 Star/Fork 类相邻重复合并，Push 每次保留
      const key = e.type + "|" + repo + (e.type === "PushEvent" ? "|" + e.created_at : "");
      if (key === lastKey) continue;
      lastKey = key;
      const style = EV_STYLE[e.type] || ["📌", "更新了 "];
      let text = style[1] + "<b>" + esc(repo || "GitHub") + "</b>";
      if (e.type === "PushEvent") {
        const commits = (e.payload && e.payload.commits) || [];
        text = (commits.length ? "推送 " + commits.length + " 次提交至 " : "推送了代码至 ") +
          "<b>" + esc(repo) + "</b>" +
          (commits[0] && commits[0].message ? "：" + esc(commits[0].message.replace(/\n.*/, "").slice(0, 42)) : "");
      } else if (e.type === "CreateEvent") {
        const t = e.payload && e.payload.ref_type;
        text = t === "repository"
          ? "创建了仓库 <b>" + esc(repo) + "</b>"
          : "在 <b>" + esc(repo) + "</b> 创建了 " + esc(e.payload && e.payload.ref ? e.payload.ref : "分支");
      } else if (e.type === "IssuesEvent" && e.payload && e.payload.issue) {
        text = "#" + e.payload.issue.number + " " + (e.payload.action || "更新") + "（<b>" + esc(repo) + "</b>）";
      } else if (e.type === "ReleaseEvent" && e.payload && e.payload.release) {
        text = "发布 " + esc(e.payload.release.tag_name) + "（<b>" + esc(repo) + "</b>）";
      }
      items.push({ text: text, time: timeAgo(e.created_at) });
      if (items.length >= 7) break;
    }
    el.innerHTML =
      "<h3>最近公开动态</h3>" +
      (items.length
        ? items
            .map((i) =>
              '<div class="gh-activity-item"><span class="a-txt">' + i.text +
              '</span><span class="a-time">' + i.time + "</span></div>"
            )
            .join("") +
          '<a class="gh-activity-more" href="' + GH_HOME + '" target="_blank" rel="noopener">前往 GitHub 主页 →</a>'
        : '<span class="gh-loading">暂无公开动态</span>');
  }

  /* ---------- 统一渲染入口 ---------- */
  function applyData({ user, repos, languages, events }) {
    renderProjects(repos, languages || {});
    renderProfile(user);
    renderStats(user, repos);
    renderLangsAndStrip(user, repos, languages || {});
    renderActivity(events || null);
  }

  /* ---------- 降级与直连：GitHub API 拉取 ---------- */
  async function fetchFromGitHub() {
    try {
      const [u, reposRaw, eventsRaw] = await Promise.all([
        fetch("https://api.github.com/users/" + GH_USER).then((r) => (r.ok ? r.json() : null)),
        fetch("https://api.github.com/users/" + GH_USER + "/repos?per_page=100&sort=updated").then((r) => (r.ok ? r.json() : [])),
        fetch("https://api.github.com/users/" + GH_USER + "/events/public?per_page=30").then((r) => (r.ok ? r.json() : [])),
      ]);

      if (!u && (!reposRaw || !reposRaw.length)) throw new Error("API Fetch failed");

      const user = u ? {
        login: u.login,
        avatar_url: u.avatar_url,
        bio: u.bio,
        location: u.location,
        hireable: u.hireable,
        created_at: u.created_at,
        public_repos: u.public_repos,
        followers: u.followers,
        following: u.following,
      } : {};

      const repos = (reposRaw || []).map((r) => ({
        name: r.name,
        description: r.description,
        fork: r.fork,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        open_issues_count: r.open_issues_count,
        pushed_at: r.pushed_at,
        html_url: r.html_url,
      }));

      const events = (eventsRaw || []).map((e) => ({
        type: e.type,
        created_at: e.created_at,
        repo: e.repo ? e.repo.name : "",
        payload: {
          commits: ((e.payload && e.payload.commits) || []).slice(0, 3).map((c) => ({ message: c.message })),
          ref_type: e.payload && e.payload.ref_type,
          ref: e.payload && e.payload.ref,
          action: e.payload && e.payload.action,
          number: e.payload && e.payload.number,
          issue: e.payload && e.payload.issue ? { number: e.payload.issue.number } : null,
          release: e.payload && e.payload.release ? { tag_name: e.payload.release.tag_name } : null,
        },
      }));

      const languages = {};
      const originals = repos.filter((r) => !r.fork && r.name !== "zsl99a.github.io" && r.language).slice(0, 10);
      await Promise.all(
        originals.map(async (r) => {
          try {
            const l = await fetch("https://api.github.com/repos/" + GH_USER + "/" + r.name + "/languages").then((res) => (res.ok ? res.json() : null));
            if (l) languages[r.name] = l;
          } catch (err) {}
        })
      );

      const data = { user, repos, languages, events };
      applyData(data);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    } catch (e) {
      if (!localStorage.getItem(CACHE_KEY)) {
        document.querySelectorAll(".gh-loading").forEach((el) => {
          el.textContent = "数据加载失败，请稍后刷新";
        });
      }
    }
  }

  /* ---------- 入口：优先本地缓存/静态文件，支持 API 优雅降级 ---------- */
  const CACHE_KEY = "zsl99a_gh_data";
  let hasRendered = false;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      applyData(JSON.parse(cached));
      hasRendered = true;
    }
  } catch (e) {}

  fetch("assets/data/github.json")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      applyData(data);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    })
    .catch(() => {
      if (!hasRendered) {
        fetchFromGitHub();
      }
    });
})();

/* ========================================================
   v2 视觉增强：滚动进度条 / 光标光晕 / 3D 倾斜卡片
   与上面原有逻辑解耦，失败互不影响；均尊重减少动效偏好
   ======================================================== */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 滚动进度条 ---------- */
  const pbar = document.getElementById("scroll-progress");
  if (pbar) {
    let pticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      pbar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      pticking = false;
    };
    window.addEventListener("scroll", () => {
      if (pticking) return;
      pticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 光标光晕（仅精细指针设备，平滑灵敏跟手） ---------- */
  const glow = document.getElementById("cursor-glow");
  if (glow && finePointer && !reduceMotion) {
    let tx = -999, ty = -999;
    let cx = -999, cy = -999;
    let running = false;

    const render = () => {
      const dx = tx - cx;
      const dy = ty - cy;
      cx += dx * 0.22;
      cy += dy * 0.22;

      glow.style.transform = "translate3d(" + (cx - 310) + "px," + (cy - 310) + "px,0)";

      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        requestAnimationFrame(render);
      } else {
        cx = tx;
        cy = ty;
        glow.style.transform = "translate3d(" + (cx - 310) + "px," + (cy - 310) + "px,0)";
        running = false;
      }
    };

    const move = (e) => {
      if (!glow.classList.contains("on")) glow.classList.add("on");
      tx = e.clientX;
      ty = e.clientY;
      if (cx < -500) {
        cx = tx;
        cy = ty;
        glow.style.transform = "translate3d(" + (cx - 310) + "px," + (cy - 310) + "px,0)";
      }
      if (!running) {
        running = true;
        requestAnimationFrame(render);
      }
    };

    const onLeave = () => {
      glow.classList.remove("on");
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", onLeave);
  }

  /* ---------- 3D 倾斜卡片（仅精细指针设备） ---------- */
  if (finePointer && !reduceMotion) {
    const cards = document.querySelectorAll(".tilt");
    cards.forEach((card) => {
      const R = 5;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + (px * R).toFixed(2) + "deg) rotateX(" + (-py * R).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }
})();
