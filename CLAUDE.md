# Working agreements for this repo

## Git

The user has asked for git management to be fully automated:

- Stage, commit, and push changes without asking for confirmation first.
- Write clear, descriptive commit messages (imperative summary line, body
  bullets for multi-part changes) — match the existing log style.
- Still avoid destructive/history-rewriting operations unless explicitly
  requested: no `--force` push, no `--amend` on already-pushed commits, no
  `reset --hard`. If a normal push is rejected (e.g. remote has diverged),
  stop and ask rather than force-pushing.
- Push to `main` on `origin` (the only remote) once a change is committed.
