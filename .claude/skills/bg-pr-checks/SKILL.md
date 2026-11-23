---
name: bg-pr-checks
description: >-
  Take an open pull request to green. Watches its checks until they all finish, explains any failure
  from the real logs, plans a fix, applies it, commits and pushes to the same branch, then watches
  again. Use when the user says "check the PR", "monitor the checks", "is CI green", "CI failed",
  "fix the PR", or right after a pull request is opened. Never merges.
---

# bg-pr-checks

Get a pull request to green, honestly. Wait for every check, find the real cause of each failure, fix the cause, push, repeat. Stop when everything passes or when it needs the author.

## Steps

0. **Pick the PR and get a yes to push.** Use the number given, or the open PR for the current branch (`gh pr view --json number,state,headRefName,baseRefName`). Stop if the branch is `master` or the PR is closed or merged. Pushing fixes to the PR branch needs a clear yes from the author; if the request does not already say to commit and push, ask once with `AskUserQuestion`. A yes covers this PR's branch only, not other pushes.
1. **Wait for the checks to finish.** Do not poll in a loop or chain sleeps:

   ```sh
   gh pr checks <n> --watch --interval 20
   gh pr checks <n>
   ```

   Run the watch in the background or with a long timeout, as the harness requires. The final `gh pr checks <n>` is the truth: count passes, failures and anything still pending. If a workflow run is still queued or in progress, keep waiting.
2. **All green?** Report the count and the names, and stop. Do not merge, approve or mark ready here. Merging is the separate `bg-merge-pr` skill, and only on the author's yes for that PR.
3. **Find the real cause of every failure.** Read the evidence, never guess from the name:

   ```sh
   gh run view <run-id> --log-failed
   gh api repos/{owner}/{repo}/check-runs/<check-run-id>/annotations
   gh api "repos/{owner}/{repo}/code-scanning/alerts?pr=<n>&state=open"
   ```

   Group failures that share one cause. Say which kind each is:
   - a real bug in the change
   - a false alarm (for example a scanner rule matching a harmless pattern)
   - flaky or infrastructure (a network or runner error, a timeout)
   - already failing on `master` (check the latest `master` run before blaming the PR)
4. **Plan before changing anything.** In plain words: the root cause, the smallest fix, and how it will be proved. If the fix needs a judgment (skip, suppress or dismiss a check or alert, lower a threshold, add a dependency, change what the PR does), ask with `AskUserQuestion` and wait. Never weaken, skip or delete a check to get green; fix the cause.
5. **Reproduce and prove the fix locally** before pushing. Use the matching command from the table below. For a refactor made only to satisfy a scanner, test that behaviour did not change.
6. **Commit and push to the same branch.** One fix per commit. Stage only the files you changed: no `git add -A`, no sample files. Messages follow `CLAUDE.md`: a short subject and a plain-words body that says what changed and why, with no session link, no tool attribution, no notes about what was or was not checked, and nothing private. Use a plain `git push`. If the branch fell behind, rebase onto `origin/master`; never merge `master` into it. A rebased branch that was already pushed needs the author's yes for `--force-with-lease`, never plain `--force`.
7. **Watch again** from step 1 on the new run. Repeat.
8. **Know when to stop.** Try a flaky job once more with `gh run rerun <run-id> --failed`, then treat it as a real problem. Stop after three attempts at the same failure, or when the fix is the author's call, and report where things stand.
9. **Report:** green or not, with counts, then one line per round (what failed, why, what changed, the commit). Name anything left for the author.

## Reproducing a failure

| Failing check | Reproduce or investigate |
| --- | --- |
| Build and check links | `source ~/.rvm/scripts/rvm && rvm use ruby-$(cat .ruby-version) && INCLUDE_DRAFTS=1 bin/check` (the `bg-check` skill) |
| Lint markdown | `npx --yes markdownlint-cli2@0.24.0` |
| Lighthouse | `bin/site-health`; the pass marks are in `.lighthouserc.json` and are never lowered to pass |
| CodeQL | A failing `CodeQL` check beside passing `Analyze (…)` jobs means new alerts in changed code: read the annotation. It cannot be run locally; fix the pattern it names |
| Anything else | `gh run view <run-id> --log-failed`, then reproduce the failing step by hand |

## Rules

- Never merge, approve, close or reopen the PR, and never push to `master`.
- Never skip, weaken or delete a check, and never dismiss a code-scanning alert, without the author's explicit yes.
- Change only what the failure needs. Do not tidy unrelated code.
- The repository and its pull requests are public: nothing private in a commit message, PR title, PR body or comment.
- Do not rewrite the PR description unless asked; if a fix changes what the PR does, tell the author so they can update it.
- Follow `CLAUDE.md`, including asking the author for decisions with `AskUserQuestion`.
