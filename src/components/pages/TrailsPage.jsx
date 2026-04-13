import { Map, Users, Target, ChevronRight } from "lucide-react";
import { TRAILS } from "../../data/wineries.js";
import { KpiCard } from "./OverviewPage.jsx";

// MIGRATION: TrailsPage now shows only real structural trail data
// (which trails feature this winery). Fake visitor estimates removed.

export default function TrailsPage({ data, winery, tier }) {
  const my = TRAILS.filter(t => t.stops.includes(winery.id));
  const other = TRAILS.filter(t => !t.stops.includes(winery.id));

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Trail Performance</h2><p className="text-xs text-gray-400">How trails feature your winery</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Map} label="Trail Appearances" value={my.length} color="purple" />
        <KpiCard icon={Users} label="Total Check-ins" value={data.totalVisits || 0} color="blue" />
        <KpiCard icon={Target} label="Avg Rating" value={data.kpi.avgRating.value || "—"} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Trails Featuring Your Winery</h3><p className="text-xs text-gray-400 mt-0.5">You appear on {my.length} of {TRAILS.length} trails</p></div>
        {my.length === 0 ? (
          <div className="text-center py-6"><Map className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Your winery doesn't appear on any trails yet.</p></div>
        ) : (
          <div className="space-y-2">
            {my.map(t => {
              const position = t.stops.indexOf(winery.id) + 1;
              return (
                <div key={t.id} className="border border-gray-100 rounded-xl p-3 hover:border-purple-200 transition">
                  <div className="flex items-center justify-between mb-1">
                    <div><span className="text-sm font-semibold text-gray-900">{t.name}</span><span className="text-xs text-gray-400 ml-2">Stop #{position} of {t.stops.length}</span></div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t.stops.length} stops</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
