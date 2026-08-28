#!/usr/bin/env node
/**
 * 构建期 GitHub 数据抓取脚本
 * 在 GitHub Actions 部署流程中执行，利用 GITHUB_TOKEN（每小时 1000~5000 次配额）
 * 生成 assets/data/github.json 供 GitHub Pages Artifact 部署，不向 Git 提交任何记录。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GH_USER = "zsl99a";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const OUT_DIR = path.join(__dirname, "..", "assets", "data");
const OUT_FILE = path.join(OUT_DIR, "github.json");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "GitHub-Pages-Build",
};
if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`${url} -> HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  console.log(`[build-data] 开始抓取用户 ${GH_USER} 的 GitHub 数据...`);

  // 1. 用户信息
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

  // 2. 仓库列表
  const reposRaw = await fetchJSON(
    `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`
  );
  const repos = reposRaw.map((r) => ({
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

  // 3. 原创仓库语言构成
  const languages = {};
  const originals = repos.filter(
    (r) => !r.fork && r.name !== "zsl99a.github.io" && r.language
  );
  await Promise.all(
    originals.map(async (r) => {
      try {
        languages[r.name] = await fetchJSON(
          `https://api.github.com/repos/${GH_USER}/${r.name}/languages`
        );
      } catch (e) {
        console.warn(`[build-data] 语言获取跳过: ${r.name} (${e.message})`);
      }
    })
  );

  // 4. 最近公开动态
  const eventsRaw = await fetchJSON(
    `https://api.github.com/users/${GH_USER}/events/public?per_page=30`
  );
  const events = eventsRaw.map((e) => ({
    type: e.type,
    created_at: e.created_at,
    repo: e.repo ? e.repo.name : "",
    payload: {
      commits: ((e.payload && e.payload.commits) || [])
        .slice(0, 3)
        .map((c) => ({ message: c.message })),
      ref_type: e.payload && e.payload.ref_type,
      ref: e.payload && e.payload.ref,
      action: e.payload && e.payload.action,
      number: e.payload && e.payload.number,
      issue:
        e.payload && e.payload.issue
          ? { number: e.payload.issue.number }
          : null,
      release:
        e.payload && e.payload.release
          ? { tag_name: e.payload.release.tag_name }
          : null,
    },
  }));

  const data = {
    generated_at: new Date().toISOString(),
    user,
    repos,
    languages,
    events,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data));
  console.log(
    `[build-data] 成功写入 ${OUT_FILE}（仓库数: ${repos.length}, 语言数: ${
      Object.keys(languages).length
    }, 事件数: ${events.length}）`
  );
}

main().catch((e) => {
  console.error("[build-data] 错误:", e);
  process.exit(1);
});
