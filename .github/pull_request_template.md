<!--
PR title format:  [SA-<n>] <type>: <short description>
Examples:
  [SA-36] feature: development branch workflow
  [SA-7] fix: auth password reset UX
Base branch: development (merge feature/fix PRs here). Release: development → main.
See CONTRIBUTING.md → Git branching model & Pull requests.
-->

## Summary

<!-- What changed and why. Link issues: Closes #123 or Refs #123 -->

## Screenshots / screen recording

<!-- UI: before & after. API or docs only: write N/A or paste curl/logs if useful. -->

## Testing

<!-- List what you ran and the result (passed / failed / not run + reason). -->

- [ ] `pre-commit run --all-files` (or equivalent hooks on commit)
- [ ] `cd frontend && npm run lint` (skip if no frontend changes — note N/A)
- [ ] `cd backend && pytest tests/ -q` (skip if no backend logic changes — note N/A)
- [ ] Manual smoke test (describe briefly, or N/A)

**Outcome (required):** e.g. “All checked passed” or “pytest not run (markdown only).”

## Notes for reviewers

<!-- Env/schema changes, follow-ups, risks, anything non-obvious. -->
