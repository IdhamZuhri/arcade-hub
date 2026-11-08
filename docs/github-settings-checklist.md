# GitHub settings checklist

Manual steps to do once on GitHub, in order. The site URL will be `https://<OWNER_USERNAME>.github.io/pixel-arcade/`.

- [ ] **1. Create the repo.** Create a public repository named exactly `pixel-arcade` (the base path depends on it). Before pushing, replace `@OWNER_USERNAME` (idham) and `@BROTHER_USERNAME` (axhad) with real usernames. They appear only in `.github/CODEOWNERS`. A missing user makes CODEOWNERS invalid, so the code-owner rule would not work. Make sure `package-lock.json` is committed. Push `main`.
- [ ] **2. Collaborators.** Settings → Collaborators → add axhad with **Write**. Everyone else stays Read and contributes through forks.
- [ ] **3. Labels.** Issues → Labels → New label: create `bug`, `enhancement` and `new-game`. The issue forms reference them.
- [ ] **4. Ruleset for `main`.** Settings → Rules → Rulesets → New ruleset → New branch ruleset. Name it `main`, set enforcement to Active and target the default branch. Enable:
  - Restrict deletions
  - Block force pushes
  - Require a pull request: 1 required approval, Require review from Code Owners, Dismiss stale pull request approvals when new commits are pushed
  - Require status checks to pass: add `ci`
  - Bypass list: add Repository admin and set it to **For pull requests only**
- [ ] **5. Actions.** Settings → Actions → General → Fork pull request workflows from outside collaborators: Require approval for first-time contributors. Workflow permissions: Read repository contents permission.
- [ ] **6. Pages.** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- [ ] **7. First deploy check.** Actions tab: `deploy` is green. Open the site: both cards (Pixel Quest, Pixel Brawl) show, both games load, and the back link returns to the hub.
- [ ] **8. Approval test.** Open a test PR as axhad and confirm it requires idham's approval.

## How approvals work (model C)

GitHub never lets a PR's author approve their own PR, so approvals are required but the repo owner can bypass.

- idham (Repository admin) is on the bypass list for pull requests only. He still opens PRs so CI runs, and can merge without an approval. He should wait for CI to pass first.
- axhad has no bypass. His PRs need approval from a code owner other than himself. idham is a code owner of `games/axhad/` and `packages/shared/` for this reason.
- Fork PRs from outsiders need one code-owner approval.

Trade-offs:

- idham's changes to `packages/shared` are not forced through axhad's review, so he should request it anyway.
- "Don't edit axhad's folder without asking" is a team rule for idham, not something GitHub enforces. axhad editing `games/idham/` does need idham's approval.
