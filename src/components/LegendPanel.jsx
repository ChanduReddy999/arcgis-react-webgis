import { useState } from "react";
import { legendUrl } from "../services/wmsService.js";
export default function LegendPanel({ layer }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="legend-box">
      <h3>Legend</h3>
      {!failed ? (
        <img
          className="legend-image"
          src={legendUrl(layer)}
          alt={`${layer} legend`}
          onError={() => setFailed(true)}
        />
      ) : (
        <p className="muted">Legend is not available for this layer.</p>
      )}
    </div>
  );
}
