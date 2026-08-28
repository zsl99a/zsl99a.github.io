#!/usr/bin/env node
/**
 * 同步 GitHub 数据至 assets/data/github.json
 * 由 .github/workflows/sync-github.yml 每小时运行（GITHUB_TOKEN，配额 1000/h），
 * 页面改为加载这份静态 JSON，访问者不再直连 api.github.com，彻底规避限流。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GH_USER = "zsl99a";
const TOKEN = process.env.GH_TOKEN || "";
const OUT = path.join(__dirname, "..", "assets", "data", "github.json");

const headers = { Accept: "application/vnd.github+json" };
if (TOKEN) headers.Authorization = "Bearer " + TOKEN;

async function fetchJSON(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
  return r.json();
}

async function main() {
  const u = await fetchJSON(`https://api.github.com/users/${GH_USER}`);
  const user = {
    login: u.login,
    avatar_url: u.avatar_url,
    bio: u.bio,
    location: u.location,
    hireable: u.hireable,
    created_at: u.created_at,
    public_repos: u.public_repos,
    followers: u.followers,
    following: u.following,
  };

  const repos = (
    await fetchJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`)
  ).map((r) => ({
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

  // 各原创仓库语言构成（字节），供项目卡片语言条与全局语言面板
  const languages = {};
  const originals = repos.filter((r) => !r.fork && r.name !== "zsl99a.github.io" && r.language);
  await Promise.all(
    originals.map(async (r) => {
      try {
        languages[r.name] = await fetchJSON(
          `https://api.github.com/repos/${GH_USER}/${r.name}/languages`
        );
      } catch (e) {
        console.warn("语言数据获取失败:", r.name, e.message);
      }
    })
  );

  // 最近公开动态
  const events = (
    await fetchJSON(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`)
  ).map((e) => ({
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

  const data = {
    generated_at: new Date().toISOString(),
    user,
    repos,
    languages,
    events,
  };

  // 数据未变化则不写入，避免每小时空提交
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  if (prev) {
    const a = structuredClone(data);
    const b = structuredClone(prev);
    delete a.generated_at;
    delete b.generated_at;
    if (JSON.stringify(a) === JSON.stringify(b)) {
      console.log("数据无变化，跳过写入");
      return;
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log(
    "已写入", OUT,
    "- 仓库数:", repos.length,
    "语言数:", Object.keys(languages).length,
    "事件数:", events.length
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});