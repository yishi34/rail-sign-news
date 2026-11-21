import yanaka from "../../../data/yanaka.json";
import { positions, metroRoutes, geographyNote } from "../../../data/metro-geography";
import MetroMap from "./MetroMap";

export const metadata = {
  title: "首都圏3D路線図 | 谷中日本鉄道",
  description: "谷鉄の首都圏路線を実地図に重ねた立体路線図。架空駅の位置・駅間経路は概略です。",
};

export default function MetroMapPage() {
  const lines = metroRoutes.flatMap((config) => {
    const line = yanaka.routemap.lines.find((item) => item.id === config.id);
    if (!line) return [];
    const lastIndex = config.last ? line.stations.findIndex((s) => s.name === config.last) : line.stations.length - 1;
    const stations = line.stations.slice(0, lastIndex + 1).map((station) => {
      if (!positions[station.name]) throw new Error(`Missing map position: ${station.name}`);
      return { ...station, coordinates: positions[station.name] };
    });
    const base = { id: line.id, name: line.name.replace("谷鉄 ", "") + (config.suffix || ""), color: config.color, loop: line.shape === "loop", stations };
    return [base, ...(line.branches || []).map((branch) => ({
      id: branch.id, name: branch.name, color: config.color, loop: false,
      stations: [{ name: branch.from }, ...branch.stations].map((s) => {
        if (!positions[s.name]) throw new Error(`Missing map position: ${s.name}`);
        return { ...s, coordinates: positions[s.name] };
      }),
    }))];
  });
  return <MetroMap lines={lines} note={geographyNote} />;
}
