// ══════════════════════════════════════════════════════════════
// ProfileSettings — Edit approved owner fields from wineryProfiles
//
// Only editable fields are exposed (desc, phone, hours, website,
// attributes, tags). Locked/core winery fields (name, region,
// price, rating, reviews) are shown read-only.
//
// Attributes: owners pick from a canonical catalog (grouped by
// category). Owners cannot create new attribute keys — the catalog
// is fixed so consumer-side filtering stays consistent.
//
// Hours: supports a structured per-day schedule with optional
// back-compat to a legacy single-string hours value.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  Save, CheckCircle, X, Upload, Dog, Baby, Accessibility, UtensilsCrossed,
  Trees, Sun, Home, Flame, Music, CalendarDays, BedDouble, ShoppingBag, Zap,
  Wine, Compass, Grape, Users, Heart, Mountain, Waves, Building2, Sparkles,
  Leaf, Clock, CalendarCheck, DoorOpen
} from "lucide-react";
import { getProfileEdits, saveProfileEdits, uploadPhoto } from "../firebaseClient.js";

// -------------------------------------------------------------
// Canonical attribute catalog. Keys are stable identifiers saved
// to Firestore — DO NOT rename without a migration. Labels are
// what the owner and consumer both see.
// -------------------------------------------------------------
const ATTRIBUTE_CATALOG = [
  {
    group: "Amenities",
    items: [
      { key: "dog_friendly", label: "Dog Friendly", icon: Dog },
      { key: "kid_friendly", label: "Kid Friendly", icon: Baby },
      { key: "accessible", label: "Wheelchair Accessible", icon: Accessibility },
      { key: "restaurant", label: "On-site Restaurant", icon: UtensilsCrossed },
      { key: "picnic", label: "Picnic Area", icon: Trees },
      { key: "outdoor_seating", label: "Outdoor Seating", icon: Sun },
      { key: "indoor_tasting", label: "Indoor Tasting", icon: Home },
      { key: "fireplace", label: "Fireplace", icon: Flame },
      { key: "live_music", label: "Live Music", icon: Music },
      { key: "event_space", label: "Event Space", icon: CalendarDays },
      { key: "lodging", label: "Lodging", icon: BedDouble },
      { key: "gift_shop", label: "Gift Shop", icon: ShoppingBag },
      { key: "ev_charging", label: "EV Charging", icon: Zap },
    ],
  },
  {
    group: "Experiences",
    items: [
      { key: "tastings", label: "Tastings", icon: Wine },
      { key: "tours", label: "Tours", icon: Compass },
      { key: "food_pairings", label: "Food Pairings", icon: UtensilsCrossed },
      { key: "barrel_tastings", label: "Barrel Tastings", icon: Wine },
      { key: "blending_sessions", label: "Blending Sessions", icon: Grape },
      { key: "winemaker_visits", label: "Winemaker Visits", icon: Users },
      { key: "private_events", label: "Private Events", icon: CalendarDays },
      { key: "weddings", label: "Weddings", icon: Heart },
      { key: "cave_tours", label: "Cave Tours", icon: Mountain },
      { key: "vineyard_walks", label: "Vineyard Walks", icon: Trees },
    ],
  },
  {
    group: "Vibe",
    items: [
      { key: "romantic", label: "Romantic", icon: Heart },
      { key: "family", label: "Family-Friendly", icon: Baby },
      { key: "group", label: "Group Friendly", icon: Users },
      { key: "quiet", label: "Quiet", icon: Leaf },
      { key: "lively", label: "Lively", icon: Sparkles },
      { key: "historic", label: "Historic", icon: Building2 },
      { key: "modern", label: "Modern", icon: Building2 },
      { key: "rustic", label: "Rustic", icon: Home },
      { key: "views", label: "Scenic Views", icon: Mountain },
      { key: "hilltop", label: "Hilltop", icon: Mountain },
      { key: "waterfront", label: "Waterfront", icon: Waves },
    ],
  },
  {
    group: "Wine Style",
    items: [
      { key: "bordeaux", label: "Bordeaux Blends", icon: Wine },
      { key: "rhone", label: "Rhône Blends", icon: Wine },
      { key: "italian", label: "Italian Varietals", icon: Wine },
      { key: "zinfandel", label: "Zinfandel", icon: Wine },
      { key: "pinot_noir", label: "Pinot Noir", icon: Wine },
      { key: "cabernet", label: "Cabernet Sauvignon", icon: Wine },
      { key: "chardonnay", label: "Chardonnay", icon: Wine },
      { key: "sparkling", label: "Sparkling", icon: Sparkles },
      { key: "rose", label: "Rosé", icon: Wine },
      { key: "dessert", label: "Sweet / Dessert", icon: Wine },
      { key: "organic", label: "Organic", icon: Leaf },
      { key: "biodynamic", label: "Biodynamic", icon: Leaf },
      { key: "sustainable", label: "Sustainable", icon: Leaf },
    ],
  },
  {
    group: "Operations",
    items: [
      { key: "by_appointment", label: "By Appointment", icon: CalendarCheck },
      { key: "walkins", label: "Walk-ins Welcome", icon: DoorOpen },
      { key: "reservations_required", label: "Reservations Required", icon: CalendarCheck },
      { key: "large_groups", label: "Large Groups OK", icon: Users },
      { key: "wine_club", label: "Wine Club Available", icon: Wine },
    ],
  },
];

// -------------------------------------------------------------
// Hours helpers — structured per-day schedule with back-compat.
// Shape: { mon: { open: "10:00", close: "17:00", closed: false }, ... }
// -------------------------------------------------------------
const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const DEFAULT_DAY = { open: "10:00", close: "17:00", closed: false };

function normalizeHours(raw) {
  // If already a structured object, merge with defaults
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out = {};
    for (const d of DAYS) out[d.key] = { ...DEFAULT_DAY, ...(raw[d.key] || {}) };
    return out;
  }
  // Legacy string → apply to every day (owner can refine)
  const base = { ...DEFAULT_DAY };
  const out = {};
  for (const d of DAYS) out[d.key] = { ...base };
  return out;
}

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const hr = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "am" : "pm";
  return m ? `${hr}:${String(m).padStart(2, "0")}${ampm}` : `${hr}${ampm}`;
}

function summarizeHours(hours) {
  const h = normalizeHours(hours);
  const open = DAYS.filter(d => !h[d.key].closed);
  if (!open.length) return "Closed";
  if (open.length === 7) {
    const first = h[open[0].key];
    const same = open.every(d => h[d.key].open === first.open && h[d.key].close === first.close);
    if (same) return `Daily ${formatTime12(first.open)} – ${formatTime12(first.close)}`;
  }
  return open.map(d => `${d.label} ${formatTime12(h[d.key].open)}–${formatTime12(h[d.key].close)}`).join(", ");
}

export default function ProfileSettings({ winery, user, tier }) {
  const [edits, setEdits] = useState({});
  const [existing, setExisting] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState("");

  // Load existing profile overrides on mount
  useEffect(() => {
    getProfileEdits(winery.id).then(data => {
      if (data) setExisting(data);
    });
  }, [winery.id]);

  const display = { ...existing, ...edits };

  // Back-compat: seed attributes from legacy dogFriendly boolean.
  const currentAttributes = (() => {
    const arr = Array.isArray(display.attributes) ? [...display.attributes] : [];
    if (display.dogFriendly && !arr.includes("dog_friendly")) arr.push("dog_friendly");
    return arr;
  })();

  const hoursStruct = normalizeHours(display.hours);

  const handleChange = (field, value) => {
    setEdits(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleAttribute = (key) => {
    const next = currentAttributes.includes(key)
      ? currentAttributes.filter(k => k !== key)
      : [...currentAttributes, key];
    handleChange("attributes", next);
    // Keep legacy dogFriendly in sync so older consumer code still works.
    if (key === "dog_friendly") handleChange("dogFriendly", next.includes("dog_friendly"));
  };

  const updateDayHours = (dayKey, patch) => {
    const next = { ...hoursStruct, [dayKey]: { ...hoursStruct[dayKey], ...patch } };
    handleChange("hours", next);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    try {
      const result = await saveProfileEdits(winery.id, edits, user.uid);
      if (result.success) {
        setSaved(true);
        setExisting(prev => ({ ...prev, ...edits }));
        setEdits({});
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrors(result.errors);
      }
    } catch (e) {
      setErrors({ general: e.message });
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadPhoto(winery.id, file);
      if (!result.success) setErrors({ photo: result.error });
    } catch (e) {
      setErrors({ photo: e.message });
    }
  };

  const addTag = () => {
    if (!newTag.trim() || (display.tags || []).length >= 3) return;
    handleChange("tags", [...(display.tags || []), newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (idx) => {
    handleChange("tags", (display.tags || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Customize your winery listing on Sip805</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" /> Changes saved and published to Sip805.
        </div>
      )}

      {errors.general && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.general}</div>
      )}

      {/* Locked fields — read only */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Core Details (managed by Sip805)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[["Name", winery.name], ["Region", winery.region], ["Price", winery.price], ["Rating", winery.rating]].map(([l, v]) => (
            <div key={l}>
              <label className="text-[10px] text-gray-400 block mb-0.5">{l}</label>
              <div className="text-sm font-medium text-gray-600">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <label className="text-sm font-semibold text-gray-900 block mb-2">Description</label>
        <textarea
          value={display.desc || ""} onChange={e => handleChange("desc", e.target.value)}
          rows={4} maxLength={500}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none"
          placeholder="Tell visitors about your winery..."
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-red-500">{errors.desc || ""}</span>
          <span className="text-xs text-gray-400">{(display.desc || "").length}/500</span>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
            <input type="text" value={display.phone || ""} onChange={e => handleChange("phone", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
              placeholder="(XXX) XXX-XXXX" />
            {errors.phone && <span className="text-xs text-red-500 mt-0.5 block">{errors.phone}</span>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Website</label>
            <input type="text" value={display.website || ""} onChange={e => handleChange("website", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
              placeholder="yourwinery.com" />
            {errors.website && <span className="text-xs text-red-500 mt-0.5 block">{errors.website}</span>}
          </div>
        </div>
      </div>

      {/* Hours — per-day schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Hours</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Set different hours for each day. Visitors see: <span className="text-gray-600 font-medium">{summarizeHours(hoursStruct)}</span>
        </p>
        <div className="space-y-2">
          {DAYS.map(d => {
            const day = hoursStruct[d.key];
            return (
              <div key={d.key} className="flex items-center gap-2">
                <div className="w-12 text-xs font-semibold text-gray-700">{d.label}</div>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={!day.closed}
                    onChange={e => updateDayHours(d.key, { closed: !e.target.checked })}
                    className="w-3.5 h-3.5 accent-purple-600" />
                  Open
                </label>
                <input type="time" value={day.open} disabled={day.closed}
                  onChange={e => updateDayHours(d.key, { open: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none disabled:bg-gray-50 disabled:text-gray-400" />
                <span className="text-xs text-gray-400">–</span>
                <input type="time" value={day.close} disabled={day.closed}
                  onChange={e => updateDayHours(d.key, { close: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button"
            onClick={() => {
              const first = hoursStruct.mon;
              const next = {};
              for (const d of DAYS) next[d.key] = { ...first };
              handleChange("hours", next);
            }}
            className="text-xs text-purple-600 font-medium hover:underline">
            Copy Monday to all days
          </button>
        </div>
        {errors.hours && <span className="text-xs text-red-500 mt-2 block">{errors.hours}</span>}
      </div>

      {/* Attributes — canonical picker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Attributes</h3>
        <p className="text-xs text-gray-400 mb-4">Select any that apply. These help visitors filter and discover your winery.</p>
        <div className="space-y-5">
          {ATTRIBUTE_CATALOG.map(section => (
            <div key={section.group}>
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.group}</h4>
              <div className="flex flex-wrap gap-2">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = currentAttributes.includes(item.key);
                  return (
                    <button key={item.key} type="button" onClick={() => toggleAttribute(item.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        active
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {currentAttributes.length > 0 && (
          <p className="text-xs text-gray-400 mt-4">{currentAttributes.length} selected</p>
        )}
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Tags (up to 3)</h3>
        <p className="text-xs text-gray-400 mb-3">Short custom keywords that show on your card (e.g. "Estate Grown").</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(display.tags || []).map((tag, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
              {tag} <button onClick={() => removeTag(i)} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        {(display.tags || []).length < 3 && (
          <div className="flex gap-2">
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-400"
              placeholder="Add a tag..." maxLength={25} />
            <button onClick={addTag} className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition">Add</button>
          </div>
        )}
        {errors.tags && <span className="text-xs text-red-500 mt-1 block">{errors.tags}</span>}
      </div>

      {/* Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Hero Photo</h3>
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 transition">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Upload image (JPG, PNG, WebP — min 400x300, max 5 MB)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
        </label>
        {errors.photo && <span className="text-xs text-red-500 mt-1 block">{errors.photo}</span>}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || Object.keys(edits).length === 0}
        className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
