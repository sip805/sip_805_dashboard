import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, TrendingUp, Map, Award, Settings, LogOut, Wine,
  ChevronDown, Users, Eye, Star, ArrowUpRight, ArrowDownRight,
  Lock, Crown, Calendar, Clock, Filter, Download, Bell,
  MapPin, Zap, Target, PieChart, Activity, ChevronRight,
  Menu, X, ExternalLink, AlertCircle, CheckCircle,
  Pencil, Upload, Image, Plus, Trash2, Save, Globe, Phone, Dog, Tag,
  Shield, UserCheck, UserX, ClipboardList, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import Landing from "./Landing.jsx";
import {
  auth, signInWithGoogle, signInWithEmail, logOut, onAuthChange,
  getWineryProfile, createWineryProfile, getWineryVisits, getAllVisits,
  getWineryProfileEdits, saveWineryProfileEdits, uploadWineryPhoto, validateWineryEdits,
  isAdmin, submitWineryClaim, getPendingClaims, getAllClaims,
  approveClaim, rejectClaim, getAllWineryOwners, getRecentVisits, getPlatformStats
} from "./firebaseClient.js";

/* ═══════════════════════════════════════════════════════════════════
   WINERY DATA — mirrors consumer app (used for benchmarking)
   ═══════════════════════════════════════════════════════════════════ */

// Default editable fields — synced from consumer app. Winery owners override these via Firestore.
const EDITABLE_DEFAULTS = {
  1: { desc: "Mountaintop estate with panoramic views. World-class Cabernet Sauvignon and Bordeaux-style blends.", hours: "Daily 10 AM – 5 PM", phone: "(805) 226-5460", website: "daouvineyards.com", dogFriendly: false, tags: ["Hilltop Views", "Cabernet", "Reserve"], experiences: [{ name: "Estate Tasting", duration: "60 min" }, { name: "Mountaintop Experience", duration: "90 min" }], gradient: "linear-gradient(135deg, #1a0533, #6b2fa0)" },
  2: { desc: "Partnership between the Perrin family of Château de Beaucastel and Robert Haas. Pioneers of Rhône varieties in Paso.", hours: "Daily 10 AM – 5 PM", phone: "(805) 237-1231", website: "tablascreek.com", dogFriendly: true, tags: ["Rhône Blends", "Organic", "Dog Friendly"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #1a3a2a, #2d6a4f)" },
  3: { desc: "High-elevation vineyards on the Santa Lucia range. Exceptional Pinot Noir, Syrah, and a legendary Viking Vineyard hike.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-8980", website: "adelaida.com", dogFriendly: true, tags: ["Mountain Estate", "Pinot Noir", "Sunset Views"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #5c3d11, #b8860b)" },
  4: { desc: "Perched on a limestone ridge with sweeping views. Known for Bordeaux varieties and a stunning hilltop tasting patio.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-0289", website: "calcareous.com", dogFriendly: true, tags: ["Hilltop", "Cabernet", "Views"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #2d1b4e, #7c3aed)" },
  19: { desc: "Iconic estate known for the legendary Isosceles blend. Beautiful gardens, on-site restaurant, and boutique hotel.", hours: "Daily 10 AM – 4:30 PM", phone: "(805) 591-3224", website: "justinwine.com", dogFriendly: true, tags: ["Isosceles", "Gardens", "Restaurant"], experiences: [{ name: "Classic Tasting", duration: "45 min" }, { name: "Vineyard Tour", duration: "75 min" }], gradient: "linear-gradient(135deg, #064e3b, #34d399)" },
  26: { desc: "Italian-inspired wines from Central Coast vineyards. Aglianico, Fiano, and Nerello Mascalese in the heart of Tin City.", hours: "Thu–Mon 11 AM – 5 PM", phone: "(805) 434-3075", website: "giornatawines.com", dogFriendly: true, tags: ["Italian Varieties", "Small Lot", "Walkable"], experiences: [{ name: "Tasting", duration: "45 min" }], gradient: "linear-gradient(135deg, #450a0a, #991b1b)" },
  32: { desc: "Named one of America's 10 Best Tasting Rooms. Unique 'Flavor Flights' pairing wines with Indian spice blends.", hours: "Daily 11 AM – 7 PM", phone: "(805) 296-1902", website: "lxvwine.com", dogFriendly: false, tags: ["Top Rated", "Spice Pairings", "Unique"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #172554, #3b82f6)" },
  70: { desc: "Wild West–themed saloon tasting room. Famous for Zinfandel and a party atmosphere.", hours: "Daily 10 AM – 5 PM", phone: "(805) 239-2204", website: "tobinjames.com", dogFriendly: true, tags: ["Fun Atmosphere", "Zinfandel", "Western Saloon"], experiences: [{ name: "Tasting", duration: "45–60 min" }], gradient: "linear-gradient(135deg, #92400e, #d97706)" },
};

const WINERIES = [
  { id: 1, name: "DAOU Family Estates", region: "Adelaida District", rating: 4.9, reviews: 1247, price: "$$$$", ...EDITABLE_DEFAULTS[1] },
  { id: 2, name: "Tablas Creek Vineyard", region: "Adelaida District", rating: 4.8, reviews: 876, price: "$$$", ...EDITABLE_DEFAULTS[2] },
  { id: 3, name: "Adelaida Vineyards", region: "Adelaida District", rating: 4.7, reviews: 498, price: "$$$" },
  { id: 4, name: "Calcareous Vineyard", region: "Adelaida District", rating: 4.7, reviews: 612, price: "$$$" },
  { id: 5, name: "Halter Ranch", region: "Adelaida District", rating: 4.7, reviews: 534, price: "$$$" },
  { id: 6, name: "Law Estate Wines", region: "Adelaida District", rating: 4.8, reviews: 367, price: "$$$$" },
  { id: 7, name: "Peachy Canyon Winery", region: "Adelaida District", rating: 4.6, reviews: 723, price: "$$" },
  { id: 8, name: "Villa Creek Cellars", region: "Adelaida District", rating: 4.7, reviews: 289, price: "$$$" },
  { id: 9, name: "Chronic Cellars", region: "Adelaida District", rating: 4.5, reviews: 445, price: "$$" },
  { id: 10, name: "Carmody McKnight", region: "Adelaida District", rating: 4.6, reviews: 312, price: "$$$" },
  { id: 11, name: "Thacher Winery", region: "Adelaida District", rating: 4.7, reviews: 287, price: "$$$" },
  { id: 12, name: "Kukkula Winery", region: "Adelaida District", rating: 4.6, reviews: 198, price: "$$$" },
  { id: 13, name: "Rangeland Wines", region: "Adelaida District", rating: 4.6, reviews: 176, price: "$$$" },
  { id: 14, name: "Epoch Estate Wines", region: "Willow Creek", rating: 4.9, reviews: 542, price: "$$$$" },
  { id: 15, name: "Denner Vineyards", region: "Willow Creek", rating: 4.7, reviews: 412, price: "$$$$" },
  { id: 16, name: "Écluse Wines", region: "Willow Creek", rating: 4.6, reviews: 298, price: "$$$" },
  { id: 17, name: "Four Lanterns Winery", region: "Willow Creek", rating: 4.5, reviews: 189, price: "$$" },
  { id: 18, name: "Croad Vineyards", region: "Willow Creek", rating: 4.6, reviews: 231, price: "$$$" },
  { id: 19, name: "Justin Vineyards", region: "West Paso Robles", rating: 4.8, reviews: 983, price: "$$$" },
  { id: 20, name: "Booker Vineyard", region: "West Paso Robles", rating: 4.8, reviews: 389, price: "$$$$" },
  { id: 21, name: "Austin Hope Winery", region: "Templeton Gap", rating: 4.7, reviews: 856, price: "$$$" },
  { id: 22, name: "Castoro Cellars", region: "Templeton Gap", rating: 4.5, reviews: 567, price: "$$" },
  { id: 23, name: "J Dusi Wines", region: "Templeton Gap", rating: 4.6, reviews: 345, price: "$$" },
  { id: 24, name: "Bella Luna Estate", region: "Templeton Gap", rating: 4.5, reviews: 234, price: "$$" },
  { id: 25, name: "Cass Winery", region: "Templeton Gap", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 26, name: "Giornata Wines", region: "Tin City", rating: 4.8, reviews: 312, price: "$$$" },
  { id: 27, name: "Sans Liege Wines", region: "Tin City", rating: 4.7, reviews: 287, price: "$$" },
  { id: 28, name: "ONX Wines", region: "Tin City", rating: 4.7, reviews: 256, price: "$$$" },
  { id: 29, name: "Turtle Rock Vineyards", region: "Tin City", rating: 4.6, reviews: 198, price: "$$" },
  { id: 30, name: "MCV Wines", region: "Tin City", rating: 4.5, reviews: 176, price: "$$" },
  { id: 31, name: "Cloak & Dagger Wines", region: "Tin City", rating: 4.6, reviews: 213, price: "$$" },
  { id: 32, name: "LXV Wine", region: "Downtown Paso Robles", rating: 4.8, reviews: 534, price: "$$$" },
  { id: 33, name: "Serial Wines", region: "Downtown Paso Robles", rating: 4.7, reviews: 312, price: "$$$" },
  { id: 34, name: "Bushong Vintage Co.", region: "Downtown Paso Robles", rating: 4.6, reviews: 198, price: "$$" },
  { id: 35, name: "Tank Garage Winery", region: "Downtown Paso Robles", rating: 4.6, reviews: 267, price: "$$" },
  { id: 36, name: "Ridge Vineyards", region: "Downtown Paso Robles", rating: 4.8, reviews: 156, price: "$$$$" },
  { id: 37, name: "Villa San-Juliette", region: "Estrella District", rating: 4.6, reviews: 345, price: "$$$" },
  { id: 38, name: "Graveyard Vineyards", region: "Pleasant Valley", rating: 4.5, reviews: 198, price: "$$" },
  { id: 39, name: "Bon Niche Cellars", region: "Pleasant Valley", rating: 4.6, reviews: 123, price: "$$" },
  { id: 40, name: "Tolosa Winery", region: "Edna Valley", rating: 4.7, reviews: 534, price: "$$$" },
  { id: 41, name: "Chamisal Vineyards", region: "Edna Valley", rating: 4.7, reviews: 423, price: "$$$" },
  { id: 42, name: "Claiborne & Churchill", region: "Edna Valley", rating: 4.6, reviews: 356, price: "$$" },
  { id: 43, name: "Kynsi Winery", region: "Edna Valley", rating: 4.6, reviews: 287, price: "$$" },
  { id: 44, name: "Baileyana Winery", region: "Edna Valley", rating: 4.5, reviews: 312, price: "$$" },
  { id: 45, name: "Biddle Ranch Vineyard", region: "Edna Valley", rating: 4.5, reviews: 234, price: "$$" },
  { id: 46, name: "Wolff Vineyards", region: "Edna Valley", rating: 4.5, reviews: 198, price: "$$" },
  { id: 47, name: "Saucelito Canyon", region: "Edna Valley", rating: 4.5, reviews: 176, price: "$$" },
  { id: 48, name: "Talley Vineyards", region: "Arroyo Grande", rating: 4.8, reviews: 567, price: "$$$" },
  { id: 49, name: "Laetitia Vineyard", region: "Arroyo Grande", rating: 4.6, reviews: 423, price: "$$$" },
  { id: 50, name: "Fess Parker Winery", region: "Santa Ynez Valley", rating: 4.7, reviews: 789, price: "$$$" },
  { id: 62, name: "J. Lohr Vineyards", region: "Paso Robles", rating: 4.5, reviews: 678, price: "$$" },
  { id: 63, name: "Eberle Winery", region: "Paso Robles", rating: 4.6, reviews: 534, price: "$$" },
  { id: 68, name: "Opolo Vineyards", region: "Paso Robles", rating: 4.6, reviews: 1245, price: "$$" },
  { id: 69, name: "Vina Robles", region: "Paso Robles", rating: 4.6, reviews: 987, price: "$$" },
  { id: 70, name: "Tobin James Cellars", region: "Paso Robles", rating: 4.7, reviews: 1567, price: "$$" },
  { id: 71, name: "Niner Wine Estates", region: "Paso Robles", rating: 4.7, reviews: 678, price: "$$$" },
  { id: 72, name: "L'Aventure Winery", region: "Paso Robles", rating: 4.8, reviews: 456, price: "$$$$" },
  { id: 79, name: "Herman Story Wines", region: "Paso Robles", rating: 4.7, reviews: 345, price: "$$$" },
  { id: 80, name: "McPrice Myers", region: "Paso Robles", rating: 4.7, reviews: 278, price: "$$$" },
];

const TRAILS = [
  { id: 1, name: "Downtown Paso Trail", stops: [32, 33, 34, 35, 36, 86] },
  { id: 2, name: "Highway 46 West Trail", stops: [71, 74, 75, 7, 67, 22] },
  { id: 3, name: "Highway 46 East Trail", stops: [69, 63, 62, 70, 84] },
  { id: 4, name: "Adelaida Back Roads", stops: [1, 4, 3, 2, 5, 11] },
  { id: 5, name: "Tin City Trail", stops: [26, 27, 28, 29, 79, 80] },
  { id: 6, name: "Dog-Friendly Trail", stops: [2, 7, 22, 19, 17, 26] },
];

/* ═══════════════════════════════════════════════════════════════════
   DEMO DATA GENERATOR — simulates analytics until real data builds up
   ═══════════════════════════════════════════════════════════════════ */

function generateDemoData(wineryId) {
  const now = new Date();
  const daily = [];
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, visitors: 0 }));

  for (let d = 89; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 18 + (wineryId % 7) * 3 : 8 + (wineryId % 5) * 2;
    const seasonBoost = (date.getMonth() >= 4 && date.getMonth() <= 9) ? 1.4 : 1;
    const visitors = Math.round((base + Math.random() * 12) * seasonBoost);
    const checkIns = Math.round(visitors * (0.25 + Math.random() * 0.2));
    daily.push({
      date: date.toISOString().split("T")[0],
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      visitors,
      checkIns,
      avgRating: +(4.2 + Math.random() * 0.7).toFixed(1),
    });
  }

  // Hourly distribution pattern (peak at 1-3pm)
  const hourWeights = [0,0,0,0,0,0,0,0,1,3,6,10,14,16,15,12,9,6,3,1,0,0,0,0];
  const totalW = hourWeights.reduce((a, b) => a + b, 0);
  const todayVisitors = daily[daily.length - 1].visitors;
  hourWeights.forEach((w, i) => {
    hourly[i].visitors = Math.round((w / totalW) * todayVisitors * 3);
  });

  // Source breakdown
  const sources = [
    { name: "Sip805 App", value: 38 + Math.round(Math.random() * 10), color: "#9333ea" },
    { name: "Google Maps", value: 22 + Math.round(Math.random() * 8), color: "#3b82f6" },
    { name: "Direct / Walk-in", value: 18 + Math.round(Math.random() * 6), color: "#16a34a" },
    { name: "Trail Route", value: 12 + Math.round(Math.random() * 8), color: "#f59e0b" },
    { name: "Social Media", value: 5 + Math.round(Math.random() * 5), color: "#ef4444" },
  ];

  // Rating distribution
  const ratings = [
    { stars: "5 stars", count: 45 + Math.round(Math.random() * 20), color: "#16a34a" },
    { stars: "4 stars", count: 30 + Math.round(Math.random() * 10), color: "#84cc16" },
    { stars: "3 stars", count: 10 + Math.round(Math.random() * 5), color: "#f59e0b" },
    { stars: "2 stars", count: 3 + Math.round(Math.random() * 3), color: "#f97316" },
    { stars: "1 star", count: 1 + Math.round(Math.random() * 2), color: "#ef4444" },
  ];

  const last30 = daily.slice(-30);
  const prev30 = daily.slice(-60, -30);
  const totalVisitors30 = last30.reduce((s, d) => s + d.visitors, 0);
  const totalVisitorsPrev = prev30.reduce((s, d) => s + d.visitors, 0);
  const totalCheckIns30 = last30.reduce((s, d) => s + d.checkIns, 0);
  const totalCheckInsPrev = prev30.reduce((s, d) => s + d.checkIns, 0);
  const avgRating30 = +(last30.reduce((s, d) => s + d.avgRating, 0) / 30).toFixed(1);

  return {
    daily, hourly, sources, ratings,
    kpi: {
      visitors: { value: totalVisitors30, change: totalVisitorsPrev ? +((totalVisitors30 - totalVisitorsPrev) / totalVisitorsPrev * 100).toFixed(1) : 0 },
      checkIns: { value: totalCheckIns30, change: totalCheckInsPrev ? +((totalCheckIns30 - totalCheckInsPrev) / totalCheckInsPrev * 100).toFixed(1) : 0 },
      avgRating: { value: avgRating30, change: +(Math.random() * 0.4 - 0.1).toFixed(1) },
      trailAppearances: { value: TRAILS.filter(t => t.stops.includes(wineryId)).length, change: 0 },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

// ── KPI Card ────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, change, prefix = "", suffix = "", color = "purple" }) => {
  const up = change > 0;
  const colorMap = { purple: "bg-purple-50 text-purple-600", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", amber: "bg-amber-50 text-amber-600" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== 0 && change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
};

// ── Premium Lock Overlay ────────────────────────────────────────
const PremiumLock = ({ feature }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
      <Lock className="w-6 h-6 text-purple-600" />
    </div>
    <p className="text-sm font-semibold text-gray-900 mb-1">Premium Feature</p>
    <p className="text-xs text-gray-400 mb-3 text-center px-4">{feature}</p>
    <button className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition flex items-center gap-1.5">
      <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
    </button>
  </div>
);

// ── Section Header ──────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGES
   ═══════════════════════════════════════════════════════════════════ */

// ── OVERVIEW PAGE ───────────────────────────────────────────────
const OverviewPage = ({ data, winery, tier }) => {
  const [range, setRange] = useState("30d");
  const chartData = range === "7d" ? data.daily.slice(-7) : range === "30d" ? data.daily.slice(-30) : data.daily;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {winery.name}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["7d", "30d", "90d"].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Eye} label="App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-ins (30d)" value={data.kpi.checkIns.value} change={data.kpi.checkIns.change} color="blue" />
        <KpiCard icon={Star} label="Avg Rating" value={data.kpi.avgRating.value} change={data.kpi.avgRating.change} color="amber" />
        <KpiCard icon={Map} label="Trail Appearances" value={data.kpi.trailAppearances.value} color="green" />
      </div>

      {/* Visitors Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Visitor Traffic" subtitle={`Daily app views & check-ins — last ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}`} />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
              <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={2} fill="url(#gPurple)" name="App Views" />
              <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} fill="url(#gBlue)" name="Check-ins" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Sources + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionHeader title="Traffic Sources" subtitle="Where your visitors come from" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={data.sources} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {data.sources.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 relative">
          <SectionHeader title="Peak Hours" subtitle="Today's visitor distribution by hour" />
          {tier === "free" && <PremiumLock feature="See your busiest hours to optimize staffing" />}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly.slice(8, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="visitors" fill="#9333ea" radius={[4, 4, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TRAFFIC PAGE ────────────────────────────────────────────────
const TrafficPage = ({ data, winery, tier }) => {
  const weekdayData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = days.map(d => ({ day: d, visitors: 0, count: 0 }));
    data.daily.forEach(d => {
      const dow = new Date(d.date).getDay();
      buckets[dow].visitors += d.visitors;
      buckets[dow].count++;
    });
    return buckets.map(b => ({ ...b, avg: b.count ? Math.round(b.visitors / b.count) : 0 }));
  }, [data.daily]);

  const checkInRate = data.kpi.visitors.value > 0
    ? ((data.kpi.checkIns.value / data.kpi.visitors.value) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Traffic Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Deep dive into your visitor patterns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Eye} label="Total App Views (30d)" value={data.kpi.visitors.value} change={data.kpi.visitors.change} color="purple" />
        <KpiCard icon={CheckCircle} label="Check-in Rate" value={checkInRate} suffix="%" color="blue" />
        <KpiCard icon={Users} label="Unique Visitors (est.)" value={Math.round(data.kpi.visitors.value * 0.72)} color="green" />
      </div>

      {/* Day of Week */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Visitors by Day of Week" subtitle="Average daily traffic across the week" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="avg" fill="#9333ea" radius={[6, 6, 0, 0]} name="Avg Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ratings Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Rating Breakdown" subtitle="Distribution of check-in ratings" />
        <div className="space-y-3 mt-2">
          {data.ratings.map(r => {
            const total = data.ratings.reduce((s, x) => s + x.count, 0);
            const pct = ((r.count / total) * 100).toFixed(0);
            return (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14">{r.stars}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: r.color }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion Funnel — Premium */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 relative">
        <SectionHeader title="Conversion Funnel" subtitle="From app view → profile tap → check-in → review" />
        {tier === "free" && <PremiumLock feature="See how visitors convert at each stage" />}
        <div className="space-y-3 mt-4">
          {[
            { stage: "Saw on Map / List", pct: 100, count: data.kpi.visitors.value, color: "#9333ea" },
            { stage: "Viewed Profile", pct: 64, count: Math.round(data.kpi.visitors.value * 0.64), color: "#7c3aed" },
            { stage: "Visited (Check-in)", pct: parseFloat(checkInRate), count: data.kpi.checkIns.value, color: "#6d28d9" },
            { stage: "Left a Rating", pct: parseFloat(checkInRate) * 0.6, count: Math.round(data.kpi.checkIns.value * 0.6), color: "#5b21b6" },
          ].map(f => (
            <div key={f.stage} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-32">{f.stage}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full flex items-center pl-2" style={{ width: `${Math.max(f.pct, 5)}%`, background: f.color }}>
                  <span className="text-[10px] text-white font-medium">{f.count.toLocaleString()}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 w-12 text-right">{f.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── TRAILS PAGE ─────────────────────────────────────────────────
const TrailsPage = ({ data, winery, tier }) => {
  const myTrails = TRAILS.filter(t => t.stops.includes(winery.id));
  const otherTrails = TRAILS.filter(t => !t.stops.includes(winery.id));

  // Simulated trail-specific metrics
  const trailMetrics = TRAILS.map(t => ({
    ...t,
    visitors: Math.round(80 + Math.random() * 200),
    completionRate: +(60 + Math.random() * 35).toFixed(0),
    avgStopsVisited: +(t.stops.length * (0.5 + Math.random() * 0.4)).toFixed(1),
    yourPosition: t.stops.indexOf(winery.id) + 1,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trail Performance</h2>
        <p className="text-sm text-gray-400 mt-1">See how trails drive traffic to your winery</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Map} label="Your Trail Appearances" value={myTrails.length} color="purple" />
        <KpiCard icon={Users} label="Trail Visitors (30d)" value={Math.round(data.kpi.visitors.value * 0.35)} color="blue" />
        <KpiCard icon={Target} label="Trail Conversion" value="34" suffix="%" color="green" />
      </div>

      {/* Your Trails */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Trails Featuring Your Winery" subtitle={`You appear on ${myTrails.length} of ${TRAILS.length} trails`} />
        {myTrails.length === 0 ? (
          <div className="text-center py-8">
            <Map className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Your winery doesn't appear on any trails yet.</p>
            <p className="text-xs text-gray-300 mt-1">Trails are curated based on location, region, and visitor data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trailMetrics.filter(t => t.stops.includes(winery.id)).map(t => (
              <div key={t.id} className="border border-gray-100 rounded-xl p-4 hover:border-purple-200 transition">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className="text-xs text-gray-400 ml-2">Stop #{t.yourPosition} of {t.stops.length}</span>
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{t.visitors} visitors/mo</span>
                </div>
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>Completion: {t.completionRate}%</span>
                  <span>Avg stops visited: {t.avgStopsVisited}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trail Visitor Comparison — Premium */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 relative">
        <SectionHeader title="Trail Visitor Comparison" subtitle="Which trails drive the most traffic to your winery" />
        {tier === "free" && <PremiumLock feature="Compare traffic from each trail with detailed breakdowns" />}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trailMetrics.filter(t => t.stops.includes(winery.id))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={150} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="visitors" fill="#9333ea" radius={[0, 6, 6, 0]} name="Monthly Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Not On These Trails */}
      {otherTrails.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionHeader title="Other Trails" subtitle="Trails you're not currently on" />
          <div className="space-y-2">
            {otherTrails.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{t.name}</span>
                <span className="text-xs text-gray-400">{t.stops.length} stops</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── BENCHMARKING PAGE ───────────────────────────────────────────
const BenchmarkPage = ({ data, winery, tier }) => {
  const regionWineries = WINERIES.filter(w => w.region === winery.region).sort((a, b) => b.rating - a.rating);
  const allSorted = [...WINERIES].sort((a, b) => b.reviews - a.reviews);
  const regionRank = regionWineries.findIndex(w => w.id === winery.id) + 1;
  const overallRank = allSorted.findIndex(w => w.id === winery.id) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Competitive Benchmarking</h2>
        <p className="text-sm text-gray-400 mt-1">See how you stack up against other wineries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Award} label={`Rank in ${winery.region}`} value={`#${regionRank}`} suffix={` of ${regionWineries.length}`} color="purple" />
        <KpiCard icon={TrendingUp} label="Overall Popularity Rank" value={`#${overallRank}`} suffix={` of ${WINERIES.length}`} color="blue" />
        <KpiCard icon={Star} label="Your Rating" value={winery.rating} suffix=" / 5" color="amber" />
      </div>

      {/* Region Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title={`${winery.region} Leaderboard`} subtitle="Ranked by rating within your region" />
        <div className="space-y-1">
          {regionWineries.map((w, i) => (
            <div key={w.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${w.id === winery.id ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${w.id === winery.id ? "font-bold text-purple-700" : "text-gray-700"}`}>{w.name}</span>
                {w.id === winery.id && <span className="text-[10px] ml-2 text-purple-500 font-medium">YOU</span>}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-gray-700">{w.rating}</span>
              </div>
              <span className="text-xs text-gray-400 w-16 text-right">{w.reviews.toLocaleString()} reviews</span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Comparison — Premium */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 relative">
        <SectionHeader title="Head-to-Head Comparison" subtitle="Compare your metrics against specific competitors" />
        {tier === "free" && <PremiumLock feature="Compare traffic, ratings, and trends vs. any competitor" />}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionWineries.slice(0, 6).map(w => ({ name: w.name.length > 15 ? w.name.slice(0, 14) + "…" : w.name, reviews: w.reviews, rating: w.rating * 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="reviews" fill="#9333ea" radius={[4, 4, 0, 0]} name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price Positioning */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <SectionHeader title="Price Positioning" subtitle="Where you sit in the market" />
        <div className="grid grid-cols-4 gap-3 mt-2">
          {["$$", "$$$", "$$$$"].map(p => {
            const count = WINERIES.filter(w => w.price === p).length;
            const isYou = winery.price === p;
            return (
              <div key={p} className={`text-center p-3 rounded-xl ${isYou ? "bg-purple-50 border-2 border-purple-300" : "bg-gray-50"}`}>
                <div className={`text-lg font-bold ${isYou ? "text-purple-700" : "text-gray-600"}`}>{p}</div>
                <div className="text-xs text-gray-400 mt-1">{count} wineries</div>
                {isYou && <div className="text-[10px] text-purple-500 font-semibold mt-1">YOUR TIER</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── PROFILE EDITOR PAGE ─────────────────────────────────────────
const ProfileEditorPage = ({ winery, user, tier }) => {
  // Full winery data from WINERIES array (for defaults)
  const defaults = WINERIES.find(w => w.id === winery.id) || winery;

  const [desc, setDesc] = useState(defaults.desc || "");
  const [phone, setPhone] = useState(defaults.phone || "");
  const [hours, setHours] = useState(defaults.hours || "");
  const [website, setWebsite] = useState(defaults.website || "");
  const [dogFriendly, setDogFriendly] = useState(defaults.dogFriendly || false);
  const [tags, setTags] = useState(defaults.tags || []);
  const [newTag, setNewTag] = useState("");
  const [experiences, setExperiences] = useState(
    defaults.experiences || [{ name: "Tasting", duration: "45–60 min" }]
  );
  const [photoURL, setPhotoURL] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing overrides from Firestore
  useEffect(() => {
    (async () => {
      const overrides = await getWineryProfileEdits(winery.id);
      if (overrides) {
        if (overrides.desc) setDesc(overrides.desc);
        if (overrides.phone) setPhone(overrides.phone);
        if (overrides.hours) setHours(overrides.hours);
        if (overrides.website !== undefined) setWebsite(overrides.website);
        if (overrides.dogFriendly !== undefined) setDogFriendly(overrides.dogFriendly);
        if (overrides.tags) setTags(overrides.tags);
        if (overrides.experiences) setExperiences(overrides.experiences);
        if (overrides.photoURL) setPhotoURL(overrides.photoURL);
      }
      setLoaded(true);
    })();
  }, [winery.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setErrors({});

    const edits = { desc, phone, hours, website, dogFriendly, tags, experiences };
    const result = await saveWineryProfileEdits(winery.id, edits, user?.uid);

    if (!result.success) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    // Upload photo if selected
    if (photoFile) {
      setUploading(true);
      const photoResult = await uploadWineryPhoto(winery.id, photoFile);
      if (!photoResult.success) {
        setErrors({ photo: photoResult.error });
        setUploading(false);
        setSaving(false);
        return;
      }
      setPhotoURL(photoResult.url);
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploading(false);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, photo: undefined }));
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && tags.length < 3 && !tags.includes(t)) {
      setTags([...tags, t]);
      setNewTag("");
    }
  };

  const removeTag = (i) => setTags(tags.filter((_, idx) => idx !== i));

  const updateExp = (i, field, val) => {
    const updated = [...experiences];
    updated[i] = { ...updated[i], [field]: val };
    setExperiences(updated);
  };

  const addExp = () => {
    if (experiences.length < 5) setExperiences([...experiences, { name: "", duration: "" }]);
  };

  const removeExp = (i) => {
    if (experiences.length > 1) setExperiences(experiences.filter((_, idx) => idx !== i));
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>;

  const FieldError = ({ field }) => errors[field] ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p> : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Update how your winery appears in the Sip805 app</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-700 transition disabled:opacity-50">
          {saving ? (uploading ? "Uploading photo..." : "Saving...") : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Locked fields notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Some fields are managed by Sip805</p>
          <p className="text-xs text-amber-600 mt-0.5">Winery name, region, price tier, ratings, and trail placement are locked to protect listing integrity. Contact us to request changes.</p>
        </div>
      </div>

      {/* Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-4 h-4 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">Hero Photo</h3>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-48 h-32 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
            {(photoPreview || photoURL) ? (
              <img src={photoPreview || photoURL} alt="Winery" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Image className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No photo yet</p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition">
              <Upload className="w-4 h-4" /> Upload Photo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG, or WebP. Min 400x300px. Max 5 MB.</p>
            <p className="text-xs text-gray-400">This replaces the gradient on your profile card.</p>
            <FieldError field="photo" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">Description</h3>
        </div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none" placeholder="Describe your winery..." />
        <div className="flex items-center justify-between mt-1">
          <FieldError field="desc" />
          <span className={`text-xs ${desc.length > 450 ? "text-amber-500" : "text-gray-400"}`}>{desc.length}/500</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">Contact & Hours</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="(805) 555-1234" />
            <FieldError field="phone" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Website</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="yourwinery.com" />
            <FieldError field="website" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Hours</label>
            <input type="text" value={hours} onChange={e => setHours(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="Daily 10 AM – 5 PM" />
            <FieldError field="hours" />
          </div>
        </div>
      </div>

      {/* Dog Friendly Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dog className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">Dog Friendly</h3>
              <p className="text-xs text-gray-400">Allow your winery to appear on the Dog-Friendly Trail</p>
            </div>
          </div>
          <button onClick={() => setDogFriendly(!dogFriendly)} className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${dogFriendly ? "bg-purple-600" : "bg-gray-200"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${dogFriendly ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">Tags</h3>
          <span className="text-xs text-gray-400">({tags.length}/3)</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-sm font-medium px-3 py-1.5 rounded-lg">
              {t}
              <button onClick={() => removeTag(i)} className="hover:text-red-500 transition"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
        {tags.length < 3 && (
          <div className="flex gap-2">
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} maxLength={25} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-400 outline-none" placeholder="Add a tag..." />
            <button onClick={addTag} disabled={!newTag.trim()} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40"><Plus className="w-4 h-4" /></button>
          </div>
        )}
        <FieldError field="tags" />
      </div>

      {/* Experiences */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-semibold text-gray-900">Experiences</h3>
          </div>
          {experiences.length < 5 && (
            <button onClick={addExp} className="flex items-center gap-1 text-xs text-purple-600 font-medium hover:text-purple-700"><Plus className="w-3.5 h-3.5" /> Add</button>
          )}
        </div>
        <div className="space-y-3">
          {experiences.map((exp, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input type="text" value={exp.name} onChange={e => updateExp(i, "name", e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-400 outline-none bg-white" placeholder="Experience name" />
                <input type="text" value={exp.duration} onChange={e => updateExp(i, "duration", e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-400 outline-none bg-white" placeholder="e.g. 45–60 min" />
              </div>
              {experiences.length > 1 && (
                <button onClick={() => removeExp(i)} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
        <FieldError field="experiences" />
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Live Preview</h3>
        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-36 relative" style={{ background: photoURL || photoPreview ? "none" : (defaults.gradient || "linear-gradient(135deg, #1a0533, #6b2fa0)") }}>
            {(photoURL || photoPreview) && <img src={photoPreview || photoURL} alt="" className="w-full h-full object-cover" />}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70">
              <h4 className="text-white font-bold text-lg">{defaults.name}</h4>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <MapPin className="w-3 h-3" /> {defaults.region}
                <span>·</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {defaults.rating}
                <span>·</span>
                {defaults.price}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" /> {hours || "Hours not set"}
              <span className="mx-1">·</span>
              <Phone className="w-3 h-3" /> {phone || "No phone"}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{desc || "No description yet."}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700">Experiences</p>
              {experiences.filter(e => e.name).map((e, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">{e.name}</span>
                  <span className="text-xs text-purple-600">{e.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom save button */}
      <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-4 rounded-2xl hover:bg-purple-700 transition disabled:opacity-50">
        {saving ? "Saving..." : saved ? <><CheckCircle className="w-5 h-5" /> Changes Saved — Live in App!</> : <><Save className="w-5 h-5" /> Save & Publish to Sip805 App</>}
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ADMIN PAGES — only visible to admin emails
// ══════════════════════════════════════════════════════════════════

// ── ADMIN OVERVIEW ──────────────────────────────────────────────
const AdminOverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getPlatformStats();
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading || !stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Platform-wide statistics</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-xs text-purple-600 font-medium hover:text-purple-700"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3"><Users className="w-5 h-5 text-purple-600" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOwners}</div>
          <div className="text-xs text-gray-400">Registered Owners</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><ClipboardList className="w-5 h-5 text-amber-600" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</div>
          <div className="text-xs text-gray-400">Pending Claims</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><CheckCircle className="w-5 h-5 text-blue-600" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCheckIns}</div>
          <div className="text-xs text-gray-400">Total Check-ins</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3"><Wine className="w-5 h-5 text-green-600" /></div>
          <div className="text-2xl font-bold text-gray-900">{WINERIES.length}</div>
          <div className="text-xs text-gray-400">Wineries in Database</div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Check-ins</h3>
        {stats.recentVisits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No check-ins yet. They'll appear here once users start visiting wineries.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentVisits.slice(0, 10).map((v, i) => {
              const w = WINERIES.find(x => x.id === v.wineryId);
              return (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Wine className="w-4 h-4 text-purple-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{w?.name || `Winery #${v.wineryId}`}</div>
                    <div className="text-xs text-gray-400">{v.wineryName || ""}</div>
                  </div>
                  {v.rating && <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{v.rating}</span></div>}
                  <span className="text-[10px] text-gray-400">{v.date ? new Date(v.date).toLocaleDateString() : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── ADMIN CLAIMS PAGE ───────────────────────────────────────────
const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const c = filter === "pending" ? await getPendingClaims() : await getAllClaims();
      setClaims(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (uid) => {
    setProcessing(uid);
    try {
      await approveClaim(uid);
      setClaims(prev => prev.map(c => c.id === uid ? { ...c, status: "approved" } : c));
    } catch (e) { alert("Error: " + e.message); }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    setProcessing(showRejectModal);
    try {
      await rejectClaim(showRejectModal, rejectReason);
      setClaims(prev => prev.map(c => c.id === showRejectModal ? { ...c, status: "rejected" } : c));
    } catch (e) { alert("Error: " + e.message); }
    setProcessing(null);
    setShowRejectModal(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Winery Claims</h2>
          <p className="text-sm text-gray-400 mt-1">Review and approve winery ownership requests</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-xs text-purple-600 font-medium hover:text-purple-700"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {["pending", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
            {f === "pending" ? "Pending" : "All Claims"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No {filter === "pending" ? "pending" : ""} claims</h3>
          <p className="text-sm text-gray-400 mt-1">{filter === "pending" ? "All claims have been reviewed." : "No one has claimed a winery yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => {
            const w = WINERIES.find(x => x.id === claim.wineryId);
            return (
              <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Wine className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{claim.wineryName || w?.name || `Winery #${claim.wineryId}`}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        claim.status === "pending" ? "bg-amber-50 text-amber-600" :
                        claim.status === "approved" ? "bg-green-50 text-green-600" :
                        "bg-red-50 text-red-600"
                      }`}>{claim.status.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      <span className="font-medium text-gray-600">{claim.email}</span>
                      {claim.submittedAt?.toDate && <span> · Submitted {claim.submittedAt.toDate().toLocaleDateString()}</span>}
                    </div>
                    {w && <div className="text-xs text-gray-400 mt-0.5">{w.region} · {w.rating} stars · {w.reviews} reviews</div>}
                    {claim.rejectionReason && <div className="text-xs text-red-400 mt-1">Reason: {claim.rejectionReason}</div>}
                  </div>
                  {claim.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(claim.id)}
                        disabled={processing === claim.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(claim.id)}
                        disabled={processing === claim.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-gray-900 mb-3">Reject Claim</h3>
            <p className="text-sm text-gray-500 mb-4">Optionally provide a reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-purple-400 outline-none resize-none mb-4"
              placeholder="Reason (optional)..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowRejectModal(null); setRejectReason(""); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleReject} disabled={processing} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                Reject Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ADMIN WINERIES PAGE ─────────────────────────────────────────
const AdminWineriesPage = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const o = await getAllWineryOwners();
        setOwners(o);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Merge owners with winery data
  const enriched = WINERIES.map(w => {
    const owner = owners.find(o => o.wineryId === w.id);
    return { ...w, owner };
  }).filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.region.toLowerCase().includes(search.toLowerCase())
  );

  const claimed = enriched.filter(w => w.owner);
  const unclaimed = enriched.filter(w => !w.owner);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Wineries</h2>
        <p className="text-sm text-gray-400 mt-1">{WINERIES.length} wineries in database · {owners.length} claimed</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
        placeholder="Search wineries..."
      />

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Claimed wineries */}
          {claimed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-green-600" /> Claimed ({claimed.length})</h3>
              <div className="space-y-2">
                {claimed.map(w => (
                  <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: w.gradient || "linear-gradient(135deg, #1a0533, #6b2fa0)" }}>
                      <Wine className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{w.name}</div>
                      <div className="text-xs text-gray-400">{w.region} · {w.price}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium text-green-600">{w.owner.email}</div>
                      <div className="text-[10px] text-gray-400">{w.owner.tier || "free"} plan</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unclaimed wineries */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Wine className="w-4 h-4 text-gray-400" /> Unclaimed ({unclaimed.length})</h3>
            <div className="space-y-1">
              {unclaimed.map(w => (
                <div key={w.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-100">
                    <Wine className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700">{w.name}</div>
                    <div className="text-xs text-gray-400">{w.region}</div>
                  </div>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs">{w.rating}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── ADMIN USERS PAGE ────────────────────────────────────────────
const AdminUsersPage = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await getRecentVisits(200);
        setVisits(v);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Group by user
  const userMap = {};
  visits.forEach(v => {
    const uid = v.userId || v.uid || "anonymous";
    if (!userMap[uid]) userMap[uid] = { uid, visits: [], wineries: new Set() };
    userMap[uid].visits.push(v);
    userMap[uid].wineries.add(v.wineryId);
  });
  const users = Object.values(userMap).sort((a, b) => b.visits.length - a.visits.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">App Users</h2>
        <p className="text-sm text-gray-400 mt-1">Users who have checked in via the Sip805 app</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No user activity yet</h3>
          <p className="text-sm text-gray-400 mt-1">Check-ins from the consumer app will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">Check-ins</div>
            <div className="col-span-3 text-center">Unique Wineries</div>
            <div className="col-span-3 text-right">Last Active</div>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map((u, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-gray-50">
                <div className="col-span-4">
                  <div className="text-sm font-medium text-gray-900 truncate">{u.visits[0]?.userName || u.uid.slice(0, 12) + "..."}</div>
                  <div className="text-[10px] text-gray-400 truncate">{u.uid}</div>
                </div>
                <div className="col-span-2 text-center text-sm font-semibold text-gray-900">{u.visits.length}</div>
                <div className="col-span-3 text-center text-sm text-gray-600">{u.wineries.size}</div>
                <div className="col-span-3 text-right text-xs text-gray-400">{u.visits[0]?.date ? new Date(u.visits[0].date).toLocaleDateString() : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── SETTINGS PAGE ───────────────────────────────────────────────
const SettingsPage = ({ winery, tier, onLogout }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <p className="text-sm text-gray-400 mt-1">Manage your winery dashboard</p>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Winery Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Winery Name</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.name}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Region</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.region}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Price Tier</label>
          <div className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{winery.price}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Dashboard Plan</label>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-3 py-2.5 rounded-lg ${tier === "pro" ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700"}`}>
              {tier === "pro" ? "Pro" : "Free"}
            </span>
            {tier === "free" && (
              <button className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1">
                <Crown className="w-3 h-3" /> Upgrade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Premium Plans */}
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Plans & Pricing</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`border-2 rounded-xl p-5 ${tier === "free" ? "border-gray-200" : "border-gray-100"}`}>
          <div className="text-sm font-bold text-gray-900">Free</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">$0<span className="text-sm text-gray-400 font-normal">/mo</span></div>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Overview dashboard</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Basic traffic stats</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Trail appearances</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Region leaderboard</li>
          </ul>
        </div>
        <div className={`border-2 rounded-xl p-5 relative ${tier === "pro" ? "border-purple-400 bg-purple-50/30" : "border-purple-200"}`}>
          <div className="absolute -top-2.5 right-4 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">RECOMMENDED</div>
          <div className="text-sm font-bold text-purple-700">Pro</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">$49<span className="text-sm text-gray-400 font-normal">/mo</span></div>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Everything in Free</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Peak hours analysis</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Conversion funnel</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Competitor comparison</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Trail deep analytics</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> CSV data export</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Featured placement boost</li>
          </ul>
          {tier === "free" && (
            <button className="w-full mt-4 bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-purple-700 transition">
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>

    <button onClick={onLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium">
      <LogOut className="w-4 h-4" /> Sign Out
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════════ */

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wineryId, setWineryId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // login | register

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const wid = parseInt(wineryId);
        const w = WINERIES.find(x => x.id === wid);
        if (!w) { setError("Invalid winery. Select from the dropdown."); setLoading(false); return; }
      }
      await signInWithEmail(email, password);
      // Auth state change will handle the rest
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Wine className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white tracking-tight">Sip805</span>
          </div>
          <h1 className="text-xl font-bold text-white">Winery Dashboard</h1>
          <p className="text-purple-200 text-sm mt-1">Analytics for Central Coast wineries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button onClick={() => setMode("login")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>Sign In</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "register" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="you@winery.com" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" placeholder="••••••••" required />
            </div>

            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Your Winery</label>
                <select value={wineryId} onChange={e => setWineryId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none bg-white" required>
                  <option value="">Select your winery...</option>
                  {[...WINERIES].sort((a, b) => a.name.localeCompare(b.name)).map(w => (
                    <option key={w.id} value={w.id}>{w.name} — {w.region}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
          </div>

          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.42l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Demo: select any winery after signing in
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   WINERY SELECTOR (post-login, if no winery profile yet)
   ═══════════════════════════════════════════════════════════════════ */

const WinerySelector = ({ user, onSelect, isAdminUser }) => {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const filtered = WINERIES.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.region.toLowerCase().includes(search.toLowerCase()));

  const handleClaim = async (w) => {
    if (isAdminUser) {
      // Admins bypass the claim flow
      onSelect(w);
      return;
    }
    setSelectedClaim(w);
  };

  const handleSubmitClaim = async () => {
    if (!selectedClaim) return;
    try {
      await submitWineryClaim(user.uid, user.email, selectedClaim.id, selectedClaim.name);
      setSubmitted(true);
    } catch (e) {
      alert("Error submitting claim: " + e.message);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Claim Submitted!</h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Your claim for <span className="font-semibold text-gray-700">{selectedClaim.name}</span> has been submitted for review. You'll get access once approved.
          </p>
          <p className="text-xs text-gray-400 mt-4">This usually takes less than 24 hours.</p>
        </div>
      </div>
    );
  }

  if (selectedClaim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: selectedClaim.gradient || "linear-gradient(135deg, #1a0533, #6b2fa0)" }}>
              <Wine className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Claim {selectedClaim.name}?</h2>
            <p className="text-sm text-gray-400 mt-1">{selectedClaim.region} · {selectedClaim.price}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              By claiming this winery, you're confirming you own or manage <span className="font-semibold">{selectedClaim.name}</span>. Your request will be reviewed before access is granted.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelectedClaim(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">Back</button>
            <button onClick={handleSubmitClaim} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition">Submit Claim</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <Wine className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900">{isAdminUser ? "Select a Winery" : "Claim Your Winery"}</h2>
          <p className="text-sm text-gray-400 mt-1">{isAdminUser ? "Admin: select any winery to view its dashboard" : "Select the winery you own or manage"}</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none mb-4"
          placeholder="Search wineries..."
        />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.map(w => (
            <button key={w.id} onClick={() => handleClaim(w)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-left transition">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wine className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{w.name}</div>
                <div className="text-xs text-gray-400">{w.region} · {w.price}</div>
              </div>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm text-gray-600">{w.rating}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [winery, setWinery] = useState(null);
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const tier = "free"; // TODO: read from Firestore profile
  const adminUser = user && isAdmin(user);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        setShowDashboard(true);
        const profile = await getWineryProfile(u.uid);
        if (profile?.wineryId) {
          const w = WINERIES.find(x => x.id === profile.wineryId);
          if (w) setWinery(w);
        }
        // Admin auto-selects first winery if no profile yet
        if (isAdmin(u) && !profile?.wineryId) {
          setWinery(WINERIES[0]);
        }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleSelectWinery = async (w) => {
    setWinery(w);
    if (user && isAdmin(user)) {
      // Admin: just select, don't create a claim
      await createWineryProfile(user.uid, { wineryId: w.id, wineryName: w.name, isAdmin: true });
    }
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setWinery(null);
    setPage("overview");
    setShowDashboard(false);
  };

  // Generate demo data for selected winery
  const data = useMemo(() => winery ? generateDemoData(winery.id) : null, [winery?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show landing page by default; dashboard only after clicking "Get Started" or if already authenticated
  if (!showDashboard && !user) return <Landing onEnterDashboard={() => setShowDashboard(true)} />;
  if (!user) return <LoginScreen />;
  if (!winery) return <WinerySelector user={user} onSelect={handleSelectWinery} isAdminUser={adminUser} />;

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Activity },
    { id: "trails", label: "Trails", icon: Map },
    { id: "benchmark", label: "Benchmark", icon: Award },
    { id: "profile", label: "Edit Profile", icon: Pencil },
    { id: "settings", label: "Settings", icon: Settings },
    // Admin pages — only shown to admin users
    ...(adminUser ? [
      { id: "divider", label: "", icon: null },
      { id: "admin-overview", label: "Admin", icon: Shield },
      { id: "admin-claims", label: "Claims", icon: ClipboardList },
      { id: "admin-wineries", label: "Wineries", icon: Wine },
      { id: "admin-users", label: "Users", icon: Users },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">Sip805</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <p className="text-[10px] text-purple-500 font-semibold tracking-wider mt-0.5">WINERY DASHBOARD</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            if (item.id === "divider") return <div key="divider" className="border-t border-gray-100 my-2 mx-2" />;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${page === item.id ? "bg-purple-50 text-purple-700" : item.id.startsWith("admin") ? "text-amber-600 hover:bg-amber-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
              {winery.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{winery.name}</div>
              <div className="text-[10px] text-gray-400">{tier === "pro" ? "Pro Plan" : "Free Plan"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{winery.name}</span>
              <span className="text-xs text-gray-400">· {winery.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tier === "free" && (
              <button className="hidden sm:flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-700 transition">
                <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
              </button>
            )}
            <button className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <Bell className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-6xl mx-auto">
          {page === "overview" && <OverviewPage data={data} winery={winery} tier={tier} />}
          {page === "traffic" && <TrafficPage data={data} winery={winery} tier={tier} />}
          {page === "trails" && <TrailsPage data={data} winery={winery} tier={tier} />}
          {page === "benchmark" && <BenchmarkPage data={data} winery={winery} tier={tier} />}
          {page === "profile" && <ProfileEditorPage winery={winery} user={user} tier={tier} />}
          {page === "settings" && <SettingsPage winery={winery} tier={tier} onLogout={handleLogout} />}
          {adminUser && page === "admin-overview" && <AdminOverviewPage />}
          {adminUser && page === "admin-claims" && <AdminClaimsPage />}
          {adminUser && page === "admin-wineries" && <AdminWineriesPage />}
          {adminUser && page === "admin-users" && <AdminUsersPage />}
        </div>
      </main>
    </div>
  );
}
