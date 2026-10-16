import { useEffect, useState } from "react";
import { WMS_URL } from "../services/wmsService.js";
export default function LayerList({ map, layers, setLayers, selectedLayer, onSelectLayer }) {
  const [catalog, setCatalog] = useState([{ name: "topp:states", title: "US States" }]);
  useEffect(() => {
    fetch(`${WMS_URL}?service=WMS&version=1.1.1&request=GetCapabilities`)
      .then((r) => r.text()).then((x) => {
        const d = new DOMParser().parseFromString(x, "text/xml");
        const a = [...d.querySelectorAll("Layer > Layer")].map((n) => ({
          name: n.querySelector(":scope > Name")?.textContent,
          title: n.querySelector(":scope > Title")?.textContent
        })).filter((n) => n.name);
        if (a.length) setCatalog([...new Map(a.map((x) => [x.name, x])).values()]);
      }).catch(() => {});
  }, []);
  const add = () => {
    if (!layers.some((l) => l.name === selectedLayer)) {
      const c = catalog.find((x) => x.name === selectedLayer) || { name: selectedLayer, title: selectedLayer };
      setLayers((p) => [...p, { ...c, visible: true }]);
    }
  };
  return <section className="side-section">
    <h3>Layer catalogue</h3>
    <label className="field-label">SELECT GEOSERVER LAYER</label>
    <select value={selectedLayer} onChange={(e) => onSelectLayer(e.target.value)}>
      {catalog.map((l) => <option key={l.name} value={l.name}>{l.title} ({l.name})</option>)}
    </select>
    <button className="primary full" onClick={add}>＋ Add selected layer</button>
    <div className="section-title"><h3>Visible layers</h3><span className="count-pill">{layers.length}</span></div>
    {layers.map((l) => <div className="layer-row" key={l.name}>
      <input type="checkbox" checked={l.visible} onChange={() => setLayers((p) => p.map((x) => x.name === l.name ? { ...x, visible: !x.visible } : x))}/>
      <span className="layer-symbol">▱</span>
      <button className="layer-text layer-select" onClick={() => onSelectLayer(l.name)}><strong>{l.title || l.name}</strong><small>{l.name}</small></button>
    </div>)}
  </section>;
}
