# docs/ — web-client

Scoped knowledge for this repository only. `../CLAUDE.md` is the entry point — read it first.

| Folder | Contains |
|---|---|
| [product/domain-slice.md](product/domain-slice.md) | The subset of `Forma.Claude`'s domain model this app displays — derived, non-authoritative |
| [features/](features/README.md) | One file per feature, produced by `../.claude/agents/` as it moves through the pipeline |

No `architecture/` or `engineering/` folder yet — this app has no owned architecture beyond UI composition and API-client wiring, and that wiring pattern will be decided by the first feature's Frontend Architect design rather than speculated up front (see `../CLAUDE.md` → Architecture).
