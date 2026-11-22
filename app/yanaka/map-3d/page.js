import mapData from "../../../data/map-3d-kml.json";
import MetroMap from "./MetroMap";

export const metadata = {
  title: "首都圏3D路線図 | 谷中日本鉄道",
  description: "谷鉄の首都圏25路線を空想鉄道No.522953のKML正データで実地図に重ねた立体路線図。",
};

export default function MetroMapPage() {
  return <MetroMap lines={mapData.lines} note={mapData.note} />;
}
