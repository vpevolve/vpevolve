# VPEvolve project page

Public static site: https://vpevolve.github.io/vpevolve/

## Current paper alignment (17 September 2026)

- Homepage: current method, spatially scoped local-rule mechanism, 20-window main comparison, and six-window bank ablations.
- `/evolution/`: actual completed Poly02 / Metal29 extended-budget trajectories, with candidate outcomes, same-incumbent metrics, repeat and early-stop accounting.
- `/evolution/archive.html`: the earlier 5 µm development geometry replay, explicitly separated from the current 10 µm study.
- `assets/current/results.json`: derived physical metrics and source hashes only. Main table cells match the manuscript rounding. Ablation percentages use unrounded verified endpoints.
- `assets/current/pattern-local-rule.png`: the paper's actual mechanism figure; focus EPE is distinguished from global Max EPE, and the original failed PVB guard is disclosed.

The current cross-model/source-reuse studies remain pending. Previous model-replay numbers and automatic learned-invariant claims have been removed from the main page. Code/dataset release remains preparing; no draft manuscript is published here.

These are development-exposed windows from one layout family. Budget caps and realized calls are separate. Retention-induced monotonicity is not a stable-learning claim. A newly selected Metal27 illustration is not substituted for the preassigned Metal29 trace before completion and review.

## Development

Serve this directory with a static HTTP server. No application build is required for the current homepage and trajectory explorer. The archived `replay.js` bundle and associated geometry remain intact.

GitHub Pages deployment uses `.github/workflows/pages.yml`. Only the explicit public HTML/CSS/JS and assets are staged. No experiment server files or local work directories are deployed.
