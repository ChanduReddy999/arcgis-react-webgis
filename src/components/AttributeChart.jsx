import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
export default function AttributeChart({ layer, features, selectedField }) {
  const counts = useMemo(() => {
    const c = new Map();
    features.forEach((f) => {
      const v = f.properties?.[selectedField];
      const k = v == null || v === "" ? "(empty)" : String(v);
      c.set(k, (c.get(k) || 0) + 1);
    });
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [features, selectedField]);
  return (
    <section className="chart-section">
      <div className="data-heading">
        <div>
          <span className="eyebrow">QUICK STATISTICS</span>
          <h2>Feature count by field - {layer}</h2>
        </div>
      </div>
      {selectedField && counts.length ? (
        <div className="chart-card">
          <Bar
            data={{
              labels: counts.map((x) => x[0]),
              datasets: [
                {
                  label: "Feature count",
                  data: counts.map((x) => x[1]),
                  backgroundColor: "#2586c8",
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: counts.length > 8 ? "y" : "x",
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      ) : (
        <div className="empty-state">
          Choose an analysis field and load features to generate counts.
        </div>
      )}
    </section>
  );
}
