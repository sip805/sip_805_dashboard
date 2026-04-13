// ==============================================================
// ClaimWinery — Searchable winery selector + claim submission
//
// MIGRATION: Now receives wineries as a prop from App.jsx,
// which loads them from Firestore instead of the static array.
// The static WINERIES import is removed.
// ==============================================================

import { useState } from "react";
import { Wine, Star, LogOut, PlusCircle, AlertCircle } from "lucide-react";
import { submitClaim, canSubmitClaim, logOut } from "../firebaseClient.js";

export default function ClaimWinery({ user, wineries, onAddWinery, onClaimSubmitted }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Search against Firestore-loaded wineries (passed as prop)
  const filtered = (wineries || []).filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.region || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const check = await canSubmitClaim(user.uid);
      if (!check.allowed) {
        setError(check.reason);
        setSubmitting(false);
        return;
      }

      await submitClaim(user.uid, user.email, selected.id, selected.name);
      if (onClaimSubmitted) onClaimSubmitted({ wineryName: selected.name });
    } catch (e) {
      setError("Error submitting claim: " + e.message);
      setSubmitting(false);
    }
  };

  // -- Confirm step -------------------------------------------
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 bg-gradient-to-br from-purple-900 to-purple-600 flex items-center justify-center">
              <Wine className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Claim {selected.name}?</h2>
            <p className="text-sm text-gray-400 mt-1">{selected.region} &middot; {selected.price}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              By claiming this winery, you're confirming you own or manage <span className="font-semibold">{selected.name}</span>.
              Your request will be reviewed before dashboard access is granted.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setSelected(null); setError(""); }} className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">Back</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- Winery list --------------------------------------------
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
                <div className="text-xs text-gray-400">{w.region} &middot; {w.price}</div>
              </div>
              {w.rating > 0 && (
                <>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-gray-600">{w.rating}</span>
                </>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No wineries match your search.</div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-2">Can't find your winery?</p>
          <button onClick={onAddWinery}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition">
            <PlusCircle className="w-4 h-4" /> Add My Winery
          </button>
        </div>

        <button onClick={logOut} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 mx-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
