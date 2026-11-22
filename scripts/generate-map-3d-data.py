#!/usr/bin/env python3
"""Generate data/map-3d-kml.json directly from the authoritative KML file."""

from __future__ import annotations

import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KML_PATH = Path(r"G:\マイドライブ\Muse\yanaka_ku-tetsu_522953.kml")
OUT_PATH = ROOT / "data" / "map-3d-kml.json"

ROUTES_SPEC = [
    ("yanaka-line", "谷中線", "谷中線", "#15834e", None, None, False),
    ("tokai", "東海ライン", "東海ライン（土肥まで）", "#df6721", 91, "土肥", False),
    ("tohoku", "東北ライン", "東北ライン（新豊原まで）", "#2468b4", 47, "新豊原", False),
    ("musashi-loop", "武蔵環状線", "武蔵環状線", "#7b9922", None, None, True),
    ("okumusashi", "奥武蔵線", "奥武蔵線", "#9b326e", None, None, False),
    ("musashi-branch", "武蔵支線", "武蔵支線", "#b84a8a", None, None, False),
    ("tama", "多摩線", "多摩線", "#079ca3", None, None, False),
    ("yamanote-west", "山手西部線", "山手西部線", "#bd9440", None, None, False),
    ("sagami-tanzawa", "相模丹沢線", "相模丹沢線", "#675aaf", None, None, False),
    ("hamasaki", "濱崎線", "濱崎線", "#426d88", None, None, False),
    ("zushi-hayama", "逗子・葉山線", "逗子・葉山線", "#a84a34", None, None, False),
    ("tono", "東野線", "東野線", "#cf4169", None, None, False),
    ("bay-monorail", "湾岸モノレール", "湾岸モノレール", "#218aaf", None, None, False),
    ("rinkai", "臨海線", "臨海線", "#318175", None, None, False),
    ("asano", "浅野線", "浅野線", "#c83a2d", None, None, False),
    ("gotanda", "五反田線", "五反田線", "#b832a8", None, None, False),
    ("oimachi", "大井町線", "大井町線", "#d96b27", None, None, False),
    ("hachioji", "八王子線", "八王子線", "#d4860a", None, None, False),
    ("hinotama", "檜多摩線", "檜多摩線", "#0b8a8f", None, None, False),
    ("musashi", "武蔵線", "武蔵線", "#65a30d", None, None, False),
    ("yoto", "葉東線", "葉東線", "#0284c7", None, None, False),
    ("tako-branch", "多古支線", "多古支線", "#3b82f6", None, None, False),
    ("moriya", "守谷線", "守谷線", "#ea580c", None, None, False),
    ("takasaki", "高崎線", "高崎線", "#0891b2", None, None, False),
    ("matsusato", "松里線", "松里線", "#2e4a8f", None, None, False),
]


def haversine_km(a: list[float], b: list[float]) -> float:
    earth_r = 6371.0
    lat1, lat2 = math.radians(a[1]), math.radians(b[1])
    dlat = math.radians(b[1] - a[1])
    dlon = math.radians(b[0] - a[0])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2.0 * earth_r * math.asin(math.sqrt(h))


def line_length_km(coords: list[list[float]]) -> float:
    return sum(haversine_km(a, b) for a, b in zip(coords, coords[1:]))


def parse_kml(kml_path: Path):
    tree = ET.parse(kml_path)
    root = tree.getroot()
    ns = {"kml": "http://www.opengis.net/kml/2.2"}

    line_strings: dict[str, list[list[float]]] = {}
    for pm in root.findall(".//kml:Placemark", ns):
        ls = pm.find(".//kml:LineString", ns)
        if ls is not None:
            name_el = pm.find("kml:name", ns)
            coords_el = ls.find("kml:coordinates", ns)
            assert name_el is not None and name_el.text is not None
            assert coords_el is not None and coords_el.text is not None
            line_name = name_el.text
            coords = []
            for tok in coords_el.text.strip().split():
                parts = tok.split(",")
                coords.append([float(parts[0]), float(parts[1])])
            line_strings[line_name] = coords

    point_folders: dict[str, list[tuple[str, list[float]]]] = {}
    for folder in root.findall(".//kml:Folder", ns):
        fname = folder.find("kml:name", ns).text
        assert fname.endswith("Points"), f"Unexpected folder name: {fname}"
        lname = fname[: -len("Points")]
        pts = []
        for pm in folder.findall("kml:Placemark", ns):
            sname = pm.find("kml:name", ns).text
            assert sname is not None
            c_text = pm.find(".//kml:Point/kml:coordinates", ns).text.strip()
            parts = c_text.split(",")
            pts.append((sname, [float(parts[0]), float(parts[1])]))
        point_folders[lname] = pts

    return line_strings, point_folders


def main():
    line_strings, point_folders = parse_kml(KML_PATH)

    selected_raw = []
    name_to_lines: dict[str, set[str]] = {}

    for line_id, kml_name, display_name, color, end_idx, expected_end_name, is_loop in ROUTES_SPEC:
        assert kml_name in line_strings, f"Missing LineString: {kml_name}"
        assert kml_name in point_folders, f"Missing Point folder: {kml_name}"

        full_coords = line_strings[kml_name]
        full_pts = point_folders[kml_name]

        if end_idx is not None:
            pts = full_pts[: end_idx + 1]
            assert pts[-1][0] == expected_end_name, (
                f"Expected end {expected_end_name} at idx {end_idx} of {kml_name}, got {pts[-1][0]}"
            )
            end_coord = pts[-1][1]
            v_idx = min(range(len(full_coords)), key=lambda j: haversine_km(end_coord, full_coords[j]))
            end_err = haversine_km(end_coord, full_coords[v_idx])
            assert end_err < 0.0001, f"End station vertex mismatch for {kml_name}: {end_err}"
            coords = full_coords[: v_idx + 1]
            truncated = True
        else:
            pts = full_pts
            coords = full_coords
            truncated = False

        for sname, _ in pts:
            name_to_lines.setdefault(sname, set()).add(line_id)

        selected_raw.append(
            (line_id, kml_name, display_name, color, is_loop, truncated, pts, coords)
        )

    lines_out = []
    total_stations = 0
    total_vertices = 0
    total_km = 0.0

    for line_id, kml_name, display_name, color, is_loop, truncated, pts, coords in selected_raw:
        stations = []
        for idx, (sname, coord) in enumerate(pts):
            min_err = min(haversine_km(coord, v) for v in coords)
            assert min_err < 0.0001, (
                f"Station point not on LineString: {kml_name}[{idx}] {sname!r} err={min_err}"
            )
            stations.append(
                {
                    "index": idx,
                    "name": sname,
                    "coordinates": coord,
                    "hub": len(name_to_lines[sname]) >= 2,
                }
            )

        km = round(line_length_km(coords), 1)
        total_stations += len(stations)
        total_vertices += len(coords)
        total_km += line_length_km(coords)

        obj = {
            "id": line_id,
            "name": display_name,
            "kmlName": kml_name,
            "color": color,
        }
        if is_loop:
            obj["loop"] = True
        obj["lengthKm"] = km
        if truncated:
            obj["truncated"] = True
        obj["path"] = coords
        obj["stations"] = stations
        lines_out.append(obj)

    assert len(lines_out) == 25, f"Expected 25 lines, got {len(lines_out)}"
    assert total_stations == 672, f"Expected 672 stations, got {total_stations}"
    assert total_vertices == 4806, f"Expected 4806 vertices, got {total_vertices}"

    tokai_line = next(l for l in lines_out if l["id"] == "tokai")
    assert tokai_line["stations"][-1]["name"] == "土肥"
    assert len(tokai_line["stations"]) == 92 and len(tokai_line["path"]) == 1070

    tohoku_line = next(l for l in lines_out if l["id"] == "tohoku")
    assert tohoku_line["stations"][-1]["name"] == "新豊原"
    assert len(tohoku_line["stations"]) == 48 and len(tohoku_line["path"]) == 218

    payload = {
        "source": "空想鉄道 No.522953 谷中日本鐵道 (yanaka_ku-tetsu_522953.kml)",
        "note": "経路・駅位置は空想鉄道 No.522953 の KML 正データ準拠（首都圏25路線・672駅）。高さと配色は仮置き（識別用）です。",
        "summary": {
            "lineCount": len(lines_out),
            "stationCount": total_stations,
            "vertexCount": total_vertices,
            "totalLengthKm": round(total_km, 1),
        },
        "lines": lines_out,
    }

    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Generated {OUT_PATH}: lines={len(lines_out)}, stations={total_stations}, "
        f"vertices={total_vertices}, length={round(total_km, 1)}km"
    )


if __name__ == "__main__":
    main()
