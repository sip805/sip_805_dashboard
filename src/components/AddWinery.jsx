// ══════════════════════════════════════════════════════════════
// AddWinery — New winery submission form
//
// PATH B of the two-path onboarding flow.
// For owners whose winery is NOT already in the Sip805 list.
//
// Submits to Firestore "winerySubmissions" collection.
// Admin reviews in the separate admin app, creates the winery
// entry, then approves ownership — nothing auto-publishes.
// ══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Wine, ArrowLeft, CheckCircle, LogOut, AlertCircle } from "lucide-react";
import { submitWinerySubmission, logOut } from "../firebaseClient.js";

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

export default function AddWinery({ user, onBack, onSubmitted }) {
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
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
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
      setSubmitted(true);
      if (onSubmitted) onSubmitted({ wineryName: form.wineryName.trim() });
    } catch (e) {
      alert("Error submitting: " + e.message);
    }
    setSubmitting(false);
  };

  // ── Success ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Winery Submitted</h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Your submission for <span className="font-semibold text-gray-700">{form.wineryName}</span> is under review.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Our team will add your winery to Sip805 and grant you dashboard access once approved.
          </p>
          <p className="text-xs text-gray-400 mt-1">This usually takes 1–3 business days.</p>
          <button onClick={logOut} className="mt-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mx-auto">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
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
