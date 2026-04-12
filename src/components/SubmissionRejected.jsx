// ==============================================================
// SubmissionRejected — Shown when winerySubmissions/{uid}.status
// is "rejected" or "needs_more_info".
//
// "needs_more_info" gets softer messaging with CTA to edit/resubmit.
// "rejected" explains the rejection with retry option.
// ==============================================================

import { XCircle, AlertTriangle, LogOut, Mail, RefreshCw, Pencil } from "lucide-react";
import { logOut } from "../firebaseClient.js";

export default function SubmissionRejected({ submission, onRetry }) {
  const needsInfo = submission?.status === "needs_more_info";
  const reason = submission?.reviewNotes || null;
  const wineryName = submission?.wineryName || "your winery";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${needsInfo ? "bg-amber-50" : "bg-red-50"}`}>
          {needsInfo
            ? <AlertTriangle className="w-8 h-8 text-amber-500" />
            : <XCircle className="w-8 h-8 text-red-500" />
          }
        </div>

        <h2 className="text-xl font-bold text-gray-900">
          {needsInfo ? "More Info Needed" : "Submission Not Approved"}
        </h2>

        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          {needsInfo
            ? <>Our team needs a bit more information about <span className="font-semibold">{wineryName}</span> before we can add it to Sip805.</>
            : <>Your submission for <span className="font-semibold">{wineryName}</span> was not approved.</>
          }
        </p>

        {reason && (
          <div className={`rounded-xl p-4 mt-4 text-left ${needsInfo ? "bg-amber-50" : "bg-red-50"}`}>
            <p className={`text-xs font-semibold mb-1 ${needsInfo ? "text-amber-700" : "text-red-700"}`}>
              {needsInfo ? "What we need" : "Reason"}
            </p>
            <p className={`text-sm leading-relaxed ${needsInfo ? "text-amber-600" : "text-red-600"}`}>{reason}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            {needsInfo
              ? <><Pencil className="w-4 h-4" /> Edit &amp; Resubmit</>
              : <><RefreshCw className="w-4 h-4" /> Try Again</>
            }
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mt-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            {needsInfo
              ? "Need help? Reach out to us:"
              : "If you believe this was an error, reach out to us:"
            }
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
