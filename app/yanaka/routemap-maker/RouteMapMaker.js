"use client";

import { useMemo, useState } from "react";

const SAMPLE_LINE = {
  name: "谷鉄 桜小町線",
  nameEn: "SAKURA-KOMACHI LINE",
  types: [
    { id: "local", label: "普通", color: "#1b7a40" },
    { id: "limited", label: "有料特急", color: "#e60012" },
    { id: "rapid", label: "急行", color: "#f5a900" },
  ],
  stations: [
    { name: "谷鉄藤沢", stops: { limited: true, rapid: true, local: true } },
    { name: "白旗神社前", stops: { limited: false, rapid: false, local: true } },
    { name: "引地桜町", stops: { limited: false, rapid: true, local: true } },
    { name: "湘南台", stops: { limited: true, rapid: true, local: true } },
    { name: "遠藤", stops: { limited: false, rapid: false, local: true } },
    { name: "慶應湘南藤沢前", stops: { limited: false, rapid: true, local: true } },
    { name: "桜小町", stops: { limited: true, rapid: true, local: true } },
    { name: "谷鉄寒川", stops: { limited: true, rapid: true, local: true } },
  ],
  branches: [
    {
      id: "sakura-branch",
      name: "桜小町支線",
      fromIndex: 3,
      stations: ["湘南台北口", "慶應北門前", "谷鉄遠藤北"],
    },
  ],
};

const TYPE_PRESETS = [
  { label: "普通", color: "#1b7a40" },
  { label: "急行", color: "#f5a900" },
  { label: "快速", color: "#2ca9e1" },
  { label: "特急", color: "#e60012" },
  { label: "有料特急", color: "#8f76d6" },
];

const COLOR_SWATCHES = ["#1b7a40", "#f5a900", "#e60012", "#2ca9e1", "#8f76d6", "#c83a2d", "#9acd32", "#1a1a1a"];

const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
function typeNumber(index) {
  return CIRCLED_NUMBERS[index] || `(${index + 1})`;
}

function geoIndex(index, total) {
  return index === 0 ? total - 1 : index - 1;
}

const SVG_STYLE = `
.mk-tier{font-weight:900;font-size:15px;font-family:'Noto Sans JP',sans-serif}
.mk-name{font-size:15px;font-weight:600;fill:#6e7479;font-family:'Noto Sans JP',sans-serif}
.mk-name-major{font-weight:900;fill:#1a1a1a}
.mk-pill-text{font-size:13px;font-weight:900;fill:#fff;font-family:'Noto Sans JP',sans-serif}
.mk-branch-label{font-size:13px;font-weight:900;fill:#1a1a1a;font-family:'Noto Sans JP',sans-serif}
.mk-title{font-size:22px;font-weight:900;fill:#1a1a1a;font-family:'Noto Sans JP',sans-serif}
.mk-title-en{font-size:12px;font-weight:600;fill:#6e7479;font-family:'Barlow Semi Condensed',sans-serif}
.mk-legend{font-size:13px;font-weight:700;fill:#1a1a1a;font-family:'Noto Sans JP',sans-serif}
`;

const NS = "http://www.w3.org/2000/svg";

function cloneLine(line) {
  return {
    ...line,
    types: line.types.map((type) => ({ ...type })),
    stations: line.stations.map((station) => ({
      ...station,
      stops: { ...station.stops },
    })),
    branches: (line.branches || []).map((branch) => ({
      ...branch,
      stations: [...branch.stations],
    })),
  };
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function filenameSafe(name) {
  return (name || "route-map").replace(/[\\/:*?"<>|]/g, "_").trim() || "route-map";
}

function allTypesStop(station, types) {
  return types.every((type) => station?.stops?.[type.id]);
}

function validateLine(line) {
  const types = line.types || [];
  const stations = line.stations || [];
  if (!types.length || stations.length < 2) return [];

  const errors = [];
  const firstStation = stations[0];
  const lastStation = stations[stations.length - 1];
  if (!allTypesStop(firstStation, types)) {
    errors.push(`始点「${firstStation.name || "駅名"}」はすべての種別が停車する必要があります。`);
  }
  if (!allTypesStop(lastStation, types)) {
    errors.push(`終点「${lastStation.name || "駅名"}」はすべての種別が停車する必要があります。`);
  }

  (line.branches || []).forEach((branch) => {
    const fromIndex = Math.max(0, Math.min(stations.length - 1, Number(branch.fromIndex) || 0));
    const fromStation = stations[fromIndex];
    if (!allTypesStop(fromStation, types)) {
      errors.push(`支線「${branch.name || "支線"}」の分岐駅「${fromStation.name || "駅名"}」はすべての種別が停車する必要があります。`);
    }
    if (!branch.stations?.length) {
      errors.push(`支線「${branch.name || "支線"}」には終点駅を1つ以上入れてください。`);
    }
  });

  return errors;
}

function defaultBranchIndex(stations, types) {
  const middleAllStop = stations.findIndex((station, index) => index > 0 && index < stations.length - 1 && allTypesStop(station, types));
  if (middleAllStop >= 0) return middleAllStop;
  const anyAllStop = stations.findIndex((station) => allTypesStop(station, types));
  return anyAllStop >= 0 ? anyAllStop : 0;
}

function buildPdf(jpeg, iw, ih) {
  const W = (iw / 2).toFixed(2);
  const H = (ih / 2).toFixed(2);
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const xref = [];
  const push = (bytes) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushStr = (s) => push(enc.encode(s));
  const content = `q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ`;

  pushStr("%PDF-1.3\n");
  xref[1] = offset;
  pushStr("1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n");
  xref[2] = offset;
  pushStr("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");
  xref[3] = offset;
  pushStr(
    `3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>\nendobj\n`
  );
  xref[4] = offset;
  pushStr(
    `4 0 obj\n<</Type/XObject/Subtype/Image/Width ${iw}/Height ${ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`
  );
  push(jpeg);
  pushStr("\nendstream\nendobj\n");
  xref[5] = offset;
  pushStr(`5 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefOffset = offset;
  let xrefStr = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xrefStr += String(xref[i]).padStart(10, "0") + " 00000 n \n";
  }
  pushStr(xrefStr);
  pushStr(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`);

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildExportSvg(line) {
  const svg = document.getElementById("maker-routemap-svg");
  if (!svg) return null;
  const w = Number(svg.getAttribute("width"));
  const baseH = Number(svg.getAttribute("height"));
  const header = 106;
  const h = baseH + header;

  const el = (name, attrs) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
  };
  const textEl = (x, y, str, cls) => {
    const t = el("text", { x, y, class: cls });
    t.textContent = str;
    return t;
  };

  const out = el("svg", { xmlns: NS, viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const style = document.createElementNS(NS, "style");
  style.textContent = SVG_STYLE;
  out.appendChild(style);
  out.appendChild(el("rect", { x: 0, y: 0, width: w, height: h, fill: "#fff" }));
  out.appendChild(el("rect", { x: 8, y: 10, width: 8, height: 12, fill: "#f5a900" }));
  out.appendChild(el("rect", { x: 8, y: 30, width: 8, height: 12, fill: "#1b7a40" }));
  out.appendChild(textEl(28, 31, line.name, "mk-title"));
  out.appendChild(textEl(28, 50, line.nameEn, "mk-title-en"));
  out.appendChild(el("line", { x1: 18, y1: 62, x2: w - 18, y2: 62, stroke: "#1b7a40", "stroke-width": 2 }));

  line.types.forEach((type, index) => {
    const x = 30 + index * 118;
    out.appendChild(el("circle", { cx: x, cy: 86, r: 7, fill: "#fff", stroke: type.color, "stroke-width": 3 }));
    out.appendChild(textEl(x + 13, 90, `${type.label || "種別"}停車駅`, "mk-legend"));
  });

  const g = el("g", { transform: `translate(0 ${header})` });
  Array.from(svg.childNodes).forEach((n) => g.appendChild(n.cloneNode(true)));
  out.appendChild(g);

  return { str: new XMLSerializer().serializeToString(out), w, h };
}

async function exportCanvas(line, scale = 2) {
  const info = buildExportSvg(line);
  if (!info) return null;
  const blob = new Blob([info.str], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = info.w * scale;
    canvas.height = info.h * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function MakerSvg({ line }) {
  const metrics = useMemo(() => {
    const types = line.types.length ? line.types : [{ id: "local", label: "普通", color: "#1b7a40" }];
    const stations = line.stations.length ? line.stations : [{ name: "駅名", stops: { [types[0].id]: true } }];
    const branches = line.branches || [];
    const lineX0 = 86;
    const lineGap = 28;
    const top = 66;
    const stationStep = 68;
    const stopRadius = 7;
    const lineRight = lineX0 + (types.length - 1) * lineGap;
    const nameX = lineRight + 36;
    const maxNameChars = Math.max(...stations.map((station) => (station.name || "駅名").length));
    const branchBaseX = nameX + maxNameChars * 16 + (branches.length ? 56 : 0);
    const branchGap = 220;
    const maxBranchChars = Math.max(
      0,
      ...branches.flatMap((branch) => [branch.name || "支線", ...(branch.stations || ["駅名"])]).map((name) => name.length)
    );
    const branchRight = branches.length ? branchBaseX + (branches.length - 1) * branchGap + maxBranchChars * 16 + 70 : 0;
    const width = Math.max(360, nameX + maxNameChars * 16 + 34, branchRight);
    const bottom = top + (stations.length - 1) * stationStep;
    const branchBottom = Math.max(
      bottom,
      ...branches.map((branch) => {
        const fromIndex = Math.max(0, Math.min(stations.length - 1, Number(branch.fromIndex) || 0));
        const stationCount = Math.max(1, branch.stations?.length || 1);
        return top + (fromIndex + stationCount) * stationStep;
      })
    );
    const height = branchBottom + 52;
    const pillWidth = Math.max(94, Math.min(width - 36, (line.name || "路線名").length * 15 + 34));
    return {
      types,
      stations,
      branches,
      lineX0,
      lineGap,
      top,
      stationStep,
      stopRadius,
      lineRight,
      nameX,
      branchBaseX,
      branchGap,
      width,
      height,
      bottom,
      pillWidth,
      localType: types[0],
      localTypeIndex: types.length - 1,
      majorType: types[1] || types[0],
    };
  }, [line]);

  const xAt = (index) => metrics.lineX0 + index * metrics.lineGap;
  const yAt = (index) => metrics.top + index * metrics.stationStep;
  const branchXAt = (index) => metrics.branchBaseX + index * metrics.branchGap;

  return (
    <svg
      id="maker-routemap-svg"
      className="maker-svg"
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      width={metrics.width}
      height={metrics.height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${line.name} 路線図`}
    >
      <rect x="18" y="16" width={metrics.pillWidth} height="30" rx="15" fill="#b42a2a" />
      <text x="34" y="36" className="mk-pill-text">
        {line.name || "路線名"}
      </text>
      {metrics.types.map((type, typeIndex) => (
        <g key={type.id}>
          <line
            x1={xAt(geoIndex(typeIndex, metrics.types.length))}
            y1={metrics.top}
            x2={xAt(geoIndex(typeIndex, metrics.types.length))}
            y2={metrics.bottom}
            stroke={type.color}
            strokeWidth={typeIndex === 0 ? 10 : 8}
            strokeLinecap="round"
          />
        </g>
      ))}

      {metrics.stations.map((station, stationIndex) => {
        const y = yAt(stationIndex);
        const stopIndexes = metrics.types
          .map((type, index) => (station.stops[type.id] ? geoIndex(index, metrics.types.length) : null))
          .filter((index) => index !== null);
        const firstStop = stopIndexes.length ? Math.min(...stopIndexes) : null;
        const lastStop = stopIndexes.length ? Math.max(...stopIndexes) : null;
        return (
          <g key={`${station.name}-${stationIndex}`}>
            {firstStop !== null && firstStop < lastStop && (
              <line x1={xAt(firstStop)} y1={y} x2={xAt(lastStop)} y2={y} stroke="#c2c6c9" strokeWidth="3" />
            )}
            {metrics.types.map((type, typeIndex) =>
              station.stops[type.id] ? (
                <circle
                  key={type.id}
                  cx={xAt(geoIndex(typeIndex, metrics.types.length))}
                  cy={y}
                  r={metrics.stopRadius}
                  fill="#fff"
                  stroke={type.color}
                  strokeWidth="3"
                />
              ) : null
            )}
            <text
              x={metrics.nameX}
              y={y + 5}
              className={station.stops[metrics.majorType.id] ? "mk-name mk-name-major" : "mk-name"}
              textAnchor="start"
            >
              {station.name || "駅名"}
            </text>
          </g>
        );
      })}

      {metrics.branches.map((branch, branchIndex) => {
        const fromIndex = Math.max(0, Math.min(metrics.stations.length - 1, Number(branch.fromIndex) || 0));
        const fromY = yAt(fromIndex);
        const branchX = branchXAt(branchIndex);
        const localX = xAt(metrics.localTypeIndex);
        const stationNames = branch.stations?.length ? branch.stations : ["支線終点"];
        const firstBranchRow = fromIndex + 1;
        const firstBranchY = yAt(firstBranchRow);
        const lastY = yAt(firstBranchRow + stationNames.length - 1);
        const branchDx = branchX - localX;
        const branchDy = firstBranchY - fromY;
        const branchLength = Math.hypot(branchDx, branchDy) || 1;
        const branchStartX = localX + (branchDx / branchLength) * metrics.stopRadius;
        const branchStartY = fromY + (branchDy / branchLength) * metrics.stopRadius;
        return (
          <g key={branch.id}>
            <polyline
              points={`${branchStartX.toFixed(1)},${branchStartY.toFixed(1)} ${branchX},${firstBranchY}`}
              stroke={metrics.localType.color}
              strokeWidth="8"
              strokeLinecap="butt"
              strokeLinejoin="round"
              fill="none"
            />
            {stationNames.length > 1 && (
              <line
                x1={branchX}
                y1={firstBranchY}
                x2={branchX}
                y2={lastY}
                stroke={metrics.localType.color}
                strokeWidth="8"
                strokeLinecap="round"
              />
            )}
            <text x={branchX + 18} y={firstBranchY - 22} className="mk-branch-label" textAnchor="start">
              {branch.name || "支線"}
            </text>
            {stationNames.map((name, stationIndex) => {
              const y = yAt(firstBranchRow + stationIndex);
              return (
                <g key={`${branch.id}-${stationIndex}`}>
                  <circle cx={branchX} cy={y} r={metrics.stopRadius} fill="#fff" stroke={metrics.localType.color} strokeWidth="3" />
                  <text x={branchX + 26} y={y + 5} className="mk-name" textAnchor="start">
                    {name || "駅名"}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function sampleLineForEditing() {
  const sample = cloneLine(SAMPLE_LINE);
  sample.name = "";
  sample.nameEn = "";
  sample.types = sample.types.map((type) => ({ ...type, label: "" }));
  sample.stations = sample.stations.map((station) => ({ ...station, name: "" }));
  sample.branches = (sample.branches || []).map((branch) => ({
    ...branch,
    name: "",
    stations: branch.stations.map(() => ""),
  }));
  return sample;
}

export default function RouteMapMaker() {
  const [line, setLine] = useState(() => sampleLineForEditing());
  const [previewLine, setPreviewLine] = useState(() => cloneLine(SAMPLE_LINE));
  const [isPreviewDirty, setIsPreviewDirty] = useState(false);
  const validationErrors = useMemo(() => validateLine(line), [line]);
  const previewValidationErrors = useMemo(() => validateLine(previewLine), [previewLine]);
  const localType = line.types[0] || { label: "普通", color: "#1b7a40" };
  const canGenerate = validationErrors.length === 0;
  const canExport = previewValidationErrors.length === 0 && !isPreviewDirty;

  const updateLine = (updater) => {
    setLine(updater);
    setIsPreviewDirty(true);
  };

  // 確定的な操作(チェック・色・追加/削除・分岐駅選択)はプレビューへ即時反映する
  const updateLineImmediate = (updater) => {
    const wrapped = (current) => {
      const next = updater(current);
      const lastIndex = next.stations.length - 1;
      const stations = next.stations.map((station, index) =>
        index === lastIndex
          ? { ...station, stops: Object.fromEntries(next.types.map((type) => [type.id, true])) }
          : station
      );
      const branches = !next.branches?.length
        ? next.branches
        : next.branches.map((branch) => {
            const station = stations[branch.fromIndex];
            if (station && allTypesStop(station, next.types)) return branch;
            return { ...branch, fromIndex: defaultBranchIndex(stations, next.types) };
          });
      return { ...next, stations, branches };
    };
    setLine(wrapped);
    setPreviewLine(wrapped);
  };

  const setBasic = (key, value) => updateLine((current) => ({ ...current, [key]: value }));

  const updateType = (typeId, key, value) => {
    const updater = (current) => {
      if (key === "color" && current.types.some((type) => type.id !== typeId && type.color === value)) {
        return current;
      }
      return {
        ...current,
        types: current.types.map((type) => (type.id === typeId ? { ...type, [key]: value } : type)),
      };
    };
    if (key === "color") {
      updateLineImmediate(updater);
    } else {
      updateLine(updater);
    }
  };

  const MAX_TYPES = 4;

  const addType = () => {
    updateLineImmediate((current) => {
      if (current.types.length >= MAX_TYPES) return current;
      const preset = TYPE_PRESETS[current.types.length % TYPE_PRESETS.length];
      const id = makeId("type");
      return {
        ...current,
        types: [...current.types, { id, ...preset }],
        stations: current.stations.map((station, index) => ({
          ...station,
          stops: { ...station.stops, [id]: index === 0 || index === current.stations.length - 1 },
        })),
      };
    });
  };

  const removeType = (typeId) => {
    updateLineImmediate((current) => {
      if (current.types.length <= 1) return current;
      if (current.types[0]?.id === typeId) return current;
      return {
        ...current,
        types: current.types.filter((type) => type.id !== typeId),
        stations: current.stations.map((station) => {
          const stops = { ...station.stops };
          delete stops[typeId];
          return { ...station, stops };
        }),
      };
    });
  };

  const updateStationName = (index, name) => {
    updateLine((current) => ({
      ...current,
      stations: current.stations.map((station, i) => (i === index ? { ...station, name } : station)),
    }));
  };

  const toggleStop = (stationIndex, typeId) => {
    updateLineImmediate((current) => {
      if (current.types[0]?.id === typeId) return current;
      if (stationIndex === current.stations.length - 1) return current;
      return {
        ...current,
        stations: current.stations.map((station, index) =>
          index === stationIndex
            ? { ...station, stops: { ...station.stops, [typeId]: !station.stops[typeId] } }
            : station
        ),
      };
    });
  };

  const addStation = () => {
    updateLineImmediate((current) => ({
      ...current,
      stations: [
        ...current.stations,
        {
          name: `新駅${current.stations.length + 1}`,
          stops: Object.fromEntries(current.types.map((type) => [type.id, true])),
        },
      ],
    }));
  };

  const removeStation = (index) => {
    updateLineImmediate((current) => {
      if (current.stations.length <= 2) return current;
      const nextLength = current.stations.length - 1;
      return {
        ...current,
        stations: current.stations.filter((_, i) => i !== index),
        branches: (current.branches || []).map((branch) => {
          const fromIndex = Number(branch.fromIndex) || 0;
          const nextIndex = fromIndex > index ? fromIndex - 1 : fromIndex === index ? Math.min(index, nextLength - 1) : fromIndex;
          return { ...branch, fromIndex: Math.max(0, nextIndex) };
        }),
      };
    });
  };

  const addBranch = () => {
    updateLineImmediate((current) => {
      if ((current.branches || []).length >= 1) return current;
      return {
        ...current,
        branches: [
          ...(current.branches || []),
          {
            id: makeId("branch"),
            name: `支線${(current.branches || []).length + 1}`,
            fromIndex: defaultBranchIndex(current.stations, current.types),
            stations: ["新支線駅1"],
          },
        ],
      };
    });
  };
  const removeBranch = (branchId) => {
    updateLineImmediate((current) => ({
      ...current,
      branches: (current.branches || []).filter((branch) => branch.id !== branchId),
    }));
  };

  const updateBranch = (branchId, key, value) => {
    const updater = (current) => ({
      ...current,
      branches: (current.branches || []).map((branch) => (branch.id === branchId ? { ...branch, [key]: value } : branch)),
    });
    if (key === "fromIndex") {
      updateLineImmediate(updater);
    } else {
      updateLine(updater);
    }
  };

  const addBranchStation = (branchId) => {
    updateLineImmediate((current) => ({
      ...current,
      branches: (current.branches || []).map((branch) =>
        branch.id === branchId ? { ...branch, stations: [...branch.stations, `新支線駅${branch.stations.length + 1}`] } : branch
      ),
    }));
  };

  const updateBranchStation = (branchId, stationIndex, name) => {
    updateLine((current) => ({
      ...current,
      branches: (current.branches || []).map((branch) =>
        branch.id === branchId
          ? { ...branch, stations: branch.stations.map((station, index) => (index === stationIndex ? name : station)) }
          : branch
      ),
    }));
  };

  const removeBranchStation = (branchId, stationIndex) => {
    updateLineImmediate((current) => ({
      ...current,
      branches: (current.branches || []).map((branch) =>
        branch.id === branchId && branch.stations.length > 1
          ? { ...branch, stations: branch.stations.filter((_, index) => index !== stationIndex) }
          : branch
      ),
    }));
  };

  const resetSample = () => {
    setLine(sampleLineForEditing());
    setPreviewLine(cloneLine(SAMPLE_LINE));
    setIsPreviewDirty(false);
  };

  const generatePreview = () => {
    if (!canGenerate) return;
    setPreviewLine(cloneLine(line));
    setIsPreviewDirty(false);
  };

  const exportSvgFile = () => {
    if (!canExport) return;
    const info = buildExportSvg(previewLine);
    if (!info) return;
    triggerDownload(new Blob([info.str], { type: "image/svg+xml;charset=utf-8" }), `${filenameSafe(previewLine.name)}_路線図.svg`);
  };

  const exportPng = async () => {
    if (!canExport) return;
    const canvas = await exportCanvas(previewLine, 2);
    if (!canvas) return;
    canvas.toBlob((blob) => blob && triggerDownload(blob, `${filenameSafe(previewLine.name)}_路線図.png`), "image/png");
  };

  const exportPdf = async () => {
    if (!canExport) return;
    const canvas = await exportCanvas(previewLine, 2);
    if (!canvas) return;
    const jpeg = dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92));
    const pdf = buildPdf(jpeg, canvas.width, canvas.height);
    triggerDownload(new Blob([pdf], { type: "application/pdf" }), `${filenameSafe(previewLine.name)}_路線図.pdf`);
  };

  return (
    <section className="maker-tool">
      <div className="line-head">
        <span className="line-band" style={{ background: "#2ca9e1" }}></span>
        <h2>作成画面</h2>
        <span className="en-sub en">EDITOR</span>
      </div>

      <div className="maker-layout">
        <div className="maker-controls">
          {validationErrors.length > 0 && (
            <div className="maker-errors" role="alert">
              <strong>入力エラー</strong>
              <ul>
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="maker-box">
            <div className="maker-box-head">
              <h3>基本</h3>
              <button type="button" className="maker-secondary" onClick={resetSample}>
                サンプル
              </button>
            </div>
            <label className="maker-field">
              <span>路線名</span>
              <input
                value={line.name}
                onChange={(e) => setBasic("name", e.target.value)}
                placeholder={SAMPLE_LINE.name}
              />
            </label>
            <label className="maker-field">
              <span>英字名</span>
              <input
                value={line.nameEn}
                onChange={(e) => setBasic("nameEn", e.target.value)}
                placeholder={SAMPLE_LINE.nameEn}
              />
            </label>
          </div>

          <div className="maker-box">
            <div className="maker-box-head">
              <h3>種別</h3>
              <button
                type="button"
                className="maker-secondary"
                onClick={addType}
                disabled={line.types.length >= MAX_TYPES}
              >
                追加
              </button>
            </div>
            <p className="maker-help">
              種別は最大{MAX_TYPES}つまでです。①は各駅停車の基準として固定され、削除・停車パターンの変更はできません。
            </p>
            <div className="maker-type-list">
              {line.types.map((type, typeIndex) => (
                <div className="maker-type-row" key={type.id}>
                  <span className="maker-type-num" style={{ color: type.color }}>
                    {typeNumber(typeIndex)}
                  </span>
                  <input
                    className="maker-type-name"
                    value={type.label}
                    onChange={(e) => updateType(type.id, "label", e.target.value)}
                    placeholder={SAMPLE_LINE.types[typeIndex]?.label || ""}
                    aria-label={`${type.label || "種別"}の種別名`}
                  />
                  <input
                    className="maker-color-input"
                    type="color"
                    value={type.color}
                    onChange={(e) => updateType(type.id, "color", e.target.value)}
                    aria-label={`${type.label || "種別"}の色`}
                  />
                  <button
                    type="button"
                    className="maker-mini"
                    onClick={() => removeType(type.id)}
                    disabled={typeIndex === 0}
                  >
                    削除
                  </button>
                  <div className="maker-swatches">
                    {COLOR_SWATCHES.map((color) => {
                      const isTaken = line.types.some((other) => other.id !== type.id && other.color === color);
                      return (
                        <button
                          type="button"
                          className="maker-swatch"
                          style={{ background: color }}
                          key={color}
                          onClick={() => updateType(type.id, "color", color)}
                          disabled={isTaken}
                          title={isTaken ? "他の種別で使用中です" : undefined}
                          aria-label={`${type.label || "種別"}を${color}にする${isTaken ? "(使用中)" : ""}`}
                        ></button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="maker-box">
            <div className="maker-box-head">
              <h3>停車駅</h3>
              <button type="button" className="maker-secondary" onClick={addStation}>
                追加
              </button>
            </div>
            <p className="maker-help">終点(一番下)の駅は全種別停車に固定され、変更はできません。</p>
            <div className="maker-stop-table">
              <div
                className="maker-stop-row maker-stop-head"
                style={{ gridTemplateColumns: `122px repeat(${line.types.length},36px) 44px` }}
              >
                <span>駅名</span>
                {line.types.map((type, typeIndex) => (
                  <span className="maker-stop-num" key={type.id} style={{ color: type.color }} title={type.label || "種別"}>
                    {typeNumber(typeIndex)}
                  </span>
                ))}
                <span></span>
              </div>
              {line.stations.map((station, stationIndex) => (
                <div
                  className="maker-stop-row"
                  style={{ gridTemplateColumns: `122px repeat(${line.types.length},36px) 44px` }}
                  key={stationIndex}
                >
                  <input
                    value={station.name}
                    onChange={(e) => updateStationName(stationIndex, e.target.value)}
                    placeholder={SAMPLE_LINE.stations[stationIndex]?.name || ""}
                    aria-label={`${stationIndex + 1}番目の駅名`}
                  />
                  {line.types.map((type, typeIndex) => {
                    const isLastStation = stationIndex === line.stations.length - 1;
                    const isFixed = typeIndex === 0 || isLastStation;
                    return (
                      <label className="maker-check" key={type.id} style={{ "--check-color": type.color }}>
                        <input
                          type="checkbox"
                          checked={isFixed ? true : Boolean(station.stops[type.id])}
                          disabled={isFixed}
                          onChange={() => toggleStop(stationIndex, type.id)}
                        />
                        <span></span>
                      </label>
                    );
                  })}
                  <button type="button" className="maker-mini" onClick={() => removeStation(stationIndex)}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="maker-box">
            <div className="maker-box-head">
              <h3>支線</h3>
              <button
                type="button"
                className="maker-secondary"
                onClick={addBranch}
                disabled={(line.branches || []).length >= 1}
              >
                追加
              </button>
            </div>
            <p className="maker-help">支線は①の種別（現在: {localType.label || "種別"}）だけで描画します。支線は1本まで追加できます。</p>
            {(line.branches || []).length === 0 ? (
              <p className="maker-empty">支線なし</p>
            ) : (
              <div className="maker-branch-list">
                {line.branches.map((branch, branchIndex) => (
                  <div className="maker-branch-card" key={branch.id}>
                    <div className="maker-branch-head">
                      <input
                        className="maker-type-name"
                        value={branch.name}
                        onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                        placeholder={SAMPLE_LINE.branches[branchIndex]?.name || ""}
                        aria-label={`${branch.name || "支線"}の支線名`}
                      />
                      <button type="button" className="maker-mini" onClick={() => removeBranch(branch.id)}>
                        削除
                      </button>
                    </div>
                    <label className="maker-field">
                      <span>分岐駅</span>
                      <select
                        value={Math.max(0, Math.min(line.stations.length - 1, Number(branch.fromIndex) || 0))}
                        onChange={(e) => updateBranch(branch.id, "fromIndex", Number(e.target.value))}
                      >
                        {line.stations.map((station, index) =>
                          allTypesStop(station, line.types) ? (
                            <option key={index} value={index}>
                              {station.name || SAMPLE_LINE.stations[index]?.name || `駅${index + 1}`}
                            </option>
                          ) : null
                        )}
                      </select>
                    </label>
                    <div className="maker-branch-stations">
                      <div className="maker-branch-subhead">
                        <span>支線の駅</span>
                        <button type="button" className="maker-mini" onClick={() => addBranchStation(branch.id)}>
                          駅追加
                        </button>
                      </div>
                      {branch.stations.map((station, stationIndex) => (
                        <div className="maker-branch-row" key={`${branch.id}-${stationIndex}`}>
                          <input
                            value={station}
                            onChange={(e) => updateBranchStation(branch.id, stationIndex, e.target.value)}
                            placeholder={SAMPLE_LINE.branches[branchIndex]?.stations[stationIndex] || ""}
                            aria-label={`${branch.name || "支線"} ${stationIndex + 1}番目の駅名`}
                          />
                          <button type="button" className="maker-mini" onClick={() => removeBranchStation(branch.id, stationIndex)}>
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="maker-preview">
          <div className="maker-preview-head">
            <div>
              <h3>{previewLine.name || "路線名"}</h3>
              <span className="en">{previewLine.nameEn || "ROUTE MAP"}</span>
            </div>
            <div className="maker-preview-actions">
              <button type="button" className="maker-generate" onClick={generatePreview} disabled={!canGenerate || !isPreviewDirty}>
                {isPreviewDirty ? "路線図を生成" : "生成済み"}
              </button>
              <div className="maker-export">
                <button type="button" onClick={exportPng} disabled={!canExport}>PNG</button>
                <button type="button" onClick={exportPdf} disabled={!canExport}>PDF</button>
                <button type="button" onClick={exportSvgFile} disabled={!canExport}>SVG</button>
              </div>
            </div>
          </div>
          {isPreviewDirty && <p className="maker-preview-error">未反映の編集があります。「路線図を生成」を押すと右側に反映されます。</p>}
          {validationErrors.length > 0 && <p className="maker-preview-error">入力エラーがあるため生成・出力できません。</p>}
          <div className="maker-legend">
            {previewLine.types.map((type) => (
              <span key={type.id}>
                <i style={{ borderColor: type.color }}></i>
                {type.label || "種別"}停車駅
              </span>
            ))}
          </div>
          <div className="maker-scroll">
            <MakerSvg line={previewLine} />
          </div>
        </div>
      </div>
    </section>
  );
}
