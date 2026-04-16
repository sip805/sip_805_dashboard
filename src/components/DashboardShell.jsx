// ==============================================================
// DashboardShell — Sidebar + header + page router
//
// ARCHITECTURE: Admin app is the control plane for all shared
// platform data. This dashboard is a read-only consumer.
// - Winery record: loaded from Firestore by App.jsx, passed as prop
// - Trails: loaded from Firestore by App.jsx via firestoreTrails prop
// - Static TRAILS array is fallback only (used when Firestore empty)
// ==============================================================

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Activity, Map, Award, Settings, Crown, Bell,
  MapPin, Menu, X, Wine, Pencil, LogOut, AlertTriangle, CheckCircle, Eye,
  Inbox, Megaphone, Sparkles, CalendarCheck
} from "lucide-react";
import { TRAILS as STATIC_TRAILS } from "../data/wineries.js";
import { logOut, getWineryVisits } from "../firebaseClient.js";
import OverviewPage from "./pages/OverviewPage.jsx";
import TrafficPage from "./pages/TrafficPage.jsx";
import TrailsPage from "./pages/TrailsPage.jsx";
import BenchmarkPage from "./pages/BenchmarkPage.jsx";
import InsightsPage from "./pages/InsightsPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import AnnouncementsPage from "./pages/AnnouncementsPage.jsx";
import ReservationsPage from "./pages/ReservationsPage.jsx";
import ProfileSettings from "./ProfileSettings.jsx";
import WineMenuPage from "./WineMenuPage.jsx";
import UpgradePage from "./UpgradePage.jsx";

// ── Real Analytics from Firestore Visits ──────────────────────
// MIGRATION COMPLETE: Replaces generateDemoData() for production.
// Computes real metrics from Firestore visit records.
// Shows zeros/empty states when no visits exist.

function computeRealAnalytics(visits, wineryId, trails) {
  const emptyHourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: 0 }));
  const emptyRatings = [
    { stars: "5 stars", count: 0, color: "#16a34a" },
    { stars: "4 stars", count: 0, color: "#84cc16" },
    { stars: "3 stars", count: 0, color: "#f59e0b" },
    { stars: "2 stars", count: 0, color: "#f97316" },
    { stars: "1 star", count: 0, color: "#ef4444" },
  ];
  const trailCount = (trails || STATIC_TRAILS).filter(t => t.stops.includes(wineryId)).length;

  if (!visits || visits.length === 0) {
    const emptyDaily = [];
    const now = new Date();
    for (let d = 89; d >= 0; d--) {
      const date = new Date(now); date.setDate(date.getDate() - d);
      emptyDaily.push({ date: date.toISOString().split("T")[0], label: `${date.getMonth()+1}/${date.getDate()}`, visitors: 0, checkIns: 0, avgRating: 0 });
    }
    return {
      daily: emptyDaily, hourly: emptyHourly, sources: [], ratings: emptyRatings,
      kpi: {
        visitors: { value: 0, change: 0 }, checkIns: { value: 0, change: 0 },
        avgRating: { value: 0, change: 0 }, trailAppearances: { value: trailCount, change: 0 },
      },
      isEmpty: true, totalVisits: 0, uniqueVisitors: 0,
    };
  }

  const now = new Date();
  const dailyMap = {};
  const hourCounts = Array(24).fill(0);
  const uniqueUsers = new Set();
  const ratingBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const v of visits) {
    const date = v.date ? new Date(v.date) : new Date();
    const dayKey = date.toISOString().split("T")[0];
    if (!dailyMap[dayKey]) dailyMap[dayKey] = { users: new Set(), checkIns: 0, ratingSum: 0, ratingN: 0 };
    dailyMap[dayKey].users.add(v.userId || "anon");
    dailyMap[dayKey].checkIns += 1;
    if (v.rating >= 1 && v.rating <= 5) {
      dailyMap[dayKey].ratingSum += v.rating;
      dailyMap[dayKey].ratingN += 1;
      ratingBuckets[Math.round(v.rating)] = (ratingBuckets[Math.round(v.rating)] || 0) + 1;
    }
    hourCounts[date.getHours()] += 1;
    uniqueUsers.add(v.userId || "anon");
  }

  const daily = [];
  for (let d = 89; d >= 0; d--) {
    const date = new Date(now); date.setDate(date.getDate() - d);
    const key = date.toISOString().split("T")[0];
    const entry = dailyMap[key];
    daily.push({
      date: key, label: `${date.getMonth()+1}/${date.getDate()}`,
      visitors: entry ? entry.users.size : 0,
      checkIns: entry ? entry.checkIns : 0,
      avgRating: entry && entry.ratingN > 0 ? +(entry.ratingSum / entry.ratingN).toFixed(1) : 0,
    });
  }

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: hourCounts[h] }));
  const totalRated = Object.values(ratingBuckets).reduce((a, b) => a + b, 0);
  const ratings = totalRated > 0 ? [5,4,3,2,1].map((s, i) => ({
    stars: s === 1 ? "1 star" : `${s} stars`,
    count: Math.round(ratingBuckets[s] / totalRated * 100),
    color: ["#16a34a","#84cc16","#f59e0b","#f97316","#ef4444"][i],
  })) : emptyRatings;

  const last30 = daily.slice(-30);
  const prev30 = daily.slice(-60, -30);
  const c30 = last30.reduce((s, d) => s + d.checkIns, 0);
  const cp30 = prev30.reduce((s, d) => s + d.checkIns, 0);
  const v30 = last30.reduce((s, d) => s + d.visitors, 0);
  const vp30 = prev30.reduce((s, d) => s + d.visitors, 0);
  const rated30 = last30.filter(d => d.avgRating > 0);
  const ar30 = rated30.length > 0 ? +(rated30.reduce((s, d) => s + d.avgRating, 0) / rated30.length).toFixed(1) : 0;
  const safePct = (curr, prev) => {
    if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev === 0) return 0;
    return +((curr - prev) / prev * 100).toFixed(1);
  };

  return {
    daily, hourly, ratings, sources: [],
    kpi: {
      visitors: { value: v30, change: safePct(v30, vp30) },
      checkIns: { value: c30, change: safePct(c30, cp30) },
      avgRating: { value: ar30, change: 0 },
      trailAppearances: { value: trailCount, change: 0 },
    },
    isEmpty: false, totalVisits: visits.length, uniqueVisitors: uniqueUsers.size,
    // Raw visit records — InsightsPage consumes these for wine-level ratings,
    // spend-bucket distribution, and tasting-note feeds.
    rawVisits: visits,
  };
}

export default function DashboardShell({ user, ownerProfile, winery, firestoreTrails }) {
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visits, setVisits] = useState(null);
  const [loadingVisits, setLoadingVisits] = useState(true);

  // ARCHITECTURE: Firestore trails (admin-managed) take priority.
  // Static TRAILS array is fallback when Firestore has no data.
  const trails = useMemo(() => {
    if (firestoreTrails && firestoreTrails.length > 0) {
      return firestoreTrails.map(t => ({
        ...t,
        id: t.trailId || t.id,
        desc: t.description || t.desc || "",
      }));
    }
    return STATIC_TRAILS;
  }, [firestoreTrails]);

  // Winery is now passed as a prop from App.jsx (loaded from Firestore).
  // Fallback to a minimal record if somehow missing.
  const displayWinery = winery || {
    id: ownerProfile.wineryId,
    name: ownerProfile.wineryName || "Your Winery",
    region: "Central Coast",
    rating: 0,
    reviews: 0,
    price: "$$",
  };

  // Safe numeric ID for analytics computation
  const rawId = Number(displayWinery.id ?? displayWinery.wineryId ?? ownerProfile.wineryId);
  const safeWineryId = Number.isFinite(rawId) && rawId >= 1 ? rawId : 1;

  const tier = ownerProfile.tier || "free";

  // MIGRATION: Load real visit data from Firestore instead of using generateDemoData()
  useEffect(() => {
    setLoadingVisits(true);
    getWineryVisits(safeWineryId)
      .then(setVisits)
      .catch(err => { console.error("Failed to load visits:", err); setVisits([]); })
      .finally(() => setLoadingVisits(false));
  }, [safeWineryId]);

  // Compute real analytics from Firestore visits
  const data = useMemo(
    () => computeRealAnalytics(visits || [], safeWineryId, trails),
    [visits, safeWineryId, trails]
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Activity },
    { id: "insights", label: "Insights", icon: Sparkles },
    { id: "leads", label: "Leads", icon: Inbox },
    { id: "reservations", label: "Reservations", icon: CalendarCheck },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "trails", label: "Trails", icon: Map },
    { id: "benchmark", label: "Benchmark", icon: Award },
    { id: "profile", label: "Edit Profile", icon: Pencil },
    { id: "menu", label: "Wine Menu", icon: Wine },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "upgrade", label: "Upgrade", icon: Crown, highlight: tier === "free" },
  ];

  const handleLogout = async () => { await logOut(); };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden text-gray-900" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <img src="/icon-512.png" alt="Sip805" width={22} height={22} className="rounded-md" style={{ objectFit: "contain" }} />
              <span className="text-base font-bold">Sip805</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-[9px] text-purple-500 font-semibold tracking-wider mt-0.5">WINERY DASHBOARD</p>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition
                ${page === item.id ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50"}
                ${item.highlight && page !== item.id ? "text-purple-600" : ""}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
              {displayWinery.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{displayWinery.name}</div>
              <div className="text-[10px] text-gray-400">{tier === "pro" ? "Pro Plan" : "Free Plan"}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition mt-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600">{displayWinery.name}</span>
              <span className="text-xs text-gray-400">· {displayWinery.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tier === "free" && (
              <button onClick={() => setPage("upgrade")} className="hidden sm:flex items-center gap-1 bg-purple-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-purple-700 transition">
                <Crown className="w-3 h-3" /> Upgrade to Pro
              </button>
            )}
            <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto">
            {page === "overview" && <OverviewPage data={data} winery={displayWinery} tier={tier} />}
            {page === "traffic" && <TrafficPage data={data} winery={displayWinery} tier={tier} />}
            {page === "insights" && <InsightsPage data={data} winery={displayWinery} tier={tier} trails={trails} />}
            {page === "leads" && <LeadsPage winery={displayWinery} tier={tier} />}
            {page === "reservations" && <ReservationsPage winery={displayWinery} tier={tier} />}
            {page === "announcements" && <AnnouncementsPage winery={displayWinery} tier={tier} />}
            {page === "trails" && <TrailsPage data={data} winery={displayWinery} tier={tier} trails={trails} />}
            {page === "benchmark" && <BenchmarkPage data={data} winery={displayWinery} tier={tier} />}
            {page === "profile" && <ProfileSettings winery={displayWinery} user={user} tier={tier} />}
            {page === "menu" && <WineMenuPage winery={displayWinery} user={user} />}
            {page === "settings" && <SettingsPage winery={displayWinery} tier={tier} onUpgrade={() => setPage("upgrade")} onLogout={handleLogout} />}
            {page === "upgrade" && <UpgradePage winery={displayWinery} tier={tier} />}
          </div>
        </div>
      </main>
    </div>
  );
}

const SettingsPage = ({ winery, tier, onUpgrade, onLogout }) => (
  <div className="space-y-5">
    <div><h2 className="text-xl font-bold text-gray-900">Settings</h2></div>
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Winery Profile</h3>
      <div className="grid grid-cols-2 gap-3">
        {[["Winery Name", winery.name], ["Region", winery.region], ["Price Tier", winery.price], ["Plan", tier === "pro" ? "Pro" : "Free"]].map(([l, v]) => (
          <div key={l}>
            <label className="text-xs text-gray-400 block mb-0.5">{l}</label>
            <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{v}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex gap-3">
      {tier === "free" && (
        <button onClick={onUpgrade} className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-purple-700 transition">
          <Crown className="w-4 h-4" /> Upgrade to Pro
        </button>
      )}
      <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2.5 rounded-lg hover:bg-red-50 transition">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  </div>
);
