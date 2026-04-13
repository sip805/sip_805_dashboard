import { useMemo } from "react";
import { Eye, CheckCircle, Users, Lock, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { KpiCard, PremiumLock } from "./OverviewPage.jsx";

// MIGRATION: TrafficPage now renders real analytics from Firestore visits.
// Empty states are shown when no visit data exists.

export default function TrafficPage({ data, winery, tier }) {
  const weekday = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const b = days.map(d => ({ day: d, checkIns: 0, count: 0 }));
    data.daily.forEach(d => { const dow = new Date(d.date).getDay(); b[dow].checkIns += d.checkIns; b[dow].count++; });
    return b.map(x => ({ ...x, avg: x.count ? Math.round(x.checkIns / x.count) : 0 }));
  }, [data.daily]);

  const hasData = data.kpi.checkIns.value > 0 || data.kpi.visitors.value > 0;

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Traffic Analytics</h2><p className="text-xs text-gray-400">Real visitor patterns from check-in data</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Eye} label="Unique Visitors (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-ins (30d)" value={data.kpi.checkIns.value} change={data.kpi.checkIns.change} color="blue" />
        <KpiCard icon={Users} label="Total Visitors (All Time)" value={data.uniqueVisitors || 0} color="green" />
      </div>

      {!hasData && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-sm text-purple-800">
            <strong>No traffic data yet.</strong> Analytics will populate as customers check in at your winery via the Sip805 app.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Check-ins by Day of Week</h3><p className="text-xs text-gray-400 mt-0.5">Average daily check-in activity</p></div>
        {hasData ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekday}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="day" tick={{fontSize:11,fill:"#6b7280"}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12}}/><Bar dataKey="avg" fill="#9333ea" radius={[6,6,0,0]} name="Avg Check-ins"/></BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center">
            <p className="text-sm text-gray-400">No check-in data yet</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Rating Breakdown</h3><p className="text-xs text-gray-400 mt-0.5">Distribution of check-in ratings</p></div>
        {data.ratings.some(r => r.count > 0) ? (
          <div className="space-y-2.5 mt-2">
            {data.ratings.map(r => (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12">{r.stars}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.count}%`, background: r.color }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-8 text-right">{r.count}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">No ratings yet</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Check-in Hours</h3><p className="text-xs text-gray-400 mt-0.5">When customers visit (all time)</p></div>
        {tier === "free" && <PremiumLock feature="See busiest hours to optimize staffing" />}
        {data.hourly.some(h => h.visitors > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly.slice(8,20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="hour" tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{borderRadius:12}}/>
                <Bar dataKey="visitors" fill="#9333ea" radius={[4,4,0,0]} name="Check-ins"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-gray-400">No hourly data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
