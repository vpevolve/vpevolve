# VPEvolve project page

Public site: https://vpevolve.github.io/vpevolve/

The page presents the VPEvolve method, measured recipe visualizations, the final experiment summaries, and links to the separate public code and layout repository.

## Results shown on the page

- Main online run: 20 FreePDK45-derived windows, ten per layer. Mean window-maximum EPE changes from 18.294 to 5.361 nm on Poly and from 22.052 to 15.692 nm on Metal1. All 20 full-method runs complete and pass endpoint repeat.
- Matched baselines: six agent methods and Bayesian optimization across the same 20 cases and ten-trial budget.
- Mechanism ablation: Full VPEvolve, Frozen Experience, and three component variants across 20 cases.
- Paired experience study: ACE and VPEvolve experience continue from the same trial-five recipe and raw history for five additional trials.
- Paired local correction: global-only and global-plus-local continuations from ten common pre-local recipes, four additional trials each.
- Cross-model full run: Claude, GPT, Gemini, DeepSeek, GLM, and Gemma each fill all three model roles on the benchmark.
- Long-horizon optimization: Poly02 Full and Frozen complete 100 trials; Metal29 Full completes 100 and Frozen ends at trial 57. The displayed curves stop at each run's last observed trial.

`assets/current/final-results.json` contains the public aggregate metrics and source hashes needed by the tables. The Bayesian optimization row follows the paper's main table, and the six-model comparison follows its cross-model figure. Recorded `opc` counts include R0; the displayed comparison subtracts one R0 call per case to match the paper's call accounting. `assets/current/long-horizon-curves.json` contains retained maximum EPE and PVB change by trial for the two selected long-horizon cases. The source handoff was verified before export; its internal trajectories, paths, prompts, and model exchanges are not published here. PVB in these public files is in `10^-3 µm`, while long-horizon PVB curves use percent change from each case's R0.

The Poly19 and Metal44 hotspot, layout-layer, and recipe-trace visualizations are individual measured examples. Metal44 comes from the completed online Full run: all ten candidates improve maximum EPE, the first two through global edits and the next eight through local rules. Its geometry and recipe changes are synchronized to the same trial records. `assets/current/replay-results.json` supplies the trace visualization.

## Development and publication

Serve this directory with a static HTTP server. GitHub Pages deploys the explicit HTML, CSS, and JavaScript allowlist in `.github/workflows/pages.yml`, plus the current public assets. The Code & data section links to the separate Apache-2.0 repository containing the public source, simulator, and 20 layouts.
