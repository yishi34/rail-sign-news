import mapData from '../../../data/map-national-kml.json';
import { buildNationalSchematic } from '../../../data/national-schematic';
import NationalSchematicMap from './NationalSchematicMap';

export const metadata = {
  title: '全国路線図 | 谷中日本鉄道',
  description: '谷中日本鉄道の全国41路線・延べ1,685駅を、地理的位置関係を保ちつつ白紙上に直線模式化した全国版路線図。',
};

export default function Page() {
  const diagram = buildNationalSchematic(mapData.lines);
  return <NationalSchematicMap diagram={diagram} />;
}
