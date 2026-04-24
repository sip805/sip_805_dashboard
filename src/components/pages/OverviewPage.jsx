// ==============================================================
// OverviewPage — the "Today" home.
//
// Action-first layout for a tasting-room / hospitality manager:
//   1. TODAY strip — what needs attention before guests arrive
//      (reservations today, new leads <24h, aging leads >48h,
//       typical peak hour)
//   2. THIS WEEK pulse — four big numbers, no charts
//   3. QUICK ACTIONS — three prominent CTAs
//   4. ONE INSIGHT — a single plain-English takeaway when we
//      have enough data to compute one
//
// Charts live on Traffic / Insights; this page is intentionally
// chart-free. We want a manager to know what to do in 30 seconds.
//
// KpiCard and PremiumLock are re-exported below because other
// pages (Benchmark, Traffic, Trails) import them from here.
// ==============================================================

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Inbox, Clock, AlertTriangle, TrendingUp, Star, Users,
  Megaphone, Wine, MessageSquare, ArrowRight, Sparkles,
  Eye, CheckCircle, Map, ArrowUpRight, ArrowDownRight, Lock, Crown,
} from "lucide-react";
import { getWineryLeads, getWineryReservations } from "../../firebaseClient.js";

// ── Shared primitives (kept for Benchmark/Traffic/Trails imports) ──

const KpiCard = ({ icon: Icon, label, value, change, suffix = "", color = "purple" }) => {
  const safeValue = (typeof value === "number" && Number.isFinite(value)) ? value : 0;
  const safeChange = (typeof change === "number" && Number.isFinite(change)) ? change : 0;
  const up = safeChange > 0;
  const cm = {
    purple: "bg-purple-50 text-purple-600",
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    amber:  "bg-amber-50 text-amber-600",
  };
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

// ── Helpers ────────────────────────────────────────────────────

const WEEKDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function toDate(ts) {
  try {
    if (!ts) return null;
    const d = ts?.toDate?.() || (typeof ts === "string" || typeof ts === "number" ? new Date(ts) : null);
    return d && !isNaN(d) ? d : null;
  } catch { return null; }
}

function hoursAgo(d) {
  if (!d) return Infinity;
  return (Date.now() - d.getTime()) / 3_600_000;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatHourRange(h) {
  const start12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const endHour = (h + 1) % 24;
  const end12 = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
  const ampm = h >= 12 ? "PM" : "AM";
  const ampmEnd = endHour >= 12 ? "PM" : "AM";
  return ampm === ampmEnd ? `${start12}\u2013${end12} ${ampm}` : `${start12} ${ampm}\u2013${end12} ${ampmEnd}`;
}

// ── Cards ──────────────────────────────────────────────────────

const TodayTile = ({ icon: Icon, value, label, tone = "purple", onClick, urgent = false }) => {
  const tones = {
    purple: "bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100/70",
    rose:   "bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100/70",
    amber:  "bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100/70",
    gray:   "bg-gray-50 text-gray-800 border-gray-100",
    red:    "bg-red-50 text-red-800 border-red-200 hover:bg-red-100/70",
  };
  const active = urgent ? "red" : tone;
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={`flex items-start gap-3 p-4 rounded-2xl border text-left w-full transition
        ${tones[active]}
        ${clickable ? "active:scale-[0.99] cursor-pointer" : "cursor-default"}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-[11px] opacity-80 mt-0.5 leading-tight">{label}</div>
      </div>
      {clickable && <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0 mt-1" />}
    </button>
  );
};

const PulseCard = ({ icon: Icon, value, label, delta, suffix = "" }) => {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta) && delta !== 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        {hasDelta && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${delta > 0 ? "text-green-600" : "text-red-500"}`}>
            {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}{suffix}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, desc, onClick, tone = "purple" }) => {
  const tones = {
    purple: "bg-purple-600 hover:bg-purple-700",
    rose:   "bg-rose-600 hover:bg-rose-700",
    amber:  "bg-amber-600 hover:bg-amber-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-2xl text-white text-left transition active:scale-[0.99] ${tones[tone]}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold leading-tight">{label}</div>
        <div className="text-xs text-white/85 mt-1 leading-snug">{desc}</div>
      </div>
    </button>
  );
};

// ── Page ───────────────────────────────────────────────────────

export default function OverviewPage({ data, winery, tier, onNavigate }) {
  const navigate = typeof onNavigate === "function" ? onNavigate : () => {};
  const wineryId = winery?.id ?? winery?.wineryId;

  const [leads, setLeads] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Leads + upcoming-week reservations. Both queries are narrow enough to
  // run on every page load without caching; Firestore composite indexes
  // already exist for wineryId + orderBy.
  useEffect(() => {
    if (!wineryId) return;
    let cancelled = false;
    getWineryLeads(wineryId).then(l => { if (!cancelled) setLeads(l || []); }).catch(() => {});
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const weekAhead = new Date(startOfToday); weekAhead.setDate(weekAhead.getDate() + 7);
    getWineryReservations(wineryId, startOfToday, weekAhead)
      .then(r => { if (!cancelled) setReservations(r || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [wineryId]);

  // === TODAY counts ==========================================

  const todaysReservations = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(s); e.setDate(e.getDate() + 1);
    return (reservations || []).filter(r => {
      const d = toDate(r.slotStart);
      if (!d || d < s || d >= e) return false;
      const status = r.status || "confirmed";
      return status !== "cancelled" && status !== "no_show";
    });
  }, [reservations]);

  const newLeads24h = useMemo(() => (leads || []).filter(l => {
    const d = toDate(l.createdAt);
    return d && hoursAgo(d) <= 24 && l.status !== "dismissed";
  }), [leads]);

  const agingLeads = useMemo(() => (leads || []).filter(l => {
    const d = toDate(l.createdAt);
    return d && hoursAgo(d) > 48 && (l.status === "new" || !l.status);
  }), [leads]);

  // Historical peak hour across all visits — "when to be ready" signal.
  const peakHourLabel = useMemo(() => {
    const hourly = data?.hourly || [];
    if (!hourly.length) return null;
    let bestHour = -1;
    let bestCount = 0;
    for (let h = 8; h <= 21; h++) {
      const c = hourly[h]?.visitors || 0;
      if (c > bestCount) { bestCount = c; bestHour = h; }
    }
    if (bestHour < 0 || bestCount === 0) return null;
    return formatHourRange(bestHour);
  }, [data?.hourly]);

  // === THIS WEEK pulse =======================================

  const weekStats = useMemo(() => {
    const daily = data?.daily || [];
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(-14, -7);
    const visitsNow = last7.reduce((s, d) => s + (d.visitors || 0), 0);
    const visitsPrev = prev7.reduce((s, d) => s + (d.visitors || 0), 0);
    const rated = last7.filter(d => (d.avgRating || 0) > 0);
    const avgRating = rated.length > 0
      ? +(rated.reduce((s, d) => s + d.avgRating, 0) / rated.length).toFixed(1)
      : 0;
    const delta = visitsPrev === 0 ? 0 : Math.round(((visitsNow - visitsPrev) / visitsPrev) * 100);
    return { visitsNow, visitsPrev, delta, avgRating };
  }, [data?.daily]);

  const newLeadsThisWeek = useMemo(() => (leads || []).filter(l => {
    const d = toDate(l.createdAt);
    return d && hoursAgo(d) <= 24 * 7;
  }).length, [leads]);

  // === Insight (day-of-week pattern) =========================

  const insight = useMemo(() => {
    const daily = data?.daily || [];
    if (!daily.length) return null;
    const sumsByDow = [0, 0, 0, 0, 0, 0, 0];
    const countsByDow = [0, 0, 0, 0, 0, 0, 0];
    for (const row of daily) {
      const d = new Date((row.date || "") + "T12:00:00");
      if (isNaN(d)) continue;
      sumsByDow[d.getDay()] += row.checkIns || 0;
      countsByDow[d.getDay()] += 1;
    }
    const avgByDow = sumsByDow.map((s, i) => countsByDow[i] > 0 ? s / countsByDow[i] : 0);
    const total = avgByDow.reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    let bestIdx = 0;
    for (let i = 1; i < 7; i++) if (avgByDow[i] > avgByDow[bestIdx]) bestIdx = i;
    const restAvg = (total - avgByDow[bestIdx]) / 6;
    if (restAvg === 0 || avgByDow[bestIdx] === 0) return null;
    const ratio = avgByDow[bestIdx] / restAvg;
    if (ratio < 1.4) return null;
    return `${WEEKDAY[bestIdx]}s are your busiest day \u2014 typically ${ratio.toFixed(1)}\u00d7 other days. Plan staffing around it.`;
  }, [data?.daily]);

  // === Header ================================================

  const displayName = winery?.name || "";
  const firstWord = String(displayName).split(/\s+/)[0] || "there";
  const greeting = `${getGreeting()}, ${firstWord}`;

  // ===========================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{greeting}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Here's what needs your attention today.</p>
      </div>

      {/* TODAY */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Today</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TodayTile
            icon={CalendarDays}
            value={todaysReservations.length}
            label={todaysReservations.length === 1 ? "reservation today" : "reservations today"}
            tone="purple"
            onClick={() => navigate("reservations")}
          />
          <TodayTile
            icon={Inbox}
            value={newLeads24h.length}
            label={newLeads24h.length === 1 ? "new lead in last 24h" : "new leads in last 24h"}
            tone="rose"
            onClick={() => navigate("leads")}
          />
          <TodayTile
            icon={AlertTriangle}
            value={agingLeads.length}
            label={agingLeads.length === 1 ? "lead waiting >48h" : "leads waiting >48h"}
            tone="amber"
            urgent={agingLeads.length > 0}
            onClick={() => navigate("leads")}
          />
          <TodayTile
            icon={Clock}
            value={peakHourLabel || "\u2014"}
            label="Typical peak hour"
            tone="gray"
          />
        </div>
      </section>

      {/* THIS WEEK */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">This week</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PulseCard
            icon={Users}
            value={weekStats.visitsNow}
            delta={weekStats.delta}
            label="App visitors (vs. last week)"
          />
          <PulseCard
            icon={Star}
            value={weekStats.avgRating || "\u2014"}
            label="Average rating"
          />
          <PulseCard
            icon={Inbox}
            value={newLeadsThisWeek}
            label="New leads"
          />
          <PulseCard
            icon={CalendarDays}
            value={reservations.length}
            label="Reservations (next 7 days)"
          />
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Quick actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickAction
            icon={Megaphone}
            label="Post an announcement"
            desc="Tell your followers about a release, event, or closure."
            tone="purple"
            onClick={() => navigate("announcements")}
          />
          <QuickAction
            icon={MessageSquare}
            label="Reply to leads"
            desc={newLeads24h.length > 0
              ? `${newLeads24h.length} new in the last 24 hours.`
              : "Fast response times close more guests."}
            tone="rose"
            onClick={() => navigate("leads")}
          />
          <QuickAction
            icon={Wine}
            label="Update your wine menu"
            desc="Keep tasting-room pricing and pours current."
            tone="amber"
            onClick={() => navigate("menu")}
          />
        </div>
      </section>

      {/* INSIGHT */}
      {insight && (
        <section>
          <div className="bg-gradient-to-r from-purple-50 to-rose-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-0.5">One thing to know</div>
              <p className="text-sm text-gray-700 leading-snug">{insight}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("traffic")}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 flex-shrink-0 mt-1"
            >
              See traffic <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      )}

      {/* EMPTY STATE — nothing has happened yet */}
      {data?.isEmpty && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">No check-ins yet.</strong>{" "}
            Numbers fill in as drinkers visit with the Sip805 app. In the meantime, make sure your{" "}
            <button
              type="button"
              onClick={() => navigate("profile")}
              className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2"
            >
              profile
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => navigate("menu")}
              className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2"
            >
              wine menu
            </button>{" "}
            are ready for discovery.
          </p>
        </div>
      )}
    </div>
  );
}
