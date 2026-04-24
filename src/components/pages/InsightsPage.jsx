// ==============================================================
// InsightsPage — the winery-value surface.
// Surfaces data a winery can't get from POS or Google Analytics:
//   - Wine-level rating rollup ("Vintage Pulse")
//   - Ticket-size distribution from spend buckets
//   - Tasting-note sentiment feed
//   - Plan-to-visit funnel (appearances in saved trails vs. actual check-ins)
// ==============================================================

import { useMemo } from "react";
import {
  Grape, DollarSign, MessageSquare, TrendingUp, Users, Lock, Crown,
  ArrowUpRight, Star, Compass, Check, Heart
} from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { hasPro } from "../../lib/tier.js";

const SPEND_LABEL = {
  none:    "Just tasting",
  lt50:    "Under $50",
  "50-150": "$50–150",
  "150-500": "$150–500",
  gt500:   "$500+",
};
const SPEND_COLOR = {
  none: "#cbd5e1", lt50: "#a78bfa", "50-150": "#8b5cf6", "150-500": "#7c3aed", gt500: "#6d28d9",
};

function computeWineRatingRollup(visits) {
  const map = {}; // name -> { sum, count }
  for (const v of visits || []) {
    const arr = Array.isArray(v.wineRatings) ? v.wineRatings : [];
    for (const wr of arr) {
      const key = wr.wineName || "Unknown";
      const r = Number(wr.rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) continue;
      if (!map[key]) map[key] = { sum: 0, count: 0 };
      map[key].sum += r;
      map[key].count += 1;
    }
  }
  return Object.entries(map)
    .map(([name, { sum, count }]) => ({ name, avg: +(sum / count).toFixed(2), count }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg);
}

function computeSpendDistribution(visits) {
  const buckets = { none: 0, lt50: 0, "50-150": 0, "150-500": 0, gt500: 0 };
  let total = 0;
  for (const v of visits || []) {
    if (v.spendBucket && buckets[v.spendBucket] != null) {
      buckets[v.spendBucket] += 1;
      total += 1;
    }
  }
  return {
    total,
    data: Object.entries(buckets).map(([key, count]) => ({
      key, label: SPEND_LABEL[key], count,
      pct: total ? Math.round((count / total) * 100) : 0,
    })),
  };
}

function collectTastingNotes(visits) {
  return (visits || [])
    .filter(v => v.notes && typeof v.notes === "string")
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, 15)
    .map(v => ({
      id: v.id,
      note: v.notes,
      rating: v.rating || 0,
      spendBucket: v.spendBucket || null,
      date: v.date,
    }));
}

function computePlanFunnel(visits, trails, wineryId) {
  // Count trails (including static seed + firestore) that include this winery
  const plans = (trails || []).filter(t => (t.stops || []).includes(Number(wineryId))).length;
  const checkIns = (visits || []).length;
  return { plans, checkIns, conversion: plans > 0 ? Math.round((checkIns / plans) * 100) : 0 };
}

function computeClubInterest(visits) {
  return (visits || []).filter(v => v.clubInterest === true).length;
}

const StatCard = ({ icon: Icon, label, value, sub, color = "purple" }) => {
  const cm = {
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${cm[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
};

export default function InsightsPage({ data, winery, tier, trails }) {
  const visits = data?.rawVisits || [];
  const isPro = hasPro(tier);

  const wineRollup = useMemo(() => computeWineRatingRollup(visits), [visits]);
  const spend = useMemo(() => computeSpendDistribution(visits), [visits]);
  const notes = useMemo(() => collectTastingNotes(visits), [visits]);
  const funnel = useMemo(() => computePlanFunnel(visits, trails, winery?.id ?? winery?.wineryId), [visits, trails, winery]);
  const clubInterest = useMemo(() => computeClubInterest(visits), [visits]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Insights</h2>
        <p className="text-xs text-gray-400">Data you can't get from POS or Google Analytics</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Grape} label="Wines rated" value={wineRollup.length} color="purple" />
        <StatCard icon={DollarSign} label="Spend responses" value={spend.total} color="green" />
        <StatCard icon={MessageSquare} label="Tasting notes" value={notes.length} color="blue" />
        <StatCard icon={Heart} label="Club interest" value={clubInterest} color="amber" />
      </div>

      {/* Plan-to-Visit Funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Plan-to-Visit Funnel</h3>
            <p className="text-xs text-gray-400">How often you appear in customer plans vs. actual visits</p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
            {funnel.conversion}% convert
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-purple-50">
            <Compass className="w-4 h-4 text-purple-600 mb-1" />
            <div className="text-lg font-bold text-purple-700">{funnel.plans}</div>
            <div className="text-[11px] text-purple-600">Trail inclusions</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50">
            <Users className="w-4 h-4 text-blue-600 mb-1" />
            <div className="text-lg font-bold text-blue-700">{funnel.checkIns}</div>
            <div className="text-[11px] text-blue-600">Check-ins</div>
          </div>
          <div className="p-3 rounded-xl bg-green-50">
            <TrendingUp className="w-4 h-4 text-green-600 mb-1" />
            <div className="text-lg font-bold text-green-700">{funnel.conversion}%</div>
            <div className="text-[11px] text-green-600">Conversion</div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 leading-snug">
          A high number of plan inclusions with low check-ins often means customers planned to come but got diverted —
          tweak hours, upgrade the listing photo, or pitch a walk-in incentive. <span className="text-purple-600">(Available on Pro with per-plan breakdown.)</span>
        </p>
      </div>

      {/* Wine rollup */}
      <div className="relative bg-white rounded-2xl border border-gray-100 p-5">
        {!isPro && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Vintage Pulse</p>
            <p className="text-xs text-gray-400 mb-2 text-center px-4 max-w-sm">
              See per-wine ratings over time, identify favorites, and catch drops on aging stock.
            </p>
            <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <Crown className="w-3 h-3" /> Upgrade to Pro
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Grape className="w-4 h-4 text-purple-600" />
          <h3 className="text-base font-bold text-gray-900">Vintage Pulse</h3>
          <span className="text-[10px] text-gray-400">Per-wine ratings from your guests</span>
        </div>
        {wineRollup.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">
            No wine-level ratings yet. As guests rate the specific wines they try during check-in, they'll appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {wineRollup.slice(0, 8).map(w => (
              <div key={w.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">{w.name}</div>
                  <div className="text-[10px] text-gray-400">{w.count} rating{w.count === 1 ? "" : "s"}</div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(w.avg) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <div className="text-xs font-bold text-gray-700 w-9 text-right">{w.avg.toFixed(1)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spend bucket distribution */}
      <div className="relative bg-white rounded-2xl border border-gray-100 p-5">
        {!isPro && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Ticket-Size Mix</p>
            <p className="text-xs text-gray-400 mb-2 text-center px-4 max-w-sm">
              See how your check-in spend distribution compares to peers in your region.
            </p>
            <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <Crown className="w-3 h-3" /> Upgrade to Pro
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-green-600" />
          <h3 className="text-base font-bold text-gray-900">Ticket-Size Mix</h3>
          <span className="text-[10px] text-gray-400">What guests say they spent on visit</span>
        </div>
        {spend.total === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">
            No spend data yet. Guests optionally share a rough spend bucket after their visit.
          </div>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spend.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {spend.data.map(d => (
                    <Cell key={d.key} fill={SPEND_COLOR[d.key]} />
                  ))}
                  <LabelList dataKey="pct" position="top" formatter={v => `${v}%`} style={{ fontSize: 10, fill: "#6b7280" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tasting notes feed */}
      <div className="relative bg-white rounded-2xl border border-gray-100 p-5">
        {!isPro && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Guest Tasting Notes</p>
            <p className="text-xs text-gray-400 mb-2 text-center px-4 max-w-sm">
              Read the actual words guests write about their visit. Pro unlocks AI sentiment rollups too.
            </p>
            <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
              <Crown className="w-3 h-3" /> Upgrade to Pro
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Tasting Notes</h3>
          <span className="text-[10px] text-gray-400">Most recent</span>
        </div>
        {notes.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">No tasting notes yet.</div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {notes.map(n => (
              <div key={n.id} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= n.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  {n.spendBucket && (
                    <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                      {SPEND_LABEL[n.spendBucket]}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {n.date ? new Date(n.date).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-snug">"{n.note}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

