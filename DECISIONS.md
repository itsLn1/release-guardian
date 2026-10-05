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