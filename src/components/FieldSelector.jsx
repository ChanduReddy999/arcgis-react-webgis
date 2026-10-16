export default function FieldSelector({ fields, selectedField, onChange }) {
  return (
    <section className="side-section">
      <h3>Analysis field</h3>
      <label className="field-label">GROUP / COUNT BY</label>
      <select value={selectedField} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose field</option>
        {fields.map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
    </section>
  );
}
