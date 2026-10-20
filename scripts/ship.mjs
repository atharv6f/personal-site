// One command to publish: build, test, strict checks, deploy to Cloudflare,
// then commit and push whatever changed.
// Usage: npm run ship                      (commit message "publish YYYY-MM-DD")
//        npm run ship -- "post: my title"  (your own commit message)
import { execSync, execFileSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const msg = process.argv[2] || `publish ${new Date().toISOString().slice(0, 10)}`;

run("npm run build");
run("npm test");
run("npm run check -- --strict");
run("npx wrangler deploy");

if (execSync("git status --porcelain").toString().trim()) {
  run("git add -A");
  execFileSync("git", ["commit", "-m", msg], { stdio: "inherit" });
}
run("git push -u origin HEAD");
