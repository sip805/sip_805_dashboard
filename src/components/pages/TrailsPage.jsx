import { Map, Users, Target, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TRAILS } from "../../data/wineries.js";
import { KpiCard, PremiumLock } from "./OverviewPage.jsx";

export default function TrailsPage({ data, winery, tier }) {
  const my = TRAILS.filter(t => t.stops.includes(winery.id));
  const other = TRAILS.filter(t => !t.stops.includes(winery.id));
  const tm = TRAILS.map(t => ({
    ...t,
    visitors: Math.round(80 + Math.abs(Math.sin(t.id * winery.id)) * 200),
    completionRate: +(60 + Math.abs(Math.sin(t.id * 13)) * 35).toFixed(0),
    yourPosition: t.stops.indexOf(winery.id) + 1,
  }));

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Trail Performance</h2><p className="text-xs text-gray-400">How trails drive traffic to your winery</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Map} label="Your Trail Appearances" value={my.length} color="purple" />
        <KpiCard icon={Users} label="Trail Visitors (30d)" value={Math.round(data.kpi.visitors.value * 0.35)} color="blue" />
        <KpiCard icon={Target} label="Trail Conversion" value="34" suffix="%" color="green" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Trails Featuring Your Winery</h3><p className="text-xs text-gray-400 mt-0.5">You appear on {my.length} of {TRAILS.length} trails</p></div>
        {my.length === 0 ? (
          <div className="text-center py-6"><Map className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Your winery doesn't appear on any trails yet.</p></div>
        ) : (
          <div className="space-y-2">
            {tm.filter(t => t.stops.includes(winery.id)).map(t => (
              <div key={t.id} className="border border-gray-100 rounded-xl p-3 hover:border-purple-200 transition">
                <div className="flex items-center justify-between mb-1">
                  <div><span className="text-sm font-semibold text-gray-900">{t.name}</span><span className="text-xs text-gray-400 ml-2">Stop #{t.yourPosition} of {t.stops.length}</span></div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t.visitors} visitors/mo</span>
                </div>
                <div className="text-xs text-gray-500">Completion: {t.completionRate}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Trail Visitor Comparison</h3><p className="text-xs text-gray-400 mt-0.5">Which trails drive the most traffic</p></div>
        {tier === "free" && <PremiumLock feature="Compare traffic from each trail" />}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tm.filter(t => t.stops.includes(winery.id))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"#6b7280"}} tickLine={false} axisLine={false} width={130} />
              <Tooltip contentStyle={{borderRadius:12}} />
              <Bar dataKey="visitors" fill="#9333ea" radius={[0,6,6,0]} name="Monthly Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {other.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Other Trails</h3><p className="text-xs text-gray-400 mt-0.5">Trails you're not currently on</p></div>
          <div className="space-y-1.5">{other.map(t => <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-600">{t.name}</span><span className="text-xs text-gray-400">{t.stops.length} stops</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
