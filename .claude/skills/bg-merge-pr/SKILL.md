---
name: bg-merge-pr
description: >-
  Squash-merge a green pull request and confirm it deployed. Checks that the PR is really ready
  (checks passed, no comments or open alerts, up to date), merges with a plain squash message,
  watches the deploy, verifies the live site, and tidies the local branches. Use when the user says
  "merge the PR", "squash merge", "ship it", "deploy this PR" or "merge and deploy". Only with the
  author's yes for that PR, and never in a web session.
---

# bg-merge-pr

Merge one pull request, safely, and prove it went live. Merging is outward-facing and cannot be quietly undone, so every step has to be true before the merge happens.

## Steps

0. **Pick the PR and get the yes.** Use the number given, or the open PR for the current branch. Stop in a web (cloud) session: there the author merges in GitHub. Merging needs a clear yes for this PR. A request that already says to merge it once it is green counts; anything else needs one question with `AskUserQuestion` first. A yes covers this PR only.
1. **Prove it is ready.** All of these must hold, read from GitHub and not assumed:

   ```sh
   gh pr view <n> --json number,state,isDraft,baseRefName,headRefName,mergeStateStatus,reviewDecision,title
   gh pr checks <n>
   gh api repos/{owner}/{repo}/issues/<n>/comments --jq length
   gh api repos/{owner}/{repo}/pulls/<n>/comments --jq length
   gh api "repos/{owner}/{repo}/code-scanning/alerts?pr=<n>&state=open" --jq length
   ```

   - state is `OPEN`, not a draft, and the base is `master`
   - every check has passed; none is pending or failing (if some are pending, wait with `gh pr checks <n> --watch --interval 20` and a time limit; if one fails, stop and use the `bg-pr-checks` skill)
   - `mergeStateStatus` is `CLEAN`: no conflicts, and the branch is not behind `master`
   - no review is asking for changes, and there are no unresolved comments or open code-scanning alerts

   If the branch is behind, stop and say so. Rebase onto `origin/master` as `CLAUDE.md` describes; a force push of the rebased branch needs the author's yes.
2. **Write the squash message.** Subject: the PR title, then the PR number in brackets, like `Title (#<n>)`. Body: the Summary paragraph from the PR description, in plain words. Check the text first: no session links, no tool attribution, no notes about what was or was not checked, nothing private. The repository is public.
3. **Merge:**

   ```sh
   gh pr merge <n> --squash --delete-branch --subject "<title> (#<n>)" --body "<summary>"
   ```

   Then read the result back (`gh pr view <n> --json state,mergedAt,mergeCommit`). Do not report success until it says `MERGED`.
4. **Watch the deploy.** Find the run for the merge commit and wait for it, with a time limit:

   ```sh
   gh run list --branch master --limit 3 --json databaseId,name,status,conclusion,headSha
   gh run watch <databaseId> --exit-status
   ```

   Then check the live site: fetch the address from `url:` in `_config.yml`, expect `200`, and look for something the PR introduced (a new page, a changed string). If the deploy fails or the live page is wrong, stop and report with the evidence. Do not revert without the author's yes.
5. **Tidy up locally.** `git switch master && git pull --ff-only`. Delete the merged local branch. A squash merge gives new commit IDs, so `git branch -d` refuses; first prove nothing is lost (`git merge-tree --write-tree master <branch>` gives the same tree as `master`), then `git branch -D`. Make sure the remote branch is gone (`git fetch --prune`).
6. **Report:** the merge commit, the deploy result, what you checked live, and anything left over.

## Rules

- Never merge without a yes for that PR, never in a web session, and never more than the one PR asked for.
- Never use `--admin`, never skip or wait out a failing check, and never merge with something pending.
- Never push to `master` directly, and never force-push without the author's yes.
- Do not change the PR's content while merging. If something is wrong, stop and say so.
- Follow `CLAUDE.md`, including asking the author for decisions with `AskUserQuestion`.
