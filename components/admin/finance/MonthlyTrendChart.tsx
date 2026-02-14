'use client';

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyTrendChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-bold mb-4 text-gray-800">روند سوددهی ۳۰ روز گذشته</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="date" scale="band" tick={{fontSize: 10}} />
          <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('fa-IR').format(value)} />
          <Legend />
          <Bar dataKey="revenue" name="درآمد" barSize={20} fill="#413ea0" />
          <Line type="monotone" dataKey="expenses" name="هزینه‌ها" stroke="#ff7300" />
          <Line type="monotone" dataKey="netProfit" name="سود خالص" stroke="#82ca9d" strokeWidth={3} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
