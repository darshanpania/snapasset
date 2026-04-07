# Architecture Outline: Creative Adaptation API And Backend

**Date**: 2026-04-07
**Status**: Proposed
**Goal**: Define a high-level backend shape for upload-first creative adaptation that supports project persistence, per-ratio outputs, retries, review, and export.

---

## Design Goals

- durable project-based workflow
- clean separation between domain state and generation infrastructure
- provider-agnostic adaptation pipeline
- support for selective retry and approval-based export
- compatibility with simple long-running execution

---

## Core Backend Domains

### Project

Represents one campaign adaptation workspace anchored to a single source creative.

Responsibilities:

- owns the source asset
- owns requested outputs
- owns project-level settings and preservation intent
- acts as the main retrieval unit for the frontend

### Source Asset

Represents the uploaded original creative and its metadata.

Responsibilities:

- stores file path or storage reference
- stores source dimensions and type
- preserves the immutable input for all future attempts

### Requested Output

Represents one target ratio or preset under a project.

Responsibilities:

- stores the target dimensions or aspect ratio
- carries review status
- groups all attempts for that output

### Output Attempt

Represents one generation attempt for a requested output.

Responsibilities:

- stores generation metadata
- stores provider used and attempt-level instructions
- stores produced asset references
- records success, failure, and diagnostics

### Export Bundle

Represents one export event for approved outputs.

Responsibilities:

- records which attempts were exported
- stores ZIP reference if persisted
- provides reproducibility for downloaded asset sets

---

## State Model

### Project State

Suggested high-level states:

- `draft`
- `processing`
- `review`
- `completed`
- `archived`

The project state should be coarse and user-facing.

### Requested Output State

Suggested high-level states:

- `pending`
- `generating`
- `generated`
- `approved`
- `rejected`
- `failed`

This is the primary state users interact with.

### Attempt State

Suggested high-level states:

- `queued`
- `running`
- `succeeded`
- `failed`
- `cancelled`

This is operational state and should not replace review state.

---

## API Shape

The API should move from single generation endpoints toward project-oriented resources.

### Project Creation

Create a project and attach a source creative.

Suggested capability:

- create project metadata
- upload source asset
- persist source asset analysis metadata

### Output Planning

Add requested outputs to a project.

Suggested capability:

- choose platform presets or raw ratios
- capture preservation intent
- create per-output records before generation starts

### Batch Generation

Create attempts for selected outputs.

Suggested capability:

- start generation for all pending outputs
- return a project reference immediately if generation runs in the background
- allow simple refresh, polling, or progress updates as needed

### Output Review

Update review state for each requested output.

Suggested capability:

- approve one attempt
- reject one output
- add notes for retry

### Retry

Create new attempts only for selected outputs.

Suggested capability:

- retry one or more rejected outputs
- attach scoped instructions
- preserve prior attempts and approved results

### Export

Generate a ZIP from approved attempts.

Suggested capability:

- export current approved set
- return downloadable file reference
- preserve export metadata for auditability if useful

---

## Suggested Endpoint Direction

Illustrative only:

```text
POST   /api/projects
GET    /api/projects/:projectId
POST   /api/projects/:projectId/source-asset
POST   /api/projects/:projectId/outputs
POST   /api/projects/:projectId/generate
PATCH  /api/projects/:projectId/outputs/:outputId/review
POST   /api/projects/:projectId/outputs/:outputId/retry
POST   /api/projects/:projectId/exports
GET    /api/projects/:projectId/exports/:exportId
GET    /api/projects/:projectId/events
```

The key design idea is resource orientation rather than action-specific one-off endpoints.

---

## Queue And Job Model

This product likely involves requests that take `45-60` seconds, but that does not automatically require heavy queueing architecture.

### Recommended Direction

- keep execution simple in v1
- support project-level generation and per-output traceability
- ensure failure of one output does not fail the whole workflow

### Architectural Guidance

- if background execution is used, operate on identifiers rather than large payloads
- keep execution state separate from project and review state
- retries should be safe and idempotent at the attempt level
- progress visibility should be lightweight and user-centered

The core architectural decision is durable product state. Whether v1 uses direct request handling, a lightweight background worker, or a simple internal job abstraction is secondary.

---

## Persistence Direction

The persistence model should support auditability and evolution.

At a high level, store:

- source asset metadata
- preservation intent selections
- requested outputs
- attempt history
- review decisions
- export history

Avoid a model where generated files are the only durable artifact and all workflow state must be reconstructed from storage paths or queue logs.

---

## Provider Abstraction

The provider layer should be organized around capabilities, not vendor names.

Suggested capability areas:

- `expand_canvas`
- `retouch_or_cleanup`
- `strict_resize`
- `analyze_composition`

Each attempt should record:

- provider identity
- model identity
- generation strategy used
- target output metadata
- relevant quality and failure signals

This creates the foundation for future routing and evaluation.

---

## Commercial Note

Pricing is not finalized. A future credit-based pricing model is possible, but it should remain a placeholder rather than a design driver.

Illustrative only:

- credits may eventually be tied to generation attempts
- retries may also consume credits

That future possibility is worth keeping in mind for usage tracking, but not worth overengineering in the first release.

---

## Storage Strategy

Treat storage as multiple artifact classes, not one flat bucket.

Suggested classes:

- source assets
- generated attempts
- approved outputs
- export bundles

This separation simplifies lifecycle management, retention policies, and debugging.

---

## Security And Guardrails

The system should assume marketing creatives may contain commercial and sensitive brand material.

High-level requirements:

- authenticated access to project and asset resources
- authorization checks at project boundary
- bounded upload types and sizes
- safe retention and deletion policies
- provider request logging without leaking sensitive creative contents unnecessarily

---

## Observability

Operational telemetry should be designed into the workflow.

Track at least:

- project creation rate
- output approval rate
- retry rate by ratio
- provider failure rate
- export completion rate
- time-to-approved-bundle

For this product, those metrics are architectural inputs, not just analytics outputs.

---

## Key Architectural Decisions

1. **Project-oriented API over stateless generation endpoints**
   This supports persistence, retries, review, and export.

2. **Separate review state from execution state**
   User approval is not the same as job success.

3. **Append-only attempt history**
   This enables traceability and quality evaluation.

4. **Capability-based provider abstraction**
   This prevents the domain model from being rewritten every time a model vendor changes.

5. **Export as a derived workflow artifact**
   Export should be assembled from approved attempts, not from whichever files were generated most recently.
