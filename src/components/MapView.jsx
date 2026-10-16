import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import WMSLayer from "@arcgis/core/layers/WMSLayer.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import { WMS_URL } from "../services/wmsService.js";
import "@arcgis/core/assets/esri/themes/light/main.css";

export default function MapViewComponent({ onMapReady, layers = [], selectedFeature }) {
  const target = useRef(null);
  const bundleRef = useRef(null);

  useEffect(() => {
    let view;
    let destroyed = false;
    const baseMap = new Map({ basemap: "osm" });
    const measurementLayer = new GraphicsLayer({ title: "Measurements", listMode: "hide" });
    const highlightLayer = new GraphicsLayer({ title: "Selected feature", listMode: "hide" });
    baseMap.addMany([measurementLayer, highlightLayer]);
    view = new MapView({
      container: target.current,
      map: baseMap,
      center: [-98.5, 39.8],
      zoom: 4,
      constraints: { snapToZoom: false }
    });
    const bundle = { map: baseMap, view, measurementLayer, highlightLayer, wmsLayers: new globalThis.Map() };
    bundleRef.current = bundle;
    view.when(() => { if (!destroyed) onMapReady(bundle); });
    const clickHandle = view.on("click", (event) => {
      if (view.__measurementActive) return;
      const p = event.mapPoint;
      if (!p) return;
      window.dispatchEvent(new CustomEvent("webgis-map-click", {
        detail: { lon: p.longitude, lat: p.latitude, coordinate: [p.x, p.y] }
      }));
    });
    return () => {
      destroyed = true;
      clickHandle.remove();
      if (view) view.destroy();
      bundleRef.current = null;
    };
  }, [onMapReady]);

  useEffect(() => {
    const b = bundleRef.current;
    if (!b) return;
    const wanted = new Set(layers.map((l) => l.name));
    for (const [name, layer] of b.wmsLayers.entries()) {
      if (!wanted.has(name)) { b.map.remove(layer); b.wmsLayers.delete(name); }
    }
    for (const item of layers) {
      let layer = b.wmsLayers.get(item.name);
      if (!layer) {
        layer = new WMSLayer({
          url: WMS_URL,
          title: item.title || item.name,
          sublayers: [{ name: item.name, title: item.title || item.name, visible: true }]
        });
        b.wmsLayers.set(item.name, layer);
        b.map.add(layer, 0);
      }
      layer.title = item.title || item.name;
      layer.visible = item.visible;
      if (layer.sublayers?.length) layer.sublayers.getItemAt(0).visible = item.visible;
    }
  }, [layers]);

  useEffect(() => {
    const b = bundleRef.current;
    if (!b) return;
    b.highlightLayer.removeAll();
    if (!selectedFeature?.geometry) return;
    try {
      const g = selectedFeature.geometry;
      let geometry;
      if (g.type === "Point") geometry = new Point({ longitude: g.coordinates[0], latitude: g.coordinates[1] });
      else if (g.type === "LineString" || g.type === "MultiLineString") {
        geometry = new Polyline({ paths: g.type === "LineString" ? [g.coordinates] : g.coordinates, spatialReference: { wkid: 4326 } });
      } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
        const rings = g.type === "Polygon" ? g.coordinates : g.coordinates.flat(1);
        geometry = new Polygon({ rings, spatialReference: { wkid: 4326 } });
      } else return;
      const symbol = g.type === "Point"
        ? new SimpleMarkerSymbol({ color: [255,159,28,0.9], size: 12, outline: { color: "#ffffff", width: 1.5 } })
        : new SimpleFillSymbol({ color: [255,159,28,0.18], outline: new SimpleLineSymbol({ color: "#ff9f1c", width: 3 }) });
      const graphic = new Graphic({ geometry, symbol, attributes: selectedFeature.properties || {} });
      b.highlightLayer.add(graphic);
      b.view.goTo(graphic).catch(() => {});
    } catch (e) { console.warn("Unable to highlight selected feature", e); }
  }, [selectedFeature]);

  return <div ref={target} className="map-container" />;
}
