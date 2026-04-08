# Product Spec: Creative Adaptation for Multi-Aspect Campaign Assets

**Date**: 2026-04-07
**Status**: Proposed
**Goal**: Turn SnapAsset from a prompt-first image generator into an upload-first creative adaptation tool for marketers who need one existing PNG/JPG creative adapted into multiple aspect ratios with generative AI.

---

## Summary

SnapAsset should help a marketer start with one finished creative, request several output ratios such as `9:16`, `16:9`, `2:1`, or `1:3`, review the generated variants, retry only the weak outputs, and export approved results as a cleanly named ZIP package.

The first release is optimized for flat raster inputs such as `PNG` and `JPG`, including creatives that already contain text, logos, CTA buttons, and other embedded brand elements.

SnapAsset should not promise exact layout preservation for flattened text-heavy creatives. It should instead optimize for:

- preserving overall style and composition
- keeping important marketing elements usable and readable
- extending or adapting the canvas where possible
- giving the marketer a fast review and retry workflow

---

## Product Positioning

### Current Product

SnapAsset currently behaves like an AI image generator that creates one image and resizes or crops it into preset dimensions.

That current behavior should be treated as legacy logic for this pivot, not as an architectural constraint.

### Target Product

SnapAsset should behave like a campaign creative adaptation tool:

- upload one existing creative
- choose platform presets or raw aspect ratios
- generate adapted variants
- review outputs per ratio
- retry only the failed ratios
- export approved assets as a campaign bundle

This is a better fit for marketers who already have approved source creative and need many placement-ready variants quickly.

---

## Primary User

### Core User

A marketer or growth designer with one approved promotional image who needs to deploy it across multiple channels and placements.

### Typical Input

- flat `PNG` or `JPG`
- may include embedded text
- may include logos, brand marks, product shots, CTA buttons, or legal copy
- no access to layered design source in most cases

### Primary Job To Be Done

"Take this one existing creative and generate acceptable versions for many aspect ratios without rebuilding each one manually."

---

## Primary Use Case

1. The user uploads one existing campaign creative.
2. The user selects several desired output ratios or platform presets.
3. The user tells SnapAsset what matters most to preserve.
4. SnapAsset generates one or more candidate outputs for each requested ratio.
5. The user reviews the outputs and approves the good ones.
6. The user retries only the rejected ratios with optional extra instructions.
7. The user exports approved outputs as a ZIP with clear asset names.

---

## Product Principles

1. **Upload-first, not prompt-first**
   The center of the product is adapting an existing asset, not generating a new one from scratch.

2. **Review before export**
   Generated outputs are not final by default. Approval is part of the workflow.

3. **Retry only what failed**
   Good outputs should stay fixed while poor ratios are reworked independently.

4. **Semantic preservation over manual masking**
   Users should specify what matters through simple inputs, not by drawing complex locked regions.

5. **Honest quality boundaries**
   The product should avoid overpromising exact preservation of flattened text/logo layouts in extreme ratio changes.

---

## UX Flow

### 1. Upload

The user uploads one creative asset.

The upload step should show:

- source image preview
- source dimensions
- source aspect ratio
- basic file validation

### 2. Preservation Intent

The user answers a short prompt such as:

`What is important to preserve properly?`

The initial UI should use simple checkbox-style options such as:

- text readability
- logo integrity
- CTA prominence
- subject or product preservation
- style and color consistency
- allow background extension

This keeps the workflow practical for marketers and avoids manual region locking in v1.

### 3. Target Selection

The user selects either:

- platform presets
- raw aspect ratios
- an adaptation mode for each selected output when relevant
- an output file-size target for exported/generated assets

The initial output size options should be:

- `2MB`
- `1MB`
- `500KB`

The generated asset should be at or below the selected size cap for that requested output.

The initial non-AI mode should include:

- `Pad with white bars`

This mode should preserve the original creative exactly, place it inside the requested aspect ratio, and fill the remaining area with white padding. It should cost `0` credits because it does not require model inference.

The first release should support a focused set of high-value outputs rather than every possible dimension.

### 4. Generate

SnapAsset generates outputs for all selected ratios in one batch.

Each requested ratio should be treated as its own trackable result, with room for multiple attempts over time.

### 5. Review

The user sees a results grid or gallery where each ratio has its own card.

Each result should support actions such as:

- approve
- reject
- retry
- open preview
- compare attempts

### 6. Rework

If some ratios fail, the user can retry only those ratios.

Retries should support optional per-ratio instructions such as:

- "keep the text clearer"
- "extend the blue background naturally"
- "preserve the product exactly"

Approved ratios should remain untouched when other ratios are retried.

### 7. Export

The user exports approved results as a ZIP bundle.

Export should use deterministic, campaign-friendly naming.

Example:

```text
spring-sale/
  01x01_instagram-post.png
  09x16_instagram-story.png
  16x09_youtube-thumbnail.png
  02x01_banner.png
```

---

## Core Functional Requirements

### Input

- Accept `PNG`, `JPG`, and `WEBP` source creatives
- Support raster uploads only in the first release
- Store the source asset as the base artifact for a project

### Generation

- Accept one source creative and many target ratios in a single request
- Generate one initial output per requested ratio
- Optionally support more than one candidate for difficult ratios later
- Preserve project history so retries do not lose previous good outputs
- Assume one generation flow may take roughly `45-60` seconds and design the user experience accordingly
- support a deterministic no-AI padding path for users who only want white bars added to match the target ratio
- respect a user-selected output file-size cap of `2MB`, `1MB`, or `500KB`

### Review State

Each requested ratio should have a clear status:

- `pending`
- `generated`
- `approved`
- `rejected`
- `retrying`
- `failed`

Each ratio should also support multiple attempts over time.

### Retry Workflow

- Retry should happen per ratio
- The user should be able to retry only rejected or failed outputs
- Retry instructions should be optional and scoped to the selected ratio

### Export

- Export only approved outputs by default
- Include ratio or platform name in filenames
- Package outputs in a single ZIP

---

## Suggested Data Model Direction

High level only:

- **Project**
  One creative adaptation job anchored to a single uploaded source asset

- **Source Asset**
  The original uploaded file and its metadata

- **Requested Output**
  One target ratio or platform preset requested by the user

- **Output Attempt**
  One generated attempt for a requested output

- **Review Decision**
  Approval or rejection state plus optional notes

This structure is important because "retry only failed ratios" is a first-class product requirement.

---

## System Behavior

### Provider Strategy

SnapAsset should use a provider abstraction rather than tying the workflow to one model vendor.

At a high level, the system should support:

- generative canvas expansion for ratio changes
- selective cleanup or retouching when needed
- plain resize/crop fallback only for low-risk cases
- deterministic padding with white bars when the user explicitly chooses that mode

The provider layer should allow SnapAsset to route requests based on task difficulty and evolve with model changes over time.

### Zero-Credit Padding Mode

The white-bar option should not be implemented as a model call or a Python sidecar by default.

Preferred direction:

- use the server image pipeline directly
- resize the source asset to fit within the target dimensions without cropping
- center the resized image on a white canvas sized to the requested output
- record the result as a normal output attempt with strategy metadata indicating deterministic padding

This is better than a separate Python path for v1 because it is simpler to operate, deterministic, fast, and already aligned with the existing Node image-processing stack.

### Execution Model

The first release should prefer the simplest execution model that supports a good user experience.

- a synchronous request plus polling-friendly project refresh may be enough for v1
- a lightweight background job layer is acceptable if it simplifies retries or progress reporting
- SnapAsset does not need heavy queueing architecture at this stage

The main requirement is not sophisticated infrastructure. The main requirement is that long-running generation does not block or confuse the user.

---

## Commercial Note

Pricing is not finalized, but the likely direction is a credit-based model.

Illustrative only:

- a monthly plan could include a fixed number of credits
- generation and retry actions could consume credits based on output count or effort

This should be treated as an incomplete product thought, not a finalized requirement for current engineering design.

### Generation Strategy

Not every ratio shift should be handled the same way.

- mild ratio changes should prefer conservative expansion
- large ratio changes should allow more generative flexibility
- extreme banner formats should be treated as lower-confidence outputs that may require retry

### Preservation Strategy

For flattened source creatives, preservation should be guided by user intent, not hard layout guarantees.

The system should aim to:

- keep important visual elements recognizable
- avoid damaging embedded text and logos when possible
- generate mostly around the existing creative rather than rewriting the whole image

---

## UX Notes For Developers

The UX should feel like an asset workflow, not a chatbot workflow.

Good defaults:

- source asset stays visible throughout the flow
- outputs are grouped by requested ratio
- approval state is visually obvious
- retry actions are lightweight
- export is available only when at least one result is approved

Avoid:

- forcing users to redraw masks or locked zones
- hiding failed ratios inside one large batch result
- overwriting approved outputs during rework

---

## Scope For V1

- upload-first workflow
- flat raster input support
- preservation intent via checkbox inputs
- multiple requested aspect ratios in one batch
- per-ratio approval and retry flow
- ZIP export of approved outputs
- project persistence for source asset, outputs, and attempt history

---

## Explicitly Out Of Scope For V1

- layered design files such as PSD or Figma imports
- exact pixel-perfect preservation of flattened text layouts
- collaborative approval workflows
- advanced manual masking tools
- bulk multi-source campaign generation
- automated multilingual text handling guarantees

---

## Risks And Constraints

1. **Flattened text-heavy creatives are inherently hard**
   Extreme ratio changes may distort or crowd embedded text and logos.

2. **Some ratios will need human review**
   This is a core assumption, not an edge case.

3. **Quality will vary by provider and by composition**
   The product should be built to route providers and improve over time.

4. **Trust depends on selective retry**
   Users will lose confidence quickly if good outputs are overwritten while reworking failed ones.

---

## Success Criteria

SnapAsset is successful in this transition when:

- users can upload one existing creative and request many output ratios in one run
- users can approve good outputs and retry bad ones independently
- exported assets are cleanly packaged and usable for campaign execution
- the workflow feels faster than manual redesign for common marketing placements

---

## Recommended Next Step

Translate this spec into:

1. a phased implementation plan
2. an API and data model design
3. a lightweight UX breakdown for the upload, review, retry, and export screens
