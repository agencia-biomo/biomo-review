'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer } from './ChartContainer';

interface ResolutionData {
  name: string;
  avgHours: number;
  color?: string;
}

interface ResolutionTimeChartProps {
  data: ResolutionData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function ResolutionTimeChart({
  data,
  title = 'Tempo Medio por Status',
  subtitle = 'Em horas',
  className,
}: ResolutionTimeChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle} className={className}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}h`, 'Tempo medio']}
            />
            <Bar
              dataKey="avgHours"
              radius={[0, 4, 4, 0]}
              fill="#8B5CF6"
              background={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
