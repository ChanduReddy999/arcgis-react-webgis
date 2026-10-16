import { useEffect, useState } from "react";
import Graphic from "@arcgis/core/Graphic.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import Draw from "@arcgis/core/views/draw/Draw.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";

const choices = [
  ["line", "Line"],
  ["freehand-line", "Freehand line"],
  ["polygon", "Polygon area"],
  ["circle", "Circle area"],
  ["freehand-polygon", "Freehand area"],
];
const distanceText = (meters) =>
  meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${meters.toFixed(1)} m`;
const areaText = (sqMeters) =>
  sqMeters >= 1e6
    ? `${(sqMeters / 1e6).toFixed(3)} km²`
    : `${sqMeters.toFixed(1)} m²`;

function measurement(geometry, type) {
  if (type === "circle") {
    const radius = geometry.radius;
    const polygon = geometry.toPolygon ? geometry.toPolygon(96) : geometry;
    return `Radius ${distanceText(radius)} · Area ${areaText(Math.abs(geometryEngine.geodesicArea(polygon, "square-meters")))}`;
  }
  if (geometry.type === "polyline") {
    return distanceText(geometryEngine.geodesicLength(geometry, "meters"));
  }
  return areaText(
    Math.abs(geometryEngine.geodesicArea(geometry, "square-meters")),
  );
}
function makeSymbol(type) {
  if (type === "line" || type === "freehand-line") {
    return { type: "simple-line", color: "#00a884", width: 3 };
  }
  return {
    type: "simple-fill",
    color: [0, 168, 132, 0.16],
    outline: { color: "#00a884", width: 2.5 },
  };
}

export default function MeasurementTools({ map, setStatus }) {
  const [active, setActive] = useState("");
  const [items, setItems] = useState([]);
  useEffect(() => {
    const view = map?.view;
    const layer = map?.measurementLayer;
    if (!view || !layer || !active) return;
    let cancelled = false;
    view.__measurementActive = true;
    setStatus("Measurement active. Draw on the map.");
    const draw = new Draw({ view });
    const options =
      active === "freehand-line" || active === "freehand-polygon"
        ? { mode: "freehand" }
        : {};
    const drawType =
      active === "line" || active === "freehand-line"
        ? "polyline"
        : active === "circle"
          ? "circle"
          : "polygon";
    const action = draw.create(drawType, options);
    const previewHandle = action.on("cursor-update", (event) => {
      try {
        const vertices = event.vertices || [];
        if (vertices.length < 2) return;
        let preview;
        if (drawType === "polyline")
          preview = new Polyline({
            paths: [vertices],
            spatialReference: view.spatialReference,
          });
        else if (drawType === "polygon" && vertices.length >= 3)
          preview = new Polygon({
            rings: [[...vertices, vertices[0]]],
            spatialReference: view.spatialReference,
          });
        if (preview) {
          const live = measurement(preview, active);
          setStatus(`Measuring live: ${live}`);
        }
      } catch {}
    });
    const completeHandle = action.on("draw-complete", (event) => {
      if (cancelled) return;
      try {
        const geometry = event.geometry;
        const text = measurement(geometry, active);
        const id = `${Date.now()}-${Math.random()}`;
        const graphic = new Graphic({
          geometry,
          symbol: makeSymbol(active),
          attributes: { measureId: id, measurement: text },
        });
        layer.add(graphic);
        let labelPoint = geometry.extent?.center;
        if (geometry.type === "polyline")
          labelPoint = geometry.getPoint(
            0,
            Math.floor(geometry.paths[0].length / 2),
          );
        if (!labelPoint) labelPoint = geometry;
        const labelGraphic = new Graphic({
          geometry: labelPoint,
          symbol: {
            type: "text",
            text,
            color: "#123b32",
            haloColor: "#ffffff",
            haloSize: 2,
            font: { size: 11, weight: "bold" },
            yoffset: 12,
          },
          attributes: { measureId: id, measurement: text, isLabel: true },
        });
        layer.add(labelGraphic);
        setItems((previous) => [...previous, { id, text }]);
        setStatus(`Measurement completed: ${text}`);
      } catch (error) {
        setStatus(`Measurement failed: ${error.message || error}`);
      } finally {
        view.__measurementActive = false;
        setActive("");
      }
    });
    setStatus(
      `Measurement active: ${choices.find((x) => x[0] === active)?.[1]}.`,
    );

    return () => {
      cancelled = true;
      view.__measurementActive = false;
      completeHandle?.remove();
      try {
        action?.destroy?.();
      } catch {}
    };
  }, [map, active, setStatus]);

  const clearOne = (id) => {
    map?.measurementLayer?.graphics
      ?.filter((g) => g.attributes?.measureId === id)
      .forEach((g) => map.measurementLayer.remove(g));
    setItems((p) => p.filter((x) => x.id !== id));
  };
  const clearAll = () => {
    map?.measurementLayer?.removeAll();
    setItems([]);
    setStatus("All measurements cleared.");
  };
  return (
    <section className="side-section">
      <h3>Measurement tools</h3>
      <p className="muted">
        Draw on the map. Completed shapes remain when you change tools.
      </p>
      <div className="measure-grid">
        {choices.map(([id, label]) => (
          <button
            key={id}
            className={active === id ? "tool-button chosen" : "tool-button"}
            onClick={() => setActive((p) => (p === id ? "" : id))}
          >
            {label}
          </button>
        ))}
      </div>
      {active && (
        <p className="tip-box">
          Active: {choices.find((x) => x[0] === active)?.[1]}. Draw on the map;
          double-click to finish lines and polygons.
        </p>
      )}
      <button className="secondary full" onClick={clearAll}>
        Clear all measurements
      </button>
      {items.map((x) => (
        <div className="measurement-row" key={x.id}>
          <span>{x.text}</span>
          <button
            onClick={() => clearOne(x.id)}
            aria-label="Clear this measurement"
          >
            ×
          </button>
        </div>
      ))}
    </section>
  );
}
