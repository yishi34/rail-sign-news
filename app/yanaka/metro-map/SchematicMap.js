'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Maximize,
  Crosshair,
  Download,
  Printer,
  Search,
  X,
  Layers,
} from 'lucide-react';
import styles from './map.module.css';

const MAX_PNG_PIXELS = 16_000_000;

export default function SchematicMap({ diagram }) {
  const { routes, stations, sheet, totalStops } = diagram;
  const svgRef = useRef(null);
  const groupRef = useRef(null);
  const zoomRef = useRef(null);
  const viewportRef = useRef(null);

  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [legendOpen, setLegendOpen] = useState(false);

  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  const trimmedQuery = query.trim();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return stations
      .filter((s) => s.names.some((n) => n.trim().includes(trimmedQuery)))
      .slice(0, 12);
  }, [stations, trimmedQuery]);

  useEffect(() => {
    const svg = select(svgRef.current);
    const behavior = zoom()
      .scaleExtent([0.5, 18])
      .on('zoom', (event) => {
        select(groupRef.current).attr('transform', event.transform);
      });
    svg.call(behavior);
    zoomRef.current = behavior;
    return () => {
      svg.on('.zoom', null);
      zoomRef.current = null;
    };
  }, []);

  function reset() {
    if (!zoomRef.current) return;
    select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    setSelected(null);
    setActive(null);
  }

  function focusStation(station, k = 4.5) {
    if (!zoomRef.current) return;
    setSelected(station.id);
    setQuery('');
    setLegendOpen(false);
    select(svgRef.current).call(
      zoomRef.current.transform,
      zoomIdentity.translate(sheet.width / 2 - station.x * k, sheet.height / 2 - station.y * k).scale(k)
    );
  }

  function focusCenter() {
    const hub = stations.find((s) => s.id === '谷鉄東京') || stations[0];
    if (!hub || !zoomRef.current) return;
    select(svgRef.current).call(
      zoomRef.current.transform,
      zoomIdentity.translate(sheet.width / 2 - hub.x * 2.8, sheet.height / 2 - hub.y * 2.8).scale(2.8)
    );
  }

  function makeSVG() {
    const copy = svgRef.current.cloneNode(true);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.setAttribute('width', String(sheet.width));
    copy.setAttribute('height', String(sheet.height));
    copy.querySelector('[data-map-content]').removeAttribute('transform');
    copy.querySelectorAll('[opacity]').forEach((n) => n.removeAttribute('opacity'));
    copy.querySelectorAll('[data-selection]').forEach((n) => n.remove());
    return new XMLSerializer().serializeToString(copy);
  }

  function save(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function download(format) {
    setBusy(true);
    setError('');
    let url;
    try {
      await document.fonts.ready;
      const blob = new Blob([makeSVG()], { type: 'image/svg+xml;charset=utf-8' });
      if (format === 'svg') {
        save(blob, 'yanaka-metropolitan-network.svg');
        return;
      }
      url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      await img.decode();
      const totalPixels = sheet.width * sheet.height;
      const scale = totalPixels > MAX_PNG_PIXELS ? Math.sqrt(MAX_PNG_PIXELS / totalPixels) : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sheet.width * scale);
      canvas.height = Math.round(sheet.height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('export');
      save(png, 'yanaka-metropolitan-network.png');
    } catch {
      setError('画像を保存できませんでした。もう一度お試しください。');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  const chosen = stations.find((s) => s.id === selected);
  const northX = sheet.width - 170;

  return (
    <main className={styles.app}>
      <header className={styles.toolbar}>
        <Link href="/yanaka/routemap" className={styles.icon} title="路線図一覧へ" aria-label="路線図一覧へ">
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.title}>
          <strong>首都圏平面路線図</strong>
          <span>谷中日本鉄道（25路線・{totalStops}駅）</span>
        </div>
        <div className={styles.search}>
          <Search size={17} />
          <input
            aria-label="駅名を検索"
            placeholder="駅名を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults[0]) focusStation(searchResults[0]);
              if (e.key === 'Escape') setQuery('');
            }}
          />
          {query && (
            <button title="検索をクリア" aria-label="検索をクリア" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          {query && (
            <div className={styles.results}>
              {searchResults.length ? (
                searchResults.map((s) => (
                  <button key={s.id} onClick={() => focusStation(s)}>
                    <span>{s.name}</span>
                    <small>{s.routes.map((id) => routesById.get(id).name).join('・')}</small>
                  </button>
                ))
              ) : (
                <p>該当する駅はありません</p>
              )}
            </div>
          )}
        </div>
        <div className={styles.exports}>
          <button onClick={() => download('svg')} disabled={busy}>
            <Download size={16} />
            SVG
          </button>
          <button onClick={() => download('png')} disabled={busy}>
            <Download size={16} />
            PNG
          </button>
          <button className={styles.icon} title="印刷" aria-label="印刷" onClick={() => window.print()}>
            <Printer size={19} />
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.legend} ${legendOpen ? styles.open : ''}`}>
          <div className={styles.legendHeading}>
            <strong>路線一覧</strong>
            <span>{routes.length}路線</span>
          </div>
          <button className={styles.all} aria-pressed={!active} onClick={() => setActive(null)}>
            全{routes.length}路線を表示（{totalStops}駅）
          </button>
          {routes.map((r) => (
            <button
              key={r.id}
              aria-pressed={active === r.id}
              onClick={() => {
                setActive(active === r.id ? null : r.id);
                setSelected(null);
              }}
              className={styles.route}
            >
              <span style={{ background: r.color }} />
              <span>{r.name}</span>
              <small>{r.stops.length}駅</small>
            </button>
          ))}
          <p className={styles.note}>
            空想鉄道 No.522953 のKML正データを基に、地理的位置関係を保って白紙上に直線模式化しています。
          </p>
          <div className={styles.links}>
            <Link href="/yanaka/map-3d" className={styles.other}>
              3D路線図を見る
            </Link>
            <Link href="/yanaka/routemap" className={styles.other}>
              路線別路線図一覧
            </Link>
          </div>
        </aside>

        <section className={styles.viewport} ref={viewportRef} aria-label="首都圏平面路線図">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${sheet.width} ${sheet.height}`}
            className={styles.svg}
            role="img"
            aria-label={`谷中日本鉄道 首都圏${routes.length}路線 延べ${totalStops}駅の平面路線図`}
          >
            <title>谷中日本鉄道 首都圏路線網図</title>
            <g ref={groupRef} data-map-content="" fontFamily='Arial, "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif'>
              <rect width={sheet.width} height={sheet.height} fill="#ffffff" />

              {/* シート上部ヘッダー */}
              <rect x="75" y="70" width="16" height="122" fill="#e5b92b" />
              <rect x="102" y="70" width="16" height="122" fill="#18804a" />
              <text x="155" y="128" fontSize="64" fontWeight="700" fill="#17252a">
                谷中日本鉄道　首都圏路線網図
              </text>
              <text x="157" y="186" fontSize="26" letterSpacing="0.5" fill="#667176">
                YANAKA JAPAN RAILWAY / METROPOLITAN NETWORK (25 LINES)
              </text>
              <g fill="#526268" stroke="#526268" aria-label="北が上">
                <text x={northX} y="108" textAnchor="middle" fontSize="36" fontWeight="700" stroke="none">
                  北
                </text>
                <path
                  d={`M${northX} 198 V126 M${northX - 18} 146 L${northX} 126 L${northX + 18} 146`}
                  fill="none"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
              </g>
              <line x1="75" x2={sheet.width - 75} y1="228" y2="228" stroke="#18804a" strokeWidth="5" />

              {/* 25路線の八方位模式パス */}
              {routes.map((r) => (
                <g key={r.id} opacity={active && active !== r.id ? 0.1 : 1}>
                  <polyline
                    points={r.path.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="18"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={r.path.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke={r.color}
                    strokeWidth="10"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* 全駅マーカー・乗換カプセル・駅名ラベル */}
              {stations.map((s) => (
                <g
                  key={s.id}
                  className={styles.stationNode}
                  opacity={active && !s.routes.includes(active) ? 0.14 : 1}
                  onClick={() => setSelected(s.id)}
                >
                  {s.label.distance > 40 && (
                    <line x1={s.x} y1={s.y} x2={s.label.x} y2={s.label.y} stroke="#9ba6ab" strokeWidth="1.2" />
                  )}
                  {s.routes.length > 1 && (
                    <g strokeLinecap="round">
                      {s.platforms.map((p, i) => (
                        <line key={`outline-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke="#243239" strokeWidth="22" />
                      ))}
                      {s.platforms.map((p, i) => (
                        <line key={`fill-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke="#ffffff" strokeWidth="16" />
                      ))}
                    </g>
                  )}
                  {s.platforms.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill="#ffffff"
                      stroke={routesById.get(p.route).color}
                      strokeWidth="2.5"
                    />
                  ))}
                  {selected === s.id && (
                    <circle data-selection="" cx={s.x} cy={s.y} r="24" fill="none" stroke="#ec562c" strokeWidth="5" />
                  )}
                  <text
                    x={s.label.x}
                    y={s.label.y}
                    textAnchor={s.label.anchor}
                    dominantBaseline="central"
                    fontSize={s.label.size}
                    fontWeight={s.routes.length > 1 ? '700' : '500'}
                    fill="#17252a"
                    stroke="#ffffff"
                    strokeWidth="6"
                    paintOrder="stroke"
                    strokeLinejoin="round"
                  >
                    {s.name}
                  </text>
                  <title>{`${s.names.join(' / ')}: ${s.routes.map((id) => routesById.get(id).name).join('・')}`}</title>
                </g>
              ))}

              {/* 下部凡例（25路線・5列×5行） */}
              <line x1="75" x2={sheet.width - 75} y1="5780" y2="5780" stroke="#dce2e3" strokeWidth="3" />
              {routes.map((r, i) => (
                <g key={r.id} transform={`translate(${90 + (i % 5) * 1445}, ${5842 + Math.floor(i / 5) * 62})`}>
                  <line x1="0" y1="0" x2="62" y2="0" stroke={r.color} strokeWidth="13" strokeLinecap="round" />
                  <text x="80" y="10" fontSize="31" fill="#243239">
                    {r.name}
                  </text>
                </g>
              ))}
              <text x="90" y="6185" fontSize="26" fill="#626c70">
                ○ 駅　◎ 乗換駅　｜　空想鉄道No.522953 KML準拠・位置関係を保ち線形を模式化　｜　東海ラインは小田原まで・東北ラインは谷鉄宇都宮まで掲載
              </text>
            </g>
          </svg>

          <div className={styles.controls}>
            <button
              title="拡大"
              aria-label="拡大"
              onClick={() => zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, 1.5)}
            >
              <Plus size={20} />
            </button>
            <button
              title="縮小"
              aria-label="縮小"
              onClick={() => zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, 1 / 1.5)}
            >
              <Minus size={20} />
            </button>
            <button title="都心を表示" aria-label="都心を表示" onClick={focusCenter}>
              <Crosshair size={19} />
            </button>
            <button title="全体を表示" aria-label="全体を表示" onClick={reset}>
              <Maximize size={19} />
            </button>
            <button
              className={styles.mobileLegend}
              title="路線一覧"
              aria-label="路線一覧"
              aria-expanded={legendOpen}
              onClick={() => setLegendOpen(!legendOpen)}
            >
              <Layers size={20} />
            </button>
          </div>

          {chosen && (
            <div className={styles.station}>
              <button title="駅情報を閉じる" aria-label="駅情報を閉じる" onClick={() => setSelected(null)}>
                <X size={17} />
              </button>
              <strong>{chosen.name}</strong>
              {chosen.names.length > 1 && <small>{chosen.names.join(' / ')}</small>}
              <span>{chosen.routes.map((id) => routesById.get(id).name).join('・')}</span>
            </div>
          )}

          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
