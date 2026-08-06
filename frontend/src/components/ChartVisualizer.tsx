"use client";

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PredictionDataPoint } from '@/lib/types';

export default function ChartVisualizer({ data }: { data: PredictionDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center border border-border bg-[#090D16] text-gray-500 font-mono text-xs">
        NO CHART DATA
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-[#090D16] pt-4 rounded border border-border overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#4B5563" 
            fontSize={10} 
            fontFamily="monospace"
            tickMargin={10}
            minTickGap={30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#4B5563" 
            fontSize={10} 
            fontFamily="monospace"
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#F3F4F6', fontFamily: 'monospace', fontSize: '12px' }}
            itemStyle={{ color: '#10B981' }}
          />
          
          {/* Confidence Band Area */}
          <Area 
            type="monotone" 
            dataKey="upper_bound" 
            stroke="none" 
            fill="url(#colorBand)" 
            isAnimationActive={true}
          />
          <Area 
            type="monotone" 
            dataKey="lower_bound" 
            stroke="none" 
            fill="#090D16" 
            isAnimationActive={true}
          />

          {/* Actual Price Line */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            activeDot={{ r: 4, fill: "#059669", stroke: "#111827", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
