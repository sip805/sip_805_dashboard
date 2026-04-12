// ==============================================================
// AddWinery — New winery submission form (Path B)
//
// For owners whose winery is NOT in the Sip805 list.
// Includes:
//   - Required field validation
//   - Duplicate winery detection against WINERIES dataset
//   - canSubmitWinerySubmission() guard to prevent double-submit
//   - Enriched record shape for admin review
//
// Submits to Firestore "winerySubmissions" collection.
// Admin reviews in the separate admin app — nothing auto-publishes.
// ==============================================================

import { useState } from "react";
import { Wine, ArrowLeft, CheckCircle, LogOut, AlertCircle, AlertTriangle } from "lucide-react";
import { WINERIES } from "../data/wineries.js";
import { submitWinerySubmission, canSubmitWinerySubmission, logOut } from "../firebaseClient.js";
import { findPotentialWineryDuplicates } from "../utils/duplicateDetection.js";

const REGIONS = [
  "Adelaida District",
  "Willow Creek",
  "Templeton Gap",
  "West Paso Robles",
  "East Paso Robles",
  "Downtown Paso Robles",
  "Tin City",
  "Edna Valley",
  "Arroyo Grande",
  "San Luis Obispo",
  "Santa Ynez Valley",
  "Santa Maria Valley",
  "Sta. Rita Hills",
  "Los Olivos",
  "Other",
];

const PHONE_RE = /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const URL_RE = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}/;

function validate(f) {
  const e = {};
  if (!f.wineryName.trim()) e.wineryName = "Winery name is required.";
  if (!f.region) e.region = "Select a region.";
  if (!f.address.trim()) e.address = "Address is required.";
  if (f.phone && !PHONE_RE.test(f.phone.trim())) e.phone = "Enter a valid phone number.";
  if (f.website && !URL_RE.test(f.website.trim())) e.website = "Enter a valid website (e.g. yourwinery.com).";
  if (!f.contactName.trim()) e.contactName = "Contact name is required.";
  if (!f.contactEmail.trim()) e.contactEmail = "Contact email is required.";
  return e;
}

export default function AddWinery({ user, onBack, onSubmitted, onClaimExisting }) {
  const [form, setForm] = useState({
    wineryName: "",
    region: "",
    address: "",
    website: "",
    phone: "",
    contactName: user?.displayName || "",
    contactEmail: user?.email || "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [dupOverridden, setDupOverridden] = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    // Reset duplicate override if they change the name or website
    if (key === "wineryName" || key === "website") {
      setDupOverridden(false);
      setShowDuplicateWarning(false);
    }
  };

  const handleSubmit = async () => {
    setGlobalError("");

    // 1. Validate required fields
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // 2. Duplicate detection (only on first attempt, not after override)
    if (!dupOverridden) {
      const dupes = findPotentialWineryDuplicates(form, WINERIES);
      if (dupes.length > 0) {
        setDuplicates(dupes);
        setShowDuplicateWarning(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 3. Guard: prevent duplicate active onboarding
      const check = await canSubmitWinerySubmission(user.uid);
      if (!check.allowed) {
        setGlobalError(check.reason);
        setSubmitting(false);
        return;
      }

      // 4. Submit with enriched shape
      await submitWinerySubmission(user.uid, user.email, {
        wineryName: form.wineryName.trim(),
        region: form.region,
        address: form.address.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        notes: form.notes.trim(),
      });

      if (onSubmitted) onSubmitted({ wineryName: form.wineryName.trim() });
    } catch (e) {
      setGlobalError("Error submitting: " + e.message);
    }
    setSubmitting(false);
  };

  const handleSubmitAnyway = () => {
    setDupOverridden(true);
    setShowDuplicateWarning(false);
    // Immediately submit since user explicitly chose to continue
    setTimeout(() => handleSubmit(), 0);
  };

  // ── Duplicate warning overlay ──────────────────────────────
  if (showDuplicateWarning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Possible Match Found</h2>
              <p className="text-xs text-gray-400">We found wineries that may already match your submission.</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {duplicates.map(d => (
              <div key={d.winery.id} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{d.winery.name}</div>
                    <div className="text-xs text-gray-500">{d.winery.region} &middot; {d.winery.price}</div>
                  </div>
                  <button
                    onClick={() => onClaimExisting && onClaimExisting(d.winery)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition"
                  >
                    Claim This
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.reasons.map((r, i) => (
                    <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDuplicateWarning(false)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Edit Submission
            </button>
            <button
              onClick={handleSubmitAnyway}
              className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  const Field = ({ label, field, required, placeholder, type = "text", component }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {component || (
        <input
          type={type}
          value={form[field]}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition ${
            errors[field] ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300" : "border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
          }`}
        />
      )}
      {errors[field] && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Your Winery</h2>
            <p className="text-xs text-gray-400">Tell us about your winery so we can add it to Sip805</p>
          </div>
        </div>

        {globalError && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Winery Name" field="wineryName" required placeholder="e.g. Silver Oak Cellars" />

          <Field label="Region" field="region" required component={
            <select
              value={form.region}
              onChange={e => set("region", e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition ${
                errors.region ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300" : "border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              } ${!form.region ? "text-gray-400" : "text-gray-900"}`}
            >
              <option value="">Select region...</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          } />

          <Field label="Address" field="address" required placeholder="123 Vineyard Lane, Paso Robles, CA" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Website" field="website" placeholder="yourwinery.com" />
            <Field label="Phone" field="phone" placeholder="(805) 555-1234" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name" field="contactName" required placeholder="Jane Smith" />
            <Field label="Your Email" field="contactEmail" required placeholder="jane@yourwinery.com" type="email" />
          </div>

          <Field label="Notes" field="notes" component={
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Anything else we should know? (optional)"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition resize-none"
            />
          } />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
            Back
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>

        <button onClick={logOut} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 mx-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
