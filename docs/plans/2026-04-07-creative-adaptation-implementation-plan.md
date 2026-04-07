# Implementation Plan: Creative Adaptation

**Date**: 2026-04-07
**Status**: Proposed
**Goal**: Deliver the creative adaptation product in phased increments that reduce technical risk while moving SnapAsset from prompt-first generation toward upload-first campaign asset adaptation.

---

## Planning Principles

1. **Build around stable product boundaries**
   The system should be organized around projects, source assets, requested outputs, attempts, and review decisions.

2. **Separate workflow from provider choice**
   Provider capabilities will evolve. The product workflow should not depend on one model vendor or one API shape.

3. **Treat retries as a first-class design concern**
   The ability to keep good outputs while reworking only weak ratios is core product value, not an enhancement.

4. **Optimize for trust before optimization**
   A reviewable, durable workflow matters more than maximum automation in the first release.

5. **Keep infrastructure proportionate to product maturity**
   This is a pivot of a non-deployed product. The first implementation should be simple unless complexity is clearly buying product value.

6. **Keep tests basic while the workflow is still moving**
   Early steps should have lightweight smoke coverage around new persistence boundaries, routes, and happy-path behavior. Detailed matrix testing can be added once the workflow shape is more stable.

---

## Phase 0: Foundations And Product Reframing

### Objective

Prepare SnapAsset to support an upload-first workflow without yet solving the full creative adaptation problem.

### Outcomes

- introduce the campaign adaptation concept into product language
- define the core domain objects
- establish project-oriented persistence boundaries
- prepare the frontend and backend to operate on uploaded source assets

### High-Level Work

- create a new project model centered on one source creative
- define requested outputs as durable records rather than temporary preset selections
- add source asset storage and metadata capture
- move away from assuming every run starts from a prompt
- introduce project and output statuses that survive page reloads and retries

### Exit Criteria

- SnapAsset can create and persist an upload-backed project
- the system can represent multiple requested outputs under one project
- the frontend can load a project and show source asset plus output state

---

## Phase 1: Single-Batch Adaptation MVP

### Objective

Ship the first usable upload-first adaptation workflow for marketers working with flat PNG/JPG creatives.

### Outcomes

- one source creative can produce many requested aspect ratios
- each ratio becomes a separately trackable output
- users can review outputs before exporting

### High-Level Work

- implement source creative upload and validation
- add preservation-intent inputs using simple semantic controls
- support a focused set of aspect ratios and platform presets
- create one initial generation attempt per requested output
- render a review grid with approval and rejection state
- export approved outputs as a ZIP package

### Architectural Notes

- assume end-to-end generation may take roughly `45-60` seconds
- start with the simplest execution model that keeps the UI responsive
- store output state independently from queue state
- represent every generation as an attempt attached to one requested output
- avoid a design where one failed ratio invalidates the whole batch

This does not require a complex queue-first architecture in v1. A lightweight background execution path is sufficient if it supports refresh, retry, and status clarity.

### Exit Criteria

- user can upload a source creative, request several ratios, review results, approve selected outputs, and export approved assets

---

## Phase 2: Selective Rework And Operational Hardening

### Objective

Turn the MVP into a workflow marketers can trust for repeated use.

### Outcomes

- users can retry only failed or rejected ratios
- approved outputs remain stable while others are reworked
- attempt history becomes visible and durable

### High-Level Work

- implement per-ratio retry flows
- add optional retry instructions scoped to individual outputs
- preserve prior attempts and approval history
- support result comparison across attempts
- improve progress reporting only as needed
- add usage, failure, and quality telemetry

### Architectural Notes

- retries should create new attempts, not mutate prior attempt records
- approval state should point to a chosen attempt, not to an output in the abstract
- execution should be durable enough for retries and user trust
- more advanced orchestration can wait until the product proves demand

### Exit Criteria

- user can keep good ratios, retry bad ratios, compare attempts, and export the approved set without confusion

---

## Phase 3: Provider Routing And Quality Strategy

### Objective

Improve output quality and cost control without changing the product workflow.

### Outcomes

- provider selection becomes a policy decision, not a hard-coded path
- different adaptation tasks can use different engines
- SnapAsset can evolve with model updates without redesigning the product

### High-Level Work

- introduce provider capability contracts
- add routing logic by task type and ratio difficulty
- define fallback behavior for unsupported or low-confidence cases
- add evaluation loops based on retry rates and approval rates

### Architectural Notes

- use capability-based routing such as expand, retouch, cleanup, strict resize
- capture provider metadata on each attempt for observability and future tuning
- decouple project records from provider-specific response formats

### Exit Criteria

- SnapAsset can route adaptation tasks across providers while preserving one consistent product workflow

---

## Phase 4: Team Workflow And Scale

### Objective

Extend the product beyond individual jobs into a reusable campaign asset system.

### Outcomes

- projects become reusable campaign workspaces
- teams can review, iterate, and export assets in a more structured way
- the system can support higher throughput reliably

### High-Level Work

- add richer project lifecycle and organization
- add collaborative review or approval states if needed
- support larger export sets and more repeatable naming schemes
- harden queueing, storage, and monitoring for production volume

### Exit Criteria

- SnapAsset supports repeated production use for campaign adaptation across users and teams

---

## Cross-Cutting Architecture Decisions

### 1. Domain Model Before Provider Logic

The project and output model should be stable even if generation providers change. This avoids rewriting product behavior every time the model market shifts.

### 2. Workflow State Must Not Depend On Execution State

Execution state is operational. Product state is user-facing. They should be related, but not collapsed into the same concept.

### 3. Attempts Should Be Append-Only

A retry should create a new attempt rather than overwriting an old one. This preserves traceability, user trust, and future evaluation data.

### 4. Export Should Be Derived From Approved State

ZIP generation should package approved attempts, not raw latest outputs. This keeps export deterministic and aligned with review decisions.

### 5. Observability Should Stay Lightweight At First

Approval rate, retry rate, and failure modes matter, but the first version does not need enterprise-grade telemetry or infrastructure.

### 6. Test Depth Should Lag Product Churn

During the current build sequence:

- add basic tests for new models, repositories, and critical route wiring
- prefer one or two representative happy-path tests over exhaustive permutations
- defer broad edge-case suites until the upload, generation, review, and export workflow stabilizes

This keeps test maintenance proportional to the speed of product change.

---

## Suggested Delivery Order

1. project and source asset persistence
2. requested output model and statuses
3. upload-first UI shell
4. first end-to-end batch adaptation flow
5. review and approval state
6. ZIP export
7. selective retry
8. provider routing and quality tuning

---

## Major Risks

1. **Treating the workflow as a simple image endpoint**
   That would make retry, approval, and history fragile.

2. **Over-coupling product state to a single model provider**
   That would make future model changes expensive and slow.

3. **Overpromising fidelity for flattened text-heavy creatives**
   The system should support review and retry because exact preservation is not guaranteed.

4. **Batching too aggressively**
   Large jobs should not behave as all-or-nothing transactions from the user’s perspective.

5. **Premature infrastructure complexity**
   Heavy queueing, orchestration, or distributed workflow design would be out of proportion to the current stage of the product.

---

## Decision Guidance

If there is a tradeoff between:

- a simple MVP with durable project/output records
- and a more complex infrastructure-first design

the simpler MVP is the better choice.

What should be durable in v1 is the product state, not the operational machinery around it.

---

## Commercial Note

Pricing is not finalized. A future credit-based model is a plausible direction, but it should not shape the technical design too aggressively yet.

Illustrative only:

- a monthly plan may include a fixed number of credits
- credit usage may eventually map to output generation and retry volume

This should remain a placeholder thought until the product workflow is validated.
