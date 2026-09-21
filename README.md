# VPEvolve project page

Public static site: https://vpevolve.github.io/vpevolve/

## Current content — 21 September 2026

Release: silver/blue theme, monochrome lithography mark, integrated recipe replay directly after the physical-layer section. Theme comparison controls are excluded from the published site.

- Homepage: the two author-drawn paper figures, measured layer stack, dense hotspot comparisons, twenty-window main results, five-condition experience study, and paired global/local continuation results.
- Main results switch between Overall, Poly and Metal. Ten candidates plus one endpoint repeat per window; seven baselines and VPEvolve. Main-study and reviewed-reuse results remain separate.
- Dense Poly19 and Metal45: co-registered 10 µm, 600 nm and 180 nm views. The close-up tracks the worst gauge immediately before local correction; fixed-focus error and full-window maximum are labelled separately.
- Homepage `#evolution` (old `/evolution/` links redirect here): all ten candidates and the endpoint repeat for both dense main-study cases; synchronized layout, mask, resist and PVB images with max/average EPE, PVB and MRC curves.
- `assets/current/results.json`: paper-aligned aggregate results.
- `assets/current/geometry/geometry.json`: source and image verification manifest; 720 verified images across 24 measured frames. No synthetic or interpolated geometry.

The two dense cases illustrate local geometry changes. Aggregate claims use all assigned study windows. No new physical evaluations were run to create the website visuals.

## Development and publication

Serve this directory with a static HTTP server. No application build is required.
GitHub Pages uses `.github/workflows/pages.yml` to deploy the explicit HTML/CSS/JS allowlist and current assets.
Only derived publication assets are included; raw experiment-server files and local working directories are excluded.

Regenerate derived result data with `scripts/update-paper-data.py` using the current manuscript checkout. Geometry provenance and visual requirements are recorded under `.research/figures/`.

Validation: JavaScript syntax and git whitespace checks pass; image bytes and SHA-256 values verified against the manifest; homepage/replay checked in-browser, including case selection, close-up views and slider controls.

## Integrated recipe replay

The homepage now hosts the complete replay. `assets/current/recipes.json` records each measured recipe diff against its actual parent, checked against the same recipe hashes as the trajectory. Global parameter edits and local pattern/edge displacement edits update with the trial slider. The endpoint repeat displays the last candidate edit with an explicit label. Key executable lines are shown first; complete filtered diffs expand on demand. Machine paths, output-file statements and comments are omitted. No new OPC or LLM calls.
