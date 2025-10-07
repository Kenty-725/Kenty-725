import { Octokit } from "@octokit/rest";
import fs from "fs/promises";
import path from "path";

const username = "Kenty-725";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

async function generate() {
  const [userResponse, repos] = await Promise.all([
    octokit.users.getByUsername({ username }),
    octokit.paginate(octokit.repos.listForUser, {
      username,
      per_page: 100,
      sort: "updated",
    }),
  ]);

  const langCount = new Map();

  for (const repo of repos) {
    if (repo.fork || !repo.language) {
      continue;
    }

    const count = langCount.get(repo.language) ?? 0;
    langCount.set(repo.language, count + 1);
  }

  const topLanguages = Array.from(langCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([language]) => language);

  const replacements = {
    name: userResponse.data.name ?? username,
    username,
    location: userResponse.data.location ?? "Somewhere on Earth",
    joinedYear: new Date(userResponse.data.created_at).getFullYear(),
    topics:
      topLanguages.length > 0
        ? topLanguages.map((lang) => `#${lang}`).join(" · ")
        : "Always exploring new stacks",
  };

  const templatePath = path.resolve("README_template.md");
  const outputPath = path.resolve("README.md");

  const template = await fs.readFile(templatePath, "utf8");

  const content = template.replace(/{{(\w+)}}/g, (_, key) => {
    const value = replacements[key];
    return value !== undefined ? String(value) : "";
  });

  await fs.writeFile(outputPath, content);
}

generate().catch((error) => {
  console.error("Failed to generate README:", error);
  process.exitCode = 1;
});
