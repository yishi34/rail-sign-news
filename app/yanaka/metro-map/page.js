import yanaka from '../../../data/yanaka.json';
import { buildSchematic } from '../../../data/metro-schematic';
import SchematicMap from './SchematicMap';

export const metadata = { title: '首都圏路線網図 | 谷中日本鉄道', description: '谷鉄の首都圏15路線をまとめた平面路線図。' };

export default function Page() {
  return <SchematicMap diagram={buildSchematic(yanaka.routemap.lines)} />;
}
