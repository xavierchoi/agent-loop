# loop.md — Agent Loops Standard Project

This project designs and validates **Agent Loops**: a cross-agent markdown standard (`LOOP.md`) for declaring goal-directed, independently-verified, self-refining agent loops. SKILL.md declares *capability*; LOOP.md declares *process* — what goal, until when, judged by what.

## Directory Map

- `spec/SPECIFICATION.md` — the standard (single source of truth; check its header for current version). Review/decision records in `spec/reviews/`
- `runtime/` — reference runner kit: `looprun/looprun.mjs` (Level 1), `looprun/evolve.mjs` (refinement), demo loop + target. See `runtime/README.md`
- `skills/loop-authoring/` — Agent Skills-format onboarding skill (the human-friendly entry point)
- `wiki/` — llm-wiki: accumulated research knowledge. **Consult `wiki/INDEX.md` before spec/research work**; ingest procedure and rules live in `wiki/WIKI.md`
- `research/` — deep-research reports and `field-runs/` (real-world run analyses + extraction rubric)
- `design/` — design docs (mechanics, UX scenarios)
- Remote: private GitHub `xavierchoi/agent-loop` (main)

## Non-Negotiable Principles

1. **No self-reporting, applied to ourselves.** An artifact's author never certifies it. Spec changes get adversarial critique passes; the runner gets independent audits; claims get verification. This project eats its own dogfood.
2. **The human owns success criteria.** `goal` and `verify` semantics are owner decisions. Automation may propose; only the owner (xavier) approves changes to what "done" means — in the spec and in this project's own process.
3. **Structure over intelligence.** Prefer fixing the harness/spec/process over demanding smarter models. Findings from implementation friction are spec input, not annoyances.
4. **Evidence discipline.** Claims carry confidence tags: 3-vote verified > primary-source collected > vendor self-report > internal n=1 observation. Never present the weaker as the stronger. Negative results are recorded, not hidden.
5. **Additive spec evolution.** Core stays minimal (5 required fields as of v0.4+; no new required fields). Complexity lives in optional fields and the Evolution extension, and is hidden from humans by tooling (agents author LOOP.md; humans answer interview questions).

## Terminology (Session-Critical)

- Use **"정제" / "refinement"** for the log→playbook knowledge process. **Never use the word 증류 or "distillation"** in any output — it triggers safety-filter false positives in this environment.
- "gene" (유전자) = a specific version of LOOP.md content. "Judgment assets" (판정 자산) = files verify depends on. "primitive 0.0" = external collaborators' (zoon's) internal name for this spec.

## Working Conventions

- **Context discipline:** bulk reading (session logs, large folders) goes to subagents that write partial reports to files and return short digests. Main session never loads raw bulk data.
- **Model tiering for delegation:** Fable 5 = orchestration and demanding QA/critique; Opus 4.8 = spec editing, implementation, rubric-based audits; Sonnet 5 = simple tasks and naive-reader probes.
- **Parallel agents get disjoint file ownership** (e.g., one owns `spec/`, another `wiki/`); cross-boundary findings go into reports, not edits.
- **Wiki rules** (from `wiki/WIKI.md`): sources are immutable after ingest; every claim cites a source; `[[entity]]` cross-refs; contradictions may stay OPEN — do not force same-day resolution.
- **Owner communication:** xavier is a concept originator, not a researcher. Before asking for a decision, explain background and per-option trade-offs in plain language with analogies (see auto-memory).
