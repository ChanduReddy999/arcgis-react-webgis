export default function MapToolbar({ map }) {
  const zoom = (delta) => {
    if (map?.view) map.view.goTo({ zoom: map.view.zoom + delta }, { duration: 180 }).catch(() => {});
  };
  return <div className="map-actions">
    <button onClick={() => zoom(1)} title="Zoom in">＋</button>
    <button onClick={() => zoom(-1)} title="Zoom out">−</button>
    <button onClick={() => map?.view?.goTo({ center: [-98.5, 39.8], zoom: 4 }, { duration: 300 }).catch(() => {})} title="Reset view">⌂</button>
  </div>;
}
