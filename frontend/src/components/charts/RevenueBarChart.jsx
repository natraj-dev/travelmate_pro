import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export default function RevenueBarChart({
  data = [],
  height = 240,
}) {
  if (!data.length) {
    return (
      <p className="text-sm text-slate py-10 text-center">
        No data yet.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#0F333015"
        />

        <XAxis
          dataKey="period"
          tick={{
            fontSize: 10,
            fill: '#6B7570',
          }}
          tickFormatter={(value) =>
            typeof value === 'string'
              ? value.slice(5)
              : value
          }
        />

        <YAxis
          tick={{
            fontSize: 11,
            fill: '#6B7570',
          }}
        />

        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #0F333015',
          }}
        />

        <Bar
          dataKey="revenue"
          fill="#0F3330"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}