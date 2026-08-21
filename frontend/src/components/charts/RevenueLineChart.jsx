import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import { formatCurrency } from '../../utils/format'

export default function RevenueLineChart({
  data = [],
  height = 260,
}) {
  if (!data.length) {
    return (
      <p className="text-sm text-slate py-12 text-center">
        No revenue data yet.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#0F333015"
        />

        <XAxis
          dataKey="period"
          tick={{
            fontSize: 11,
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
          formatter={(value) => formatCurrency(value)}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #0F333015',
          }}
        />

        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#BE9B4E"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}