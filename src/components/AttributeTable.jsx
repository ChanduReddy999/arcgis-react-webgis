export default function AttributeTable({ layer, features, fields, onSelect }) {
  return (
    <section className="data-section">
      <div className="data-heading">
        <div>
          <span className="eyebrow">DATA EXPLORER</span>
          <h2>Attribute table - {layer}</h2>
        </div>
        <div className="data-meta">
          {features.length.toLocaleString()} record(s)
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {fields.map((f) => (
                <th key={f}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={f.id || i} onClick={() => onSelect(f)}>
                <td>{i + 1}</td>
                {fields.map((k) => (
                  <td key={k} title={String(f.properties?.[k] ?? "")}>
                    {String(f.properties?.[k] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!features.length && (
          <div className="empty-state">
            Run an attribute query to load records.
          </div>
        )}
      </div>
    </section>
  );
}
