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
  const [zoomPct, setZoomPct] = useState(100);

  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  const trimmedQuery = query.trim();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return stations
      .filter((s) => s.names.some((n) => n.trim().includes(trimmedQuery)))
      .slice(0, 12);
  }, [stations, trimmedQuery]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const viewportEl = viewportRef.current;
    const svg = select(svgEl);

    const calcWheelDelta = (event) => {
      const unit = event.deltaMode === 1 ? 3 : event.deltaMode === 2 ? 1 : 100;
      const step = Math.max(-2, Math.min(2, -event.deltaY / unit));
      return step * 0.55 * (event.ctrlKey ? 1.8 : 1);
    };

    const behavior = zoom()
      .scaleExtent([0.45, 36])
      .clickDistance(4)
      .wheelDelta(calcWheelDelta)
      .on('zoom', (event) => {
        select(groupRef.current).attr('transform', event.transform);
        setZoomPct(Math.round(event.transform.k * 100));
      });

    svg.call(behavior);
    zoomRef.current = behavior;

    const handleViewportWheel = (event) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      // SVG外のオーバーレイ（コントロールバー・駅情報カード等）でのホイール操作もズームに連動させる
      if (svgEl && svgEl.contains(event.target)) return;
      const factor = Math.pow(2, calcWheelDelta(event));
      svg.call(behavior.scaleBy, factor);
    };

    if (viewportEl) {
      viewportEl.addEventListener('wheel', handleViewportWheel, { passive: false });
    }

    return () => {
      svg.on('.zoom', null);
      if (viewportEl) {
        viewportEl.removeEventListener('wheel', handleViewportWheel);
      }
      zoomRef.current = null;
    };
  }, []);

  function reset() {
    if (!zoomRef.current) return;
    select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    setSelected(null);
    setActive(null);
  }

  function focusStation(station, k = 5.5) {
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
      zoomIdentity.translate(sheet.width / 2 - hub.x * 3.4, sheet.height / 2 - hub.y * 3.4).scale(3.4)
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
  const northX = sheet.width - 230;

  return (
    <main className={styles.app}>
      <header className={styles.toolbar}>
        <Link href="/yanaka/routemap" className={styles.icon} title="路線図一覧へ" aria-label="路線図一覧へ">
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.title}>
          <strong>首都圏路線図</strong>
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
            空想鉄道 No.522953 のKML正データを基に、地理的位置関係を保って白紙上に直線模式化しています。マウスホイールで拡大縮小・ドラッグで移動できます。
          </p>
          <div className={styles.links}>
            <Link href="/yanaka/national-map" className={styles.other}>
              全国路線図を見る
            </Link>
            <Link href="/yanaka/map-3d" className={styles.other}>
              3D路線図を見る
            </Link>
            <Link href="/yanaka/routemap" className={styles.other}>
              路線別路線図一覧
            </Link>
          </div>
        </aside>

        <section className={styles.viewport} ref={viewportRef} aria-label="首都圏路線図">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${sheet.width} ${sheet.height}`}
            className={styles.svg}
            role="img"
            aria-label={`谷中日本鉄道 首都圏${routes.length}路線 延べ${totalStops}駅の首都圏路線図`}
          >
            <title>谷中日本鉄道 首都圏路線図</title>
            <g ref={groupRef} data-map-content="" fontFamily='Arial, "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif'>
              <rect width={sheet.width} height={sheet.height} fill="#ffffff" />

              {/* シート上部ヘッダー */}
              <rect x="100" y="80" width="28" height="180" fill="#e5b92b" />
              <rect x="142" y="80" width="28" height="180" fill="#18804a" />
              <text x="210" y="168" fontSize="128" fontWeight="700" fill="#17252a">
                谷中日本鉄道　首都圏路線図
              </text>
              <text x="212" y="248" fontSize="50" letterSpacing="0.8" fill="#667176">
                YANAKA JAPAN RAILWAY / METROPOLITAN NETWORK (25 LINES)
              </text>
              <g fill="#526268" stroke="#526268" aria-label="北が上">
                <text x={northX} y="144" textAnchor="middle" fontSize="68" fontWeight="700" stroke="none">
                  北
                </text>
                <path
                  d={`M${northX} 274 V168 M${northX - 28} 198 L${northX} 168 L${northX + 28} 198`}
                  fill="none"
                  strokeWidth="9"
                  strokeLinejoin="round"
                />
              </g>
              <line x1="100" x2={sheet.width - 100} y1="304" y2="304" stroke="#18804a" strokeWidth="11" />

              {/* 25路線の八方位模式パス */}
              {routes.map((r) => (
                <g key={r.id} opacity={active && active !== r.id ? 0.1 : 1}>
                  <polyline
                    points={r.path.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="46"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={r.path.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke={r.color}
                    strokeWidth="30"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* 全駅マーカー・乗換カプセル・駅名ラベル（引出線なし・縦書き併用） */}
              {stations.map((s) => (
                <g
                  key={s.id}
                  className={styles.stationNode}
                  opacity={active && !s.routes.includes(active) ? 0.14 : 1}
                  onClick={() => setSelected(s.id)}
                >
                  {s.routes.length > 1 && (
                    <g strokeLinecap="round">
                      {s.platforms.map((p, i) => (
                        <line key={`outline-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke="#243239" strokeWidth="46" />
                      ))}
                      {s.platforms.map((p, i) => (
                        <line key={`fill-${i}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} stroke="#ffffff" strokeWidth="32" />
                      ))}
                    </g>
                  )}
                  {s.platforms.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="15"
                      fill="#ffffff"
                      stroke={routesById.get(p.route).color}
                      strokeWidth="5"
                    />
                  ))}
                  {selected === s.id && (
                    <circle data-selection="" cx={s.x} cy={s.y} r="46" fill="none" stroke="#ec562c" strokeWidth="8" />
                  )}
                  <text
                    x={s.label.x}
                    y={s.label.y}
                    textAnchor={s.label.anchor}
                    dominantBaseline="central"
                    writingMode={s.label.vertical ? 'vertical-rl' : undefined}
                    fontSize={s.label.size}
                    fontWeight={s.routes.length > 1 ? '700' : '600'}
                    fill="#17252a"
                    stroke="#ffffff"
                    strokeWidth="11"
                    paintOrder="stroke"
                    strokeLinejoin="round"
                  >
                    {s.name}
                  </text>
                  <title>{`${s.names.join(' / ')}: ${s.routes.map((id) => routesById.get(id).name).join('・')}`}</title>
                </g>
              ))}

              {/* 下部凡例（25路線・5列×5行） */}
              <line x1="100" x2={sheet.width - 100} y1="9880" y2="9880" stroke="#dce2e3" strokeWidth="6" />
              {routes.map((r, i) => (
                <g key={r.id} transform={`translate(${120 + (i % 5) * 2190}, ${9965 + Math.floor(i / 5) * 78})`}>
                  <line x1="0" y1="0" x2="104" y2="0" stroke={r.color} strokeWidth="26" strokeLinecap="round" />
                  <text x="128" y="16" fontSize="52" fill="#243239">
                    {r.name}
                  </text>
                </g>
              ))}
              <text x="120" y="10385" fontSize="38" fill="#626c70">
                ○ 駅　◎ 乗換駅　｜　空想鉄道No.522953 KML準拠・位置関係を保ち線形を模式化　｜　東海ラインは小田原まで・東北ラインは谷鉄宇都宮まで掲載
              </text>
            </g>
          </svg>

          <div className={styles.controls}>
            <button
              type="button"
              title="拡大"
              aria-label="拡大"
              onClick={() => zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, 1.5)}
            >
              <Plus size={20} />
            </button>
            <button
              type="button"
              title="縮小"
              aria-label="縮小"
              onClick={() => zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, 1 / 1.5)}
            >
              <Minus size={20} />
            </button>
            <button
              type="button"
              className={styles.zoomBadge}
              title="倍率をリセット（全体を表示）"
              aria-label={`現在倍率 ${zoomPct}%・全体を表示`}
              onClick={reset}
            >
              {zoomPct}%
            </button>
            <button type="button" title="都心を表示" aria-label="都心を表示" onClick={focusCenter}>
              <Crosshair size={19} />
            </button>
            <button type="button" title="全体を表示" aria-label="全体を表示" onClick={reset}>
              <Maximize size={19} />
            </button>
            <button
              type="button"
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
