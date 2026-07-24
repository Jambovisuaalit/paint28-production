# CI validation

This branch exists only to validate the current Paint28 `main` implementation through a reviewable pull request.

Validation base commit:

```text
e8ce1f58ceb82465dc0e0d7af81c27b8d406e43a
```

Required checks:

- `lint-typecheck-build`
- `playwright-ui-smoke`

The pull request must remain unmerged until both checks are green and their logs are available.

Validation trigger: 2026-07-24.
