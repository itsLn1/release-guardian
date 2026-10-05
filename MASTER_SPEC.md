# Release Guardian AI — MASTER SPEC

> **Don't just deploy. Prove it's safe to deploy.**

| Field | Value |
|---|---|
| Project | Release Guardian AI |
| Event | CopadoCon 2026 Hackathon |
| Type | Demo-first proof of concept |
| Spec status | v1.0 — authoritative for implementation |
| Default mode | `RELEASE_GUARDIAN_MODE=demo` |

This document is the single source of truth for what Release Guardian AI is and how it is built. A fresh Claude session must be able to continue implementation from this file plus `CLAUDE.md`, `PROJECT_STATE.md`, `TODO.md`, and `DECISIONS.md`, without any prior conversation.

**How to read this spec:** Sections marked **MUST** are requirements. Sections marked **SHOULD** are strong defaults. Anything labelled **TBD-LIVE** is deliberately unspecified because it depends on real Copado/Salesforce API behaviour that has not been verified. Do not fill TBD-LIVE items in with guesses.

---

## Table of Contents

1. Product Overview
2. Problem Being Solved
3. Target Users
4. Hackathon Objective
5. Core User Journey
6. Complete Demo Scenario
7. Demo Mode vs Live Mode
8. System Architecture
9. Repository Structure
10. Domain Models
11. Copado Service Architecture
12. CRT Service Architecture
13. AI Service Architecture
14. Risk Engine
15. Release Readiness Engine
16. Evidence Model
17. Agent State Machine
18. MCP Tools
19. REST API Responsibilities
20. React UI Structure
21. VS Code Extension Responsibilities
22. Failure Diagnosis Flow
23. Remediation Flow
24. Human Approval Flow
25. Deployment Flow
26. Deterministic Demo Data
27. Testing Strategy
28. Security Considerations
29. Future Live Integrations
30. Five-Minute Hackathon Demo Script
31. Non-Goals
32. Architectural Constraints
33. Appendix A — Implementation Phases
34. Appendix B — Glossary

---

## 1. Product Overview

Release Guardian AI is an **AI-powered Salesforce release engineer**. Given a release (a set of user stories and their metadata changes), it:

1. Analyzes what changed.
2. Analyzes what those changes depend on and what depends on them.
3. Calculates an **explainable** release risk score.
4. Recommends the tests that matter for this specific change.
5. Runs those tests.
6. Validates the deployment against the target environment.
7. If something fails, diagnoses the root cause and prepares a remediation.
8. Re-validates and re-tests after remediation.
9. Asks a human for explicit approval.
10. Deploys.
11. Produces a **release evidence package** proving why the release was considered safe.

The product is positioned as a release *engineer*, not an autonomous deployer. The AI reasons, explains, and prepares. **Deterministic engines decide readiness. Humans approve production.**

### 1.1 Product principles

| Principle | Meaning |
|---|---|
| Evidence over opinion | Every readiness claim is backed by a recorded evidence item. |
| Explainable by default | Every score shows the factors that produced it. |
| Human in control | Production deployment is impossible without an explicit human approval record. |
| Demo first | The deterministic Demo Mode is the primary deliverable. |
| Adapter boundaries | External systems sit behind interfaces so Live Mode can replace Demo Mode later. |

---

## 2. Problem Being Solved

Salesforce releases fail late and expensively. Typical pain points:

- **Late discovery of missing dependencies.** A component references a field, class, or flow that was not included in the promotion. This is commonly discovered only during validation against a higher environment.
- **Unclear blast radius.** Teams do not know what else a changed shared class or field touches.
- **Test selection is guesswork.** Teams either run everything (slow) or run a hopeful subset (risky).
- **Opaque risk judgments.** "It feels risky" is not auditable.
- **Failure triage is manual.** Deployment error messages are read by hand, cross-referenced against the story, and fixed through trial and error.
- **No release evidence.** Approvers sign off without a consolidated, traceable record of what was checked.
- **Pressure to deploy.** Approvals are rushed because the information is scattered.

Release Guardian AI compresses this into one guided, evidence-backed workflow.

---

## 3. Target Users

| Persona | Needs | Primary surface |
|---|---|---|
| **Salesforce Developer** | Know before promoting whether a story is safe; quick diagnosis of failures | VS Code extension, dashboard |
| **Release Manager** (primary approver) | Clear readiness status, risk factors, evidence, an approve/reject decision | Dashboard |
| **QA Lead** | See which tests were recommended and why; see results | Dashboard |
| **Engineering Manager / Auditor** | Evidence package after the fact | Evidence export |
| **AI client users** (e.g. an MCP-capable assistant) | Ask for release analysis conversationally | MCP server |

The **demo audience** (hackathon judges) is treated as a secondary persona: they must understand value within seconds.

---

## 4. Hackathon Objective

Deliver a **polished, reliable, five-minute demo** that shows an end-to-end release journey, including a realistic failure and recovery, ending with human approval and an evidence package.

### 4.1 Success criteria

1. The full journey runs end to end with **no real Copado credentials** and **no network dependency**.
2. The demo is **deterministic**: same inputs, same outputs, every run.
3. The failure → diagnosis → remediation → success arc is clearly visible.
4. The risk score and its contributing factors are visible and understandable.
5. The human approval gate is visible and cannot be bypassed.
6. The evidence package can be viewed and exported.
7. The architecture visibly supports swapping to Live Mode (adapters).
8. The demo can be reset and re-run in under 5 seconds.

### 4.2 Priority order

1. Reliability of the demo
2. Clarity of the story
3. Visual polish
4. Architectural credibility (adapters, MCP, explainability)
5. Breadth of features

---

## 5. Core User Journey

```
Select release/story
      │
      ▼
Analyze changes ──► Analyze dependencies ──► Calculate risk ──► Recommend tests
      │
      ▼
Run tests ──► Validate deployment
                    │
          ┌─────────┴─────────┐
        PASS                FAIL
          │                   │
          │          Diagnose failure
          │                   │
          │          Prepare remediation ──► (user applies fix)
          │                   │
          │          Re-validate + re-run tests
          │                   │
          └─────────┬─────────┘
                    ▼
           Evaluate readiness
                    │
                    ▼
          Human approval request
              │            │
           APPROVE       REJECT ──► stop
              │
              ▼
           Deploy
              │
              ▼
     Generate release evidence
```

The 13 steps from `CLAUDE.md` map onto the states in [Section 17](#17-agent-state-machine).

---

## 6. Complete Demo Scenario

### 6.1 Narrative

**Company:** a fictional B2B company, "Northwind Equipment."
**Release:** `REL-2026-07` — "Discount Approval Enhancements."
**Story:** `US-1042` — "Require tiered approval for opportunity discounts above 20%."
**Pipeline (fictional, demo only):** `Dev → QA → UAT → Production`.
**Target environment of this release:** `Production`.
**Developer:** Priya (fictional). **Approver:** Marcus, Release Manager (fictional).

### 6.2 What the story changes (4 components in the story)

| # | Type | API Name | Change | Notes |
|---|---|---|---|---|
| 1 | ApexClass | `DiscountApprovalService` | Modified | New tier logic; reads `Opportunity.Discount_Tier__c` |
| 2 | ApexClass | `DiscountApprovalServiceTest` | Modified | Does **not** cover the new tier-3 branch |
| 3 | ApexTrigger | `OpportunityTrigger` | Modified | Calls the service on discount change |
| 4 | Flow | `Opportunity_Discount_Approval` | Modified | References `Opportunity.Discount_Tier__c` |

### 6.3 Planted problems (the demo's "gotchas")

| ID | Root cause | Where it appears |
|---|---|---|
| **RC-1** | `CustomField: Opportunity.Discount_Tier__c` exists in Dev but was **never added to the story**. It is a missing dependency. | Dependency analysis (warning), test run (2 failures), validation (error) |
| **RC-2** | `DiscountApprovalService` coverage is **62%**, below the policy threshold of **75%**, because the test class does not cover the new tier-3 branch. | Risk engine (coverage gap), validation (coverage failure) |

> Note: 75% is the Salesforce org-wide Apex coverage requirement for production deployments. The demo policy also applies 75% to changed classes as a configurable Release Guardian policy (see Section 15.2), not as a claim about Salesforce per-class behaviour.

### 6.4 Dependency picture

Changed components touch a shared utility `PricingUtils` (unchanged, used by 7 other classes). Blast radius = **9 impacted components**, of which 3 are flagged high-criticality (`OpportunityTrigger`, `QuoteSyncBatch`, `PricingUtils`). Full list in [Section 26](#26-deterministic-demo-data).

### 6.5 Step-by-step expected outcome

| Step | Expected result |
|---|---|
| Select release | `REL-2026-07` / `US-1042` loaded |
| Analyze changes | 4 changed components; 1 critical-path Apex class |
| Analyze dependencies | 9 impacted components; **1 missing dependency detected** (`Opportunity.Discount_Tier__c`) |
| Calculate risk | **69 / High** (before validation) |
| Recommend tests | 6 tests recommended (4 Apex, 2 CRT), each with a reason |
| Run tests | 4 pass, **2 fail** (both caused by RC-1) |
| Validate deployment | **FAILED**: missing field reference + coverage 62% < 75% |
| Risk recomputed | **74 / High** |
| Diagnose | Two root causes identified with evidence and confidence |
| Prepare remediation | Proposal: add the field to the story; add test method covering tier-3 |
| User applies remediation | Story updated (demo: fixture state transitions) |
| Re-validate + re-test | Validation **PASSED**; coverage **88%**; 6/6 tests pass |
| Risk recomputed | **48 / Medium** |
| Readiness | **READY_FOR_APPROVAL** (all gates satisfied) |
| Human approval | Marcus approves with a comment |
| Deploy | Deployment simulated; **SUCCEEDED** |
| Evidence | Evidence package generated, hash-sealed, exportable |

---

## 7. Demo Mode vs Live Mode

Controlled by `RELEASE_GUARDIAN_MODE` (`demo` | `live`). Default `demo`.

| Aspect | Demo Mode | Live Mode (future) |
|---|---|---|
| Copado | `DemoCopadoService` reading fixtures | `LiveCopadoService` calling real APIs |
| CRT | `DemoCrtService` reading fixtures | `LiveCrtService` |
| AI | `DemoAiService` (rule-based, canned) | `LiveAiService` (LLM-backed, optional) |
| Credentials | None | Required, from env / secret store |
| Network | None required | Required |
| Determinism | **Guaranteed** | Not guaranteed |
| Clock / IDs | Fixed clock, sequential IDs | Real clock, UUIDs |
| Failure behaviour | Scripted by scenario | Real |
| State | In-memory + optional JSON snapshot | TBD-LIVE (database later) |
| Approval | Same gate as Live | Same gate |

### 7.1 Rules

- Mode selection happens in **exactly one place**: the composition root (`createContainer(mode)`).
- Application code, engines, API, MCP, and UI **never** check the mode to alter behaviour. They depend only on interfaces.
- The UI MAY display a "DEMO MODE" badge, driven by the `/api/health` response.
- Demo logic **MUST NOT** appear outside `Demo*Service` classes and the fixtures directory.
- Live Mode in this hackathon is a **stub**: `LiveCopadoService` etc. may exist as classes that throw `NotImplementedError("Live mode not implemented")`. The `RELEASE_GUARDIAN_MODE=live` startup MUST fail fast with a clear message if live credentials are absent.

---

## 8. System Architecture

### 8.1 Logical view

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│  React Dashboard      VS Code Extension      MCP client (AI)    │
└──────────┬───────────────────┬──────────────────────┬───────────┘
           │ HTTP/JSON         │ HTTP/JSON            │ MCP (stdio)
           ▼                   ▼                      ▼
┌──────────────────────────────────┐   ┌──────────────────────────┐
│          REST API (apps/api)     │   │  MCP Server (apps/mcp)   │
│  thin: validation, routing,      │   │  thin: tool schemas,     │
│  serialization, SSE              │   │  calls core only         │
└──────────────────┬───────────────┘   └─────────────┬────────────┘
                   │                                 │
                   └──────────────┬──────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE (packages/core)                         │
│                                                                 │
│  ReleaseOrchestrator (agent state machine)                      │
│     ├─ RiskEngine            (pure, deterministic)              │
│     ├─ ReadinessEngine       (pure, deterministic)              │
│     ├─ TestRecommender       (pure, deterministic)              │
│     ├─ EvidenceService       (append-only evidence store)       │
│     ├─ ApprovalService       (human approval records)           │
│     └─ Ports (interfaces):                                      │
│          CopadoService  CrtService  AiService  Clock  IdGen     │
└──────────────────┬──────────────────────────────────────────────┘
                   │ implemented by
     ┌─────────────┼─────────────────────────────┐
     ▼             ▼                             ▼
 Demo*Service   Live*Service (stubs)         Fixtures (JSON)
```

### 8.2 Key architectural decisions (see also DECISIONS.md)

1. **Core library first.** All business logic lives in `packages/core`. API and MCP are thin adapters over the same `ReleaseOrchestrator`. This guarantees UI, MCP, and VS Code behave identically.
2. **Deterministic engines decide; AI explains.** The AI service narrates, diagnoses with structured output, and proposes remediation. It **never** sets the risk score, readiness status, or approval.
3. **Single process.** API + core run in one Node process. MCP server is a separate process that either imports core directly (demo) or calls the REST API. **Default: MCP calls the REST API** so state is shared with the dashboard during the demo (see 18.1).
4. **In-memory state.** No database in the hackathon scope. State is held in a `ReleaseRunStore` interface with an in-memory implementation.
5. **Server-Sent Events (SSE)** push step progress to the UI so the demo feels live. Polling is the documented fallback.

### 8.3 Technology choices

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Required by `CLAUDE.md` |
| Runtime | Node.js 20+ | LTS, native fetch |
| Workspace | npm workspaces | Simplest, no extra tooling |
| API | Express + Zod validation | Familiar, minimal |
| UI | React + Vite + Tailwind CSS | Preferred stack |
| Tests | Vitest | Shared across packages, fast |
| MCP | Official TypeScript MCP SDK (`@modelcontextprotocol/sdk`) | Verify current version at install time |
| VS Code ext | TypeScript, VS Code Extension API, webview/tree view | Minimal |
| Validation | Zod schemas in `packages/shared` | Single schema source for API/MCP |

> "Use simpler alternatives when they make the implementation more reliable" (CLAUDE.md). If any choice above causes friction, replace it and record an ADR.

---

## 9. Repository Structure

```
release-guardian-ai/
├── CLAUDE.md
├── MASTER_SPEC.md
├── PROJECT_STATE.md
├── TODO.md
├── DECISIONS.md
├── package.json                 # npm workspaces root
├── tsconfig.base.json
├── .env.example                 # RELEASE_GUARDIAN_MODE=demo
├── .gitignore
│
├── packages/
│   ├── shared/                  # Types + Zod schemas ONLY. No logic. No I/O.
│   │   └── src/
│   │       ├── models/          # domain types (Section 10)
│   │       ├── schemas/         # zod schemas for API/MCP payloads
│   │       ├── errors.ts        # error codes
│   │       └── index.ts
│   │
│   └── core/                    # All business logic
│       └── src/
│           ├── ports/           # CopadoService, CrtService, AiService, Clock, IdGenerator, ReleaseRunStore
│           ├── engines/
│           │   ├── risk/        # RiskEngine, factor calculators, policy
│           │   ├── readiness/   # ReadinessEngine, gates
│           │   └── tests/       # TestRecommender
│           ├── orchestrator/    # ReleaseOrchestrator, state machine, transitions
│           ├── evidence/        # EvidenceService, bundle builder, hasher, exporters
│           ├── approval/        # ApprovalService
│           ├── demo/            # Demo*Service implementations + scenario runner
│           │   ├── DemoCopadoService.ts
│           │   ├── DemoCrtService.ts
│           │   ├── DemoAiService.ts
│           │   └── fixtures/    # scenario JSON (Section 26)
│           ├── live/            # Live*Service stubs (throw NotImplemented)
│           ├── container.ts     # composition root: createContainer(mode)
│           └── index.ts
│
├── apps/
│   ├── api/                     # Express REST API + SSE
│   │   └── src/ (routes/, middleware/, server.ts)
│   ├── mcp-server/              # MCP tools (stdio)
│   │   └── src/ (tools/, server.ts)
│   ├── web/                     # React + Vite + Tailwind dashboard
│   │   └── src/ (pages/, components/, api/, hooks/, state/)
│   └── vscode-extension/        # Last priority
│       └── src/ (extension.ts, views/, commands/)
│
├── docs/
│   ├── demo-script.md           # copy of Section 30, kept in sync
│   └── api.md                   # optional, generated from schemas
│
└── scripts/
    ├── reset-demo.ts            # resets in-memory state via API
    └── verify-demo.ts           # runs the golden scenario headlessly
```

### 9.1 Dependency rules (MUST be enforced)

```
shared  ◄── core  ◄── api
                 ◄── mcp-server (via API client or core)
shared  ◄── web
shared  ◄── vscode-extension
```

- `shared` imports nothing from the repo.
- `core` imports only `shared`.
- `web` and `vscode-extension` **never** import `core`. They talk to the API only.
- Engines (`risk`, `readiness`, `tests`) import **no** ports. They are pure functions over data.

---

## 10. Domain Models

All defined in `packages/shared/src/models`. Use strong types, no `any`. Dates are ISO-8601 strings. IDs are strings.

```ts
// ---------- Release & change ----------
export type ReleaseStatus = 'DRAFT' | 'IN_PROGRESS' | 'READY' | 'DEPLOYED' | 'FAILED' | 'REJECTED';

export interface Release {
  id: string;                    // "REL-2026-07"
  name: string;
  targetEnvironmentId: string;   // "env-prod"
  stories: UserStory[];
  status: ReleaseStatus;
}

export interface UserStory {
  id: string;                    // "US-1042"
  title: string;
  description: string;
  author: string;
  components: MetadataComponent[];
}

export type MetadataType =
  | 'ApexClass' | 'ApexTrigger' | 'Flow' | 'CustomField'
  | 'CustomObject' | 'PermissionSet' | 'LightningComponentBundle' | 'ValidationRule';

export type ChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface MetadataComponent {
  type: MetadataType;
  apiName: string;               // "DiscountApprovalService"
  changeType: ChangeType;
  linesChanged?: number;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH';  // from classification rules
}

export interface Environment {
  id: string;
  name: string;
  kind: 'DEV' | 'QA' | 'UAT' | 'PRODUCTION';
}

// ---------- Dependencies ----------
export interface DependencyEdge {
  from: string;                  // component key "ApexClass:DiscountApprovalService"
  to: string;                    // component key
  kind: 'REFERENCES' | 'CALLS' | 'TRIGGERS' | 'READS_FIELD';
}

export interface DependencyAnalysis {
  releaseId: string;
  changed: string[];             // component keys
  impacted: ImpactedComponent[]; // downstream, NOT in the story
  missing: MissingDependency[];  // upstream required, NOT in the story / target
  edges: DependencyEdge[];
}

export interface ImpactedComponent {
  key: string;
  type: MetadataType;
  apiName: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

export interface MissingDependency {
  key: string;                   // "CustomField:Opportunity.Discount_Tier__c"
  requiredBy: string[];
  presentInTarget: boolean;
  severity: 'WARNING' | 'BLOCKER';
}

// ---------- Risk ----------
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  id: RiskFactorId;
  label: string;
  weight: number;                // integer, weights sum to 100
  score: number;                 // 0-100, higher = riskier
  contribution: number;          // weight * score / 100, 2 decimals
  explanation: string;           // human-readable, deterministic
  evidenceIds: string[];
}

export type RiskFactorId =
  | 'CHANGE_SCOPE' | 'METADATA_CRITICALITY' | 'DEPENDENCY_BLAST_RADIUS'
  | 'TEST_COVERAGE_GAP' | 'TEST_RESULTS' | 'DEPLOYMENT_VALIDATION' | 'HISTORICAL_HOTSPOT';

export interface RiskAssessment {
  releaseId: string;
  score: number;                 // 0-100 integer
  level: RiskLevel;
  factors: RiskFactor[];
  policyVersion: string;
  computedAt: string;
  trigger: string;               // e.g. "after-validation-failure"
}

// ---------- Tests ----------
export type TestKind = 'APEX' | 'CRT';
export type TestStatus = 'NOT_RUN' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface TestRecommendation {
  testId: string;
  name: string;
  kind: TestKind;
  reason: string;                // why it was recommended
  priority: 'MUST_RUN' | 'SHOULD_RUN';
  coversComponents: string[];
}

export interface TestResult {
  testId: string;
  name: string;
  kind: TestKind;
  status: TestStatus;
  durationMs: number;
  failureMessage?: string;
}

export interface TestRun {
  id: string;
  releaseId: string;
  attempt: number;
  results: TestResult[];
  coverage: CoverageSummary;
}

export interface CoverageSummary {
  perClass: { apiName: string; percent: number }[];
  overallPercent: number;
}

// ---------- Validation / deployment ----------
export type ValidationStatus = 'PASSED' | 'FAILED';

export interface DeploymentValidation {
  id: string;
  releaseId: string;
  attempt: number;
  status: ValidationStatus;
  errors: ValidationError[];
  coverage: CoverageSummary;
}

export interface ValidationError {
  code: string;                  // demo codes, e.g. "MISSING_REFERENCE", "COVERAGE_BELOW_THRESHOLD"
  component?: string;
  message: string;
}

export interface Deployment {
  id: string;
  releaseId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  approvalId: string;            // REQUIRED
  startedAt: string;
  finishedAt?: string;
}

// ---------- Diagnosis / remediation ----------
export interface Diagnosis {
  releaseId: string;
  rootCauses: RootCause[];
  generatedBy: 'AI' | 'RULES';
}

export interface RootCause {
  id: string;                    // "RC-1"
  summary: string;
  category: 'MISSING_DEPENDENCY' | 'COVERAGE_GAP' | 'TEST_FAILURE' | 'OTHER';
  confidence: number;            // 0..1
  supportingEvidenceIds: string[];
  affectedComponents: string[];
}

export interface RemediationPlan {
  id: string;
  releaseId: string;
  actions: RemediationAction[];
  risk: 'LOW' | 'MEDIUM';        // risk of applying the fix itself
  status: 'PROPOSED' | 'APPLIED' | 'REJECTED';
}

export interface RemediationAction {
  id: string;
  rootCauseId: string;
  kind: 'ADD_COMPONENT_TO_STORY' | 'ADD_TEST_METHOD' | 'OTHER';
  description: string;
  target: string;
  patchPreview?: string;         // text/diff shown to the user
}

// ---------- Readiness ----------
export type ReadinessStatus = 'BLOCKED' | 'NEEDS_ATTENTION' | 'READY_FOR_APPROVAL';

export interface ReadinessGate {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  detail: string;
  evidenceIds: string[];
}

export interface ReadinessReport {
  releaseId: string;
  status: ReadinessStatus;
  gates: ReadinessGate[];
  computedAt: string;
}

// ---------- Approval ----------
export interface ApprovalRequest {
  id: string;
  releaseId: string;
  readinessSnapshot: ReadinessReport;
  riskSnapshot: RiskAssessment;
  evidenceHash: string;          // hash of evidence at request time
  requestedAt: string;
}

export interface ApprovalDecision {
  id: string;
  requestId: string;
  decision: 'APPROVED' | 'REJECTED';
  decidedBy: string;             // human identity
  comment: string;
  decidedAt: string;
}

// ---------- Evidence ----------
// See Section 16.

// ---------- Orchestration ----------
export interface ReleaseRun {
  releaseId: string;
  state: AgentState;             // Section 17
  attempt: number;               // validation/test attempt counter (drives demo determinism)
  analysis?: ChangeAnalysis;
  dependencies?: DependencyAnalysis;
  risk?: RiskAssessment;
  recommendations?: TestRecommendation[];
  testRuns: TestRun[];
  validations: DeploymentValidation[];
  diagnosis?: Diagnosis;
  remediation?: RemediationPlan;
  readiness?: ReadinessReport;
  approvalRequest?: ApprovalRequest;
  approvalDecision?: ApprovalDecision;
  deployment?: Deployment;
  stepLog: StepLogEntry[];
}

export interface ChangeAnalysis {
  releaseId: string;
  componentCount: number;
  byType: Record<string, number>;
  highCriticalityCount: number;
  totalLinesChanged: number;
  summary: string;
}

export interface StepLogEntry {
  at: string;
  fromState: AgentState;
  toState: AgentState;
  message: string;
}
```

---

## 11. Copado Service Architecture

### 11.1 Port (interface)

`CopadoService` expresses **what Release Guardian needs**, not how Copado's API is shaped. **Do not model real Copado endpoints in this interface.** TBD-LIVE: mapping each method to real Copado APIs requires reading current official Copado documentation.

```ts
export interface CopadoService {
  listReleases(): Promise<ReleaseSummary[]>;
  getRelease(releaseId: string): Promise<Release>;
  getEnvironments(releaseId: string): Promise<Environment[]>;

  /** Changed components in the release/story, with classification. */
  getChanges(releaseId: string): Promise<MetadataComponent[]>;

  /** Dependency graph around the changed set. */
  getDependencies(releaseId: string): Promise<DependencyAnalysis>;

  /** Historical signals used by the risk engine (e.g. prior failures per component). */
  getHistory(releaseId: string): Promise<ReleaseHistory>;

  /** Check-only validation against the target environment. */
  validateDeployment(releaseId: string): Promise<DeploymentValidation>;

  /** Apply an approved remediation to the story/branch (non-production action). */
  applyRemediation(releaseId: string, plan: RemediationPlan): Promise<void>;

  /** Execute deployment. MUST reject without a valid approval id. */
  deploy(releaseId: string, approvalId: string): Promise<Deployment>;
  getDeployment(deploymentId: string): Promise<Deployment>;
}
```

### 11.2 Implementations

| Class | Behaviour |
|---|---|
| `DemoCopadoService` | Loads scenario fixtures. Behaviour keyed by `(operation, attempt)` from a `ScenarioScript`. Mutates an in-memory copy of the fixture when `applyRemediation` is called, so later calls reflect the fix. |
| `LiveCopadoService` | Stub that throws `NotImplementedError`. Documented in Section 29. |

### 11.3 Demo determinism mechanics

- A `ScenarioScript` declares outcomes per step and attempt. Example: `validateDeployment` attempt 1 → fixture `validation-1-failed.json`; attempt 2 → `validation-2-passed.json`.
- Attempt counters are **derived from the stored `ReleaseRun`**, not hidden in the service. The orchestrator passes state through, so reset = clearing the run.
- `applyRemediation` flips a flag in the in-memory scenario state (`remediationApplied = true`), which selects the "post-fix" fixtures. No randomness anywhere.

### 11.4 Safety rule

`deploy()` in **every** implementation MUST verify that `approvalId` refers to an `APPROVED` decision via the injected `ApprovalService`, and MUST throw `ApprovalRequiredError` otherwise. The orchestrator checks too (defence in depth).

---

## 12. CRT Service Architecture

CRT refers to Copado Robotic Testing. As with Copado, the port describes needs only; **TBD-LIVE** for real API mapping.

```ts
export interface CrtService {
  /** Catalog of available tests (Apex + CRT) relevant to a set of components. */
  listAvailableTests(components: string[]): Promise<AvailableTest[]>;

  /** Start a test run for the given tests. */
  runTests(releaseId: string, testIds: string[], attempt: number): Promise<TestRun>;

  getTestRun(runId: string): Promise<TestRun>;
}

export interface AvailableTest {
  testId: string;
  name: string;
  kind: TestKind;
  coversComponents: string[];
  historicalFlakiness: number;   // 0..1
}
```

| Class | Behaviour |
|---|---|
| `DemoCrtService` | Returns fixture test catalog; `runTests` returns attempt-keyed fixtures (attempt 1: 4 pass / 2 fail; attempt 2 after remediation: 6 pass). Simulated durations are fixed numbers. |
| `LiveCrtService` | Stub (`NotImplementedError`). |

Notes:
- Apex tests and CRT tests are unified under one `TestRun` model for the demo. In Live Mode they may come from different systems; the port deliberately hides that.
- Coverage is returned inside `TestRun` and `DeploymentValidation` as `CoverageSummary`.

---

## 13. AI Service Architecture

### 13.1 Role of AI

| AI MAY | AI MUST NOT |
|---|---|
| Explain a risk score in plain language | Set or alter the risk score |
| Diagnose failures from structured evidence | Declare a release "ready" |
| Propose remediation | Approve anything |
| Summarize evidence for the approver | Trigger deployment |
| Answer questions about the release | Invent evidence |

### 13.2 Port

All methods return **structured, schema-validated output**, not free text parsed by regex.

```ts
export interface AiService {
  explainRisk(input: { assessment: RiskAssessment; dependencies: DependencyAnalysis }): Promise<RiskNarrative>;

  diagnoseFailure(input: {
    release: Release;
    validation: DeploymentValidation;
    failedTests: TestResult[];
    dependencies: DependencyAnalysis;
    evidence: EvidenceItem[];
  }): Promise<Diagnosis>;

  proposeRemediation(input: { diagnosis: Diagnosis; release: Release }): Promise<RemediationPlan>;

  summarizeForApprover(input: { readiness: ReadinessReport; risk: RiskAssessment; evidence: EvidenceItem[] }): Promise<ApproverSummary>;
}

export interface RiskNarrative { headline: string; bullets: string[]; }
export interface ApproverSummary { headline: string; keyPoints: string[]; openConcerns: string[]; }
```

### 13.3 Implementations

**`DemoAiService`** is **rule-based and deterministic**. It maps inputs to canned narratives using templates and lookups (e.g. a validation error with code `MISSING_REFERENCE` plus a matching `MissingDependency` produces root cause `RC-1`). It MUST produce identical output for identical input and MUST NOT call any network service. It MAY be written as templates filled from the input data so it still reads as generated.

**`LiveAiService`** (future, optional): LLM-backed. Requirements when built:
- Output validated against Zod schemas; on failure fall back to `RULES` diagnosis.
- Every claim must cite `evidenceIds` that exist.
- Temperature low; prompts versioned.
- No secrets or customer metadata bodies sent without an explicit policy.

### 13.4 Honesty rule

Demo AI output is labelled in the UI with `generatedBy: 'RULES'` internally and presented in the UI as "AI analysis (Demo Mode)". The spec does not require pretending an LLM was called. The presentation script (Section 30) should say plainly that Demo Mode uses a deterministic analysis engine and that Live Mode plugs in a model.

---

## 14. Risk Engine

**Location:** `packages/core/src/engines/risk`. **Pure function**, no I/O, no clock access (clock passed in).

```ts
computeRisk(input: RiskInput, policy: RiskPolicy, now: string): RiskAssessment
```

### 14.1 Risk inputs

`RiskInput` = change analysis + dependency analysis + latest test run (optional) + latest validation (optional) + history.

### 14.2 Factors and weights (policy v1)

Weights sum to **100**. Each factor yields a score 0–100 (higher = riskier). Final score = `round(Σ weight × score / 100)` using round-half-up.

| Factor ID | Weight | Scoring rule (policy v1) |
|---|---:|---|
| `CHANGE_SCOPE` | 15 | Based on component count and lines changed: 1–2 comps → 10; 3–4 → 40; 5–8 → 60; >8 → 85. +5 per 100 lines changed beyond 200, capped at 100. |
| `METADATA_CRITICALITY` | 20 | Max criticality among changed components: HIGH → 85, MEDIUM → 50, LOW → 15. +0 otherwise. |
| `DEPENDENCY_BLAST_RADIUS` | 20 | Impacted components: 0 → 0; 1–3 → 30; 4–8 → 60; ≥9 → 80; +10 if any impacted is HIGH criticality (cap 100). |
| `TEST_COVERAGE_GAP` | 20 | For changed Apex classes: gap = `max(0, 75 − minChangedClassCoverage)`; score = `min(100, round(gap × 100 / 75 × 1.0))`… see 14.3 for the demo-calibrated rule. |
| `TEST_RESULTS` | 10 | No run yet → 60; any failure → 60 (+10 per additional failure, cap 100) ; all passed → 20 − (flakiness adjustments, min 0). |
| `DEPLOYMENT_VALIDATION` | 10 | Not run → 50; failed → 100; passed → 0. |
| `HISTORICAL_HOTSPOT` | 5 | Based on prior failed releases touching the same components: 0 prior → 0; 1 → 35; ≥2 → 70; plus 0–30 for high-churn components. |

### 14.3 Calibration note (IMPORTANT)

The exact numeric formulas for sub-scores are **policy data**, expressed in a versioned `RiskPolicy` object and unit tested. The demo requires specific factor scores; therefore implement each factor's calculator, then **calibrate** policy v1 constants so the golden scenario in 14.5 is reproduced exactly. If formulas and the golden values ever disagree, **the golden values in 14.5 win** and the formulas must be adjusted (and the adjustment recorded as an ADR). Do not hard-code the demo numbers inside the engine; they must emerge from the policy plus fixture inputs.

> A simpler acceptable approach, if calibration proves fiddly: a calculator may use banded lookup tables (e.g. coverage gap bands) instead of continuous formulas. Bands are easier to explain and test.

### 14.4 Levels

| Score | Level |
|---|---|
| 0–24 | LOW |
| 25–49 | MEDIUM |
| 50–74 | HIGH |
| 75–100 | CRITICAL |

### 14.5 Golden demo scores (MUST be reproduced)

**Checkpoint A — after analysis, before tests/validation → 69 / HIGH**

| Factor | Weight | Score | Contribution |
|---|---:|---:|---:|
| CHANGE_SCOPE | 15 | 40 | 6.00 |
| METADATA_CRITICALITY | 20 | 85 | 17.00 |
| DEPENDENCY_BLAST_RADIUS | 20 | 80 | 16.00 |
| TEST_COVERAGE_GAP | 20 | 75 | 15.00 |
| TEST_RESULTS | 10 | 60 | 6.00 |
| DEPLOYMENT_VALIDATION | 10 | 50 | 5.00 |
| HISTORICAL_HOTSPOT | 5 | 70 | 3.50 |
| **Total** | **100** | | **68.50 → 69** |

**Checkpoint B — after failed validation (tests: 2 failures) → 74 / HIGH**
Same as A except `DEPLOYMENT_VALIDATION` = 100 (contribution 10.00). Total 73.50 → **74**.
(`TEST_RESULTS` stays 60 in the demo: two failures would normally add +10, so policy v1 for this scenario treats failures from a single root cause as one. Implement via "distinct failure causes" or calibrate; see 14.3.)

**Checkpoint C — after remediation, re-validation, re-test → 48 / MEDIUM**

| Factor | Weight | Score | Contribution |
|---|---:|---:|---:|
| CHANGE_SCOPE | 15 | 45 | 6.75 |
| METADATA_CRITICALITY | 20 | 85 | 17.00 |
| DEPENDENCY_BLAST_RADIUS | 20 | 80 | 16.00 |
| TEST_COVERAGE_GAP | 20 | 15 | 3.00 |
| TEST_RESULTS | 10 | 20 | 2.00 |
| DEPLOYMENT_VALIDATION | 10 | 0 | 0.00 |
| HISTORICAL_HOTSPOT | 5 | 70 | 3.50 |
| **Total** | **100** | | **48.25 → 48** |

> Design intent: risk goes **down because of evidence** (coverage up, tests green, validation passed), while structural risk (criticality, blast radius) legitimately remains. The demo shows that "Medium" is an honest result, and that readiness is determined by gates, not by score alone.

### 14.6 Explainability requirements (ADR-004)

- Every `RiskFactor` has a human-readable `explanation` generated deterministically from inputs (e.g. "Minimum coverage among changed classes is 62%; policy threshold is 75%.").
- Every factor links `evidenceIds`.
- The UI MUST render the factor table, not only the total.
- The risk engine records **delta** between assessments so the UI can show "74 → 48: coverage gap −12.0, test results −4.0, validation −10.0, ...".

### 14.7 Risk policy

```ts
export interface RiskPolicy {
  version: string;               // "v1"
  weights: Record<RiskFactorId, number>;
  levelThresholds: { medium: number; high: number; critical: number };
  coverageThresholdPercent: number;   // 75
}
```

Policy is a plain constant in code for the hackathon. No admin UI.

---

## 15. Release Readiness Engine

**Location:** `packages/core/src/engines/readiness`. Pure function:

```ts
evaluateReadiness(input: ReadinessInput, policy: ReadinessPolicy, now: string): ReadinessReport
```

Readiness answers: **"Do we have the evidence required to ask a human to approve?"** It is distinct from risk. A medium-risk release can be ready; a low-risk release with no validation is not.

### 15.1 Gates (policy v1)

| Gate ID | Label | PASS when | FAIL when | PENDING when |
|---|---|---|---|---|
| `G1_CHANGES_ANALYZED` | Changes analyzed | Change analysis evidence exists | — | Not yet run |
| `G2_DEPENDENCIES_CLEAR` | Dependencies analyzed, no blocker missing | Analysis exists and no `BLOCKER` missing dependency (or all resolved) | A blocker missing dependency unresolved | Not yet run |
| `G3_RISK_ACCEPTABLE` | Risk below CRITICAL | Latest risk level ≠ CRITICAL | CRITICAL | No assessment |
| `G4_REQUIRED_TESTS_PASSED` | All MUST_RUN tests passed (latest run) | All passed | Any MUST_RUN failed | No run |
| `G5_COVERAGE_THRESHOLD` | Changed Apex coverage ≥ policy | min coverage ≥ 75 | below | No validation/run |
| `G6_VALIDATION_PASSED` | Latest deployment validation passed | PASSED | FAILED | Not run |
| `G7_NO_OPEN_REMEDIATION` | No unapplied remediation outstanding | None `PROPOSED` | — (treated as FAIL if a plan is PROPOSED and not applied) | — |
| `G8_EVIDENCE_COMPLETE` | Evidence bundle has all required types | Complete | Missing required types | — |

### 15.2 Status rules

- `BLOCKED`: any gate is `FAIL`.
- `NEEDS_ATTENTION`: no `FAIL`, at least one `PENDING`.
- `READY_FOR_APPROVAL`: all gates `PASS`.

Policy constants: `coverageThresholdPercent = 75` (shared with the risk policy). This is a **Release Guardian policy value**; for production deployments Salesforce itself enforces an org-wide 75% Apex coverage requirement, but this spec makes no claim about Salesforce's per-class rules beyond that.

### 15.3 Staleness rule

Evidence is tied to the release's **content version** (a fixture-defined `contentVersion` incremented by remediation). If the content version changes after evidence was recorded, that evidence is **stale**: gates depending on it revert to `PENDING`. This is why re-validation and re-test are mandatory after remediation.

### 15.4 Readiness never grants approval

`READY_FOR_APPROVAL` only enables the **request for approval** action. A human must still decide.

---

## 16. Evidence Model

Evidence is the audit trail. It is **append-only** and **hash-sealed**.

```ts
export type EvidenceType =
  | 'RELEASE_SELECTED' | 'CHANGE_ANALYSIS' | 'DEPENDENCY_ANALYSIS' | 'RISK_ASSESSMENT'
  | 'TEST_RECOMMENDATION' | 'TEST_RUN' | 'DEPLOYMENT_VALIDATION'
  | 'FAILURE_DIAGNOSIS' | 'REMEDIATION_PLAN' | 'REMEDIATION_APPLIED'
  | 'READINESS_REPORT' | 'APPROVAL_REQUEST' | 'APPROVAL_DECISION' | 'DEPLOYMENT_RESULT';

export interface EvidenceItem {
  id: string;                    // "ev-0001" (sequential in demo)
  releaseId: string;
  type: EvidenceType;
  title: string;
  summary: string;
  source: 'DEMO' | 'COPADO' | 'CRT' | 'RULES_ENGINE' | 'AI' | 'HUMAN';
  createdAt: string;
  contentVersion: number;
  payload: unknown;              // typed per EvidenceType via discriminated union in implementation
  supersedes?: string;           // id of an earlier item this replaces (never delete)
}

export interface EvidenceBundle {
  releaseId: string;
  generatedAt: string;
  items: EvidenceItem[];
  finalReadiness: ReadinessReport;
  finalRisk: RiskAssessment;
  approval?: ApprovalDecision;
  deployment?: Deployment;
  bundleHash: string;            // SHA-256 over canonical JSON of items + final snapshots
  hashAlgorithm: 'SHA-256';
}
```

### 16.1 Rules

1. Items are never mutated or deleted; corrections use `supersedes`.
2. Failures are **kept** in the evidence (the failed validation stays in the bundle). The story of failure and recovery is the point.
3. `bundleHash` is computed over **canonical JSON** (stable key ordering). In Demo Mode, with the fixed clock and sequential IDs, the hash is identical on every run, which is itself a useful determinism check in tests.
4. The hash is an **integrity indicator**, not a digital signature. Do not describe it as tamper-proof or legally non-repudiable.
5. `APPROVAL_REQUEST` records the evidence hash at request time; deployment verifies the approved snapshot still matches current content version.

### 16.2 Exports

| Format | Purpose |
|---|---|
| JSON | Machine-readable full bundle |
| Markdown | Human-readable release evidence report (primary demo artifact) |
| (stretch) PDF/HTML print view | Only if time allows |

### 16.3 Markdown report outline

1. Release summary and outcome
2. Risk timeline (A → B → C) with factor tables
3. Dependency findings
4. Tests recommended vs run, with results (both attempts)
5. Validation attempts (including failure)
6. Diagnosis and remediation
7. Readiness gates
8. Approval record (who, when, comment)
9. Deployment result
10. Integrity: bundle hash

---

## 17. Agent State Machine

The `ReleaseOrchestrator` is an explicit finite state machine. No hidden branching, no free-form LLM-driven control flow. The "agent" behaviour is orchestrated, deterministic steps that call engines and AI services for analysis.

### 17.1 States

```ts
export type AgentState =
  | 'IDLE'
  | 'RELEASE_SELECTED'
  | 'ANALYZING_CHANGES'
  | 'ANALYZING_DEPENDENCIES'
  | 'SCORING_RISK'
  | 'RECOMMENDING_TESTS'
  | 'RUNNING_TESTS'
  | 'VALIDATING_DEPLOYMENT'
  | 'DIAGNOSING_FAILURE'
  | 'PREPARING_REMEDIATION'
  | 'AWAITING_REMEDIATION_CONFIRMATION'
  | 'APPLYING_REMEDIATION'
  | 'EVALUATING_READINESS'
  | 'READY_FOR_APPROVAL'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'GENERATING_EVIDENCE'
  | 'COMPLETED'
  | 'BLOCKED'        // needs human attention outside the flow
  | 'REJECTED'
  | 'FAILED';        // unrecoverable error
```

### 17.2 Transition table

| From | Event | To | Notes |
|---|---|---|---|
| `IDLE` | `selectRelease` | `RELEASE_SELECTED` | |
| `RELEASE_SELECTED` | `start` | `ANALYZING_CHANGES` | |
| `ANALYZING_CHANGES` | done | `ANALYZING_DEPENDENCIES` | evidence: CHANGE_ANALYSIS |
| `ANALYZING_DEPENDENCIES` | done | `SCORING_RISK` | evidence: DEPENDENCY_ANALYSIS |
| `SCORING_RISK` | done | `RECOMMENDING_TESTS` | risk checkpoint A |
| `RECOMMENDING_TESTS` | done | `RUNNING_TESTS` | evidence: TEST_RECOMMENDATION |
| `RUNNING_TESTS` | done | `VALIDATING_DEPLOYMENT` | evidence: TEST_RUN (even if failures) |
| `VALIDATING_DEPLOYMENT` | validation passed & tests passed | `EVALUATING_READINESS` | |
| `VALIDATING_DEPLOYMENT` | validation failed OR tests failed | `DIAGNOSING_FAILURE` | risk recomputed (checkpoint B) |
| `DIAGNOSING_FAILURE` | done | `PREPARING_REMEDIATION` | evidence: FAILURE_DIAGNOSIS |
| `PREPARING_REMEDIATION` | done | `AWAITING_REMEDIATION_CONFIRMATION` | evidence: REMEDIATION_PLAN |
| `AWAITING_REMEDIATION_CONFIRMATION` | `confirmRemediation` (human) | `APPLYING_REMEDIATION` | |
| `AWAITING_REMEDIATION_CONFIRMATION` | `rejectRemediation` | `BLOCKED` | |
| `APPLYING_REMEDIATION` | done | `RUNNING_TESTS` | contentVersion++; attempt++; evidence: REMEDIATION_APPLIED |
| `EVALUATING_READINESS` | all gates PASS | `READY_FOR_APPROVAL` | risk checkpoint C recorded before this |
| `EVALUATING_READINESS` | any gate FAIL | `BLOCKED` or `DIAGNOSING_FAILURE` | see 17.3 |
| `READY_FOR_APPROVAL` | `requestApproval` | `AWAITING_APPROVAL` | evidence: APPROVAL_REQUEST |
| `AWAITING_APPROVAL` | `approve` (human) | `APPROVED` | evidence: APPROVAL_DECISION |
| `AWAITING_APPROVAL` | `reject` (human) | `REJECTED` | terminal |
| `APPROVED` | `deploy` | `DEPLOYING` | requires valid approval |
| `DEPLOYING` | success | `DEPLOYED` | |
| `DEPLOYING` | failure | `FAILED` | evidence: DEPLOYMENT_RESULT |
| `DEPLOYED` | auto | `GENERATING_EVIDENCE` → `COMPLETED` | |
| any | unrecoverable error | `FAILED` | |
| any | `reset` | `IDLE` | demo reset only |

### 17.3 Rules

- **Attempts:** the orchestrator caps remediation loops at **2** attempts (`maxAttempts`). After that: `BLOCKED`.
- **Auto-advance vs. pause:** the orchestrator exposes `runUntilPause(releaseId)`, which advances automatically through machine-driven states and **pauses** at `AWAITING_REMEDIATION_CONFIRMATION` and `AWAITING_APPROVAL` (human gates). This is the primary API for the UI and MCP.
- **Step pacing:** in the demo, each step MAY include a fixed `simulatedDelayMs` (e.g. 600–1200ms) purely for presentation. Delay values come from fixtures; a `DEMO_FAST=1` env flag disables delays for tests.
- **Idempotency:** re-sending an event that is not valid in the current state returns `InvalidTransitionError` (HTTP 409), never silently succeeds.
- **Persistence:** after every transition, the run is saved via `ReleaseRunStore`.
- **Events:** each transition emits an event consumed by SSE.

### 17.4 Diagram

```
IDLE → RELEASE_SELECTED → ANALYZING_CHANGES → ANALYZING_DEPENDENCIES → SCORING_RISK
 → RECOMMENDING_TESTS → RUNNING_TESTS → VALIDATING_DEPLOYMENT
        ├── pass ───────────────────────────────► EVALUATING_READINESS
        └── fail → DIAGNOSING_FAILURE → PREPARING_REMEDIATION
                     → AWAITING_REMEDIATION_CONFIRMATION (HUMAN)
                     → APPLYING_REMEDIATION → RUNNING_TESTS (attempt 2) ─┐
                                                                         │
EVALUATING_READINESS → READY_FOR_APPROVAL → AWAITING_APPROVAL (HUMAN) ◄──┘
   → APPROVED → DEPLOYING → DEPLOYED → GENERATING_EVIDENCE → COMPLETED
                    └── REJECTED (terminal)
```

---

## 18. MCP Tools

### 18.1 Principles (ADR-005)

- Tools are **business-level**, not API wrappers.
- Each tool has a Zod input schema and returns structured JSON plus a short human-readable `summary` string.
- The MCP server holds **no business logic**. Default topology: MCP server → REST API (so the dashboard and an AI client see the same run). Alternative: import core directly for isolated use; both must behave identically.
- **No MCP tool can grant approval.** Approval is human-only (see 24 and 28).
- Transport: stdio. TBD: exact SDK API shape; verify against the installed `@modelcontextprotocol/sdk` version.

### 18.2 Tool catalog

| Tool | Input | Behaviour | Mutates state |
|---|---|---|---|
| `list_releases` | — | Lists available releases | No |
| `analyze_release` | `releaseId` | Runs change analysis + dependency analysis; returns `ChangeAnalysis`, `DependencyAnalysis` summary | Yes (advances run) |
| `calculate_release_risk` | `releaseId` | Returns latest `RiskAssessment` with factors and narrative; recomputes if inputs changed | Yes (evidence) |
| `recommend_tests` | `releaseId` | Returns `TestRecommendation[]` with reasons | Yes (evidence) |
| `run_release_tests` | `releaseId` | Runs recommended tests; returns `TestRun` | Yes |
| `validate_release` | `releaseId` | Runs deployment validation; returns result | Yes |
| `diagnose_release_failure` | `releaseId` | Returns `Diagnosis` for latest failed validation/tests | Yes (evidence) |
| `prepare_release_fix` | `releaseId` | Returns `RemediationPlan` (status PROPOSED). **Does not apply it.** | Yes (evidence) |
| `get_release_readiness` | `releaseId` | Returns `ReadinessReport` and why | No |
| `get_release_evidence` | `releaseId`, `format` | Returns evidence bundle (JSON or Markdown) | No |
| `deploy_release` | `releaseId` | Attempts deploy; **fails with `APPROVAL_REQUIRED`** unless a human approval exists in the run | Yes (if approved) |

Not exposed via MCP: `approve_release`, `confirm_remediation`, `reset_demo`. (A human must perform these through the dashboard / extension.)

### 18.3 Standard result envelope

```ts
interface ToolResult<T> {
  ok: boolean;
  summary: string;               // one or two sentences
  data?: T;
  error?: { code: string; message: string; nextStep?: string };
}
```

`nextStep` is a hint such as "A human must approve this release in the dashboard."

### 18.4 Error codes (shared)

`RELEASE_NOT_FOUND`, `INVALID_TRANSITION`, `APPROVAL_REQUIRED`, `APPROVAL_STALE`, `REMEDIATION_NOT_CONFIRMED`, `NOT_IMPLEMENTED_IN_MODE`, `VALIDATION_ERROR`, `INTERNAL`.

---

## 19. REST API Responsibilities

The API is a **thin layer**: parse and validate input (Zod), call the orchestrator/services, serialize output. No business logic in route handlers.

Base path: `/api`. JSON in/out. Errors use a uniform shape `{ error: { code, message } }`.

### 19.1 Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status + `mode` (`demo`/`live`) |
| GET | `/api/releases` | List releases |
| GET | `/api/releases/:id` | Release detail |
| GET | `/api/releases/:id/run` | Full current `ReleaseRun` |
| POST | `/api/releases/:id/start` | Select + begin; runs until first human pause |
| POST | `/api/releases/:id/step` | Advance exactly one machine step (useful for stepped demos/tests) |
| POST | `/api/releases/:id/continue` | Continue auto-advance until next pause |
| GET | `/api/releases/:id/risk` | Latest risk + history of assessments |
| GET | `/api/releases/:id/readiness` | Latest readiness |
| GET | `/api/releases/:id/tests` | Recommendations + runs |
| GET | `/api/releases/:id/diagnosis` | Diagnosis |
| GET | `/api/releases/:id/remediation` | Remediation plan |
| POST | `/api/releases/:id/remediation/confirm` | **Human** confirms applying the plan |
| POST | `/api/releases/:id/remediation/reject` | Human rejects |
| POST | `/api/releases/:id/approval/request` | Create approval request (requires READY_FOR_APPROVAL) |
| POST | `/api/releases/:id/approval/decision` | **Human** approve/reject with `decidedBy`, `comment` |
| POST | `/api/releases/:id/deploy` | Deploy (requires approved decision) |
| GET | `/api/releases/:id/evidence` | Evidence items |
| GET | `/api/releases/:id/evidence/export?format=json\|md` | Download bundle |
| GET | `/api/releases/:id/events` | SSE stream of step events |
| POST | `/api/demo/reset` | Reset all demo state (**only available when mode = demo**) |

### 19.2 Cross-cutting

- **CORS:** allow the Vite dev origin only (configurable).
- **Request IDs** and structured logging (simple console JSON).
- **HTTP status mapping:** 400 validation, 404 not found, 409 invalid transition / approval required, 500 internal.
- **Human-action endpoints** (`remediation/confirm`, `approval/decision`) record `decidedBy`. In Demo Mode, identity is a configured demo user ("marcus.release-manager") selected in the UI. No authentication is implemented (see 28).
- **No endpoint** deploys without going through the orchestrator's approval check.

---

## 20. React UI Structure

React + Vite + Tailwind. State via React Query (or simple fetch hooks) + SSE hook. No heavy state library. Look and feel: clean, dark-or-light "mission control" style; the demo is judged visually, so polish matters but only after the flow works.

### 20.1 Layout

Single-page app, one primary screen with a persistent header.

```
┌──────────────────────────────────────────────────────────────┐
│ Release Guardian AI   [DEMO MODE]      Release: REL-2026-07  │
├───────────────┬──────────────────────────────────────────────┤
│  Pipeline     │  Main panel (changes with the current step)  │
│  timeline     │                                              │
│  (steps with  │                                              │
│  status)      │                                              │
│               ├──────────────────────────────────────────────┤
│  Risk gauge   │  Activity log (SSE stream)                   │
│  + readiness  │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### 20.2 Components

| Component | Responsibility |
|---|---|
| `AppShell` | Header, mode badge, reset button (demo only) |
| `ReleasePicker` | Choose release; shows story title |
| `PipelineTimeline` | Vertical steps mapped from `AgentState`; statuses: pending / active / done / failed / waiting-human |
| `ChangesPanel` | Table of changed components with type, change, criticality |
| `DependencyPanel` | Impacted components list, **missing dependency** highlight; simple graph (SVG) is a stretch goal, a grouped list is acceptable |
| `RiskPanel` | Gauge (score + level) and **factor breakdown table** with contribution bars; shows delta vs previous assessment |
| `RiskTimeline` | Mini chart / list: 69 → 74 → 48 |
| `TestPanel` | Recommended tests with reasons; run results per attempt |
| `ValidationPanel` | Validation attempts, errors with codes, coverage per class |
| `DiagnosisPanel` | Root causes with confidence and linked evidence |
| `RemediationPanel` | Proposed actions with patch preview; **"Apply fix"** confirm button |
| `ReadinessPanel` | Gate checklist (PASS/FAIL/PENDING) with evidence links |
| `ApprovalPanel` | Summary for approver, risk, gates, **Approve / Reject** with required comment |
| `DeploymentPanel` | Deploy button (disabled until approved), progress, result |
| `EvidencePanel` | Evidence list, bundle hash, export buttons (JSON / Markdown) |
| `ActivityLog` | Live step messages |
| `ModeBadge`, `StatusPill`, `EvidenceChip` | Small shared pieces |

### 20.3 UX requirements

- **Primary call to action** is always obvious ("Start analysis", "Apply fix", "Request approval", "Approve", "Deploy").
- Human-gate states are visually distinct ("Waiting for you").
- Failures are shown in red with clarity, not hidden.
- Every number on screen that comes from a computation can be traced (click factor → evidence).
- Loading states use simulated progress from SSE, not fake spinners disconnected from the backend.
- A **"Reset demo"** button (demo mode only) restores the initial state.
- Keyboard focus and basic accessibility: labelled buttons, sufficient contrast.
- Must render well at 1280×720 and 1920×1080 (projector reality).

### 20.4 Directory sketch

```
apps/web/src/
  api/ (client.ts, sse.ts)
  hooks/ (useRelease.ts, useReleaseEvents.ts)
  components/ (the list above)
  pages/ (Dashboard.tsx)
  lib/ (format.ts, stateMapping.ts)
```

---

## 21. VS Code Extension Responsibilities

**Lowest priority of the P0 items.** Build only after dashboard, API, and MCP work. It is a thin client of the REST API.

### 21.1 Scope

| Feature | Description |
|---|---|
| Release tree view | Sidebar tree: releases → stories → components, with status icons |
| Command: *Release Guardian: Analyze Release* | Starts the run via API; shows progress notification |
| Status bar item | Shows readiness (`BLOCKED` / `NEEDS_ATTENTION` / `READY_FOR_APPROVAL`) and risk score |
| Risk summary view | Compact webview or tree showing the factor breakdown |
| Diagnosis surface | After failure, show root causes and a **proposed fix preview** (read-only diff-style text) |
| "Open in dashboard" | Opens the browser to the release's approval view |
| Output channel | Streams step log |

### 21.2 Explicit limits

- The extension **does not** approve releases or deploy to production. It links to the dashboard for approval. (This is a deliberate safety and scope decision.)
- It does not contain business logic; all data comes from `/api`.
- Configuration setting: `releaseGuardian.apiBaseUrl` (default `http://localhost:4000`).
- No marketplace publishing required; a `.vsix` or "Run Extension" dev host is sufficient for the hackathon.
- If time runs out, a **static, read-only status bar + one command** is an acceptable minimum. Do not let this block the demo.

---

## 22. Failure Diagnosis Flow

**Trigger:** state `VALIDATING_DEPLOYMENT` completes with `FAILED` validation or failed tests → `DIAGNOSING_FAILURE`.

### 22.1 Steps

1. Gather inputs: failed validation errors, failed test results, dependency analysis, relevant evidence items.
2. Call `AiService.diagnoseFailure(...)` (Demo: rule-based).
3. **Validate the output** against the `Diagnosis` schema. Every `supportingEvidenceIds` entry must reference an existing evidence item; otherwise discard that root cause or fall back to the rules diagnosis.
4. Record `FAILURE_DIAGNOSIS` evidence.
5. Recompute risk (checkpoint B).
6. Transition to `PREPARING_REMEDIATION`.

### 22.2 Expected demo diagnosis

| ID | Category | Summary | Confidence | Supporting evidence |
|---|---|---|---|---|
| RC-1 | `MISSING_DEPENDENCY` | `Flow Opportunity_Discount_Approval` and `ApexClass DiscountApprovalService` reference `Opportunity.Discount_Tier__c`, which exists in Dev but is not part of story US-1042 and is absent in the target. Two test failures share this cause. | 0.97 | Dependency analysis (missing dependency), validation error `MISSING_REFERENCE`, two failed tests |
| RC-2 | `COVERAGE_GAP` | `DiscountApprovalService` coverage is 62% (threshold 75%). The tier-3 approval branch has no test coverage. | 0.93 | Coverage summary, validation error `COVERAGE_BELOW_THRESHOLD` |

### 22.3 Rules

- Diagnosis groups symptoms by **root cause**, not by error line. (Six symptoms → two causes.)
- Confidence values are fixture-defined in Demo Mode; in Live Mode they must be derived and not presented as calibrated probabilities.
- If no root cause can be determined: category `OTHER`, state `BLOCKED`, message asks for human triage. The system must **not** fabricate a cause.

---

## 23. Remediation Flow

### 23.1 Principle

Remediation is **proposed by AI, confirmed by a human, applied by the service**. Even in non-production, the demo shows a confirmation step to reinforce the "human in control" message. Remediation never touches production directly.

### 23.2 Steps

1. `PREPARING_REMEDIATION`: `AiService.proposeRemediation` produces a `RemediationPlan` (status `PROPOSED`) with actions, each linked to a root cause.
2. Evidence `REMEDIATION_PLAN` recorded.
3. State `AWAITING_REMEDIATION_CONFIRMATION`. UI shows the plan and a preview of every change.
4. Human clicks **Apply fix** → `POST /remediation/confirm`.
5. `APPLYING_REMEDIATION`: `CopadoService.applyRemediation(plan)`. In Demo Mode this flips scenario state and increments `contentVersion`.
6. Evidence `REMEDIATION_APPLIED` recorded.
7. Previous evidence tied to the older `contentVersion` is marked stale for readiness purposes (not deleted).
8. Orchestrator returns to `RUNNING_TESTS` (attempt 2), then `VALIDATING_DEPLOYMENT`.

### 23.3 Expected demo plan

| Action | Root cause | Kind | Description | Preview |
|---|---|---|---|---|
| A1 | RC-1 | `ADD_COMPONENT_TO_STORY` | Add `CustomField: Opportunity.Discount_Tier__c` to story US-1042 | Component added to the story's component list |
| A2 | RC-2 | `ADD_TEST_METHOD` | Add `testTierThreeRequiresVpApproval` to `DiscountApprovalServiceTest` | Short Apex test method preview (text, illustrative) |

The A2 preview is an **illustrative code snippet shown as text**. The demo does not compile or run real Apex.

### 23.4 Safeguards

- Plan `risk` field rates the fix's own risk (`LOW`).
- Only `PROPOSED` plans can be confirmed.
- Max 2 remediation attempts; then `BLOCKED`.
- The system never auto-confirms.

---

## 24. Human Approval Flow

**ADR-003: Production deployment must always require explicit human approval.**

### 24.1 Steps

1. State `READY_FOR_APPROVAL` (all readiness gates PASS).
2. Human (or the UI on their behalf) clicks **Request approval** → `POST /approval/request`. The system snapshots readiness, risk, and the **evidence hash** into an `ApprovalRequest`. State → `AWAITING_APPROVAL`.
3. The approver sees: AI summary (`summarizeForApprover`), risk breakdown, gates, test results, validation history, remediation history, and evidence links.
4. The approver chooses **Approve** or **Reject**, entering `decidedBy` and a **mandatory comment**.
5. The decision is recorded as evidence (`APPROVAL_DECISION`).
6. Only an `APPROVED` decision allows `deploy`.

### 24.2 Hard rules (MUST)

1. No code path calls `CopadoService.deploy()` unless the `ApprovalService` confirms a valid `APPROVED` decision for that release and **current** content version/evidence hash.
2. If content changes after approval (contentVersion differs), the approval is **stale** → `APPROVAL_STALE`, deployment refused, new approval required.
3. Approval cannot be created by MCP tools, AI services, or automatic transitions.
4. The same identity that "requested" may approve in the demo (single-user demo), but the record stores both. In Live Mode, separation of duties is a future requirement (Section 29).
5. Rejection is terminal for that run, with the reason preserved in evidence.
6. Each approval is **single-use**: once consumed by a deployment it cannot be reused.

### 24.3 UI requirements

- The Approve button is disabled until the comment is entered.
- A confirmation dialog states the target environment: "You are approving deployment to **Production**."
- The AI never pre-fills the decision.

---

## 25. Deployment Flow

### 25.1 Steps

1. Precondition checks in orchestrator: state `APPROVED`; approval valid, not stale, not consumed; readiness still `READY_FOR_APPROVAL` for current content version.
2. State → `DEPLOYING`. `CopadoService.deploy(releaseId, approvalId)` called.
3. **Demo:** a simulated deployment that reports staged progress (e.g. "Preparing package", "Deploying components", "Running validation tests", "Finalizing") using fixed durations from fixtures, then returns `SUCCEEDED`. The demo must be clearly labelled as simulated.
4. Evidence `DEPLOYMENT_RESULT` recorded; approval marked consumed.
5. State → `DEPLOYED` → `GENERATING_EVIDENCE` → `COMPLETED`.
6. The evidence bundle is sealed (hash computed) and exported.

### 25.2 Failure behaviour

If deployment fails (not scripted in the primary demo; available as an alternate scenario): state `FAILED`, evidence recorded, diagnosis may be offered, and a **new** approval is required for any retry.

### 25.3 No silent rollback claims

The spec does not promise automatic rollback. Rollback planning is a Future item (Section 29).

---

## 26. Deterministic Demo Data

All fixtures live in `packages/core/src/demo/fixtures/` as JSON validated against `shared` schemas at load time (fail fast if invalid).

### 26.1 Determinism infrastructure

| Concern | Rule |
|---|---|
| Time | Injected `Clock`. Demo clock starts at `2026-09-14T09:00:00.000Z` and advances by **fixed increments** (e.g. +15s per step) rather than real time. |
| IDs | Injected `IdGenerator`. Demo IDs sequential per type: `ev-0001`, `tr-0001`, `val-0001`, `appr-0001`. |
| Randomness | **Forbidden** in core. No `Math.random()` or `Date.now()` in business logic (lint rule recommended). |
| Ordering | All lists sorted by explicit stable keys. |
| Delays | Presentation delays are from fixtures and do not affect data. |
| Reset | `POST /api/demo/reset` rebuilds the container state from fixtures. |

### 26.2 Scenario fixture files

```
fixtures/scenario-001/
  scenario.json              # script: per-step, per-attempt outcomes
  releases.json
  environments.json
  changes.json
  dependencies.json
  history.json
  tests-catalog.json
  test-run-1.json            # 4 pass / 2 fail
  test-run-2.json            # 6 pass
  validation-1-failed.json
  validation-2-passed.json
  diagnosis.json
  remediation.json
  approver-summary.json
```

### 26.3 Core data (authoritative values)

**Environments:** `env-dev` (DEV), `env-qa` (QA), `env-uat` (UAT), `env-prod` (PRODUCTION).

**Dependencies — impacted components (9):**

| # | Key | Criticality | Reason |
|---|---|---|---|
| 1 | `ApexClass:PricingUtils` | HIGH | Called by `DiscountApprovalService`; used by 7 classes |
| 2 | `ApexClass:QuoteSyncBatch` | HIGH | Calls `PricingUtils`; nightly batch on quotes |
| 3 | `ApexClass:OpportunityTriggerHandler` | HIGH | Invoked by `OpportunityTrigger` |
| 4 | `ApexClass:QuoteTotalsService` | MEDIUM | Uses `PricingUtils` |
| 5 | `ApexClass:RenewalPricingService` | MEDIUM | Uses `PricingUtils` |
| 6 | `ApexClass:OrderPricingService` | MEDIUM | Uses `PricingUtils` |
| 7 | `Flow:Opportunity_Stage_Notifications` | LOW | Fires on same object updates |
| 8 | `ValidationRule:Opportunity.Discount_Max_Check` | MEDIUM | Related discount field logic |
| 9 | `LightningComponentBundle:discountSummaryCard` | LOW | Displays discount values |

**Missing dependency (1):**
`CustomField:Opportunity.Discount_Tier__c` — required by `Flow:Opportunity_Discount_Approval` and `ApexClass:DiscountApprovalService`; `presentInTarget: false`; severity `BLOCKER`.

**History:** two prior failed releases touched `PricingUtils` and `OpportunityTrigger` (drives `HISTORICAL_HOTSPOT`).

**Test catalog and recommendations (6):**

| Test ID | Name | Kind | Priority | Reason |
|---|---|---|---|---|
| `t-apex-1` | `DiscountApprovalServiceTest` | APEX | MUST_RUN | Directly covers changed class |
| `t-apex-2` | `OpportunityTriggerTest` | APEX | MUST_RUN | Covers changed trigger |
| `t-apex-3` | `PricingUtilsTest` | APEX | MUST_RUN | Shared utility in blast radius |
| `t-apex-4` | `QuoteSyncBatchTest` | APEX | SHOULD_RUN | High-criticality downstream batch |
| `t-crt-1` | `CRT: Opportunity discount approval flow` | CRT | MUST_RUN | End-to-end UI check of changed Flow |
| `t-crt-2` | `CRT: Quote creation regression` | CRT | SHOULD_RUN | Downstream regression on pricing |

**Test run 1 (attempt 1):** `t-apex-1` FAILED (`Variable does not exist: Discount_Tier__c`), `t-crt-1` FAILED (flow error: field not found), others PASSED.
**Test run 2 (attempt 2, after remediation):** all 6 PASSED.

**Coverage:**
- Attempt 1: `DiscountApprovalService` 62%, `OpportunityTrigger` 91%, `PricingUtils` 94%; overall 84%.
- Attempt 2: `DiscountApprovalService` 88%, `OpportunityTrigger` 91%, `PricingUtils` 94%; overall 90%.

> Illustrative fixture numbers only. They are not measurements from a real org.

**Validation 1 (FAILED) errors:**
1. `MISSING_REFERENCE` — `Flow:Opportunity_Discount_Approval`: references `Opportunity.Discount_Tier__c` which does not exist in the target.
2. `MISSING_REFERENCE` — `ApexClass:DiscountApprovalService`: variable does not exist: `Discount_Tier__c`.
3. `COVERAGE_BELOW_THRESHOLD` — `DiscountApprovalService`: 62% < 75%.

> These are **Release Guardian demo error codes**, not real Copado/Salesforce error strings.

**Validation 2:** `PASSED`, no errors.

**Approver (demo user):** `marcus.release-manager`, comment fixture e.g. "Reviewed evidence; coverage and validation green. Approved for production window."

### 26.4 Alternate scenarios (stretch, not required)

- `scenario-002-clean-release`: low-risk release that passes first time (useful to prove the system doesn't always fail).
- `scenario-003-deployment-failure`: validation passes, deployment fails (shows `FAILED` path).

Scenario selection is via the `Release` chosen; each scenario is data only.

---

## 27. Testing Strategy

"Never claim something works without testing it." (CLAUDE.md)

### 27.1 Test pyramid

| Layer | Scope | Tooling | Priority |
|---|---|---|---|
| **Unit — engines** | Risk factors, risk policy, readiness gates, test recommender | Vitest | **Highest** |
| **Unit — evidence** | Hashing, canonical JSON, supersede logic, stale marking | Vitest | High |
| **Unit — approval** | Single-use, stale, rejection | Vitest | High |
| **Unit — state machine** | Every valid and invalid transition | Vitest | High |
| **Integration — golden scenario** | Full run through orchestrator with Demo services; asserts risk 69 → 74 → 48, 2 root causes, final readiness, deployment, bundle hash | Vitest | **Highest** |
| **API tests** | Routes with `supertest`: status codes, validation, 409 on deploy without approval | Vitest + supertest | High |
| **MCP tests** | Each tool returns envelope; `deploy_release` fails w/o approval | Vitest | Medium |
| **UI tests** | A few component tests (RiskPanel, ApprovalPanel); optional Playwright smoke if time | Vitest + Testing Library | Medium/Low |
| **Demo verification script** | `scripts/verify-demo.ts` runs the whole demo headlessly and prints PASS/FAIL | tsx | **High** |

### 27.2 Must-have tests (explicit)

1. **Determinism:** run the golden scenario twice; assert deep-equal outputs and **identical `bundleHash`**.
2. **Risk golden values:** checkpoints A/B/C produce exactly 69, 74, 48 with the listed factor contributions.
3. **Explainability:** every `RiskFactor` has non-empty `explanation`; contributions sum to the total (within rounding).
4. **Approval gate:** `deploy` without approval → `ApprovalRequiredError`; with rejected decision → error; with stale approval → `APPROVAL_STALE`; approval reuse → error.
5. **Readiness staleness:** after remediation, gates depending on pre-fix evidence are `PENDING` until re-run.
6. **State machine:** invalid transitions throw `InvalidTransitionError`; max-attempts leads to `BLOCKED`.
7. **No MCP approval path:** assert the MCP tool list contains no approve/confirm tool.
8. **Mode isolation:** grep-style test asserting no `RELEASE_GUARDIAN_MODE` reads outside `container.ts` / config.
9. **Schema validation:** all fixtures validate against Zod schemas.
10. **Evidence integrity:** modifying any evidence item changes the bundle hash.

### 27.3 Quality gates

At the end of every implementation phase (per CLAUDE.md): run tests, run `tsc --noEmit` across workspaces, fix errors, update `PROJECT_STATE.md` and `TODO.md`, record ADRs, commit.

### 27.4 Lint/type rules

- `strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess` recommended.
- ESLint rule: `@typescript-eslint/no-explicit-any` as error (exceptions need a comment).
- Recommended custom rule/grep check: ban `Math.random`, `Date.now`, `new Date()` inside `packages/core/src` except in the real clock implementation.

---

## 28. Security Considerations

Scope: appropriate for a hackathon POC, but designed so the story is credible.

| Area | Requirement |
|---|---|
| **Human approval** | Enforced in code (24.2), not only in the UI. Defence in depth: API, orchestrator, and service all check. |
| **Approval integrity** | Approval tied to content version + evidence hash; single-use. |
| **MCP boundary** | MCP exposes no approval tool; `deploy_release` fails without a human-created approval. Prevents an AI client from self-approving. |
| **Secrets** | No secrets in the repo. `.env` is gitignored; `.env.example` has placeholders only. Demo Mode needs none. |
| **Live mode safety** | Live mode refuses to start without required credentials and never logs them. |
| **Authentication** | **Not implemented in the hackathon.** API binds to `localhost` by default. State this explicitly in the presentation. The approval identity in Demo Mode is a selected demo user, not an authenticated one. |
| **Input validation** | All API/MCP inputs validated with Zod. |
| **Data handling** | Demo data is fictional. In Live Mode, avoid sending metadata bodies/secrets to an LLM without an explicit policy; log minimal data. |
| **AI safety** | AI output schema-validated; evidence references verified; AI cannot trigger state transitions that require humans. |
| **Prompt injection (Live)** | Treat metadata, commit messages, and test output as **untrusted data**; never let them alter tool permissions or approval logic. |
| **Least privilege (Live)** | Use scoped credentials; separate read-only analysis credentials from deployment credentials. |
| **Audit** | Evidence is append-only, with a bundle hash as an integrity indicator (not a signature). |
| **Dependencies** | Pin versions; run `npm audit` before the demo. |
| **CORS / network** | Restrict CORS to the dev UI origin; bind to localhost. |
| **Demo reset** | `/api/demo/reset` only exists in demo mode. |

---

## 29. Future Live Integrations

All items **TBD-LIVE**: each requires reading current official documentation first. **Do not invent endpoints, field names, or authentication flows.**

| Integration | Plan |
|---|---|
| **Copado CI/CD** | Implement `LiveCopadoService`. Step 1: research the current official Copado APIs/CLI for user stories, pipelines, promotions, validations/deployments. Step 2: write a **mapping table** (port method → real capability, or "gap"). Step 3: implement read-only methods first (`listReleases`, `getChanges`), then validation, then deployment last. |
| **Copado Robotic Testing** | Implement `LiveCrtService` after verifying the available API/trigger mechanisms and result retrieval. |
| **Copado AI** | Evaluate whether any Copado AI capabilities can back parts of `AiService`; keep the port unchanged. |
| **LLM-backed AI** | Implement `LiveAiService` with schema-validated structured output and evidence citation checks (13.3). |
| **Dependency analysis** | Replace fixture graph with real metadata dependency analysis (source needs verification). |
| **Authentication / SSO** | Needed before any shared deployment. |
| **Separation of duties** | Requester ≠ approver, role-based approval policies. |
| **Persistence** | Replace in-memory `ReleaseRunStore` with a database. |
| **Multi-org / multi-pipeline** | Support multiple pipelines and environments. |
| **Historical risk learning** | Calibrate risk weights from real release outcomes. |
| **Rollback planning** | Generate a rollback plan as part of evidence. |
| **Notifications** | Slack/Teams approval requests. |
| **Policy configuration** | Admin-defined readiness gates and risk weights per team. |
| **Evidence retention** | Export to compliance systems; signed attestations. |

### 29.1 Live mode adoption path

1. Implement read-only Live methods; run in "shadow mode" alongside demo data.
2. Add contract tests for each Live service using recorded responses (record only after verifying real behaviour).
3. Enable validation, then deployment, behind feature flags.
4. Never enable production deployment in Live Mode without the approval gate and authentication in place.

---

## 30. Five-Minute Hackathon Demo Script

**Setup before going on stage:** `npm run demo` (API + web), browser on dashboard at 1920×1080, "DEMO MODE" visible, reset pressed. Have `verify-demo` passed that morning. Have an exported evidence Markdown file ready as a backup screenshot.

| Time | On screen | Say (approx.) |
|---|---|---|
| **0:00–0:30** | Dashboard, release `REL-2026-07` selected | "Releases fail late. Release Guardian AI doesn't just deploy; it proves it's safe to deploy. Meet Priya, who needs to ship a discount-approval change to production." |
| **0:30–1:15** | Click **Start analysis**. Timeline animates: changes, dependencies | "It analyzes the four changed components and maps what depends on them. Nine components are in the blast radius, including a shared pricing utility. And look: it found a dependency that is **not** in the story, a custom field that exists only in Dev." |
| **1:15–1:50** | Risk panel: **69 / High** with factor table; test recommendations | "The score is explainable. Here's every factor and its contribution; nothing is a black box. It also recommends six tests, each with a reason, not just 'run everything'." |
| **1:50–2:25** | Tests run: 4 pass, 2 fail. Validation fails. Risk → **74** | "Tests run and validation runs against Production as a check. It fails, as predicted. Risk rises to 74." |
| **2:25–3:10** | Diagnosis panel: RC-1, RC-2. Remediation panel with previews | "Six symptoms, two root causes: the missing field, and a coverage gap on the new approval branch. The AI proposes a fix and shows exactly what it will change. **It doesn't apply anything on its own.** Priya reviews and clicks Apply fix." |
| **3:10–3:50** | Re-run: tests 6/6, validation passes, coverage 88%. Risk → **48 / Medium**. Readiness gates all green | "Everything is re-validated, not assumed. Risk dropped from 74 to 48 *because of evidence*. It's still Medium; blast radius is real, and we show that honestly. All readiness gates pass." |
| **3:50–4:30** | Approval panel: summary, evidence. Marcus approves with a comment. Deploy. | "Now the human gate. Marcus sees the evidence summary, the risk breakdown, and the history, including the failure. Production deployment is impossible without his explicit approval; even our MCP tools can't approve for him." |
| **4:30–5:00** | Deployment succeeds. Evidence panel: export Markdown, show bundle hash. Brief mention of MCP + VS Code | "Deployed, and the evidence package tells the whole story, failure included. This runs in Demo Mode today with deterministic data; Live Mode plugs real Copado and a model into the same adapters. Thank you." |

### 30.1 Backup plan

- If the UI stalls: `Reset demo` (5s), restart from the beginning at fast mode.
- If everything fails: run `scripts/verify-demo.ts` in terminal to show the same flow headlessly, and show pre-recorded screenshots.
- Keep the 90-second condensed path ready: start → risk → failure → fix → approve → deploy.

### 30.2 Optional MCP moment (if time)

In an MCP client: "Is REL-2026-07 safe to deploy?" → `get_release_readiness` returns the evidence-backed answer; "Deploy it" → `APPROVAL_REQUIRED` message. Short and strong.

---

## 31. Non-Goals

For the hackathon, the following are **explicitly out of scope**:

- Real Copado, CRT, or Salesforce API calls (no credentials needed)
- Real Apex compilation, execution, or metadata parsing
- Authentication, user management, RBAC, multi-tenancy
- Persistent database
- Production-grade security hardening
- Multi-org or multi-pipeline support
- Automatic rollback
- Real LLM calls in the core demo path
- Editing code in the user's repository
- Learning from historical release data
- Mobile layout
- Marketplace publishing of the VS Code extension
- Internationalization
- Performance optimization or scaling
- A full-featured dependency graph visualization (a list is enough)
- Any claim that the demo mirrors exact Copado API behaviour

---

## 32. Architectural Constraints

These are **binding**. Any deviation requires an ADR in `DECISIONS.md`.

1. **Demo Mode must work with no credentials and no network.**
2. **Demo behaviour is deterministic.** Fixed clock, sequential IDs, scripted outcomes, no randomness.
3. **External systems only via interfaces** (`CopadoService`, `CrtService`, `AiService`). No direct fixture reads outside `Demo*Service`.
4. **Mode is chosen in one place** (`container.ts`). No `if (demo)` branches elsewhere.
5. **Production deployment requires explicit human approval**, enforced in the service layer, not only the UI.
6. **AI never decides.** Risk and readiness are deterministic, pure, and unit-tested. AI explains/diagnoses/proposes.
7. **Risk is explainable.** Every score shows factors, weights, contributions, explanations, and evidence links.
8. **Readiness is evidence-backed.** Gates reference evidence; stale evidence invalidates gates.
9. **Evidence is append-only** and failures are retained.
10. **Business logic lives in `packages/core`.** API, MCP, UI, and extension are thin.
11. **UI and extension never import `core`.**
12. **MCP exposes business-level tools** and **no approval tool**.
13. **Strong TypeScript.** No unexplained `any`.
14. **Don't invent Copado API details.** Unknown = `TBD-LIVE`, documented as such.
15. **Don't over-engineer.** No microservices, no database, no message queue, no plugin systems, no dependency injection framework (a plain composition root is enough).
16. **Small phases.** Work in small increments; keep the demo runnable at the end of each.
17. **Don't rewrite working code** without reason.
18. **Never claim something works without testing it.**
19. **Update project docs** (`PROJECT_STATE.md`, `TODO.md`, `DECISIONS.md`) at the end of each phase and commit.

---

## 33. Appendix A — Implementation Phases

Each phase ends with: tests green, type check clean, docs updated, commit. The demo (or the portion built so far) must remain runnable.

| Phase | Goal | Deliverables | Exit check |
|---|---|---|---|
| **1** | Project setup | npm workspaces, tsconfig, Vitest, ESLint, `.env.example`, empty packages | `npm test` and `tsc` run clean |
| **2** | Shared models | All types and Zod schemas in `packages/shared` | Compiles; schema tests |
| **3** | Ports + demo infrastructure | Port interfaces, `Clock`, `IdGenerator`, `ReleaseRunStore`, `container.ts` | Unit tests |
| **4** | Fixtures + Demo services | Scenario-001 fixtures, `DemoCopadoService`, `DemoCrtService`, `DemoAiService` | Fixtures validate; service tests |
| **5** | Engines | `RiskEngine`, `ReadinessEngine`, `TestRecommender`, policy | **Golden risk values 69/74/48 pass** |
| **6** | Evidence + approval | `EvidenceService`, hashing, exporters, `ApprovalService` | Hash/approval tests |
| **7** | Orchestrator | State machine, `runUntilPause`, events | **Golden scenario integration test + determinism test** |
| **8** | REST API | Routes, SSE, error mapping | supertest suite; `verify-demo` script |
| **9** | React dashboard | Panels in order: pipeline timeline → risk → failure/remediation → approval/deploy → evidence | Manual run of full demo |
| **10** | MCP server | Tools per Section 18 | MCP tests incl. approval-refusal |
| **11** | Polish & rehearsal | Visual polish, pacing, README, demo rehearsal, backup plan | Three consecutive clean demo runs |
| **12** | VS Code extension | Minimal per Section 21 | Runs in extension dev host |
| **13** | Presentation | Slides/notes from Section 30 | Rehearsed |

**Recommended first build target:** Phases 1–7 (headless, fully tested core). The golden scenario integration test is the project's backbone; the UI is then comparatively mechanical.

---

## 34. Appendix B — Glossary

| Term | Meaning |
|---|---|
| **ADR** | Architecture Decision Record, stored in `DECISIONS.md` |
| **Adapter / Port** | Interface the core depends on; implementations are swappable |
| **Blast radius** | Components not in the release that could be affected by it |
| **Content version** | Counter incremented when the release contents change (e.g. via remediation) |
| **CRT** | Copado Robotic Testing |
| **Demo Mode** | Deterministic mode using fixtures; no credentials |
| **Evidence** | Append-only record of an analysis, result, decision, or action |
| **Gate** | A readiness condition that must PASS |
| **Golden scenario** | The scripted scenario whose outputs are asserted exactly in tests |
| **Live Mode** | Future mode using real integrations |
| **Readiness** | Whether required evidence exists to ask for approval |
| **Remediation** | Proposed fix for diagnosed root causes |
| **TBD-LIVE** | Detail intentionally unspecified until verified against real documentation |

---

*End of MASTER_SPEC.md*
