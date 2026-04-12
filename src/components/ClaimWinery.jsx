// ══════════════════════════════════════════════════════════════
// ClaimWinery — Searchable winery selector + claim submission
//
// Shown after auth when no approved owner profile exists and
// no pending claim exists. Owner cannot access the dashboard
// until an admin approves the claim from the admin app.
// ══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Wine, Star, CheckCircle, LogOut, X } from "lucide-react";
import { WINERIES } from "../data/wineries.js";
import { submitClaim, logOut } from "../firebaseClient.js";

export default function ClaimWinery({ user }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = WINERIES.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await submitClaim(user.uid, user.email, selected.id, selected.name);
      setSubmitted(true);
    } catch (e) {
      alert("Error submitting claim: " + e.message);
    }
    setSubmitting(false);
  };

  // ── Success state ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Claim Submitted</h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Your claim for <span className="font-semibold text-gray-700">{selected.name}</span> has been submitted for review.
          </p>
          <p className="text-xs text-gray-400 mt-2">You'll get dashboard access once approved.</p>
          <p className="text-xs text-gray-400 mt-1">This usually takes less than 24 hours.</p>
          <button onClick={logOut} className="mt-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mx-auto">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── Confirm step ───────────────────────────────────────────
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 bg-gradient-to-br from-purple-900 to-purple-600 flex items-center justify-center">
              <Wine className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Claim {selected.name}?</h2>
            <p className="text-sm text-gray-400 mt-1">{selected.region} · {selected.price}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              By claiming this winery, you're confirming you own or manage <span className="font-semibold">{selected.name}</span>.
              Your request will be reviewed before dashboard access is granted.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelected(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">Back</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Winery list ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <Wine className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900">Claim Your Winery</h2>
            <p className="text-sm text-gray-400 mt-1">Select the winery you own or manage</p>
          </div>
        </div>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none mb-4"
          placeholder="Search wineries..."
        />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.map(w => (
            <button key={w.id} onClick={() => setSelected(w)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-left transition">
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
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No wineries match your search.</div>
          )}
        </div>
        <button onClick={logOut} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 mx-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
