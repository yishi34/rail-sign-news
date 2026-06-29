import Link from "next/link";
import asano from "../../../../data/yanaka-asano.json";

export const metadata = {
  title: "浅野線 路線図 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "谷中日本鉄道の架空路面電車「浅野線」のイメージ路線図。実在の交通事業者・路線計画とは関係ありません。",
};

const LEFT = 72;
const GAP = 112;
const LINE_Y = 96;
const NAME_Y = 118;
const NAME_CH = 16;
const TRANSFER_GAP = 16;
const TRANSFER_LH = 12;

function statLabel(system) {
  return `${system.stats.stops}停留場 / 専用軌道 ${system.stats.dedicatedStops} / 街路併用 ${system.stats.streetStops}`;
}

function TramRouteSvg({ system }) {
  const stations = system.stations;
  const lastIndex = stations.length - 1;
  const dedicatedLastIndex = stations.findLastIndex((station) => station.track === "dedicated");
  const xAt = (index) => LEFT + index * GAP;
  const width = xAt(lastIndex) + 80;
  const maxDepth = Math.max(
    ...stations.map((station) => {
      const transferCount = station.transfer ? station.transfer.length : 0;
      return station.name.length * NAME_CH + (transferCount ? TRANSFER_GAP + transferCount * TRANSFER_LH : 0);
    })
  );
  const height = NAME_Y + maxDepth + 28;
  const firstX = xAt(0);
  const lastX = xAt(lastIndex);
  const dedicatedEndX = xAt(dedicatedLastIndex);
  const color = system.color;

  return (
    <svg
      className="tram-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${system.name} 路線図`}
    >
      <text x={firstX} y="30" className="tram-svg-title">
        {system.name}
      </text>
      <text x={firstX} y="51" className="tram-svg-sub en">
        {system.nameEn} / {statLabel(system)}
      </text>

      <line
        x1={firstX}
        y1={LINE_Y}
        x2={dedicatedEndX}
        y2={LINE_Y}
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <line
        x1={dedicatedEndX}
        y1={LINE_Y}
        x2={lastX}
        y2={LINE_Y}
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {stations.map((station, index) => {
        const x = xAt(index);
        const dedicated = station.track === "dedicated";
        return (
          <g key={`${station.name}-${index}`}>
            <circle
              cx={x}
              cy={LINE_Y}
              r={dedicated ? 8 : 7}
              fill="#fff"
              stroke={color}
              strokeWidth={dedicated ? 4 : 3}
            />
            <text x={x} y={NAME_Y} className="tram-station-name" writingMode="vertical-rl" textAnchor="start">
              {station.name}
            </text>
            {station.transfer &&
              station.transfer.map((transfer, transferIndex) => (
                <text
                  key={transfer}
                  x={x}
                  y={NAME_Y + station.name.length * NAME_CH + TRANSFER_GAP + transferIndex * TRANSFER_LH}
                  className="tram-transfer"
                  textAnchor="middle"
                >
                  {transfer}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
}

function RouteCard({ system }) {
  return (
    <article className="tram-map-card">
      <div className="tram-map-head">
        <div>
          <h2>{system.name}</h2>
          <span className="en">{system.nameEn}</span>
        </div>
        <span className="tram-type" style={{ background: system.color }}>
          {system.type}
        </span>
      </div>
      <p className="tram-summary">{system.summary}</p>
      <div className="tram-stats">
        <span>{system.stats.stops}停留場</span>
        <span>専用軌道内 {system.stats.dedicatedStops}停留場</span>
        <span>街路併用 {system.stats.streetStops}停留場</span>
      </div>
      <div className="tram-legend">
        <span><i className="tram-legend-solid" style={{ background: system.color }}></i>専用軌道区間</span>
        <span><i className="tram-legend-street" style={{ background: system.color }}></i>街路併用区間</span>
      </div>
      <div className="tram-scroll">
        <TramRouteSvg system={system} />
      </div>
      <p className="rm-hint">← 横にスクロールできます →</p>
    </article>
  );
}

export default function YanakaAsanoRouteMapPage() {
  const routeMap = asano.routemap;

  return (
    <>
      <header className="tram-header">
        <div className="station-sign tram-sign">
          <h1>{asano.headingJa} 路線図</h1>
          <div className="romaji en">{asano.headingEn}</div>
          <span className="tram-fiction-label">{asano.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YNR ASANO LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main tram-main">
        <section>
          <div className="line-head">
            <span className="line-band" style={{ background: asano.color }}></span>
            <h2>{routeMap.title}</h2>
            <span className="en-sub en">{routeMap.en}</span>
          </div>
          <div className="tram-map-list">
            {routeMap.systems.map((system) => (
              <RouteCard key={system.id} system={system} />
            ))}
          </div>
          <p className="tram-note">{routeMap.note}</p>
        </section>
      </main>

      <footer>
        谷中日本鉄道 浅野線は架空の路面電車コンテンツです。実在の交通事業者・路線計画とは関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
