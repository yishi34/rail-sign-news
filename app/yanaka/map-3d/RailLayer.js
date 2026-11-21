import * as THREE from "three";
import { MercatorCoordinate } from "maplibre-gl";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export function createRailLayer(lines, labelRoot, labelClass, onPick) {
  const origin = MercatorCoordinate.fromLngLat([139.65, 35.65]);
  const unit = origin.meterInMercatorCoordinateUnits();
  const transform = new THREE.Matrix4().makeTranslation(origin.x, origin.y, 0)
    .scale(new THREE.Vector3(unit, -unit, unit));
  const local = (coordinate) => {
    const p = MercatorCoordinate.fromLngLat(coordinate);
    return new THREE.Vector3((p.x - origin.x) / unit, -(p.y - origin.y) / unit, 0);
  };
  const resources = [];
  const keep = (resource) => { resources.push(resource); return resource; };
  const layer = {
    id: "yanaka-3d-railways", type: "custom", renderingMode: "3d",
    options: { visible: new Set(lines.map((l) => l.id)), height: 1, labels: true, selected: null },
    routes: [], projected: [],
    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      this.renderer.autoClear = false;
      const circle = keep(new THREE.CircleGeometry(1, 20));
      const white = keep(new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide }));
      const black = keep(new THREE.MeshBasicMaterial({ color: "#25312c", side: THREE.DoubleSide }));
      lines.forEach((line, index) => {
        const group = new THREE.Group();
        const points = line.stations.map((s) => local(s.coordinates));
        const curve = new THREE.CatmullRomCurve3(points, line.loop, "centripetal");
        const path = curve.getPoints(Math.max(32, points.length * 10));
        const geometry = keep(new LineGeometry());
        geometry.setPositions(path.flatMap((v) => [v.x, v.y, 0]));
        const material = keep(new LineMaterial({ color: line.color, linewidth: 5, worldUnits: false }));
        const track = new Line2(geometry, material);
        track.computeLineDistances();
        group.add(track);
        const stations = line.stations.map((station, i) => {
          const marker = new THREE.Group();
          marker.position.copy(points[i]);
          const rim = new THREE.Mesh(circle, black);
          const face = new THREE.Mesh(circle, white);
          face.scale.setScalar(0.73);
          face.position.z = 0.1;
          marker.add(rim, face);
          group.add(marker);
          const label = document.createElement("button");
          label.className = labelClass;
          label.textContent = station.name;
          label.style.borderBottomColor = line.color;
          label.hidden = true;
          label.addEventListener("click", (event) => { event.stopPropagation(); onPick({ ...station, lineId: line.id }); });
          labelRoot.appendChild(label);
          return { ...station, lineId: line.id, point: points[i], marker, label, important: i === 0 || i === points.length - 1 || (station.transfer?.length || 0) >= 2 };
        });
        this.scene.add(group);
        const shadow = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path.map((p) => {
          const lngLat = new MercatorCoordinate(origin.x + p.x * unit, origin.y - p.y * unit).toLngLat();
          return [lngLat.lng, lngLat.lat];
        }) } };
        this.routes.push({ group, stations, material, id: line.id, index, shadow });
      });
      this.clickHandler = (event) => {
        let closest = null, distance = 15;
        for (const station of this.projected) {
          const d = Math.hypot(station.x - event.point.x, station.y - event.point.y);
          if (d < distance) { closest = station; distance = d; }
        }
        if (closest) onPick(closest.station);
      };
      map.on("click", this.clickHandler);
    },
    setOptions(options) { Object.assign(this.options, options); this.map?.triggerRepaint(); },
    getShadows(visible) { return { type: "FeatureCollection", features: this.routes.filter((r) => visible.has(r.id)).map((r) => r.shadow) }; },
    render(gl, args) {
      const width = this.map.getContainer().clientWidth;
      const height = this.map.getContainer().clientHeight;
      const scale = 156543.03392 * Math.cos(35.65 * Math.PI / 180) / 2 ** this.map.getZoom();
      this.camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);
      const labels = [], placed = [], names = new Set();
      this.projected = [];
      this.routes.forEach((route) => {
        route.group.visible = this.options.visible.has(route.id);
        route.group.position.z = 2 + this.options.height * (140 + route.index * 95) * Math.min(1, scale / 120);
        route.material.resolution.set(width, height);
        route.stations.forEach((station) => {
          station.label.hidden = true;
          if (!route.group.visible) return;
          const selected = this.options.selected === `${route.id}:${station.name}`;
          station.marker.scale.setScalar(scale * (selected ? 6 : 3.4));
          station.marker.position.z = scale * 0.6;
          const projected = new THREE.Vector4(station.point.x, station.point.y, route.group.position.z + scale * 0.7, 1)
            .applyMatrix4(this.camera.projectionMatrix);
          if (projected.w <= 0) return;
          const x = (projected.x / projected.w + 1) * width / 2;
          const y = (1 - projected.y / projected.w) * height / 2;
          if (x < 0 || y < 0 || x > width || y > height) return;
          this.projected.push({ x, y, station });
          if (selected || (this.options.labels && (station.important || this.map.getZoom() >= 12.5))) {
            labels.push({ x, y, station, selected });
          }
        });
      });
      labels.sort((a, b) => Number(b.selected) - Number(a.selected));
      for (const { x, y, station, selected } of labels) {
        const labelWidth = Math.max(56, station.name.length * 12 + 18);
        const box = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y - 36, bottom: y - 9 };
        if (!selected && (names.has(station.name) || placed.length > 30 || placed.some((b) => box.left < b.right + 8 && box.right > b.left - 8 && box.top < b.bottom + 8 && box.bottom > b.top - 8))) continue;
        if (box.left < 2 || box.right > width - 2 || box.top < 2) continue;
        station.label.style.left = `${x}px`;
        station.label.style.top = `${y - 10}px`;
        station.label.hidden = false;
        placed.push(box); names.add(station.name);
      }
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.renderer.resetState();
    },
    onRemove() {
      this.map?.off("click", this.clickHandler);
      this.routes.forEach((r) => r.stations.forEach((s) => s.label.remove()));
      resources.forEach((resource) => resource.dispose());
      this.renderer?.dispose();
    },
  };
  return layer;
}
