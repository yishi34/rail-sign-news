#!/usr/bin/env python3
"""Generate data/map-national-kml.json for all 41 lines (1,685 stations) from KML."""

from __future__ import annotations

import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KML_PATH = Path(r"G:\マイドライブ\Muse\yanaka_ku-tetsu_522953.kml")
OUT_PATH = ROOT / "data" / "map-national-kml.json"

# (id, kmlName, displayName, color, isLoop)
ROUTES_SPEC = [
    # 幹線・広域
    ("tokai", "東海ライン", "東海ライン", "#df6721", False),
    ("sanyo", "山陽ライン", "山陽ライン", "#0072bc", False),
    ("kyushu", "九州ライン", "九州ライン", "#e11d48", False),
    ("tohoku", "東北ライン", "東北ライン", "#2468b4", False),
    ("setouchi", "瀬戸内ライン", "瀬戸内ライン", "#0891b2", False),
    ("toyama", "富山線", "富山線", "#0f766e", False),
    ("gatama", "潟馬線", "潟馬線", "#7c3aed", False),
    ("nagano", "長野線", "長野線", "#2563eb", False),
    ("kitadake-climb", "北岳登山線", "北岳登山線", "#16a34a", False),
    ("yamagata", "山形線", "山形線", "#db2777", False),
    ("oita", "大分線", "大分線", "#ea580c", False),
    ("meifu", "名阜線", "名阜線", "#9333ea", False),
    ("osaka", "大阪線", "大阪線", "#dc2626", False),
    ("daira", "大良線", "大良線", "#0284c7", False),
    ("wakayama", "和歌山線", "和歌山線", "#d97706", False),
    ("tsuyama", "津山線", "津山線", "#059669", False),
    ("kure-branch", "呉支線", "呉支線", "#0d9488", False),
    ("fuchucho-branch", "府中町支線", "府中町支線", "#6366f1", False),
    # 首都圏（25路線のうち幹線2本を除く23路線）
    ("yanaka-line", "谷中線", "谷中線", "#15834e", False),
    ("musashi-loop", "武蔵環状線", "武蔵環状線", "#7b9922", True),
    ("okumusashi", "奥武蔵線", "奥武蔵線", "#f8b500", False),
    ("musashi-branch", "武蔵支線", "武蔵支線", "#d99100", False),
    ("tama", "多摩線", "多摩線", "#079ca3", False),
    ("yamanote-west", "山手西部線", "山手西部線", "#bd9440", False),
    ("sagami-tanzawa", "相模丹沢線", "相模丹沢線", "#675aaf", False),
    ("hamasaki", "濱崎線", "濱崎線", "#426d88", False),
    ("zushi-hayama", "逗子・葉山線", "逗子・葉山線", "#a84a34", False),
    ("tono", "東野線", "東野線", "#cf4169", False),
    ("bay-monorail", "湾岸モノレール", "湾岸モノレール", "#218aaf", False),
    ("rinkai", "臨海線", "臨海線", "#318175", False),
    ("asano", "浅野線", "浅野線", "#c83a2d", False),
    ("gotanda", "五反田線", "五反田線", "#b832a8", False),
    ("oimachi", "大井町線", "大井町線", "#d96b27", False),
    ("hachioji", "八王子線", "八王子線", "#d4860a", False),
    ("hinotama", "檜多摩線", "檜多摩線", "#0b8a8f", False),
    ("musashi", "武蔵線", "武蔵線", "#65a30d", False),
    ("yoto", "葉東線", "葉東線", "#0284c7", False),
    ("tako-branch", "多古支線", "多古支線", "#3b82f6", False),
    ("moriya", "守谷線", "守谷線", "#ea580c", False),
    ("takasaki", "高崎線", "高崎線", "#0891b2", False),
    ("matsusato", "松里線", "松里線", "#2e4a8f", False),
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
            line_name = pm.find("kml:name", ns).text
            coords = [
                [float(p.split(",")[0]), float(p.split(",")[1])]
                for p in ls.find("kml:coordinates", ns).text.strip().split()
            ]
            line_strings[line_name] = coords

    point_folders: dict[str, list[tuple[str, list[float]]]] = {}
    for folder in root.findall(".//kml:Folder", ns):
        fname = folder.find("kml:name", ns).text
        assert fname.endswith("Points"), f"Unexpected folder: {fname}"
        lname = fname[:-len("Points")]
        pts = []
        for pm in folder.findall("kml:Placemark", ns):
            sname = pm.find("kml:name", ns).text
            c_text = pm.find(".//kml:Point/kml:coordinates", ns).text.strip()
            parts = c_text.split(",")
            pts.append((sname, [float(parts[0]), float(parts[1])]))
        point_folders[lname] = pts

    return line_strings, point_folders


def main():
    line_strings, point_folders = parse_kml(KML_PATH)
    lines_out = []
    total_stations = 0
    total_km = 0.0

    for line_id, kml_name, display_name, color, is_loop in ROUTES_SPEC:
        assert kml_name in line_strings, f"Missing LineString: {kml_name}"
        assert kml_name in point_folders, f"Missing Points: {kml_name}"
        coords = line_strings[kml_name]
        pts = point_folders[kml_name]
        stations = []
        for idx, (sname, coord) in enumerate(pts):
            stations.append(
                {
                    "index": idx,
                    "name": sname,
                    "coordinates": coord,
                }
            )
        km = round(line_length_km(coords), 1)
        total_stations += len(stations)
        total_km += line_length_km(coords)
        obj = {
            "id": line_id,
            "name": display_name,
            "kmlName": kml_name,
            "color": color,
            "lengthKm": km,
            "stations": stations,
        }
        if is_loop:
            obj["loop"] = True
        lines_out.append(obj)

    assert len(lines_out) == 41, f"Expected 41 lines, got {len(lines_out)}"
    assert total_stations == 1685, f"Expected 1685 stations, got {total_stations}"

    payload = {
        "source": "空想鉄道 No.522953 谷中日本鐵道 (yanaka_ku-tetsu_522953.kml)",
        "summary": {
            "lineCount": len(lines_out),
            "stationCount": total_stations,
            "totalLengthKm": round(total_km, 1),
        },
        "lines": lines_out,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {OUT_PATH}: lines={len(lines_out)}, stations={total_stations}, length={round(total_km, 1)}km")


if __name__ == "__main__":
    main()
