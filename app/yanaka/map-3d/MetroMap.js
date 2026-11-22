"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Minus, LocateFixed, Compass, Maximize, Minimize, Layers, X, RotateCcw, ChevronRight, MapPin, LoaderCircle } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./map.module.css";

const INITIAL = { center: [139.62, 35.65], zoom: 10.15, pitch: 54, bearing: -18 };
const MOBILE_INITIAL = { center: [139.7, 35.66], zoom: 9.2, pitch: 48, bearing: -12 };
const attribution = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">地理院タイル</a>';

function IconButton({ label, children, onClick, ...props }) {
  return <button className={styles.iconButton} type="button" title={label} aria-label={label} onClick={onClick} {...props}>{children}</button>;
}

export default function MetroMap({ lines, note }) {
  const container = useRef(null), labels = useRef(null), mapRef = useRef(null), layerRef = useRef(null), shell = useRef(null);
  const [visible, setVisible] = useState(() => new Set(lines.map((l) => l.id)));
  const [height, setHeight] = useState(1), [pitch, setPitch] = useState(54), [showLabels, setShowLabels] = useState(true);
  const [selected, setSelected] = useState(null), [query, setQuery] = useState("");
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [tileError, setTileError] = useState(false);
  const [retry, setRetry] = useState(0), [panelOpen, setPanelOpen] = useState(false), [fullscreen, setFullscreen] = useState(false);
  const [basemap, setBasemap] = useState("pale");
  const reducedMotion = useRef(false);
  const stations = useMemo(() => {
    const entries = new Map();
    lines.forEach((line) => line.stations.forEach((station) => {
      const existing = entries.get(station.name);
      if (!existing) {
        entries.set(station.name, { ...station, lineId: line.id, lineIds: [line.id] });
      } else if (!existing.lineIds.includes(line.id)) {
        existing.lineIds.push(line.id);
      }
    }));
    return [...entries.values()];
  }, [lines]);
  const results = query.trim() ? stations.filter((s) => s.name.includes(query.trim())).slice(0, 12) : [];
  const pick = useRef(setSelected);
  pick.current = setSelected;

  useEffect(() => {
    let stopped = false, map, observer;
    setReady(false); setError(""); setTileError(false);
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (async () => {
      try {
        const [mapModule, { createRailLayer }] = await Promise.all([import("maplibre-gl"), import("./RailLayer")]);
        const maplibre = mapModule.default || mapModule;
        if (stopped) return;
        maplibre.setWorkerUrl(`/vendor/maplibre/${maplibre.getVersion()}/maplibre-gl-worker.mjs`);
        const initialView = window.innerWidth <= 760 ? MOBILE_INITIAL : INITIAL;
        setPitch(initialView.pitch);
        map = new maplibre.Map({
          container: container.current, ...initialView, maxPitch: 70, minZoom: 7, maxZoom: 17,
          maxBounds: [[137.9, 34.6], [141.6, 37.6]],
          canvasContextAttributes: { antialias: true },
          style: { version: 8, sources: {
            pale: { type: "raster", tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"], tileSize: 256, minzoom: 5, maxzoom: 18, attribution },
            photo: { type: "raster", tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"], tileSize: 256, minzoom: 5, maxzoom: 18, attribution },
          }, layers: [
            { id: "background", type: "background", paint: { "background-color": "#eef2ef" } },
            { id: "base-pale", type: "raster", source: "pale", paint: { "raster-opacity": 0.74, "raster-saturation": -0.65 } },
            { id: "base-photo", type: "raster", source: "photo", layout: { visibility: "none" }, paint: { "raster-opacity": 0.8 } },
          ] },
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
        map.on("error", (event) => {
          if (event.sourceId === "pale" || event.sourceId === "photo") setTileError(true);
          else { setError("地図の描画中にエラーが発生しました。再試行してください。"); console.error("Map error", event.error); }
        });
        map.on("sourcedata", (event) => { if ((event.sourceId === "pale" || event.sourceId === "photo") && event.tile?.state === "loaded") setTileError(false); });
        map.on("pitchend", () => setPitch(Math.round(map.getPitch())));
        map.on("load", () => {
          if (stopped) return;
          map.addSource("rail-shadows", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "rail-shadows", type: "line", source: "rail-shadows", paint: { "line-color": "#4a5650", "line-width": 4, "line-opacity": 0.18 }, layout: { "line-join": "round", "line-cap": "round" } });
          const layer = createRailLayer(lines, labels.current, styles.stationLabel, (station) => pick.current(station));
          map.addLayer(layer);
          layerRef.current = layer;
          setReady(true);
        });
        observer = new ResizeObserver(() => map.resize());
        observer.observe(container.current);
      } catch (cause) {
        if (!stopped) setError("3D地図を起動できませんでした。WebGL対応ブラウザで再試行してください。");
        console.error(cause);
      }
    })();
    return () => { stopped = true; observer?.disconnect(); map?.remove(); mapRef.current = null; layerRef.current = null; };
  }, [lines, retry]);

  useEffect(() => {
    if (!ready) return;
    layerRef.current?.setOptions({ visible, height, labels: showLabels, selected: selected ? `${selected.lineId}:${selected.index}` : null });
    mapRef.current.getSource("rail-shadows").setData(layerRef.current.getShadows(visible));
  }, [visible, height, showLabels, selected, ready, lines]);

  useEffect(() => {
    if (!ready) return;
    mapRef.current.setLayoutProperty("base-pale", "visibility", basemap === "pale" ? "visible" : "none");
    mapRef.current.setLayoutProperty("base-photo", "visibility", basemap === "photo" ? "visible" : "none");
  }, [basemap, ready]);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  function focus(coordinates, zoom = 13) {
    mapRef.current?.easeTo({ center: coordinates, zoom, duration: reducedMotion.current ? 0 : 800 });
    setPanelOpen(false);
  }
  function selectStation(station) {
    const lineId = station.lineIds?.find((id) => visible.has(id)) || station.lineIds?.[0] || station.lineId;
    const targetLine = lines.find((l) => l.id === lineId);
    const matchedStation = targetLine?.stations.find((s) => s.name === station.name) || station;
    setVisible((old) => new Set([...old, lineId]));
    setSelected({ ...matchedStation, lineId }); setQuery(""); focus(matchedStation.coordinates);
  }
  function toggleLine(id) {
    setVisible((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
    if (selected?.lineId === id) setSelected(null);
  }
  function fitCoords(coords) {
    if (!coords.length) return;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 70, maxZoom: 13, duration: reducedMotion.current ? 0 : 800 });
  }
  function focusLine(line) {
    setVisible((old) => new Set([...old, line.id]));
    fitCoords(line.path || line.stations.map((s) => s.coordinates));
    setPanelOpen(false);
  }
  function overview() {
    const chosen = lines.filter((l) => visible.has(l.id));
    if (!chosen.length) return;
    fitCoords(chosen.flatMap((l) => l.path || l.stations.map((s) => s.coordinates)));
  }
  function setMode(is3d) {
    const p = is3d ? 54 : 0;
    setPitch(p); setHeight(is3d ? 1 : 0);
    mapRef.current?.easeTo({ pitch: p, bearing: is3d ? -18 : 0, duration: reducedMotion.current ? 0 : 600 });
  }
  const selectedLine = lines.find((l) => l.id === selected?.lineId);
  const stationLines = selected ? lines.filter((l) => l.stations.some((s) => s.name === selected.name)) : [];

  return <div className={styles.shell} ref={shell}>
    <div className={styles.header}>
      <Link href="/yanaka/routemap" className={styles.back} aria-label="路線図へ戻る" title="路線図へ戻る"><ArrowLeft size={18} /></Link>
      <div className={styles.brand}><span className={styles.brandMark}>YN</span><div><h1>首都圏3D路線図</h1><span>谷中日本鉄道</span></div></div>
      <div className={styles.headerRight}><span className={styles.fiction}>架空鉄道</span><IconButton label="路線・表示設定" onClick={() => setPanelOpen(!panelOpen)} aria-expanded={panelOpen}><Layers size={19} /></IconButton></div>
    </div>
    <div className={styles.workspace}>
      <aside className={`${styles.sidebar} ${panelOpen ? styles.open : ""}`} aria-label="路線と表示設定">
        <div className={styles.searchBox}><Search size={16} /><input aria-label="駅を検索" placeholder="駅を検索" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); if (e.key === "Enter" && results[0]) selectStation(results[0]); }} />{query && <IconButton label="検索をクリア" onClick={() => setQuery("")}><X size={15} /></IconButton>}</div>
        {query && <div className={styles.searchResults} aria-label="駅の検索結果">{results.length ? results.map((s) => <button key={`${s.lineId}:${s.index}`} onClick={() => selectStation(s)}><MapPin size={14} /><span>{s.name}</span><ChevronRight size={14} /></button>) : <p>該当する駅はありません</p>}</div>}
        <div className={styles.controls}>
          <div className={styles.segments} aria-label="地図の表示モード"><button aria-pressed={pitch > 0} onClick={() => setMode(true)}>立体</button><button aria-pressed={pitch === 0} onClick={() => setMode(false)}>平面</button></div>
          <label className={styles.slider}><span>傾き <output>{pitch}°</output></span><input aria-label="地図の傾き" type="range" min="0" max="70" value={pitch} onChange={(e) => { const value = Number(e.target.value); setPitch(value); mapRef.current?.setPitch(value); }} /></label>
          <label className={styles.slider}><span>路線の高さ <output>{height.toFixed(1)}</output></span><input aria-label="路線の高さ" type="range" min="0" max="3" step="0.1" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
          <div className={styles.settingsRow}><label><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />駅名</label><select aria-label="背景地図" value={basemap} onChange={(e) => setBasemap(e.target.value)}><option value="pale">淡色地図</option><option value="photo">航空写真</option></select></div>
        </div>
        <div className={styles.listHeading}><strong>路線 <small>{visible.size} / {lines.length}</small></strong><button onClick={() => { setVisible(visible.size === lines.length ? new Set() : new Set(lines.map((l) => l.id))); setSelected(null); }}>{visible.size === lines.length ? "すべて隠す" : "すべて表示"}</button></div>
        <div className={styles.lineList}>{lines.map((line) => <div className={styles.lineRow} key={line.id}>
          <label><input type="checkbox" checked={visible.has(line.id)} onChange={() => toggleLine(line.id)} /><span className={styles.swatch} style={{ background: line.color }} /><span>{line.name}<small>{line.stations.length}駅{line.loop ? " · 環状線" : ""}</small></span></label>
          <IconButton label={`${line.name}の全体を表示`} onClick={() => focusLine(line)}><LocateFixed size={16} /></IconButton>
        </div>)}</div>
        <p className={styles.note}>{note}</p>
      </aside>
      <div className={styles.mapArea}>
        <div className={styles.map} ref={container} aria-label="谷鉄 首都圏3D地図" />
        <div className={styles.labels} ref={labels} />
        <div className={styles.mapBadge}><span className={styles.liveDot} />首都圏 <span>{visible.size}路線</span></div>
        <div className={styles.toolbar}>
          <IconButton label="拡大" disabled={!ready} onClick={() => mapRef.current?.zoomIn()}><Plus size={19} /></IconButton>
          <IconButton label="縮小" disabled={!ready} onClick={() => mapRef.current?.zoomOut()}><Minus size={19} /></IconButton>
          <IconButton label="北を上にする" disabled={!ready} onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: 500 })}><Compass size={19} /></IconButton>
          <IconButton label="表示中の全路線を収める" disabled={!ready || !visible.size} onClick={overview}><LocateFixed size={19} /></IconButton>
          <IconButton label="都心へ戻る" disabled={!ready} onClick={() => { const view = window.innerWidth <= 760 ? MOBILE_INITIAL : INITIAL; setPitch(view.pitch); mapRef.current?.easeTo({ ...view, duration: reducedMotion.current ? 0 : 800 }); }}><RotateCcw size={18} /></IconButton>
          <IconButton label={fullscreen ? "全画面を終了" : "全画面"} onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.current.requestFullscreen(); } catch { setError("このブラウザでは全画面表示を利用できません。"); } }}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</IconButton>
        </div>
        {!ready && !error && <div className={styles.loading}><LoaderCircle size={22} className={styles.spinner} />地図を読み込み中</div>}
        {error && <div className={styles.message} role="alert"><p>{error}</p><button onClick={() => { setError(""); setRetry((n) => n + 1); }}>再試行</button></div>}
        {tileError && ready && <div className={styles.tileError} role="status">背景地図を取得できません。<button onClick={() => setRetry((n) => n + 1)}>再読込</button></div>}
        {!visible.size && ready && <div className={styles.empty}>表示中の路線はありません<button onClick={() => setVisible(new Set(lines.map((l) => l.id)))}>すべて表示</button></div>}
        {selected && <section className={styles.stationPanel} aria-label="選択した駅">
          <div className={styles.stationHeading}><div><small>STATION</small><h2>{selected.name}</h2></div><IconButton label="駅情報を閉じる" onClick={() => setSelected(null)}><X size={18} /></IconButton></div>
          <div className={styles.stationRoutes}>{stationLines.map((line) => <span key={line.id}><i style={{ background: line.color }} />{line.name}</span>)}</div>
          {selected.transfer?.length > 0 && <p className={styles.transfers}>乗換：{selected.transfer.join("・")}</p>}
          <p className={styles.positionNote}>KML正データ座標 · {selected.coordinates[1].toFixed(5)}, {selected.coordinates[0].toFixed(5)}</p>
          {selectedLine && <button className={styles.routeAction} onClick={() => { setVisible(new Set([selectedLine.id])); focusLine(selectedLine); }}>{selectedLine.name}だけ表示<ChevronRight size={15} /></button>}
        </section>}
        <div className={styles.mapNote}>経路・駅はKML正データ準拠／高さ・色は仮置き</div>
      </div>
    </div>
  </div>;
}
