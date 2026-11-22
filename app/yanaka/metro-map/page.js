import mapData from '../../../data/map-3d-kml.json';
import { buildSchematic } from '../../../data/metro-schematic';
import SchematicMap from './SchematicMap';

export const metadata = {
  title: '首都圏路線図 | 谷中日本鉄道',
  description: '谷中日本鉄道の首都圏25路線・650駅を、地理的位置関係を保ちつつ白紙上に直線模式化した首都圏路線図。',
};

export default function Page() {
  const diagram = buildSchematic(mapData.lines);
  return <SchematicMap diagram={diagram} />;
}
