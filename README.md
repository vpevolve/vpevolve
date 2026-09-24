# VPEvolve project page

Public static site: https://vpevolve.github.io/vpevolve/

## Current content — 24 September 2026

The homepage follows the current ICLR manuscript's online Actor–Reflector–Curator experiment. It presents the virtual process engineer, the LLM reflector and curator, and the evolving Skill Bank. The new recipe-development Figure 1 is shown alongside the current Figure 3 method diagram.

- Main result: 20 windows cropped from FreePDK45-generated full-chip layouts, ten Poly and ten Metal1. Each online task has ten physical trials, an R0 evaluation, and an endpoint repeat. Poly mean window-maximum EPE falls from 18.294 to 5.525 nm; Metal1 falls from 22.052 to 16.495 nm. All 20 endpoints meet the paper's feasibility and improvement criteria.
- Direct-reuse comparison: eight-method results from the earlier controller are labeled separately. The dense Poly19 and Metal45 geometry explorer and recipe replay also belong to this comparison; they are not online Actor–Reflector–Curator trajectories.
- Six-window component study: five direct-reuse conditions, including frozen and reviewed reuse. The paired global/local continuation remains a separate controlled study.
- `assets/current/results.json`: manuscript-derived online aggregates, direct-reuse comparison, component study, trajectories, and paired continuation. Regenerate it with `scripts/update-paper-data.py MANUSCRIPT_CHECKOUT`.
- `assets/current/geometry/geometry.json`: geometry source and image verification manifest. The images are measured outputs; no new physical evaluations were run for the website.

Figure 1 uses the latest author-supplied drawing. Its global and local code-line labels match the current manuscript narrative.

The open testbed download contains the differentiable simulator, analytic modes, a GDS-to-mask converter, tests, and all 20 layouts. A separate dataset archive contains the GDS files and manifest. SHA-256 checksums are published alongside both archives.

## Development and publication

Serve this directory with a static HTTP server; no application build is required. GitHub Pages uses `.github/workflows/pages.yml` to deploy the explicit HTML/CSS/JS allowlist and current assets. The site includes derived publication assets and sanitized Apache-2.0 release archives. Raw experiment-server files, local working directories, and private repository history are excluded.

## Integrated recipe replay

The homepage hosts the direct-reuse replay. `assets/current/recipes.json` records each measured recipe diff against its actual parent, checked against the same recipe hashes as the trajectory. Global parameter edits and local pattern/edge displacement edits update with the trial slider. The endpoint repeat displays the last candidate edit with an explicit label. Key executable lines are shown first; complete filtered diffs expand on demand. Machine paths, output-file statements, and comments are omitted.
