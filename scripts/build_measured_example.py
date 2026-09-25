"""Export one verified online recipe run as public, co-registered website assets.

Run inside an environment with klayout, numpy, and Pillow. This script reads a
private experiment handoff but writes only measured metrics, filtered recipe
changes, and rasterized GDS layers. It never copies source paths or model logs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import klayout.db as k
import numpy as np
from PIL import Image, ImageChops, ImageDraw


SIZE = 1000
COLORS = {
    "target": (244, 194, 122, 235),
    "mask": (116, 143, 207, 165),
    "sraf": (198, 151, 242, 230),
    "contour": (110, 239, 202, 255),
    "pvb": (243, 146, 173, 165),
}
LAYER_NUMBERS = {"mask": (101, 0), "sraf": (40, 0), "contour": (5, 0), "pvb": (6, 0)}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def region(layout: k.Layout, layer: tuple[int, int]) -> k.Region:
    index = layout.find_layer(*layer)
    return k.Region() if index is None else k.Region(layout.top_cell().begin_shapes_rec(index)).merged()


def rendered_region(shape: k.Region, dbu: float, box: list[float], name: str) -> Image.Image:
    x0, y0, x1, y1 = box
    cut = shape & k.Region(k.Box(*(round(value / dbu) for value in box)))
    scale = SIZE / (x1 - x0)
    canvas = Image.new("L", (SIZE, SIZE), 0)
    for polygon in cut.each():
        rings = [list(polygon.each_point_hull())]
        rings += [list(polygon.each_point_hole(i)) for i in range(polygon.holes())]
        rings = [[(round((point.x * dbu - x0) * scale), round((y1 - point.y * dbu) * scale)) for point in ring] for ring in rings]
        if name in ("target", "contour"):
            draw = ImageDraw.Draw(canvas)
            for ring in rings:
                if len(ring) > 1:
                    draw.line(ring + [ring[0]], fill=255, width=2 if name == "contour" else 1)
        else:
            piece = Image.new("L", canvas.size, 0)
            draw = ImageDraw.Draw(piece)
            for index, ring in enumerate(rings):
                if len(ring) > 2:
                    draw.polygon(ring, fill=255 if index == 0 else 0)
            canvas = ImageChops.lighter(canvas, piece)
    color = COLORS[name]
    image = Image.new("RGBA", canvas.size, color[:3] + (0,))
    image.putalpha(canvas.point(lambda value: round(value * color[3] / 255)))
    return image


def gauge_image(box: list[float], focus: dict, signed_epe_nm: float) -> Image.Image:
    x0, y0, x1, y1 = box
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if not (x0 <= focus["x_um"] <= x1 and y0 <= focus["y_um"] <= y1):
        return image
    scale = SIZE / (x1 - x0)
    start = ((focus["x_um"] - x0) * scale, (y1 - focus["y_um"]) * scale)
    end = (
        (focus["x_um"] + focus["normal"][0] * signed_epe_nm / 1000 - x0) * scale,
        (y1 - focus["y_um"] - focus["normal"][1] * signed_epe_nm / 1000) * scale,
    )
    draw.line([start, end], fill=(255, 255, 255, 235), width=2)
    radius = 4 if x1 - x0 < 1 else 3
    draw.ellipse([start[0] - radius, start[1] - radius, start[0] + radius, start[1] + radius], fill=(244, 194, 122, 255))
    draw.ellipse([end[0] - radius, end[1] - radius, end[0] + radius, end[1] + radius], fill=(255, 255, 255, 235))
    return image


def compose(images: dict[str, Image.Image], keys: list[str]) -> Image.Image:
    result = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    for key in keys:
        result = Image.alpha_composite(result, images[key])
    return result


def focus_epe(npz_path: Path, focus: dict) -> float:
    with np.load(npz_path, allow_pickle=False) as values:
        match = np.isclose(values["x_um"], focus["x_um"], atol=1e-8) & np.isclose(values["y_um"], focus["y_um"], atol=1e-8)
        assert match.sum() == 1, f"Focus gauge missing or ambiguous: {npz_path}"
        return float(values["signed_epe_nm"][match][0])


def changed_lines(raw_diff: str) -> list[str]:
    kept = []
    for line in raw_diff.splitlines():
        if not line.startswith(("+", "-")) or line.startswith(("+++", "---")):
            continue
        content = line[1:].lstrip()
        if content.startswith(("//", "#", "INCLUDE ", "image ", "pw_condition ")):
            continue
        if re.search(r"/(?:data|home|Users|tmp|var)/|[A-Za-z]:\\|https?://|@", content):
            continue
        kept.append(line)
    assert kept, "No public executable change remains after filtering"
    return ["@@ Recorded recipe changes @@", *kept]


def build(packet: Path, case_id: str, output: Path) -> None:
    run = packet / "main_and_ablation/main/trajectories" / case_id
    inputs = packet / "main_and_ablation/inputs/cases" / case_id
    output.mkdir(parents=True, exist_ok=True)
    trace = read_json(run / "trajectory.json")
    report = read_json(run / "REPORT.json")
    gauges = read_json(inputs / "gauges.json")
    assert trace["case_id"] == case_id and trace["arm"] == "full"
    assert trace["status"] == report["status"] == "complete"
    assert trace["endpoint_repeat_passed"] and report["terminal_repeat"] == "passed"
    assert sha256(run / "REPORT.json") == trace["source_report_sha256"]
    points = trace["points"]
    assert len(points) == 11 and [point["slot"] for point in points] == list(range(11))
    assert [point["stage"] for point in points[1:]] == ["global", "global"] + ["local"] * 8
    assert all(point["retained"] and point["feasible"] and point["measurement_valid"] for point in points[1:])
    maxima = [point["retained_metrics"]["edge_normal_max_epe_nm"] for point in points]
    assert all(later < earlier - 1e-6 for earlier, later in zip(maxima, maxima[1:]))
    assert all(abs(point["candidate_metrics"]["edge_normal_max_epe_nm"] - point["retained_metrics"]["edge_normal_max_epe_nm"]) < 1e-9 for point in points[1:])

    parent = read_json(run / "trials/trial-2/measurement/combined-measurement.json")
    focus_source = parent["hotspots"][0]
    focus = {key: focus_source[key] for key in ("x_um", "y_um", "gauge_id", "normal")}
    x, y = focus["x_um"], focus["y_um"]
    boxes = {
        "core": gauges["core_bbox_um"],
        "zoom": [x - .3, y - .3, x + .3, y + .3],
        "detail": [x - .09, y - .09, x + .09, y + .09],
    }
    viewport = {
        view: {"bbox_um": box, "width_um": box[2] - box[0], "scale_bar_um": bar, "scale_label": label}
        for view, box, bar, label in (
            ("core", boxes["core"], 2, "2 µm"),
            ("zoom", boxes["zoom"], .1, "100 nm"),
            ("detail", boxes["detail"], .025, "25 nm"),
        )
    }
    target_path = inputs / "layout.gds"
    target_layout = k.Layout()
    target_layout.read(str(target_path))
    target = region(target_layout, tuple(gauges["target_layer"]))
    assert not target.is_empty()
    files, frames, public_points, recipe_frames = [], [], [], []
    target_hash = sha256(target_path)
    report_hash = trace["source_report_sha256"]
    for slot in range(12):
        folder = run / "trials" / ("R0" if slot == 0 else "endpoint-repeat" if slot == 11 else f"trial-{slot}")
        measurement_path = folder / "measurement/combined-measurement.json"
        result_path = folder / "calibre_results.gds"
        measurement = read_json(measurement_path)
        assert measurement["measurement_valid"] and measurement["hard_feasible"]
        metrics = measurement["metrics"]
        source_point = points[min(slot, 10)]
        expected = source_point["retained_metrics"]["edge_normal_max_epe_nm"]
        assert abs(metrics["edge_normal_max_epe_nm"] - expected) < 1e-6
        signed_focus = focus_epe(folder / "measurement/fixed-gauge-values.npz", focus)
        layout = k.Layout()
        layout.read(str(result_path))
        assert abs(layout.dbu - target_layout.dbu) < 1e-12
        shapes = {"target": target, **{name: region(layout, layer) for name, layer in LAYER_NUMBERS.items()}}
        assert not shapes["mask"].is_empty() and not shapes["contour"].is_empty()
        assets = {}
        for view, box in boxes.items():
            images = {name: rendered_region(shape, layout.dbu, box, name) for name, shape in shapes.items()}
            images["gauge"] = gauge_image(box, focus, signed_focus)
            images["overlay"] = compose(images, ["pvb", "mask", "sraf", "target", "contour", "gauge"])
            images["mask_view"] = compose(images, ["mask", "sraf", "target"])
            images["resist_view"] = compose(images, ["pvb", "target", "contour", "gauge"])
            images["pvb_view"] = compose(images, ["pvb", "target"])
            assets[view] = {}
            for name, image in images.items():
                filename = f"metal44-{slot:02d}-{view}-{name}.png"
                path = output / filename
                image.save(path, optimize=True)
                assets[view][name] = filename
                files.append({"path": filename, "sha256": sha256(path), "bytes": path.stat().st_size})
        kind = "initial" if slot == 0 else "repeat" if slot == 11 else "candidate"
        frame = {
            "opc_calls": slot,
            "kind": kind,
            "retained_frame": slot if slot < 11 else 10,
            "recipe_sha256": source_point["recipe_sha256"],
            "measurement_sha256": sha256(measurement_path),
            "result_gds_sha256": sha256(result_path),
            "target_sha256": target_hash,
            "metrics": metrics,
            "focus_epe_nm": abs(signed_focus),
            "focus_signed_epe_nm": signed_focus,
            "assets": assets,
        }
        frames.append(frame)
        public_points.append({
            "opc_calls": slot,
            "slot": slot,
            "kind": kind,
            "stage": "repeat" if slot == 11 else source_point["stage"],
            "candidate_metrics": None if slot == 0 else metrics,
            "retained_metrics": source_point["retained_metrics"],
            "retained": True,
            "feasible": True,
            "recipe_sha256": source_point["recipe_sha256"],
        })
        if slot == 0:
            recipe_frames.append({"slot": 0, "kind": "initial", "stage": "initial", "recipe_sha256": source_point["recipe_sha256"], "parent_slot": None, "diff": [], "global_controls": [], "retained": True, "lines_added": 0, "lines_removed": 0})
        elif slot == 11:
            recipe_frames.append({"slot": 11, "kind": "repeat", "stage": "repeat", "recipe_sha256": source_point["recipe_sha256"], "parent_slot": 10, "diff": [], "global_controls": [], "retained": True, "lines_added": 0, "lines_removed": 0})
        else:
            diff = changed_lines(source_point["actual_diff"])
            controls = ["movement"] if slot == 1 else ["feedback"] if slot == 2 else []
            recipe_frames.append({"slot": slot, "kind": kind, "stage": source_point["stage"], "recipe_sha256": source_point["recipe_sha256"], "parent_slot": slot - 1, "diff": diff, "global_controls": controls, "retained": True, "lines_added": sum(line.startswith("+") for line in diff), "lines_removed": sum(line.startswith("-") for line in diff)})
        print(f"rendered Metal44 R{slot if slot < 11 else '10 repeat'}", flush=True)

    public_case = {
        "case_id": case_id,
        "layer": "metal1",
        "view_id": "metal1",
        "display_label": "Metal44",
        "selection": "Dense Metal1 window from the completed online VPEvolve run. All ten measured candidates improve maximum EPE and satisfy the fixed quality limits.",
        "status": "complete",
        "stop_reason": "ten-trial budget completed",
        "initial": points[0]["retained_metrics"],
        "current": points[10]["retained_metrics"],
        "opc_submitted": 11,
        "llm_reserved": report["cost"]["model_calls"],
        "points": public_points,
        "report_sha256": report_hash,
        "prefix": 2,
    }
    public_geometry = {
        "case_id": case_id, "layer": "metal1", "view_id": "metal1", "display_label": "Metal44",
        "frames": frames, "prefix": 2, "parent_slot": 2, "viewport": viewport,
        "focus": focus, "report_sha256": report_hash,
        "scope": "Fixed worst gauge before the first local correction, shown across all measured trials. The global maximum may move to another gauge.",
    }
    documents = {
        "replay-case.json": public_case,
        "geometry-case.json": public_geometry,
        "recipes-case.json": {"case_id": case_id, "frames": recipe_frames},
        "files.json": files,
    }
    for name, document in documents.items():
        (output / name).write_text(json.dumps(document, indent=2) + "\n")
    assert not any(re.search(r"/(?:data|home|Users)/|(?:10|127|192)\.\d+\.\d+\.\d+", (output / name).read_text()) for name in documents)
    print(f"DONE: {len(files)} PNGs; {maxima[0]:.3f} → {maxima[-1]:.3f} nm", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--packet", type=Path, required=True)
    parser.add_argument("--case", default="metal1-44-dense-x20-y740")
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()
    build(arguments.packet, arguments.case, arguments.output)
