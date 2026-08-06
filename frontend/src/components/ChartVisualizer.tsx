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
      <div className="h-64 w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-medium font-mono text-xs">
        NO CHART DATA
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white pt-4 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94A3B8" 
            fontSize={10} 
            fontFamily="monospace"
            tickMargin={10}
            minTickGap={30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={10} 
            fontFamily="monospace"
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1E293B', fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}
            itemStyle={{ color: '#3B82F6' }}
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
            fill="#ffffff" 
            isAnimationActive={true}
          />

          {/* Actual Price Line */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            activeDot={{ r: 5, fill: "#2563EB", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
