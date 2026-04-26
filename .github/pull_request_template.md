<!--
Title format: [SA-<n>] <Kind>/<Short Description>
Example branch: fix/SA-7-auth-password-reset-ux
Example title:  [SA-7] Fix/Auth Password Reset UX
See CONTRIBUTING.md → Pull requests for the full convention.
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
