# VPEvolve project page

Public static site: https://vpevolve.github.io/vpevolve/

## Published content

- Homepage: method diagrams, measured geometry, local-rule mechanism, 20-window comparison, and six-window experience-bank ablations.
- /evolution/: completed Poly02, Metal29, and selected Metal27 trajectories, with candidate geometry, retained metrics, local/global actions, and endpoint repeats.
- assets/current/results.json: audited derived metrics and source hashes.
- assets/current/geometry/: images from the same measured trials.

Metal27 was selected after observing the main Metal results; it is an illustrative case. The preassigned Poly02 and Metal29 traces remain independently available. All cases use fixed measurement and quality criteria.

## Development and publication

Serve this directory with a static HTTP server. No application build is required.
GitHub Pages uses .github/workflows/pages.yml to deploy the explicit HTML/CSS/JS allowlist and current assets.
Only derived publication assets are included; raw experiment-server files and local working directories are excluded.

Regenerate derived result data with scripts/update-paper-data.py using the current manuscript checkout, then verify case labels, selection notes, source hashes, and image alignment before publishing.
