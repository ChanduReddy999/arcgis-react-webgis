import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import MapToolbar from "./components/MapToolbar.jsx";
import LayerList from "./components/LayerList.jsx";
import LegendPanel from "./components/LegendPanel.jsx";
import ScaleBar from "./components/ScaleBar.jsx";
import BasemapGallery from "./components/BasemapGallery.jsx";
import MeasurementTools from "./components/MeasurementTools.jsx";
import AttributeQuery from "./components/AttributeQuery.jsx";
import AttributeTable from "./components/AttributeTable.jsx";
import FieldSelector from "./components/FieldSelector.jsx";
import AttributeChart from "./components/AttributeChart.jsx";
import StateIdentify from "./components/StateIdentify.jsx";
import "./styles/App.css";

export default function App() {
  const [mapBundle, setMapBundle] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState("topp:states");
  const [layers, setLayers] = useState([
    { name: "topp:states", title: "US States", visible: true },
  ]);
  const [features, setFeatures] = useState([]);
  const [chartFeatures, setChartFeatures] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedField, setSelectedField] = useState("");
  const [status, setStatus] = useState(
    "Ready. Select a layer or click the map.",
  );
  const map = mapBundle;
  useEffect(() => {
    if (!selectedField && fields.length) setSelectedField(fields[0]);
  }, [fields, selectedField]);
  const selectLayer = (name) => {
    if (name === selectedLayer) return;
    setSelectedLayer(name);
    setFeatures([]);
    setChartFeatures([]);
    setFields([]);
    setSelectedField("");
    setSelectedFeature(null);
    setStatus(`Selected ${name}. Loading its attributes...`);
  };
  return (
    <div className="app-shell">
      {/* <header className="topbar"><div className="brand-mark">G</div><div className="brand"><strong>GeoInsight</strong><span>MODULAR WEB GIS · ARCGIS SDK</span></div><div className="topbar-spacer"/><span className="connection"><i/> GeoServer WMS/WFS</span></header> */}
      <main className="workspace">
        <aside className="sidebar">
          <div className="side-heading">
            <div>
              <h2>Map controls</h2>
            </div>
            <span className="live-dot" />
          </div>
          <LayerList
            map={map}
            layers={layers}
            setLayers={setLayers}
            selectedLayer={selectedLayer}
            onSelectLayer={selectLayer}
          />
          <LegendPanel layer={selectedLayer} />
          <BasemapGallery map={mapBundle} />
          <MeasurementTools map={map} setStatus={setStatus} />
          <FieldSelector
            fields={fields}
            selectedField={selectedField}
            onChange={setSelectedField}
          />
          <AttributeQuery
            key={selectedLayer}
            layer={selectedLayer}
            fields={fields}
            setFields={setFields}
            setFeatures={setFeatures}
            setChartFeatures={setChartFeatures}
            setStatus={setStatus}
          />
          <StateIdentify map={map} setStatus={setStatus} />
        </aside>
        <section className="main-content">
          <div className="map-card">
            <MapView
              onMapReady={setMapBundle}
              layers={layers}
              selectedFeature={selectedFeature}
            />
            <MapToolbar map={map} />
            <div className="map-top-chip">
              <span className="chip-dot" /> {selectedLayer}
            </div>
            <div className="map-help">Click the map to inspect coordinates</div>
          </div>
          <ScaleBar map={map} />
          <div className="status-bar">
            <span className="status-icon">✓</span>
            <span>{status}</span>
            <span className="status-spacer" />
            <span className="crs">WGS 84 / Web Mercator</span>
          </div>
          <AttributeTable
            layer={selectedLayer}
            features={features}
            fields={fields}
            onSelect={setSelectedFeature}
          />
          <AttributeChart
            layer={selectedLayer}
            features={chartFeatures}
            fields={fields}
            selectedField={selectedField}
          />
        </section>
      </main>
    </div>
  );
}
