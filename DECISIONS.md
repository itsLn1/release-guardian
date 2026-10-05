# Release Guardian AI — Architecture Decisions

This file records important architectural decisions.

## ADR-001 — Demo First

Status: ACCEPTED

We will build a deterministic Demo Mode before implementing real Copado integrations.

Reason:

The hackathon demo must be reliable and should not depend on live API availability.

---

## ADR-002 — Adapter Architecture

Status: ACCEPTED

External systems will use interfaces/adapters.

Example:

CopadoService
    |
    +-- DemoCopadoService
    |
    +-- LiveCopadoService

Reason:

This allows us to replace demo implementations with real APIs later without rewriting the application.

---

## ADR-003 — Human Approval

Status: ACCEPTED

Production deployment must always require explicit human approval.

Reason:

The system is an AI release assistant, not an uncontrolled autonomous deployment system.

---

## ADR-004 — Explainable Risk

Status: ACCEPTED

Release readiness scores must be explainable.

The UI must show the factors that produced the score.

---

## ADR-005 — High-Level MCP Tools

Status: ACCEPTED

MCP should expose business-level operations such as:

- analyze_release
- calculate_release_risk
- recommend_tests
- diagnose_release_failure
- prepare_release_fix
- get_release_readiness
- deploy_release

Rather than exposing only low-level API wrappers.

---

## ADR-006 — ESM, NodeNext and package layout

Status: ACCEPTED

All packages are ESM (`"type": "module"`) using `module`/`moduleResolution` NodeNext, so relative imports use `.js` extensions. Packages export compiled output from `dist/` (built with `tsc -b` project references). Tests and typecheck resolve workspace packages to `src/` via Vitest aliases and `tsconfig.typecheck.json` paths, so they never need a prior build. Package builds use `"types": []`, so core cannot accidentally use Node globals.

Reason:

NodeNext output runs unchanged under Node (API, MCP server) and is also consumable by Vite. Source aliasing keeps the test loop fast.

---

## ADR-007 — Additions to MASTER_SPEC models; ApprovalService port

Status: ACCEPTED

The spec left a few gaps, resolved additively (no spec field removed or renamed):

- `ReleaseRun.contentVersion` and `ApprovalRequest.contentVersion` added. The spec requires content versioning (15.3, 24.2) but omitted the fields.
- `ReleaseSummary`, `ReleaseHistory` and `PriorFailure` defined (referenced by `CopadoService` but not specified).
- `ApprovalService` defined as a port in `core/ports` (`createRequest`, `recordDecision`, `assertDeployable`, `markConsumed`) so Copado implementations can verify approvals via an injected dependency (spec 11.4).
- Error classes live in `core`; `shared` holds only codes and plain types, keeping `shared` free of logic.

---

## ADR-008 — Phase 1 scope versus the spec's implementation appendix

Status: ACCEPTED

Phase 1 delivered the foundation plus models and ports (the user-requested scope), which MASTER_SPEC.md Appendix A spreads across phases 1-3. Zod schemas, fixtures, the in-memory run store and `container.ts` are deferred to Phase 2 because nothing consumes them yet.
