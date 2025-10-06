import { Octokit } from "@octokit/rest";
import fs from "fs";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

const username = "Kenty-725"; // あなたのGitHubユーザー名

async function generate() {
  const user = await octokit.users.getByUsername({ username });
  const repos = await octokit.repos.listForUser({ username, per_page: 100 });

  // 言語割合集計
  const langCount = {};
  for (const repo of repos.data) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  }

  const langs = Object.entries(langCount)
    .map(([lang, count]) => `- ${lang}: ${count}`)
    .join("\n");

  // README内容
  const content = `
## 👋 ${user.data.name || username}

- 🌱 Joined GitHub ${new Date(user.data.created_at).getFullYear()}年
- 📊 Total Public Repos: ${user.data.public_repos}
- 🏙️ Location: ${user.data.location || "Unknown"}

### 📈 Top Languages
${langs}

![GitHub stats](https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=transparent)
`;

  fs.writeFileSync("README.md", content);
}

generate();
