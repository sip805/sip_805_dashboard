// ══════════════════════════════════════════════════════════════
// DashboardShell — Sidebar + header + page router
//
// Only rendered for APPROVED winery owners. No winery switching.
// The winery is locked to the owner's approved wineryId.
// ══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  BarChart3, Activity, Map, Award, Settings, Crown, Bell,
  MapPin, Menu, X, Wine, Pencil, LogOut
} from "lucide-react";
import { WINERIES, generateDemoData } from "../data/wineries.js";
import { logOut } from "../firebaseClient.js";
import OverviewPage from "./pages/OverviewPage.jsx";
import TrafficPage from "./pages/TrafficPage.jsx";
import TrailsPage from "./pages/TrailsPage.jsx";
import BenchmarkPage from "./pages/BenchmarkPage.jsx";
import ProfileSettings from "./ProfileSettings.jsx";
import UpgradePage from "./UpgradePage.jsx";

export default function DashboardShell({ user, ownerProfile }) {
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Look up the full winery record from the owner's approved wineryId
  const winery = WINERIES.find(w => w.id === ownerProfile.wineryId) || {
    id: ownerProfile.wineryId,
    name: ownerProfile.wineryName || "Your Winery",
    region: "Central Coast",
    rating: 0,
    reviews: 0,
    price: "$$",
  };

  const tier = ownerProfile.tier || "free";
  const data = useMemo(() => generateDemoData(winery.id), [winery.id]);

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Activity },
    { id: "trails", label: "Trails", icon: Map },
    { id: "benchmark", label: "Benchmark", icon: Award },
    { id: "profile", label: "Edit Profile", icon: Pencil },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "upgrade", label: "Upgrade", icon: Crown, highlight: tier === "free" },
  ];

  const handleLogout = async () => {
    await logOut();
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden text-gray-900" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wine className="w-5 h-5 text-purple-600" />
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
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition
                ${page === item.id ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50"}
                ${item.highlight && page !== item.id ? "text-purple-600" : ""}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar footer — winery info */}
        <div className="p-2.5 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
              {winery.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{winery.name}</div>
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
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600">{winery.name}</span>
              <span className="text-xs text-gray-400">· {winery.region}</span>
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

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto">
            {page === "overview" && <OverviewPage data={data} winery={winery} tier={tier} />}
            {page === "traffic" && <TrafficPage data={data} winery={winery} tier={tier} />}
            {page === "trails" && <TrailsPage data={data} winery={winery} tier={tier} />}
            {page === "benchmark" && <BenchmarkPage data={data} winery={winery} tier={tier} />}
            {page === "profile" && <ProfileSettings winery={winery} user={user} tier={tier} />}
            {page === "settings" && <SettingsPage winery={winery} tier={tier} onUpgrade={() => setPage("upgrade")} onLogout={handleLogout} />}
            {page === "upgrade" && <UpgradePage winery={winery} tier={tier} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Settings (inline — simple read-only profile info) ────────
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
