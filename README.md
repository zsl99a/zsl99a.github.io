# 朱少林 · 个人主页

👋 欢迎来到我的 GitHub Pages 个人主页：**[https://zsl99a.github.io](https://zsl99a.github.io)**

基于真实简历与 GitHub 公开仓库数据构建的暗色「量化终端」风格单页站点。纯静态（HTML / CSS / JS），**无需构建步骤**，直接由 GitHub Pages 托管。

## 目录结构

| 文件 | 说明 |
|------|------|
| `index.html` | 主页（Hero / 关于 / 技能 / 经历 / 项目 / GitHub / 联系） |
| `assets/css/style.css` | 暗色霓虹主题样式、响应式布局、动画 |
| `assets/js/main.js` | 交互：粒子背景 / 打字机 / 滚动揭示 / 数字递增 / 技能条 |
| `assets/img/favicon.svg` | 站点图标 |
| `profile/README.md` | GitHub 个人首页 README（部署到 `zsl99a/zsl99a` 仓库） |
| `profile/.github/workflows/snake.yml` | 贡献蛇自动生成工作流 |

## 本地预览

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 部署

推送至 `main` 分支后，在仓库 **Settings → Pages** 中选择 `main` 分支根目录作为源即可（默认 `*.github.io` 仓库已开启）。
