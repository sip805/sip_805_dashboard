// ══════════════════════════════════════════════════════════════
// UpgradePage — Free → Pro comparison + upgrade CTA
//
// Shown inside the dashboard for free-tier owners.
// Pro-tier owners see a "You're on Pro" confirmation instead.
// ══════════════════════════════════════════════════════════════

import { Crown, Check, X, Zap, TrendingUp, Target, Map, BarChart3, Eye } from "lucide-react";
import { hasPro, tierLabel } from "../lib/tier.js";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything you need to get started",
    features: [
      { label: "Basic traffic overview", included: true },
      { label: "Trail appearances", included: true },
      { label: "Region leaderboard", included: true },
      { label: "Profile editing", included: true },
      { label: "Peak hours analysis", included: false },
      { label: "Conversion funnel", included: false },
      { label: "Head-to-head comparison", included: false },
      { label: "Trail traffic comparison", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "Unlock every insight to grow your tasting room",
    features: [
      { label: "Basic traffic overview", included: true },
      { label: "Trail appearances", included: true },
      { label: "Region leaderboard", included: true },
      { label: "Profile editing", included: true },
      { label: "Peak hours analysis", included: true },
      { label: "Conversion funnel", included: true },
      { label: "Head-to-head comparison", included: true },
      { label: "Trail traffic comparison", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

const highlights = [
  { icon: Eye, title: "Peak Hours", desc: "Know exactly when visitors arrive so you can staff smarter." },
  { icon: Target, title: "Conversion Funnel", desc: "See how app views turn into check-ins and ratings." },
  { icon: BarChart3, title: "Competitor Comparison", desc: "Compare traffic, ratings, and trends vs. any rival." },
  { icon: Map, title: "Trail Deep-Dive", desc: "Which trails actually drive people to your door." },
];

export default function UpgradePage({ winery, tier }) {
  // Pro and Enterprise both mean "nothing to upgrade to" here — show the
  // current-plan confirmation card instead of the comparison table.
  if (hasPro(tier)) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Plan</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your subscription</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">You're on the {tierLabel(tier)}</h3>
          <p className="text-sm text-gray-500 mt-1">All premium features are unlocked for {winery.name}.</p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5" /> Active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upgrade to Pro</h2>
        <p className="text-xs text-gray-400 mt-0.5">Unlock every insight to grow your tasting room</p>
      </div>

      {/* Plan comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className={`rounded-2xl border p-5 ${plan.id === "pro" ? "border-purple-300 bg-purple-50/50 ring-1 ring-purple-200" : "border-gray-100 bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-base font-bold ${plan.id === "pro" ? "text-purple-700" : "text-gray-900"}`}>{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.desc}</p>
              </div>
              {plan.id === "pro" && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className={`text-3xl font-bold ${plan.id === "pro" ? "text-purple-700" : "text-gray-900"}`}>{plan.price}</span>
              <span className="text-sm text-gray-400">{plan.period}</span>
            </div>
            <div className="space-y-2">
              {plan.features.map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  {f.included ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${f.included ? "text-gray-700" : "text-gray-400"}`}>{f.label}</span>
                </div>
              ))}
            </div>
            {plan.id === "pro" ? (
              <button className="w-full mt-5 bg-purple-600 text-white font-semibold py-2.5 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm">
                <Crown className="w-4 h-4" /> Upgrade Now — $29/mo
              </button>
            ) : (
              <div className="w-full mt-5 text-center text-sm text-gray-400 py-2.5">Current Plan</div>
            )}
          </div>
        ))}
      </div>

      {/* Pro highlights */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">What you unlock with Pro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map(h => (
            <div key={h.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <h.icon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{h.title}</div>
                <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
