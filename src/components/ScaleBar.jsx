import { useEffect, useRef } from "react";
import ScaleBarWidget from "@arcgis/core/widgets/ScaleBar.js";
export default function ScaleBar({ map }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!map?.view || !ref.current) return;
    const widget = new ScaleBarWidget({ view: map.view, container: ref.current, unit: "metric", style: "ruler" });
    return () => widget.destroy();
  }, [map]);
  return <div ref={ref} className="scale-host" />;
}
