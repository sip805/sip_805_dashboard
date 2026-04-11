import { useState, useEffect, useRef } from "react";
import {
  Wine, BarChart3, Map, Award, TrendingUp, Users, Eye, Star,
  CheckCircle, ArrowRight, ChevronDown, Play, Zap, Lock, Crown,
  Activity, Target, MapPin, Shield, Clock, DollarSign, Menu, X
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   DEMO DATA — simulated dashboard preview
   ═══════════════════════════════════════════════════════════════════ */

const demoTraffic = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 29 + i);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return {
    label: `${d.getMonth() + 1}/${d.getDate()}`,
    visitors: Math.round((isWeekend ? 22 : 12) + Math.random() * 15),
    checkIns: Math.round((isWeekend ? 8 : 4) + Math.random() * 6),
  };
});

const demoSources = [
  { name: "Sip805 App", value: 42, color: "#9333ea" },
  { name: "Google Maps", value: 25, color: "#3b82f6" },
  { name: "Walk-in", value: 18, color: "#16a34a" },
  { name: "Trail Route", value: 15, color: "#f59e0b" },
];

const demoDayOfWeek = [
  { day: "Mon", avg: 10 }, { day: "Tue", avg: 12 }, { day: "Wed", avg: 11 },
  { day: "Thu", avg: 15 }, { day: "Fri", avg: 22 }, { day: "Sat", avg: 28 }, { day: "Sun", avg: 24 },
];

const demoLeaderboard = [
  { name: "Hilltop Ridge Winery", rating: 4.9, reviews: 1247, rank: 1 },
  { name: "Sunset Vine Estate", rating: 4.7, reviews: 612, rank: 2, isYou: true },
  { name: "Oak Hollow Cellars", rating: 4.8, reviews: 876, rank: 3 },
  { name: "Golden Creek Vineyards", rating: 4.7, reviews: 534, rank: 4 },
  { name: "Coastal Bluff Wines", rating: 4.8, reviews: 367, rank: 5 },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

const StatBadge = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-white">{value}</div>
    <div className="text-sm text-purple-200 mt-1">{label}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   INTERACTIVE DEMO SECTION
   ═══════════════════════════════════════════════════════════════════ */

const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Activity },
    { id: "trails", label: "Trails", icon: Map },
    { id: "benchmark", label: "Benchmark", icon: Award },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-5xl mx-auto">
      {/* Demo header bar */}
      <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-400 ml-3">dashboard.sip805.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">LIVE DEMO</span>
        </div>
      </div>

      <div className="flex min-h-[460px]">
        {/* Mini sidebar */}
        <div className="w-48 bg-gray-50 border-r border-gray-100 p-3 hidden sm:block">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <Wine className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-bold text-gray-900">Sip805</span>
          </div>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition mb-1 ${activeTab === t.id ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Mobile tab row */}
        <div className="sm:hidden flex gap-1 bg-gray-50 border-b border-gray-100 p-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium ${activeTab === t.id ? "bg-purple-50 text-purple-700" : "text-gray-400"}`}
            >
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-5 overflow-hidden">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Overview</h3>
                  <p className="text-xs text-gray-400">Welcome back, Sunset Vine Estate</p>
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
                  {["7d", "30d"].map(r => (
                    <span key={r} className={`px-2 py-1 text-[10px] rounded font-medium ${r === "30d" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}>{r}</span>
                  ))}
                </div>
              </div>

              {/* Mini KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "App Views", value: "487", change: "+12.3%", icon: Eye, color: "bg-purple-50 text-purple-600" },
                  { label: "Check-ins", value: "142", change: "+8.7%", icon: CheckCircle, color: "bg-blue-50 text-blue-600" },
                  { label: "Avg Rating", value: "4.7", change: "+0.2", icon: Star, color: "bg-amber-50 text-amber-600" },
                  { label: "Trail Appearances", value: "2", change: "", icon: Map, color: "bg-green-50 text-green-600" },
                ].map(k => (
                  <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
                      <k.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">{k.value}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">{k.label}</span>
                      {k.change && <span className="text-[10px] text-green-600 font-medium">{k.change}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini chart */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-700 mb-3">Visitor Traffic — Last 30 Days</div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demoTraffic}>
                      <defs>
                        <linearGradient id="demoG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9333ea" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                      <YAxis tick={false} axisLine={false} tickLine={false} />
                      <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={2} fill="url(#demoG)" />
                      <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={1.5} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PRO: Peak Hours Preview — fully visible */}
              <div className="bg-white border border-purple-200 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-700">Peak Hours — Staffing Insights</div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" /> PRO</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {["10a","11a","12p","1p","2p","3p"].map((h,i) => (
                    <div key={h} className="text-center">
                      <div className="rounded-md bg-purple-200 mx-auto mb-1" style={{ height: [24,36,44,40,32,20][i], width: "100%" }} />
                      <span className="text-[8px] text-gray-400">{h}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 mt-2">Peak at 12–1 PM on weekends. Consider adding a staff member.</div>
              </div>
            </div>
          )}

          {activeTab === "traffic" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Traffic Analytics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-3">Visitors by Day of Week</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demoDayOfWeek}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <Bar dataKey="avg" fill="#9333ea" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-3">Traffic Sources</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie data={demoSources} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                          {demoSources.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center mt-1">
                    {demoSources.map(s => (
                      <div key={s.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-[10px] text-gray-500">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRO: Conversion Funnel — fully visible */}
              <div className="bg-white border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-700">Conversion Funnel</div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" /> PRO</span>
                </div>
                <div className="space-y-2">
                  {[
                    { stage: "App Views", count: 487, pct: 100, color: "bg-purple-500" },
                    { stage: "Profile Clicks", count: 312, pct: 64, color: "bg-purple-400" },
                    { stage: "Check-ins", count: 142, pct: 29, color: "bg-blue-500" },
                    { stage: "Left a Rating", count: 98, pct: 20, color: "bg-green-500" },
                  ].map(s => (
                    <div key={s.stage} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 w-20 text-right">{s.stage}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 w-8">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 mt-2">29% of app viewers check in. 69% of those leave a rating.</div>
              </div>
            </div>
          )}

          {activeTab === "trails" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Trail Performance</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-purple-700">2</div>
                  <div className="text-[10px] text-purple-500">Trail Appearances</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">171</div>
                  <div className="text-[10px] text-blue-500">Trail Visitors/mo</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-700">34%</div>
                  <div className="text-[10px] text-green-500">Conversion</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Hilltop Heritage Trail", stop: 2, total: 6, visitors: 214 },
                  { name: "Dog-Friendly Trail", stop: 4, total: 6, visitors: 128 },
                ].map(t => (
                  <div key={t.name} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{t.name}</span>
                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t.visitors}/mo</span>
                    </div>
                    <div className="text-[10px] text-gray-400">Stop #{t.stop} of {t.total}</div>
                  </div>
                ))}
              </div>

              {/* PRO: Trail ROI — fully visible */}
              <div className="bg-white border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-700">Trail ROI Breakdown</div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" /> PRO</span>
                </div>
                <div className="space-y-2">
                  {[
                    { trail: "Hilltop Heritage", views: 214, checkIns: 72, conversion: "34%", revenue: "$3,240" },
                    { trail: "Dog-Friendly", views: 128, checkIns: 38, conversion: "30%", revenue: "$1,710" },
                  ].map(r => (
                    <div key={r.trail} className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-700 font-medium w-24 truncate">{r.trail}</span>
                      <span className="text-gray-400">{r.views} views</span>
                      <span className="text-gray-400">{r.checkIns} visits</span>
                      <span className="text-green-600 font-semibold">{r.conversion}</span>
                      <span className="text-purple-600 font-bold ml-auto">{r.revenue}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 mt-2">Estimated revenue based on avg. $45/visitor spend.</div>
              </div>
            </div>
          )}

          {activeTab === "benchmark" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Competitive Benchmarking</h3>
              <div className="space-y-1">
                {demoLeaderboard.map(w => (
                  <div key={w.rank} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${w.isYou ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${w.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {w.rank}
                    </span>
                    <div className="flex-1">
                      <span className={`text-xs ${w.isYou ? "font-bold text-purple-700" : "text-gray-700"}`}>{w.name}</span>
                      {w.isYou && <span className="text-[9px] ml-1 text-purple-500 font-bold">YOU</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{w.rating}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 w-14 text-right">{w.reviews.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* PRO: Head-to-Head Comparison — fully visible */}
              <div className="bg-white border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-700">Head-to-Head Comparison</div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" /> PRO</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 text-center">
                    <div className="text-[10px] font-bold text-purple-700">Sunset Vine Estate</div>
                    <div className="text-[9px] text-gray-400">You</div>
                  </div>
                  <div className="text-[10px] text-gray-300 font-bold">VS</div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] font-bold text-gray-700">Hilltop Ridge Winery</div>
                    <div className="text-[9px] text-gray-400">#1 in region</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { metric: "Avg Rating", you: "4.7", them: "4.9" },
                    { metric: "Monthly Views", you: "487", them: "1,204" },
                    { metric: "Check-in Rate", you: "29%", them: "34%" },
                    { metric: "Trail Routes", you: "2", them: "3" },
                  ].map(m => (
                    <div key={m.metric} className="flex items-center text-[10px]">
                      <span className="flex-1 text-right font-semibold text-purple-600">{m.you}</span>
                      <span className="w-24 text-center text-gray-400">{m.metric}</span>
                      <span className="flex-1 text-left font-semibold text-gray-600">{m.them}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PRICING SECTION
   ═══════════════════════════════════════════════════════════════════ */

const PricingSection = ({ onGetStarted }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
    <div className="bg-white rounded-2xl border border-gray-200 p-7">
      <div className="text-sm font-bold text-gray-900">Free</div>
      <div className="text-4xl font-bold text-gray-900 mt-2">$0<span className="text-base text-gray-400 font-normal">/mo</span></div>
      <p className="text-sm text-gray-400 mt-2">Perfect for getting started</p>
      <ul className="mt-5 space-y-3">
        {["Overview dashboard with KPI cards", "30-day traffic & check-in trends", "Trail appearance tracking", "Region leaderboard", "Rating breakdown"].map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={onGetStarted} className="w-full mt-6 border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded-xl hover:bg-purple-50 transition">
        Get Started Free
      </button>
    </div>

    <div className="bg-white rounded-2xl border-2 border-purple-400 p-7 relative shadow-lg shadow-purple-100">
      <div className="absolute -top-3 right-6 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
      <div className="text-sm font-bold text-purple-700">Pro</div>
      <div className="text-4xl font-bold text-gray-900 mt-2">$49<span className="text-base text-gray-400 font-normal">/mo</span></div>
      <p className="text-sm text-gray-400 mt-2">Full analytics suite for serious wineries</p>
      <ul className="mt-5 space-y-3">
        {[
          "Everything in Free",
          "Peak hours & staffing insights",
          "Full conversion funnel analysis",
          "Head-to-head competitor comparison",
          "Trail deep analytics & ROI",
          "CSV data export",
          "Featured placement boost on Sip805",
          "Priority support",
        ].map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={onGetStarted} className="w-full mt-6 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition">
        Start 14-Day Free Trial
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function Landing({ onEnterDashboard }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoRef = useRef(null);
  const pricingRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-bold text-gray-900">Sip805</span>
            <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold ml-1">FOR WINERIES</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo(demoRef)} className="text-sm text-gray-500 hover:text-gray-900 transition">Demo</button>
            <button onClick={() => scrollTo(pricingRef)} className="text-sm text-gray-500 hover:text-gray-900 transition">Pricing</button>
            <button onClick={onEnterDashboard} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">Sign In</button>
            <button onClick={onEnterDashboard} className="bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              Get Started Free
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <button onClick={() => scrollTo(demoRef)} className="block text-sm text-gray-600 w-full text-left py-2">Demo</button>
            <button onClick={() => scrollTo(pricingRef)} className="block text-sm text-gray-600 w-full text-left py-2">Pricing</button>
            <button onClick={onEnterDashboard} className="block text-sm text-gray-600 w-full text-left py-2">Sign In</button>
            <button onClick={onEnterDashboard} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg">Get Started Free</button>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> 124 Central Coast wineries listed
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Know your visitors<br />
            <span className="text-purple-600">before they arrive</span>
          </h1>
          <p className="text-lg text-gray-500 mt-5 max-w-2xl mx-auto leading-relaxed">
            Sip805 Winery Dashboard gives you real-time analytics on who's viewing your profile, which trails drive traffic, and how you stack up against nearby wineries.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button onClick={onEnterDashboard} className="w-full sm:w-auto bg-purple-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo(demoRef)} className="w-full sm:w-auto border border-gray-200 text-gray-700 font-medium px-8 py-3.5 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Try the Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-purple-700 to-indigo-800 py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-6">
          <StatBadge value="124" label="Wineries Listed" />
          <StatBadge value="6" label="Curated Wine Trails" />
          <StatBadge value="5" label="Regions Covered" />
          <StatBadge value="Free" label="To Get Started" />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to grow</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Real-time insights to attract more visitors, optimize your tasting room, and outpace the competition.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Eye} title="Visitor Traffic" desc="See daily, weekly, and monthly views of your winery profile on the Sip805 app. Track trends over time." color="bg-purple-50 text-purple-600" />
            <FeatureCard icon={CheckCircle} title="Check-in Analytics" desc="Track how many app visitors actually show up. Measure your profile-to-visit conversion rate." color="bg-blue-50 text-blue-600" />
            <FeatureCard icon={Map} title="Trail Performance" desc="See which wine trails drive traffic to your door and your position on each route." color="bg-green-50 text-green-600" />
            <FeatureCard icon={Award} title="Competitive Benchmarking" desc="See how your ratings, reviews, and traffic compare to other wineries in your region." color="bg-amber-50 text-amber-600" />
            <FeatureCard icon={Clock} title="Peak Hours Analysis" desc="Know your busiest hours and days. Optimize staffing and tasting room capacity." color="bg-red-50 text-red-600" />
            <FeatureCard icon={Target} title="Conversion Funnel" desc="Track the journey from app view to profile click to check-in to rating. Find your drop-off points." color="bg-indigo-50 text-indigo-600" />
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ─────────────────────────────────────── */}
      <section ref={demoRef} className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Play className="w-3.5 h-3.5" /> Interactive Demo
            </div>
            <h2 className="text-3xl font-bold text-gray-900">See it in action</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Click through the tabs to explore what your dashboard will look like. Real data starts flowing the moment you sign up.</p>
          </div>
          <InteractiveDemo />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Get set up in 3 minutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create your account", desc: "Sign up free with your email or Google account. Takes 30 seconds.", icon: Users },
              { step: "2", title: "Claim your winery", desc: "Select your winery from our database of 124 Central Coast wineries.", icon: Wine },
              { step: "3", title: "Watch the data flow", desc: "Your dashboard lights up immediately with visitor insights from the Sip805 app.", icon: BarChart3 },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section ref={pricingRef} className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="text-gray-500 mt-3">Start free. Upgrade when you're ready for deeper insights.</p>
          </div>
          <PricingSection onGetStarted={onEnterDashboard} />
        </div>
      </section>

      {/* ── TESTIMONIAL / SOCIAL PROOF ───────────────────────────── */}
      <section className="py-16 px-4 bg-purple-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
          </div>
          <blockquote className="text-lg text-gray-700 italic leading-relaxed">
            "We finally understand which trails actually drive people to our tasting room. The Sip805 dashboard paid for itself in the first week."
          </blockquote>
          <div className="mt-4">
            <div className="text-sm font-semibold text-gray-900">Winery Owner</div>
            <div className="text-xs text-gray-400">Adelaida District, Paso Robles</div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to grow your tasting room?</h2>
          <p className="text-purple-200 mt-4 text-lg">124 Central Coast wineries already listed on Sip805. Claim yours. Free to start, powerful when you upgrade.</p>
          <button onClick={onEnterDashboard} className="mt-8 bg-white text-purple-700 font-bold px-10 py-4 rounded-xl hover:bg-purple-50 transition text-lg">
            Get Started Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-white">Sip805</span>
            <span className="text-xs text-gray-500">Winery Dashboard</span>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Support</a>
            <a href="https://sip805.com" className="hover:text-white transition">Consumer App</a>
          </div>
          <div className="text-xs">&copy; {new Date().getFullYear()} Sip805. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
