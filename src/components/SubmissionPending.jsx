// ==============================================================
// SubmissionPending — Holding screen for new winery submissions
//
// Shown when winerySubmissions/{uid}.status === "pending".
// Uses blue accent to visually distinguish from the amber
// ClaimPending screen (which is for existing-winery claims).
// ==============================================================

import { Clock, LogOut, Mail } from "lucide-react";
import { logOut } from "../firebaseClient.js";

export default function SubmissionPending({ submission }) {
  const wineryName = submission?.wineryName || "your winery";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Submission Under Review</h2>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Your new winery submission for <span className="font-semibold">{wineryName}</span> is being reviewed by our team.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          We'll add your winery to the Sip805 platform and grant you dashboard access once approved.
        </p>
        <p className="text-xs text-gray-400 mt-1">New winery reviews usually take 1–3 business days.</p>

        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            Questions or need to update your submission? Reach out to us:
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
