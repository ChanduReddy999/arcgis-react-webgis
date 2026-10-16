import { useCallback, useEffect, useRef, useState } from "react";
import { WFS_URL } from "../services/wmsService.js";

export default function AttributeQuery({
  layer,
  fields,
  setFields,
  setFeatures,
  setChartFeatures,
  setStatus,
}) {
  const [field, setField] = useState("");
  const [operator, setOperator] = useState("=");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const requestRef = useRef(null);

  const loadFeatures = useCallback(async (
    filterField = "",
    filterValue = "",
    filterOperator = "=",
  ) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setStatus(`Loading attributes for ${layer}...`);

    try {
      const pageSize = 1000;
      const allFeatures = [];
      let startIndex = 0;
      let previousPageSignature = "";
      let totalMatched = null;

      while (true) {
        const url = new URL(WFS_URL);
        url.search = new URLSearchParams({
          service: "WFS",
          version: "2.0.0",
          request: "GetFeature",
          typeNames: layer,
          outputFormat: "application/json",
          srsName: "EPSG:4326",
          count: String(pageSize),
          startIndex: String(startIndex),
        });
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw Error(`WFS HTTP ${response.status}`);
        const data = await response.json();
        const page = data.features || [];
        if (totalMatched == null && Number.isFinite(Number(data.numberMatched))) {
          totalMatched = Number(data.numberMatched);
        }
        if (!page.length) break;

        const signature = JSON.stringify([
          page[0].id ?? page[0].properties,
          page[page.length - 1].id ?? page[page.length - 1].properties,
        ]);
        if (startIndex > 0 && signature === previousPageSignature) {
          throw Error("GeoServer repeated a WFS page; pagination is unavailable for this layer");
        }
        previousPageSignature = signature;
        allFeatures.push(...page);
        startIndex += page.length;
        setStatus(`Loading ${layer} records... ${allFeatures.length.toLocaleString()} loaded`);

        if (page.length < pageSize || (totalMatched != null && startIndex >= totalMatched)) {
          break;
        }
      }
      const availableFields = Object.keys(allFeatures[0]?.properties || {});
      const activeField = availableFields.includes(filterField)
        ? filterField
        : availableFields[0] || "";
      const term = filterValue.trim();
      const results = allFeatures.filter((feature) => {
        if (!term) return true;
        const raw = feature.properties?.[activeField];
        if (raw == null || raw === "") return filterOperator === "!=";

        const actual = String(raw).trim();
        const expected = term;
        if (filterOperator === "=" || filterOperator === "!=") {
          const equal = actual.localeCompare(expected, undefined, {
            sensitivity: "base",
            numeric: true,
          }) === 0;
          return filterOperator === "=" ? equal : !equal;
        }

        const actualNumber = Number(actual);
        const expectedNumber = Number(expected);
        const bothNumeric = actual !== "" && expected !== "" &&
          Number.isFinite(actualNumber) && Number.isFinite(expectedNumber);
        const comparison = bothNumeric
          ? Math.sign(actualNumber - expectedNumber)
          : Math.sign(actual.localeCompare(expected, undefined, {
              sensitivity: "base",
              numeric: true,
            }));
        if (filterOperator === "<") return comparison < 0;
        if (filterOperator === "<=") return comparison <= 0;
        if (filterOperator === ">") return comparison > 0;
        if (filterOperator === ">=") return comparison >= 0;
        return true;
      });

      setFields(availableFields);
      setField(activeField);
      setChartFeatures(allFeatures);
      setFeatures(results);
      setStatus(
        `Loaded ${results.length} feature(s) from ${layer}${
          term ? ` matching ${activeField}` : ""
        }.`,
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      setStatus(
        `Attribute query failed: ${error.message}. Check GeoServer WFS/CORS access.`,
      );
      setFields([]);
      setFeatures([]);
      setChartFeatures([]);
    } finally {
      if (requestRef.current === controller) setBusy(false);
    }
  }, [layer, setFields, setFeatures, setChartFeatures, setStatus]);

  useEffect(() => {
    loadFeatures();
    return () => requestRef.current?.abort();
  }, [loadFeatures]);

  return (
    <section className="side-section">
      <h3>Attribute query</h3>
      <label className="field-label">FIELD NAME</label>
      <select
        value={field}
        onChange={(event) => setField(event.target.value)}
        disabled={!fields.length || busy}
      >
        <option value="">{busy ? "Loading fields..." : "No fields available"}</option>
        {fields.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <label className="field-label">OPERATOR</label>
      <select
        value={operator}
        onChange={(event) => setOperator(event.target.value)}
        disabled={!fields.length || busy}
      >
        <option value="=">Equals (=)</option>
        <option value="!=">Not equal (!=)</option>
        <option value="&lt;">Less than (&lt;)</option>
        <option value="&lt;=">Less than or equal (&lt;=)</option>
        <option value="&gt;">Greater than (&gt;)</option>
        <option value="&gt;=">Greater than or equal (&gt;=)</option>
      </select>
      <label className="field-label">VALUE</label>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="e.g. California"
      />
      <button
        className="primary full"
        onClick={() => loadFeatures(field, value, operator)}
        disabled={busy || !fields.length}
      >
        {busy ? "Loading..." : "Run attribute query"}
      </button>
      <p className="muted">
        All available fields and records load from the selected layer automatically.
      </p>
    </section>
  );
}
