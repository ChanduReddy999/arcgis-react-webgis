export default function BasemapGallery({ map }) {
  const choose = (name) => {
    if (!map) return;
    const basemap = name === "OpenStreetMap" ? "osm" : name === "Satellite" ? "satellite" : "topo-vector";
    map.map.basemap = basemap;
  };
  return <section className="side-section">
    <h3>Basemap gallery</h3>
    <div className="basemap-grid">
      {[["OpenStreetMap", "🗺"], ["Satellite", "🌍"], ["Terrain", "⛰"]].map(([n, i]) =>
        <button key={n} className="basemap-card" onClick={() => choose(n)}><span>{i}</span><small>{n}</small></button>)}
    </div>
  </section>;
}
