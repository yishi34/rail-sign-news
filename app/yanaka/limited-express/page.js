import Link from "next/link";
import yanaka from "../../../data/yanaka.json";
import limitedExpress from "../../../data/yanaka-limited-express.json";

export const metadata = {
  title: "特急ネットワーク図 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の特急ネットワーク図。特急いずみ・特急アルプスなどの特急系統をまとめたイメージ路線図です。",
};

const nodeMap = Object.fromEntries(limitedExpress.nodes.map((node) => [node.id, node]));
const limitedExpressHeadline = [...new Set(limitedExpress.services.map((service) => service.label))]
  .map((label, index) => (index === 0 ? label : label.replace(/^特急/, "")))
  .join("・");

function StopList({ service }) {
  return (
    <ol className="lx-stop-list">
      {service.route.map((nodeId) => (
        <li key={nodeId}>{nodeMap[nodeId].name}</li>
      ))}
    </ol>
  );
}

function serviceTitle(service) {
  return service.variant ? `${service.label} ${service.variant}` : service.label;
}

function LimitedRouteDiagram({ title, subtitle, services, axis }) {
  const serviceStops = services.map((service) => new Set(service.route));
  const displayedAxis = axis.filter((nodeId) => serviceStops.some((stops) => stops.has(nodeId)));
  const stations = displayedAxis.map((nodeId) => nodeMap[nodeId]);
  const stationGap = axis.length > 12 ? 92 : 118;
  const labelMaxLen = Math.max(...services.map((service) => serviceTitle(service).length));
  const leftBase = Math.max(132, labelMaxLen * 16 + 56);
  const tierY0 = 66;
  const tierStep = 40;
  const xAt = (index) => leftBase + index * stationGap;
  const yAt = (index) => tierY0 + index * tierStep;
  const bottomY = yAt(services.length - 1);
  const nameTop = bottomY + 28;
  const maxNameLen = Math.max(...stations.map((station) => station.name.length));
  const width = leftBase + (stations.length - 1) * stationGap + 80;
  const height = nameTop + maxNameLen * 16 + 40;

  return (
    <section className="lx-diagram-card">
      <div className="lx-diagram-head">
        <h3>{title}</h3>
        <span className="en">{subtitle}</span>
      </div>
      <svg
        className="lx-diagram-svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`${title} 路線図`}
      >
        {services.map((service, index) => (
          <g key={service.id}>
            <rect x="18" y={yAt(index) - 15} width="30" height="30" rx="4" fill={service.color} />
            <text x="33" y={yAt(index) + 6} className="lx-diagram-symbol" textAnchor="middle">
              {service.symbol}
            </text>
            <text x="58" y={yAt(index) + 5} className="lx-diagram-tier" fill={service.color}>
              {serviceTitle(service)}
            </text>
            <line
              x1={xAt(0)}
              y1={yAt(index)}
              x2={xAt(stations.length - 1)}
              y2={yAt(index)}
              stroke={service.color}
              strokeWidth={index === 0 ? 9 : 8}
              strokeLinecap="round"
              strokeDasharray={service.dash ? "14 10" : undefined}
            />
          </g>
        ))}

        {stations.map((station, stationIndex) => {
          const stopIndexes = serviceStops
            .map((stops, serviceIndex) => (stops.has(station.id) ? serviceIndex : null))
            .filter((serviceIndex) => serviceIndex !== null);
          const firstStop = Math.min(...stopIndexes);
          const lastStop = Math.max(...stopIndexes);
          const x = xAt(stationIndex);
          const terminal = stationIndex === 0 || stationIndex === stations.length - 1 || station.major;

          return (
            <g key={station.id}>
              {stopIndexes.length > 1 && (
                <line
                  x1={x}
                  y1={yAt(firstStop)}
                  x2={x}
                  y2={yAt(lastStop)}
                  stroke="#c2c6c9"
                  strokeWidth="3"
                />
              )}
              {services.map((service, serviceIndex) =>
                serviceStops[serviceIndex].has(station.id) ? (
                  <circle
                    key={service.id}
                    cx={x}
                    cy={yAt(serviceIndex)}
                    r={terminal ? 8 : 6}
                    fill="#fff"
                    stroke="#1a1a1a"
                    strokeWidth={terminal ? 3.5 : 3}
                  />
                ) : null
              )}
              <text
                x={x}
                y={nameTop}
                className={terminal ? "lx-diagram-name terminal" : "lx-diagram-name"}
                writingMode="vertical-rl"
                textAnchor="start"
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function LimitedExpressMap() {
  const routeAxes = Object.fromEntries(limitedExpress.baseRoutes.map((route) => [route.id, route.route]));
  const izumiServices = limitedExpress.services.filter((service) => service.name === "いずみ");
  const otherServices = limitedExpress.services.filter((service) => service.name !== "いずみ");

  return (
    <div className="lx-network-board" aria-label="谷中日本鉄道 特急路線図">
      <div className="lx-board-head">
        <div>
          <h3>谷鉄 特急路線図</h3>
          <span className="en">LIMITED EXPRESS ROUTE MAP</span>
        </div>
        <span>{limitedExpressHeadline}</span>
      </div>
      <div className="lx-network-list">
        <LimitedRouteDiagram
          title="特急いずみ"
          subtitle="IZUMI LIMITED EXPRESS"
          services={izumiServices}
          axis={routeAxes["tokai-axis"]}
        />
        {otherServices.map((service) => (
          <LimitedRouteDiagram
            key={service.id}
            title={service.label}
            subtitle={service.subtitle}
            services={[service]}
            axis={service.baseRoute ? routeAxes[service.baseRoute] : service.route}
          />
        ))}
      </div>
    </div>
  );
}

export default function YanakaLimitedExpressPage() {
  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{limitedExpress.title}</h1>
          <div className="romaji en">{limitedExpress.en}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <Link href="/yanaka/routemap">路線図へ</Link>
          </div>
        </div>
      </header>

      <main className="yk-main lx-main">
        <section>
          <div className="line-head">
            <span className="line-band" style={{ background: yanaka.color }}></span>
            <h2>{limitedExpressHeadline}</h2>
            <span className="en-sub en">LIMITED EXPRESS</span>
          </div>
          <p className="lx-lead">{limitedExpress.lead}</p>
          <div className="lx-map-shell">
            <LimitedExpressMap />
          </div>
          <p className="rm-hint">← 横にスクロールできます →</p>
        </section>

        <section>
          <div className="line-head">
            <span className="line-band" style={{ background: yanaka.color }}></span>
            <h2>特急系統</h2>
            <span className="en-sub en">SERVICES</span>
          </div>
          <div className="lx-service-grid">
            {limitedExpress.services.map((service) => (
              <article className="lx-service" key={service.id}>
                <div className="lx-service-top" style={{ borderColor: service.color }}>
                  <span className="lx-service-symbol" style={{ background: service.color }}>
                    {service.symbol}
                  </span>
                  <div>
                    <h3>{serviceTitle(service)}</h3>
                    <span className="en-sub en">{service.subtitle}</span>
                  </div>
                </div>
                <p>{service.summary}</p>
                <StopList service={service} />
              </article>
            ))}
          </div>
          <p className="lx-note">{limitedExpress.note}</p>
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
