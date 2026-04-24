// ══════════════════════════════════════════════════════════════
// UpgradePage — performance-based pricing
//
// Two products:
//  1. Bring Me Customers (metered)
//     Free forever to list. First 10 attributed first-time visitors
//     are on us. Then $5 per new customer, with an adjustable
//     monthly cap ($50–$2,000; defaults to $200).
//
//  2. Featured Placement (subscription)
//     Bronze $99 / Silver $249 / Gold $499 per month.
//     Boosts position in trails, map, search, home carousel,
//     and unlocks geo-pushes for higher tiers.
//
// Legacy Pro/Enterprise owners are grandfathered into the
// analytics set they already had and see an explanation banner.
// ══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Crown, Check, Users, Zap, MapPin, Shield, Info, Sparkles,
} from "lucide-react";
import { hasPro, tierLabel } from "../lib/tier.js";

const FREE_VISITS = 10;
const PER_VISIT_DOLLARS = 5;
const DEFAULT_CAP_DOLLARS = 200;
const CAP_MIN = 50;
const CAP_MAX = 2000;

const featuredTiers = [
  {
    id: "bronze",
    name: "Bronze",
    price: 99,
    tagline: "Stand out on one trail",
    features: [
      "Featured badge across the app",
      "Recommended slot on 1 trail of your choice",
      "Priority in search results",
      "Featured impression & click analytics",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    price: 249,
    popular: true,
    tagline: "Where most paying wineries land",
    features: [
      "Everything in Bronze",
      "Top-of-trail placement on up to 3 trails",
      "1 geo-push per month (users near Paso)",
      "Home screen carousel rotation",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 499,
    tagline: "Dominate the region",
    features: [
      "Everything in Silver",
      "Top-of-trail on every trail you appear on",
      "Enhanced map pin (larger, distinct color)",
      "2 geo-pushes per month",
      "Home screen carousel priority",
      "Event spotlight for your announcements",
    ],
  },
];

const attributionRules = [
  { icon: Check,  text: "A verified on-site check-in — not just a click or a view" },
  { icon: Users,  text: "Their first-ever visit to your winery through Sip805" },
  { icon: MapPin, text: "They opened your profile in our app within 7 days of showing up" },
  { icon: Shield, text: "Dispute any charge within 14 days — we review and refund if it doesn't hold up" },
];

export default function UpgradePage({ winery, tier }) {
  // Read the winery's billing state. These fields may not exist on legacy
  // docs — missing values mean "still in the free trial, no card on file."
  const billing = winery?.billing || {};
  const billingEnabled    = !!billing.enabled;
  const freeRemaining     = Math.max(0, billing.freeVisitsRemaining ?? FREE_VISITS);
  const freeUsed          = Math.max(0, FREE_VISITS - freeRemaining);
  const capDollars        = billing.monthlyCap ?? DEFAULT_CAP_DOLLARS;
  const spentDollars      = billing.currentMonthSpend ?? 0;
  const currentFeatured   = winery?.featured?.tier || "none";
  const isLegacyPro       = hasPro(tier);

  // Stripe integration lives in a follow-up PR — these CTAs open a simple
  // "contact us to activate" modal in the meantime.
  const [modal, setModal] = useState(null);
  const openTurnOn   = () => setModal({ kind: "turnOn" });
  const openFeatured = (tierId) => setModal({ kind: "featured", tierId });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Free to list. Pay only when we bring you new customers.
        </p>
      </div>

      {isLegacyPro && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-900">
              You're on {tierLabel(tier)} — grandfathered
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              You keep every insight and feature you already had. We're rolling out a new performance-based pricing model below — no action needed from you right now.
            </p>
          </div>
        </div>
      )}

      {/* ── Headline product: metered attribution ─────────────── */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-rose-50 border border-purple-200 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-3 right-4">
          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            How you pay
          </span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bring Me Customers</h3>
            <p className="text-sm text-gray-500 mt-0.5">Pay per verified first-time visitor we send you.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 p-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">${PER_VISIT_DOLLARS}</span>
            <span className="text-sm text-gray-500">per new customer</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Zap className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              Your first {FREE_VISITS} new customers are on us
            </span>
          </div>
        </div>

        {billingEnabled ? (
          <div className="bg-white rounded-xl border border-purple-100 p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">This month</span>
              <span className="text-[11px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">${spentDollars}</div>
                <div className="text-xs text-gray-400">of ${capDollars} cap</div>
              </div>
              <button onClick={openTurnOn} className="text-xs font-semibold text-purple-600 hover:text-purple-700">
                Adjust cap →
              </button>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (spentDollars / Math.max(1, capDollars)) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-purple-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your free trial</span>
              <span className="text-[11px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                {freeRemaining} free left
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all"
                style={{ width: `${(freeUsed / FREE_VISITS) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {freeUsed === 0
                ? "We haven't sent you any new customers yet. When we do, you'll see them here."
                : `${freeUsed} of ${FREE_VISITS} free customers delivered so far.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {attributionRules.map(({ icon: Icon, text }) => (
            <div key={text} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-700 leading-relaxed">{text}</span>
            </div>
          ))}
        </div>

        {!billingEnabled && (
          <button
            onClick={openTurnOn}
            className="w-full bg-gradient-to-r from-purple-600 to-rose-500 text-white font-semibold py-3 rounded-xl hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Turn on attribution billing
          </button>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-3">
          Default monthly cap: ${DEFAULT_CAP_DOLLARS} (adjustable ${CAP_MIN}–${CAP_MAX.toLocaleString()}). Cancel anytime.
        </p>
      </div>

      {/* ── Featured Placement tiers ──────────────────────────── */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-900">Featured Placement</h3>
          <p className="text-xs text-gray-400 mt-0.5">Be seen first in the app. Monthly subscription, cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {featuredTiers.map(t => {
            const isCurrent = currentFeatured === t.id;
            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-4 bg-white flex flex-col ${t.popular ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-100"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                  {t.popular && (
                    <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">{t.tagline}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-gray-900">${t.price}</span>
                  <span className="text-xs text-gray-400">/mo</span>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-1.5 items-start">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[12px] text-gray-700 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full text-center text-xs font-semibold text-green-700 bg-green-50 py-2 rounded-lg">
                    Your current plan
                  </div>
                ) : (
                  <button
                    onClick={() => openFeatured(t.id)}
                    className={`w-full text-xs font-semibold py-2 rounded-lg transition ${
                      t.popular
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Choose {t.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── What's always free ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Free for every winery, forever</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
          {[
            "Your profile in the app",
            "The full dashboard",
            "Traffic & check-in analytics",
            "Leads inbox",
            "Reservations",
            "Wine menu publishing",
          ].map(x => (
            <div key={x} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span>{x}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 flex items-start gap-1.5">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>Benchmark insights (how you compare to other wineries in your region) unlock automatically once you turn on attribution billing.</span>
        </p>
      </div>

      {/* ── Placeholder modals — replace with Stripe flows ────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {modal.kind === "featured"
                ? `Featured ${modal.tierId[0].toUpperCase() + modal.tierId.slice(1)} — coming soon`
                : "Billing — coming soon"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Stripe billing is being wired up. For early access email{" "}
              <a href="mailto:anthony@wargamingintel.com" className="text-purple-600 font-semibold">
                anthony@wargamingintel.com
              </a>{" "}
              and we'll activate {modal.kind === "featured" ? "the featured tier" : "attribution billing"} on your account manually.
            </p>
            <button
              onClick={() => setModal(null)}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-2 rounded-xl hover:bg-gray-200 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
