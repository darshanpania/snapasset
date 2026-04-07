# UX Outline: Creative Adaptation Workflow

**Date**: 2026-04-07
**Status**: Proposed
**Goal**: Describe the high-level user experience for SnapAsset as an upload-first creative adaptation tool for marketers.

---

## UX Principles

1. **Keep the source creative visible**
   The user should always be able to orient around the original asset.

2. **Make progress legible**
   Users should understand what is pending, what succeeded, what failed, and what needs review.

3. **Design around approval, not just generation**
   The product should feel like a workflow tool, not a one-shot generator.

4. **Make retries lightweight**
   Reworking poor ratios should feel easy and scoped, not like restarting the whole project.

---

## Main Workflow

### Screen 1: Start New Adaptation

Purpose:

- introduce the upload-first use case
- let the user create a new adaptation project

Key elements:

- upload area
- short explanation of what SnapAsset does
- supported file types
- examples of target outputs or channels

Primary action:

- `Upload creative`

### Screen 2: Source Asset Setup

Purpose:

- confirm the uploaded asset
- capture basic preservation intent
- define target outputs

Key elements:

- large source preview
- source dimensions and aspect ratio
- preservation intent prompt
- checkbox-based preservation options
- target preset or aspect-ratio selector

Primary action:

- `Generate variants`

Notes:

- this screen should stay practical and low-friction
- avoid advanced editing tools in v1

### Screen 3: Generation In Progress

Purpose:

- show that SnapAsset is working through the requested ratios
- set expectations that outputs may complete independently
- make a `45-60` second generation window feel understandable rather than stalled

Key elements:

- project summary
- list of requested outputs
- per-output progress state
- source preview pinned or visible nearby

Primary behavior:

- outputs appear as they complete
- the user should not have to wait for all ratios before understanding progress

Notes:

- this does not require a sophisticated real-time system in v1
- a clear progress state and periodic refresh behavior are enough if they feel reliable

### Screen 4: Review Grid

Purpose:

- let the user inspect generated outputs ratio by ratio
- support quick approval or rejection

Key elements:

- grid of output cards grouped by ratio or platform
- clear labels for ratio, platform, and status
- preview action
- approve action
- reject action
- retry action

Each card should answer:

- what was requested
- what attempt is being shown
- whether it is approved
- whether another retry is needed

### Screen 5: Retry Flow

Purpose:

- rerun only the weak outputs without affecting the approved ones

Key elements:

- selected failed or rejected ratios
- optional retry instruction field
- reference back to source creative and prior attempt

Primary action:

- `Retry selected`

Notes:

- retry should feel scoped and safe
- approved outputs should remain visibly locked in as accepted

### Screen 6: Export

Purpose:

- package approved results for campaign use

Key elements:

- list of approved outputs
- naming preview for exported files
- ZIP export action

Primary action:

- `Export approved assets`

---

## Core UX Components

### Source Preview Panel

Persistent context panel that keeps the original creative visible during setup, review, and retry.

### Output Cards

Primary unit in the review interface.

Each card should show:

- preview thumbnail
- ratio or platform name
- attempt status
- quick actions

### Status Filters

Users should be able to filter outputs by:

- all
- awaiting review
- approved
- rejected
- failed

This becomes important once one project has many requested outputs.

### Attempt History View

Lightweight comparison view for outputs that have been retried.

This does not need to be a full design diff tool in v1. It just needs to help the user answer:

- is the new attempt better than the previous one
- which attempt should be approved

---

## UX Behavior Guidelines

### During Generation

- do not block the whole experience behind one spinner
- show partial completion as results arrive
- make failures explicit, not hidden

### During Review

- approval should be a confident, low-friction action
- rejection should naturally lead to retry
- failed outputs should be visually distinct from merely unreviewed outputs

### During Retry

- retries should be scoped to selected outputs
- users should never worry that a retry will overwrite good assets
- prior approved choices should remain stable

### During Export

- default export should include approved assets only
- export should feel like the final step of a review workflow, not just a download button

---

## V1 UX Scope

- one source asset per project
- simple preservation intent controls
- per-ratio review states
- retry for selected outputs
- ZIP export for approved results
- generation feedback designed for long-running requests without assuming advanced infrastructure

---

## Deliberately Deferred UX

- manual masking or region locking
- advanced canvas editing tools
- side-by-side designer-grade annotation systems
- collaborative multi-user review
- layered content editing

---

## UX Success Criteria

The UX is successful if a marketer can:

1. upload one creative quickly
2. request several outputs without confusion
3. understand which ratios are good and which need work
4. retry only the weak outputs
5. export a final approved bundle with confidence
