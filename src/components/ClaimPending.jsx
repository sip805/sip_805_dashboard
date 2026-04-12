// ══════════════════════════════════════════════════════════════
// ClaimPending — Holding screen while claim awaits admin approval
//
// Shown when wineryClaims/{uid}.status === "pending".
// The admin app (separate) will approve/reject from their end.
// ══════════════════════════════════════════════════════════════

import { Clock, LogOut, Mail } from "lucide-react";
import { logOut } from "../firebaseClient.js";

export default function ClaimPending({ wineryName }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Claim Under Review</h2>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Your claim for <span className="font-semibold">{wineryName}</span> has been submitted and is being reviewed by our team.
        </p>
        <p className="text-xs text-gray-400 mt-2">You'll get dashboard access once approved.</p>

        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            This usually takes less than 24 hours. If you have questions, reach out to us:
          </p>
          <a href="mailto:support@sip805.com" className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium mt-2 hover:underline">
            <Mail className="w-4 h-4" /> support@sip805.com
          </a>
        </div>

        <button onClick={logOut}
          className="mt-6 flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-gray-700 transition">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
