// ==============================================================
// AnnouncementsPage — publish release/event/general announcements
// that appear in the consumer app's "What's new" row on Home.
// ==============================================================

import { useEffect, useState } from "react";
import { Megaphone, Wine, Calendar, Send, Trash2, Edit3, Check } from "lucide-react";
import {
  getWineryAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../firebaseClient.js";

const KIND_META = {
  release: { label: "🍷 New Release", color: "bg-purple-50 text-purple-700 border-purple-200" },
  event:   { label: "📅 Event",       color: "bg-amber-50 text-amber-700 border-amber-200" },
  general: { label: "📣 Update",      color: "bg-gray-100 text-gray-600 border-gray-200" },
};

function fmtDate(ts) {
  try {
    const d = ts?.toDate?.() || (ts ? new Date(ts) : null);
    if (!d || isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function AnnouncementsPage({ winery }) {
  const wineryId = winery?.id ?? winery?.wineryId;
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", kind: "release", endsAt: "" });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const refresh = () => {
    if (!wineryId) { setList([]); return; }
    getWineryAnnouncements(wineryId)
      .then(setList)
      .catch(() => setList([]));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [wineryId]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, { ...form, status: "published" });
        setFlash("Updated");
      } else {
        await publishAnnouncement(wineryId, winery.name, { ...form, status: "published" });
        setFlash("Published");
      }
      setForm({ title: "", body: "", kind: "release", endsAt: "" });
      setEditingId(null);
      refresh();
      setTimeout(() => setFlash(""), 1500);
    } catch (e) {
      console.error("Publish failed:", e);
      setFlash("Failed to publish");
      setTimeout(() => setFlash(""), 2000);
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title || "",
      body: a.body || "",
      kind: a.kind || "general",
      endsAt: a.endsAt?.toDate?.() ? a.endsAt.toDate().toISOString().split("T")[0] : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", body: "", kind: "release", endsAt: "" });
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    await deleteAnnouncement(a.id);
    refresh();
  };

  const toggleArchive = async (a) => {
    const newStatus = a.status === "archived" ? "published" : "archived";
    await updateAnnouncement(a.id, { status: newStatus });
    refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
        <p className="text-xs text-gray-400">Your release drops, events, and updates appear on the Sip805 home feed</p>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-900">
            {editingId ? "Edit announcement" : "Publish an announcement"}
          </h3>
          {flash && <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> {flash}</span>}
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.entries(KIND_META).map(([k, m]) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, kind: k }))}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                form.kind === k ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200"
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder={form.kind === "release" ? "2023 Estate Syrah — just released" : form.kind === "event" ? "Harvest Party — Saturday 2 PM" : "A quick update for our guests"}
          maxLength={120}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        />

        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          placeholder="Details…"
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Ends:
          </label>
          <input
            type="date"
            value={form.endsAt}
            onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <span className="text-[10px] text-gray-400">(Optional — hides from feed after this date)</span>
        </div>

        <div className="flex gap-2">
          {editingId && (
            <button onClick={cancelEdit} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
              Cancel
            </button>
          )}
          <button
            onClick={submit}
            disabled={busy || !form.title.trim()}
            className="ml-auto px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {editingId ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      {/* Existing announcements */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Your announcements</h3>
        {list === null && <div className="text-xs text-gray-400">Loading…</div>}
        {list?.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Wine className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nothing published yet.</p>
            <p className="text-xs text-gray-300 mt-1">Announcements surface in the consumer app's home feed.</p>
          </div>
        )}
        <div className="space-y-2">
          {(list || []).map(a => {
            const m = KIND_META[a.kind] || KIND_META.general;
            const isArchived = a.status === "archived";
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-3.5 ${isArchived ? "border-gray-100 opacity-70" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.color}`}>{m.label}</span>
                      {isArchived && <span className="text-[10px] text-gray-400">Archived</span>}
                      <span className="text-[10px] text-gray-400">Posted {fmtDate(a.createdAt)}</span>
                      {a.endsAt && <span className="text-[10px] text-gray-400">Ends {fmtDate(a.endsAt)}</span>}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                    {a.body && <div className="text-xs text-gray-500 mt-1 leading-snug whitespace-pre-wrap">{a.body}</div>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => beginEdit(a)}
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                      title="Edit"><Edit3 className="w-3.5 h-3.5 text-gray-500" /></button>
                    <button onClick={() => toggleArchive(a)}
                      className="px-2 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 text-[10px] text-gray-600">
                      {isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button onClick={() => remove(a)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                      title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
