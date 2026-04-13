import { useState } from "react";
import { Eye, CheckCircle, Star, Map, ArrowUpRight, ArrowDownRight, Lock, Crown } from "lucide-react";
// MIGRATION: OverviewPage now renders real analytics from Firestore visits.
// Empty states are shown when no visit data exists instead of fake metrics.
import { AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const KpiCard = ({ icon: Icon, label, value, change, suffix = "", color = "purple" }) => {
  // Guard against NaN/invalid values — never render broken metrics
  const safeValue = (typeof value === "number" && Number.isFinite(value)) ? value : 0;
  const safeChange = (typeof change === "number" && Number.isFinite(change)) ? change : 0;
  const up = safeChange > 0;
  const cm = { purple: "bg-purple-50 text-purple-600", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", amber: "bg-amber-50 text-amber-600" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cm[color]}`}><Icon className="w-4 h-4" /></div>
        {safeChange !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(safeChange)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">{safeValue.toLocaleString()}{suffix}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
};

const PremiumLock = ({ feature }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
    <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mb-2"><Lock className="w-5 h-5 text-purple-600" /></div>
    <p className="text-sm font-semibold text-gray-900 mb-1">Premium Feature</p>
    <p className="text-xs text-gray-400 mb-2 text-center px-4">{feature}</p>
    <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"><Crown className="w-3 h-3" /> Upgrade to Pro</button>
  </div>
);

export { KpiCard, PremiumLock };

export default function OverviewPage({ data, winery, tier }) {
  const [range, setRange] = useState("30d");
  const cd = range === "7d" ? data.daily.slice(-7) : range === "30d" ? data.daily.slice(-30) : data.daily;
  const hasTraffic = cd.some(d => d.checkIns > 0 || d.visitors > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-xl font-bold text-gray-900">Overview</h2><p className="text-xs text-gray-400">Welcome back, {winery.name}</p></div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {["7d","30d","90d"].map(r=><button key={r} onClick={()=>setRange(r)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${range===r?"bg-white text-gray-900 shadow-sm":"text-gray-500"}`}>{r}</button>)}
        </div>
      </div>

      {/* Real analytics KPIs — zeros when no visits exist */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Eye} label="Unique Visitors (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-ins (30d)" value={data.kpi.checkIns.value} change={data.kpi.checkIns.change} color="blue" />
        <KpiCard icon={Star} label="Avg Rating" value={data.kpi.avgRating.value || 0} color="amber" />
        <KpiCard icon={Map} label="Trail Appearances" value={data.kpi.trailAppearances.value} color="green" />
      </div>

      {data.isEmpty && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-sm text-purple-800">
            <strong>No visitor data yet.</strong> Your dashboard metrics will populate as customers check in
            at your winery using the Sip805 app. All numbers shown are real — zeros mean no recorded activity yet.
          </p>
        </div>
      )}

      {/* Visitor traffic chart — real data */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Visitor Traffic</h3><p className="text-xs text-gray-400 mt-0.5">Daily visitors & check-ins</p></div>
        {hasTraffic ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cd}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9333ea" stopOpacity={0.15}/><stop offset="100%" stopColor="#9333ea" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e5e7eb",boxShadow:"0 4px 12px rgba(0,0,0,0.05)"}} />
                <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={2} fill="url(#gP)" name="Unique Visitors" />
                <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} fill="url(#gB)" name="Check-ins" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No traffic data yet</p>
              <p className="text-xs text-gray-300 mt-1">Check-ins will appear here as customers visit</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating breakdown — real data or empty state */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Rating Breakdown</h3><p className="text-xs text-gray-400 mt-0.5">From customer check-ins</p></div>
          {data.ratings.some(r => r.count > 0) ? (
            <div className="space-y-2">
              {data.ratings.map(r => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">{r.stars}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full" style={{ width: `${r.count}%`, backgroundColor: r.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-8 text-right">{r.count}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-400">No ratings yet</p>
            </div>
          )}
        </div>

        {/* Peak hours — real data, premium locked for free tier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
          <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Peak Hours</h3><p className="text-xs text-gray-400 mt-0.5">Check-in time distribution</p></div>
          {tier==="free"&&<PremiumLock feature="See busiest hours to optimize staffing"/>}
          {data.hourly.some(h => h.visitors > 0) ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly.slice(8,20)}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="hour" tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12}}/><Bar dataKey="visitors" fill="#9333ea" radius={[4,4,0,0]} name="Check-ins"/></BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-gray-400">No hourly data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
