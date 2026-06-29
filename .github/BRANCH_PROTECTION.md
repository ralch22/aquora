# Branch protection for `main` (owner action)

> ⚠️ Owner-gated: applying this rule needs repo-admin rights on `ralch22/aquora`.
> Until it's enabled, AO agents *can* open PRs but nothing forces review or a green build.

Recommended settings for `main` (Settings → Branches → Add rule, or via `gh`):

- **Require a pull request before merging** (no direct pushes to `main`).
- **Require status checks to pass**: `CI / storefront` and `CI / backend` (from `.github/workflows/ci.yml`).
- **Require branches to be up to date before merging**.
- **Require review from Code Owners** (uses `.github/CODEOWNERS`).
- Optionally: **Require linear history** and **Dismiss stale approvals**.

Apply via `gh` (requires admin token):

```bash
gh api -X PUT repos/ralch22/aquora/branches/main/protection \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.require_code_owner_reviews=true \
  -F 'required_status_checks.contexts[]=CI / storefront' \
  -F 'required_status_checks.contexts[]=CI / backend' \
  -F required_status_checks.strict=true \
  -F enforce_admins=false \
  -F restrictions=
```

> Note: the very first reconciliation push to `main` (WS0-PR1) was a direct push by design — it
> had to establish `main == production` before any PR flow could exist. Enable protection *after* that.
