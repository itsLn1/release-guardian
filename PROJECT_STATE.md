# Release Guardian AI — Project State

## Current Phase

PHASE 1 — FOUNDATION: COMPLETE. Next: PHASE 2 — Schemas, fixtures and run store.

## Overall Status

IN PROGRESS (foundation done; no product behaviour implemented yet)

## Completed

Phase 1 (foundation):

- npm workspaces monorepo: `packages/shared`, `packages/core` (apps/* added in later phases)
- Strict TypeScript (ESM, NodeNext, project references), Vitest, ESLint (flat config)
- `@release-guardian/shared`: all domain models from MASTER_SPEC.md section 10, evidence types (section 16), `ErrorCode`/`ErrorInfo`/`ToolResult` (section 18), `ReleaseGuardianMode`, and const lists for agent states, evidence types, risk factor ids, error codes
- `@release-guardian/core`:
  - Ports: `CopadoService`, `CrtService`, `AiService`, `ApprovalService`, `Clock`, `IdGenerator`, `ReleaseRunStore` (interfaces only)
  - Error classes + `toErrorInfo`
  - `resolveMode(env)` (defaults to demo, fails fast on invalid values)
  - `componentKey()`
  - Deterministic `FixedStepClock` and `SequentialIdGenerator`
- Guardrails: ESLint bans `Math.random`, `Date.now`, zero-arg `new Date()`, `process.env` in core; `tests/architecture.test.ts` enforces dependency rules (shared imports nothing external, core imports only shared, mode read only in config/container, no non-determinism in core)
- 38 tests passing; typecheck, lint, test, build all pass (`npm run verify`)

## Currently Working On

Nothing. Phase 1 is finished and committed.

## Next Task

PHASE 2: (1) Zod schemas in `packages/shared/src/schemas` for API/MCP payloads and fixture-validated models (update the architecture test to allow `zod` in shared); (2) scenario-001 JSON fixtures under `packages/core/src/demo/fixtures/scenario-001/` per MASTER_SPEC.md 26.2-26.3, with a loader that validates them against the schemas and fails fast; (3) `InMemoryReleaseRunStore` and the `createContainer(mode)` composition root skeleton (`container.ts`). Do NOT yet write Demo*Service classes, engines or the orchestrator.

Before Phase 5 (engines): resolve the open calibration items listed under Known Issues.

## Known Issues

- MASTER_SPEC.md 14.2: the `TEST_COVERAGE_GAP` row contains an unfinished formula ("see 14.3"). Use banded lookup tables calibrated to the golden values in 14.5.
- MASTER_SPEC.md 14.5 checkpoint B: `TEST_RESULTS` stays 60 despite two failures; the "distinct failure causes" rule must be defined when the risk engine is built.
- Dev toolchain installed at latest majors (TypeScript 6, ESLint 10, Vitest 5); versions are locked in `package-lock.json`.
- No git remote configured; commit author was set per-commit only.

## Important Decisions

See DECISIONS.md: ADR-006 (module system and package layout), ADR-007 (additions to spec models; ApprovalService port), ADR-008 (Phase 1 scope vs spec appendix).

## Last Completed Commit

Phase 1 foundation commit (see `git log`).

## Commands

- `npm run verify` — typecheck, lint, test, build
- `npm run typecheck | lint | test | build | clean`

## Notes

This project is being built as a demo-first CopadoCon hackathon POC.

Demo Mode comes first.

Live Copado integration will be implemented later.
