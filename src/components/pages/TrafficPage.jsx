import { useMemo } from "react";
import { Eye, CheckCircle, Users, Lock, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { KpiCard, PremiumLock } from "./OverviewPage.jsx";

export default function TrafficPage({ data, winery, tier }) {
  const weekday = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const b = days.map(d => ({ day: d, visitors: 0, count: 0 }));
    data.daily.forEach(d => { const dow = new Date(d.date).getDay(); b[dow].visitors += d.visitors; b[dow].count++; });
    return b.map(x => ({ ...x, avg: x.count ? Math.round(x.visitors / x.count) : 0 }));
  }, [data.daily]);
  const cr = data.kpi.visitors.value > 0 ? ((data.kpi.checkIns.value / data.kpi.visitors.value) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Traffic Analytics</h2><p className="text-xs text-gray-400">Deep dive into visitor patterns</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Eye} label="Total App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-in Rate" value={cr} suffix="%" color="blue" />
        <KpiCard icon={Users} label="Unique Visitors (est.)" value={Math.round(data.kpi.visitors.value * 0.72)} color="green" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Visitors by Day of Week</h3><p className="text-xs text-gray-400 mt-0.5">Average daily traffic</p></div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekday}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="day" tick={{fontSize:11,fill:"#6b7280"}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12}}/><Bar dataKey="avg" fill="#9333ea" radius={[6,6,0,0]} name="Avg Visitors"/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Rating Breakdown</h3><p className="text-xs text-gray-400 mt-0.5">Distribution of check-in ratings</p></div>
        <div className="space-y-2.5 mt-2">
          {data.ratings.map(r => { const tot = data.ratings.reduce((s, x) => s + x.count, 0); const pct = ((r.count / tot) * 100).toFixed(0); return (
            <div key={r.stars} className="flex items-center gap-3"><span className="text-xs text-gray-500 w-12">{r.stars}</span><div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} /></div><span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span></div>
          ); })}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Conversion Funnel</h3><p className="text-xs text-gray-400 mt-0.5">From app view to review</p></div>
        {tier === "free" && <PremiumLock feature="See how visitors convert at each stage" />}
        <div className="space-y-2.5 mt-3">
          {[
            { stage: "Saw on Map/List", pct: 100, c: data.kpi.visitors.value, col: "#9333ea" },
            { stage: "Viewed Profile", pct: 64, c: Math.round(data.kpi.visitors.value * 0.64), col: "#7c3aed" },
            { stage: "Checked In", pct: parseFloat(cr), c: data.kpi.checkIns.value, col: "#6d28d9" },
            { stage: "Left Rating", pct: parseFloat(cr) * 0.6, c: Math.round(data.kpi.checkIns.value * 0.6), col: "#5b21b6" },
          ].map(f => (
            <div key={f.stage} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-28">{f.stage}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full flex items-center pl-1.5" style={{ width: `${Math.max(f.pct, 5)}%`, background: f.col }}>
                  <span className="text-[9px] text-white font-medium">{f.c.toLocaleString()}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 w-10 text-right">{f.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
