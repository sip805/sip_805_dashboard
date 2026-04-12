// ==============================================================
// ClaimRejected — Shown when wineryClaims/{uid}.status === "rejected"
//
// Explains the rejection, shows reason if available,
// and offers CTA to retry or contact support.
// ==============================================================

import { XCircle, LogOut, Mail, RefreshCw } from "lucide-react";
import { logOut } from "../firebaseClient.js";

export default function ClaimRejected({ claim, onRetry }) {
  const reason = claim?.rejectionReason || claim?.reviewNotes || null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Claim Not Approved</h2>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Your claim for <span className="font-semibold">{claim?.wineryName || "the winery"}</span> was not approved.
        </p>

        {reason && (
          <div className="bg-red-50 rounded-xl p-4 mt-4 text-left">
            <p className="text-xs font-semibold text-red-700 mb-1">Reason</p>
            <p className="text-sm text-red-600 leading-relaxed">{reason}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mt-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            If you believe this was an error, reach out to us:
          </p>
          <a href="mailto:support@sip805.com" className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium mt-2 hover:underline">
            <Mail className="w-4 h-4" /> support@sip805.com
          </a>
        </div>

        <button onClick={logOut}
          className="mt-5 flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-gray-700 transition">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
