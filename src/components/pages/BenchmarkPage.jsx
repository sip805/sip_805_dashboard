import { Award, TrendingUp, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WINERIES } from "../../data/wineries.js";
import { KpiCard, PremiumLock } from "./OverviewPage.jsx";

export default function BenchmarkPage({ data, winery, tier }) {
  const region = WINERIES.filter(w => w.region === winery.region).sort((a, b) => b.rating - a.rating);
  const rr = region.findIndex(w => w.id === winery.id) + 1;
  const allSorted = [...WINERIES].sort((a, b) => b.reviews - a.reviews);

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Competitive Benchmarking</h2><p className="text-xs text-gray-400">How you stack up</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Award} label={`Rank in ${winery.region}`} value={`#${rr || "—"}`} suffix={region.length ? ` of ${region.length}` : ""} color="purple" />
        <KpiCard icon={TrendingUp} label="Overall Rank" value={`#${allSorted.findIndex(w => w.id === winery.id) + 1 || "—"}`} color="blue" />
        <KpiCard icon={Star} label="Your Rating" value={winery.rating} suffix="/5" color="amber" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">{winery.region} Leaderboard</h3><p className="text-xs text-gray-400 mt-0.5">Ranked by rating</p></div>
        <div className="space-y-0.5">
          {region.map((w, i) => (
            <div key={w.id} className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg ${w.id === winery.id ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${w.id === winery.id ? "font-bold text-purple-700" : "text-gray-700"}`}>{w.name}</span>
                {w.id === winery.id && <span className="text-[10px] ml-1 text-purple-500 font-bold">YOU</span>}
              </div>
              <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{w.rating}</span></div>
              <span className="text-xs text-gray-400 w-14 text-right">{w.reviews.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Head-to-Head Comparison</h3><p className="text-xs text-gray-400 mt-0.5">Compare vs. specific competitors</p></div>
        {tier === "free" && <PremiumLock feature="Compare traffic, ratings, and trends vs. any competitor" />}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={region.slice(0, 6).map(w => ({ name: w.name.length > 12 ? w.name.slice(0, 11) + "\u2026" : w.name, reviews: w.reviews }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{fontSize:9,fill:"#6b7280"}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize:10,fill:"#9ca3af"}} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{borderRadius:12}} />
              <Bar dataKey="reviews" fill="#9333ea" radius={[4,4,0,0]} name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-3"><h3 className="text-base font-bold text-gray-900">Price Positioning</h3></div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {["$$", "$$$", "$$$$"].map(p => { const c = WINERIES.filter(w => w.price === p).length; const isU = winery.price === p; return (
            <div key={p} className={`text-center p-2.5 rounded-xl ${isU ? "bg-purple-50 border-2 border-purple-300" : "bg-gray-50"}`}>
              <div className={`text-base font-bold ${isU ? "text-purple-700" : "text-gray-600"}`}>{p}</div>
              <div className="text-xs text-gray-400">{c} wineries</div>
              {isU && <div className="text-[9px] text-purple-500 font-semibold mt-0.5">YOUR TIER</div>}
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
