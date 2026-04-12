// ══════════════════════════════════════════════════════════════
// ProfileSettings — Edit approved owner fields from wineryProfiles
//
// Only editable fields are exposed (desc, phone, hours, website,
// dogFriendly, tags). Locked/core winery fields (name, region,
// price, rating, reviews) are shown read-only.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Save, CheckCircle, X, Dog, Upload } from "lucide-react";
import { getProfileEdits, saveProfileEdits, uploadPhoto } from "../firebaseClient.js";

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

  const handleChange = (field, value) => {
    setEdits(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
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
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Hours</label>
            <input type="text" value={display.hours || ""} onChange={e => handleChange("hours", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
              placeholder="Daily 10 AM - 5 PM" />
            {errors.hours && <span className="text-xs text-red-500 mt-0.5 block">{errors.hours}</span>}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Attributes</h3>
        <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${display.dogFriendly ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => handleChange("dogFriendly", !display.dogFriendly)}>
          <Dog className="w-4 h-4" /> Dog Friendly
        </button>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags (up to 3)</h3>
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
