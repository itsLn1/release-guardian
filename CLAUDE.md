# Release Guardian AI

## Project

Release Guardian AI is a CopadoCon 2026 hackathon proof of concept.

The product is an AI-powered Salesforce release engineer.

Core idea:

> Don't just deploy. Prove it's safe to deploy.

The demo should allow a developer to:

1. Select a Salesforce release/story
2. Analyze changes
3. Analyze dependencies
4. Calculate release risk
5. Recommend tests
6. Run tests
7. Validate deployment
8. Diagnose deployment failures
9. Prepare remediation
10. Re-run validation and tests
11. Ask for human approval
12. Deploy
13. Generate release evidence

## Current goal

Build a polished DEMO-FIRST version.

The demo must work without real Copado credentials.

Use deterministic Demo Mode first.

Later we will add real Copado API integrations.

## Architecture principle

Use interfaces/adapters so Demo Mode can later be replaced by Live Mode.

Example:

Application
    |
    v
CopadoService
    |
    +-- DemoCopadoService
    |
    +-- LiveCopadoService

Do not scatter mock/demo logic throughout the application.

## Technology

Preferred:

- Node.js
- TypeScript
- React
- Vite
- Tailwind CSS
- MCP
- VS Code Extension

Use simpler alternatives when they make the implementation more reliable.

## Important rules

- Do not over-engineer.
- Build a working demo before production features.
- Do not implement everything at once.
- Work in small phases.
- Do not rewrite working code unnecessarily.
- Use strong TypeScript types.
- Avoid unnecessary `any`.
- Production deployment must require explicit human approval.
- Demo scenarios must be deterministic.
- Test important business logic.
- Never claim something works without testing it.

## Project documentation

Before doing work, read:

- PROJECT_STATE.md
- TODO.md
- DECISIONS.md

The complete product specification will be stored in:

- MASTER_SPEC.md

## Session workflow

At the beginning of every session:

1. Read CLAUDE.md
2. Read PROJECT_STATE.md
3. Read TODO.md
4. Read DECISIONS.md
5. Inspect the repository
6. Check git status
7. Continue from the current project state

Do not repeat completed work.

At the end of each implementation phase:

1. Run tests
2. Run type checking
3. Fix errors
4. Update PROJECT_STATE.md
5. Update TODO.md
6. Record important decisions in DECISIONS.md
7. Commit the completed work

## Current mode

DEMO MODE

Environment variable:

RELEASE_GUARDIAN_MODE=demo