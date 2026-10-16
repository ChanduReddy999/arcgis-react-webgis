import { useCallback, useEffect, useRef, useState } from "react";
import { WFS_URL } from "../services/wmsService.js";
import * as turf from "@turf/turf";

const getStateName = (feature) => {
  const properties = feature.properties || {};
  return (
    properties.STATE_NAME ||
    properties.STATE ||
    properties.NAME ||
    properties.name ||
    properties.state_name ||
    properties.STATE_ABBR ||
    "Unknown state"
  );
};

export default function StateIdentify({ setStatus }) {
  const [point, setPoint] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const requestRef = useRef(null);

  const analyze = useCallback(async (clickedPoint) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setResult(null);
    setStatus("Finding the clicked state and nearest state...");

    try {
      const url = new URL(WFS_URL);
      url.search = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName: "topp:states",
        outputFormat: "application/json",
        srsName: "EPSG:4326",
        maxFeatures: "1000",
      });
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw Error(`WFS HTTP ${response.status}`);
      const data = await response.json();
      const states = (data.features || []).filter((feature) =>
        ["Polygon", "MultiPolygon"].includes(feature.geometry?.type),
      );
      if (!states.length) throw Error("The states layer returned no polygon features");

      const clicked = turf.point([clickedPoint.lon, clickedPoint.lat]);
      const containing = states.find((feature) =>
        turf.booleanPointInPolygon(clicked, feature),
      );
      const candidates = states.filter((feature) => feature !== containing);
      let nearest = null;
      let nearestDistance = Infinity;

      for (const feature of candidates) {
        try {
          const distance = turf.pointToPolygonDistance(clicked, feature, {
            units: "kilometers",
          });
          if (distance < nearestDistance) {
            nearest = feature;
            nearestDistance = distance;
          }
        } catch {
          // Ignore an invalid state geometry and continue with the other states.
        }
      }

      const nextResult = {
        clicked: containing ? getStateName(containing) : "Outside state polygons",
        nearest: nearest ? getStateName(nearest) : "Not found",
        distance: nearestDistance,
      };
      setResult(nextResult);
      setStatus(
        containing
          ? `Point is inside ${nextResult.clicked}. Nearest other state: ${nextResult.nearest}.`
          : `Point is outside state polygons. Nearest state: ${nextResult.nearest}.`,
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      setStatus(`State lookup failed: ${error.message}. Check GeoServer WFS/CORS access.`);
    } finally {
      if (requestRef.current === controller) setBusy(false);
    }
  }, [setStatus]);

  useEffect(() => {
    const handler = (event) => {
      setPoint(event.detail);
    };
    window.addEventListener("webgis-map-click", handler);
    return () => {
      window.removeEventListener("webgis-map-click", handler);
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (point) analyze(point);
  }, [point, analyze]);

  return (
    <section className="side-section">
      <h3>State identify</h3>
      <p className="muted">
        Click anywhere on the map to find the state at that point and the nearest other state.
      </p>
      {point && (
        <div className="coordinate-card">
          <small>CLICKED COORDINATE</small>
          <strong>{point.lat.toFixed(5)}°, {point.lon.toFixed(5)}°</strong>
        </div>
      )}
      {busy && <p className="muted">Checking state boundaries...</p>}
      {result && (
        <div className="result-card">
          <small>SPATIAL RESULT</small>
          <strong>{result.clicked}</strong>
          <span>Nearest other state: {result.nearest}</span>
          <span>
            Boundary distance: {Number.isFinite(result.distance)
              ? `${result.distance.toFixed(2)} km`
              : "Unavailable"}
          </span>
        </div>
      )}
    </section>
  );
}
