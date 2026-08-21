import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#0F3330',
  '#BE9B4E',
  '#2C6E8E',
  '#2F855A',
  '#8F7233',
  '#1B4C47',
]

export default function SeasonalDemandChart({
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
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="month"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={{
            fontSize: 11,
          }}
        >
          {data.map((_, index) => (
            <Cell
              key={`season-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #0F333015',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}