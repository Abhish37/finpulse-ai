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

export default function ChartVisualizer({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center border border-border bg-surface text-gray-500">
        No forecast data available.
      </div>
    );
  }

  // Find min and max for the Y-axis domain
  let minPrice = Number.MAX_VALUE;
  let maxPrice = Number.MIN_VALUE;

  data.forEach(d => {
    if (d.price < minPrice) minPrice = d.price;
    if (d.price > maxPrice) maxPrice = d.price;
    if (d.lower_bound && d.lower_bound < minPrice) minPrice = d.lower_bound;
    if (d.upper_bound && d.upper_bound > maxPrice) maxPrice = d.upper_bound;
  });

  // Give a little padding to the domain
  const yMin = Math.max(0, minPrice * 0.95);
  const yMax = maxPrice * 1.05;

  return (
    <div className="h-96 w-full border border-border bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#666666" 
            tick={{ fill: '#666666', fontSize: 12 }} 
            tickFormatter={(tick) => tick.substring(5)} // Show MM-DD
          />
          <YAxis 
            stroke="#666666" 
            tick={{ fill: '#666666', fontSize: 12 }} 
            domain={[yMin, yMax]}
            tickFormatter={(tick) => `$${tick.toFixed(0)}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111111', borderColor: '#333333', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#888' }}
          />
          
          {/* Confidence Band */}
          <Area 
            type="monotone" 
            dataKey="upper_bound" 
            stroke="none" 
            fill="#6366F1" 
            fillOpacity={0.1} 
          />
          <Area 
            type="monotone" 
            dataKey="lower_bound" 
            stroke="none" 
            fill="#0A0A0A" 
            fillOpacity={1} // Mask the bottom half of the upper area to create a band
          />
          
          {/* Forecast Line */}
          <Line 
            type="monotone" 
            dataKey={(d) => d.is_forecast ? d.price : null} 
            stroke="#6366F1" 
            strokeWidth={2} 
            dot={false}
            name="Forecast" 
          />
          
          {/* Historical Line */}
          <Line 
            type="monotone" 
            dataKey={(d) => !d.is_forecast ? d.price : null} 
            stroke="#10B981" 
            strokeWidth={2} 
            dot={false}
            name="Historical"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
