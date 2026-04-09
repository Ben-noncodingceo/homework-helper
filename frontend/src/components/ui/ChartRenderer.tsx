import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartData } from '../../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  data: ChartData;
}

export default function ChartRenderer({ data }: Props) {
  if (!data) return null;

  if (data.type === 'table') {
    return (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          {data.tableHeaders && (
            <thead>
              <tr className="bg-gray-100">
                {data.tableHeaders.map((h, i) => (
                  <th key={i} className="border border-gray-300 px-3 py-1.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(data.tableRows ?? []).map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-300 px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.type === 'geometry') {
    return (
      <div className="my-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <span className="font-semibold">图形说明：</span> {data.description}
      </div>
    );
  }

  const chartData = (data.labels ?? []).map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    (data.datasets ?? []).forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  const title = data.title ? (
    <p className="text-sm font-semibold text-center text-gray-700 mb-1">{data.title}</p>
  ) : null;

  if (data.type === 'bar') {
    return (
      <div className="my-3">
        {title}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {(data.datasets ?? []).map((ds, i) => (
              <Bar key={i} dataKey={ds.label} fill={ds.color ?? COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (data.type === 'line') {
    return (
      <div className="my-3">
        {title}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {(data.datasets ?? []).map((ds, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.color ?? COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (data.type === 'pie') {
    const pieData = (data.labels ?? []).map((label, i) => ({
      name: label,
      value: data.datasets?.[0]?.data[i] ?? 0,
    }));
    return (
      <div className="my-3">
        {title}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
