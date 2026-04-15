// ══════════════════════════════════════════════════════════════
// WineMenuPage — Manage a winery's wine list (form-only, no photos)
//
// Wines are stored in a flat "wineryWines" collection keyed by
// wineryId. Owners add, edit, and delete wines via structured
// fields so the consumer app can filter and sort reliably.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Wine, Pencil, Trash2, X, Save, AlertCircle, Search, ArrowUpDown, CheckCircle
} from "lucide-react";
import { getWineryWines, addWine, updateWine, deleteWine } from "../firebaseClient.js";

const TYPE_OPTIONS = [
  { value: "red", label: "Red" },
  { value: "white", label: "White" },
  { value: "rose", label: "Rosé" },
  { value: "sparkling", label: "Sparkling" },
  { value: "dessert", label: "Dessert" },
  { value: "fortified", label: "Fortified" },
];

const TIER_OPTIONS = [
  { value: "", label: "— None —" },
  { value: "estate", label: "Estate" },
  { value: "reserve", label: "Reserve" },
  { value: "single_vineyard", label: "Single Vineyard" },
  { value: "club", label: "Club Exclusive" },
  { value: "library", label: "Library" },
];

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In Stock", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "sold_out", label: "Sold Out", color: "bg-gray-100 text-gray-500 border-gray-200" },
  { value: "club_only", label: "Club Only", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "coming_soon", label: "Coming Soon", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const BOTTLE_SIZES = ["375ml", "750ml", "1.5L (Magnum)", "3L"];

const BLANK_WINE = {
  name: "", varietal: "", type: "red",
  vintage: new Date().getFullYear() - 2,
  abv: 14, price: 0,
  bottleSize: "750ml",
  description: "",
  appellation: "", aging: "",
  pairings: [],
  bottlesProduced: "",
  tier: "", availability: "in_stock",
  awards: "", sweetness: "",
  sortOrder: 100,
};

function availabilityBadge(value) {
  return AVAILABILITY_OPTIONS.find(o => o.value === value) || AVAILABILITY_OPTIONS[0];
}

function typeLabel(value) {
  return TYPE_OPTIONS.find(o => o.value === value)?.label || value;
}

function tierLabel(value) {
  return TIER_OPTIONS.find(o => o.value === value)?.label || "";
}

export default function WineMenuPage({ winery, user }) {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [savedToast, setSavedToast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await getWineryWines(winery.id);
      setWines(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [winery.id]);

  const visibleWines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wines.filter(w => {
      if (filterType !== "all" && w.type !== filterType) return false;
      if (!q) return true;
      return (
        (w.name || "").toLowerCase().includes(q) ||
        (w.varietal || "").toLowerCase().includes(q) ||
        (w.appellation || "").toLowerCase().includes(q)
      );
    });
  }, [wines, search, filterType]);

  const handleOpenAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (wine) => {
    setEditing(wine);
    setFormOpen(true);
  };

  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
    await reload();
  };

  const handleDelete = async (wine) => {
    await deleteWine(wine.id);
    setDeleteConfirm(null);
    await reload();
  };

  const counts = useMemo(() => {
    const out = { all: wines.length };
    for (const t of TYPE_OPTIONS) out[t.value] = wines.filter(w => w.type === t.value).length;
    return out;
  }, [wines]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wine Menu</h2>
          <p className="text-xs text-gray-400 mt-0.5">Add wines to your menu. Visitors see this on your Sip805 listing.</p>
        </div>
        <button onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:bg-purple-700 transition">
          <Plus className="w-4 h-4" /> Add Wine
        </button>
      </div>

      {savedToast && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" /> Saved.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, varietal, AVA..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-400" />
        </div>
        <button onClick={() => setFilterType("all")}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            filterType === "all" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          All ({counts.all})
        </button>
        {TYPE_OPTIONS.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === t.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t.label} ({counts[t.value] || 0})
          </button>
        ))}
      </div>

      {/* Wine List */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">Loading your menu...</div>
      ) : visibleWines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Wine className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-gray-700">
            {wines.length === 0 ? "No wines yet" : "No wines match your filters"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {wines.length === 0
              ? "Add your first wine to start building your public menu."
              : "Try a different search or type filter."}
          </div>
          {wines.length === 0 && (
            <button onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              <Plus className="w-4 h-4" /> Add Your First Wine
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleWines.map(wine => (
            <WineCard key={wine.id} wine={wine}
              onEdit={() => handleOpenEdit(wine)}
              onDelete={() => setDeleteConfirm(wine)} />
          ))}
        </div>
      )}

      {formOpen && (
        <WineForm
          winery={winery} user={user} initial={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {deleteConfirm && (
        <DeleteModal wine={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)} />
      )}
    </div>
  );
}

// ── Wine Card ────────────────────────────────────────────────
function WineCard({ wine, onEdit, onDelete }) {
  const avail = availabilityBadge(wine.availability);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900">{wine.name}</h3>
          <span className="text-xs text-gray-400">{wine.vintage}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${avail.color}`}>{avail.label}</span>
          {wine.tier && (
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
              {tierLabel(wine.tier)}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {typeLabel(wine.type)} · {wine.varietal}
          {wine.appellation && <> · {wine.appellation}</>}
          {wine.abv ? <> · {wine.abv}% ABV</> : null}
        </div>
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{wine.description}</p>
        {(wine.pairings && wine.pairings.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {wine.pairings.slice(0, 4).map((p, i) => (
              <span key={i} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="text-lg font-bold text-gray-900">${wine.price}</div>
        <div className="text-[10px] text-gray-400">{wine.bottleSize}</div>
        <div className="flex gap-1 mt-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Wine Form Modal ──────────────────────────────────────────
function WineForm({ winery, user, initial, onClose, onSaved }) {
  const [data, setData] = useState(() => initial ? { ...BLANK_WINE, ...initial } : { ...BLANK_WINE });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [newPairing, setNewPairing] = useState("");

  const set = (field, value) => {
    setData(d => ({ ...d, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const addPairing = () => {
    const v = newPairing.trim();
    if (!v || data.pairings.length >= 8) return;
    set("pairings", [...data.pairings, v]);
    setNewPairing("");
  };

  const removePairing = (idx) => {
    set("pairings", data.pairings.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const result = initial
        ? await updateWine(initial.id, data, user.uid)
        : await addWine(winery.id, data, user.uid);
      if (!result.success) {
        setErrors(result.errors || { general: "Could not save." });
      } else {
        onSaved();
      }
    } catch (err) {
      setErrors({ general: err.message || "Could not save." });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{initial ? "Edit Wine" : "Add Wine"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {errors.general && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{errors.general}
            </div>
          )}

          {/* Core */}
          <Section title="Core Details">
            <Field label="Wine Name" error={errors.name} required>
              <input type="text" value={data.name} onChange={e => set("name", e.target.value)}
                className={inputCls} placeholder="e.g. Estate Cabernet Sauvignon" maxLength={80} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Varietal / Grape" error={errors.varietal} required>
                <input type="text" value={data.varietal} onChange={e => set("varietal", e.target.value)}
                  className={inputCls} placeholder="Cabernet Sauvignon" />
              </Field>
              <Field label="Type" error={errors.type} required>
                <select value={data.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Vintage" error={errors.vintage} required>
                <input type="number" value={data.vintage} onChange={e => set("vintage", e.target.value)}
                  className={inputCls} min="1900" max={new Date().getFullYear() + 1} />
              </Field>
              <Field label="ABV %" error={errors.abv} required>
                <input type="number" step="0.1" value={data.abv} onChange={e => set("abv", e.target.value)}
                  className={inputCls} min="0" max="25" />
              </Field>
              <Field label="Price ($)" error={errors.price} required>
                <input type="number" step="0.01" value={data.price} onChange={e => set("price", e.target.value)}
                  className={inputCls} min="0" />
              </Field>
            </div>
            <Field label="Description" error={errors.description} required>
              <textarea value={data.description} onChange={e => set("description", e.target.value)}
                rows={3} maxLength={600}
                className={inputCls + " resize-none"}
                placeholder="Tasting notes, flavor profile, what makes this wine special..." />
              <div className="text-[10px] text-gray-400 text-right mt-0.5">{(data.description || "").length}/600</div>
            </Field>
          </Section>

          {/* Wine Details */}
          <Section title="Wine Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Appellation / AVA">
                <input type="text" value={data.appellation} onChange={e => set("appellation", e.target.value)}
                  className={inputCls} placeholder="Paso Robles" />
              </Field>
              <Field label="Bottle Size">
                <select value={data.bottleSize} onChange={e => set("bottleSize", e.target.value)} className={inputCls}>
                  {BOTTLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Aging">
              <input type="text" value={data.aging} onChange={e => set("aging", e.target.value)}
                className={inputCls} placeholder="18 months in French oak, 40% new" />
            </Field>
            <Field label="Sweetness (1 = Bone Dry, 5 = Dessert)" error={errors.sweetness}>
              <select value={data.sweetness} onChange={e => set("sweetness", e.target.value)} className={inputCls}>
                <option value="">— Not specified —</option>
                <option value="1">1 — Bone Dry</option>
                <option value="2">2 — Dry</option>
                <option value="3">3 — Off-Dry</option>
                <option value="4">4 — Sweet</option>
                <option value="5">5 — Dessert</option>
              </select>
            </Field>
            <Field label="Food Pairings (up to 8)">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.pairings.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded-lg">
                    {p}
                    <button type="button" onClick={() => removePairing(i)} className="hover:text-purple-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {data.pairings.length < 8 && (
                <div className="flex gap-2">
                  <input type="text" value={newPairing} onChange={e => setNewPairing(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPairing(); } }}
                    className={inputCls} placeholder="Grilled lamb, aged cheddar..." maxLength={40} />
                  <button type="button" onClick={addPairing}
                    className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition">
                    Add
                  </button>
                </div>
              )}
            </Field>
          </Section>

          {/* Inventory & Marketing */}
          <Section title="Inventory & Marketing">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category Tier" error={errors.tier}>
                <select value={data.tier} onChange={e => set("tier", e.target.value)} className={inputCls}>
                  {TIER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Availability" error={errors.availability}>
                <select value={data.availability} onChange={e => set("availability", e.target.value)} className={inputCls}>
                  {AVAILABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bottles Produced (optional)">
                <input type="number" value={data.bottlesProduced} onChange={e => set("bottlesProduced", e.target.value)}
                  className={inputCls} placeholder="e.g. 450" min="0" />
              </Field>
              <Field label="Sort Order (lower = higher on menu)">
                <input type="number" value={data.sortOrder} onChange={e => set("sortOrder", e.target.value)}
                  className={inputCls} />
              </Field>
            </div>
            <Field label="Awards">
              <input type="text" value={data.awards} onChange={e => set("awards", e.target.value)}
                className={inputCls} placeholder="92 pts Wine Enthusiast 2024; Gold, SF Chron Wine Competition" />
            </Field>
          </Section>
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : (initial ? "Save Changes" : "Add Wine")}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400";

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500 mt-0.5 block">{error}</span>}
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────
function DeleteModal({ wine, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-bold text-gray-900">Delete wine?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Remove <span className="font-semibold">{wine.name}</span> ({wine.vintage}) from your menu? This can't be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
