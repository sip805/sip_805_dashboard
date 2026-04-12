import { useState } from "react";
import { Eye, CheckCircle, Star, Map, ArrowUpRight, ArrowDownRight, Lock, Crown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const KpiCard = ({ icon: Icon, label, value, change, suffix = "", color = "purple" }) => {
  const up = change > 0;
  const cm = { purple: "bg-purple-50 text-purple-600", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", amber: "bg-amber-50 text-amber-600" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cm[color]}`}><Icon className="w-4 h-4" /></div>
        {change !== 0 && change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
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
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-xl font-bold text-gray-900">Overview</h2><p className="text-xs text-gray-400">Welcome back, {winery.name}</p></div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {["7d","30d","90d"].map(r=><button key={r} onClick={()=>setRange(r)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${range===r?"bg-white text-gray-900 shadow-sm":"text-gray-500"}`}>{r}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Eye} label="App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-ins (30d)" value={data.kpi.checkIns.value} change={data.kpi.checkIns.change} color="blue" />
        <KpiCard icon={Star} label="Avg Rating" value={data.kpi.avgRating.value} change={data.kpi.avgRating.change} color="amber" />
        <KpiCard icon={Map} label="Trail Appearances" value={data.kpi.trailAppearances.value} color="green" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Visitor Traffic</h3><p className="text-xs text-gray-400 mt-0.5">Daily app views & check-ins</p></div>
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
              <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={2} fill="url(#gP)" name="App Views" />
              <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} fill="url(#gB)" name="Check-ins" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Traffic Sources</h3><p className="text-xs text-gray-400 mt-0.5">Where visitors come from</p></div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart><Pie data={data.sources} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">{data.sources.map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip contentStyle={{borderRadius:12}}/><Legend iconType="circle" iconSize={8} formatter={v=><span className="text-xs text-gray-600">{v}</span>}/></RPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
          <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Peak Hours</h3><p className="text-xs text-gray-400 mt-0.5">Today's visitor distribution</p></div>
          {tier==="free"&&<PremiumLock feature="See busiest hours to optimize staffing"/>}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly.slice(8,20)}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="hour" tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12}}/><Bar dataKey="visitors" fill="#9333ea" radius={[4,4,0,0]} name="Visitors"/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
