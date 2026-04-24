// ==============================================================
// ReservationsPage — Pro-only slot-booking control panel.
//
// Wineries configure availability (weekly hours, slot duration,
// capacity, lead time) and see upcoming bookings with guest
// contact info and party size. Status updates (completed, no-show,
// cancel) write to the reservations collection which Cloud
// Functions then email to the guest.
//
// Free-tier wineries see an upgrade CTA — reservations remain a
// key driver of Pro conversion.
// ==============================================================

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock, Users, Mail, MessageSquare, CheckCircle,
  XCircle, Lock, Save, ToggleLeft, ToggleRight, AlertTriangle,
  UserCheck, Ban
} from "lucide-react";
import {
  getReservationSettings,
  saveReservationSettings,
  getWineryReservations,
  updateReservationStatus,
  DEFAULT_RESERVATION_SETTINGS,
} from "../../firebaseClient.js";
import { hasPro } from "../../lib/tier.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STYLE = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-100 text-gray-400 border-gray-200",
  no_show:   "bg-red-50 text-red-700 border-red-200",
};

function fmtSlotStart(ts) {
  try {
    const d = ts?.toDate?.() || (ts ? new Date(ts) : null);
    if (!d || isNaN(d)) return "—";
    return d.toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return "—"; }
}

function groupByDate(reservations) {
  const groups = new Map();
  for (const r of reservations) {
    const d = r.slotStart?.toDate?.() || (r.slotStart ? new Date(r.slotStart) : null);
    if (!d || isNaN(d)) continue;
    const key = d.toISOString().split("T")[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function ReservationsPage({ winery, tier }) {
  const wineryId = winery?.id ?? winery?.wineryId;
  const isPro = hasPro(tier);

  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFlash, setSettingsFlash] = useState("");

  const [reservations, setReservations] = useState(null);
  const [windowFilter, setWindowFilter] = useState("upcoming"); // upcoming | today | past

  const [busyId, setBusyId] = useState("");

  // Load settings
  useEffect(() => {
    if (!wineryId || !isPro) { setSettings({ ...DEFAULT_RESERVATION_SETTINGS }); return; }
    getReservationSettings(wineryId)
      .then(setSettings)
      .catch(() => setSettings({ ...DEFAULT_RESERVATION_SETTINGS }));
  }, [wineryId, isPro]);

  // Load reservations in current window
  const reload = () => {
    if (!wineryId || !isPro) { setReservations([]); return; }
    const now = new Date();
    let from = null, to = null;
    if (windowFilter === "upcoming") {
      from = new Date(now);
      to = new Date(now); to.setDate(to.getDate() + 90);
    } else if (windowFilter === "today") {
      from = new Date(now); from.setHours(0, 0, 0, 0);
      to = new Date(from); to.setDate(to.getDate() + 1);
    } else if (windowFilter === "past") {
      from = new Date(now); from.setDate(from.getDate() - 90);
      to = new Date(now);
    }
    setReservations(null);
    getWineryReservations(wineryId, from, to)
      .then(setReservations)
      .catch(() => setReservations([]));
  };
  useEffect(reload, [wineryId, isPro, windowFilter]);

  const grouped = useMemo(() => groupByDate(reservations || []), [reservations]);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const saved = await saveReservationSettings(wineryId, settings);
      setSettings(saved);
      setSettingsFlash("Saved");
      setTimeout(() => setSettingsFlash(""), 1500);
    } catch (e) {
      console.error("Save settings failed:", e);
      setSettingsFlash("Failed");
      setTimeout(() => setSettingsFlash(""), 2000);
    } finally {
      setSavingSettings(false);
    }
  };

  const setStatus = async (r, status, reason) => {
    setBusyId(r.id);
    try {
      await updateReservationStatus(r.id, status, { cancelledBy: "winery", reason });
      setReservations(prev => (prev || []).map(x => x.id === r.id ? { ...x, status } : x));
    } catch (e) {
      console.error("Reservation status failed:", e);
    } finally {
      setBusyId("");
    }
  };

  if (!isPro) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reservations</h2>
          <p className="text-xs text-gray-400">Accept tasting bookings directly from Sip805 consumers</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Reservations is a Pro feature</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Set your weekly tasting hours, capacity, and party size limits. Sip805 customers pick a time;
            we send confirmation emails to you and your guest. Reduces phone-tag and no-shows, and every
            confirmed booking counts toward your Pro ROI.
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg">
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div className="text-sm text-gray-400">Loading reservations…</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reservations</h2>
        <p className="text-xs text-gray-400">Slot-based tasting bookings with automatic email confirmations</p>
      </div>

      {/* Master switch */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <button
          onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
          className="flex-shrink-0"
          title={settings.enabled ? "Disable" : "Enable"}
        >
          {settings.enabled
            ? <ToggleRight className="w-10 h-10 text-purple-600" />
            : <ToggleLeft className="w-10 h-10 text-gray-300" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">
            {settings.enabled ? "Accepting reservations" : "Reservations disabled"}
          </div>
          <div className="text-xs text-gray-500 leading-snug">
            {settings.enabled
              ? "Your slot picker is live on the Sip805 consumer app."
              : "Consumers see a 'Request a reservation' form instead of the slot picker."}
          </div>
        </div>
      </div>

      {/* Weekly hours */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-900">Weekly hours</h3>
          {settingsFlash && <span className="ml-auto text-xs text-green-600 font-medium">{settingsFlash}</span>}
        </div>
        <div className="space-y-1.5">
          {settings.weeklyHours.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <label className="w-12 text-xs text-gray-600 font-medium">{DAYS[i]}</label>
              <button
                onClick={() => {
                  const wh = [...settings.weeklyHours];
                  wh[i] = { ...wh[i], isOpen: !wh[i].isOpen };
                  setSettings(s => ({ ...s, weeklyHours: wh }));
                }}
                className={`w-16 px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  h.isOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                {h.isOpen ? "Open" : "Closed"}
              </button>
              {h.isOpen && (
                <>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={e => {
                      const wh = [...settings.weeklyHours];
                      wh[i] = { ...wh[i], openTime: e.target.value };
                      setSettings(s => ({ ...s, weeklyHours: wh }));
                    }}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={e => {
                      const wh = [...settings.weeklyHours];
                      wh[i] = { ...wh[i], closeTime: e.target.value };
                      setSettings(s => ({ ...s, weeklyHours: wh }));
                    }}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capacity & policy */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-gray-900">Capacity & policy</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Slot every (min)" value={settings.slotDurationMinutes}
            onChange={v => setSettings(s => ({ ...s, slotDurationMinutes: v }))}
            min={15} max={120} step={15} />
          <NumberField label="Tasting length (min)" value={settings.tastingDurationMinutes}
            onChange={v => setSettings(s => ({ ...s, tastingDurationMinutes: v }))}
            min={15} max={240} step={15} />
          <NumberField label="Max party size" value={settings.maxPartySize}
            onChange={v => setSettings(s => ({ ...s, maxPartySize: v }))}
            min={1} max={30} />
          <NumberField label="Parties per slot" value={settings.concurrentCapacity}
            onChange={v => setSettings(s => ({ ...s, concurrentCapacity: v }))}
            min={1} max={50} />
          <NumberField label="Min lead time (hrs)" value={settings.leadTimeHours}
            onChange={v => setSettings(s => ({ ...s, leadTimeHours: v }))}
            min={0} max={168} />
          <NumberField label="Max advance (days)" value={settings.advanceBookingDays}
            onChange={v => setSettings(s => ({ ...s, advanceBookingDays: v }))}
            min={1} max={365} />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Notes shown on slot picker (optional)</label>
          <textarea
            value={settings.notes || ""}
            onChange={e => setSettings(s => ({ ...s, notes: e.target.value }))}
            placeholder="e.g. Please arrive 5 minutes early. Groups of 6+ please call us."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? "Saving…" : "Save settings"}
          </button>
        </div>

        {settings.enabled && settings.weeklyHours.every(h => !h.isOpen) && (
          <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              Reservations are enabled, but every day is marked Closed. Open at least one day so guests can book.
            </div>
          </div>
        )}
      </div>

      {/* Upcoming bookings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-900">
            {windowFilter === "past" ? "Past bookings" : windowFilter === "today" ? "Today" : "Upcoming bookings"}
          </h3>
          <div className="flex gap-1">
            {[
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["past", "Past"],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setWindowFilter(k)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  windowFilter === k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {reservations === null && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">Loading…</div>
        )}
        {reservations !== null && grouped.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {windowFilter === "past" ? "No past bookings in this window." : "No bookings yet."}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              When consumers book through the app, they'll show up here.
            </p>
          </div>
        )}

        {grouped.map(([dateKey, items]) => {
          const d = new Date(dateKey + "T12:00:00");
          const label = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
          return (
            <div key={dateKey} className="space-y-1.5">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
              {items.map(r => {
                const status = r.status || "confirmed";
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-14 flex-shrink-0 text-center">
                        <div className="text-[10px] text-gray-400 uppercase">
                          {r.slotStart?.toDate?.()?.toLocaleDateString(undefined, { month: "short" }) || ""}
                        </div>
                        <div className="text-base font-bold text-gray-900">
                          {r.slotStart?.toDate?.()?.getDate?.() || "—"}
                        </div>
                        <div className="text-[10px] text-purple-600 font-semibold flex items-center justify-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {r.slotStart?.toDate?.()?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) || ""}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {r.userName || r.userEmail || "Guest"}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
                            {status.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                            <Users className="w-3 h-3" /> Party of {r.partySize || 2}
                          </span>
                        </div>
                        {r.userEmail && (
                          <a href={`mailto:${r.userEmail}`} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-purple-600 hover:underline">
                            <Mail className="w-3 h-3" /> {r.userEmail}
                          </a>
                        )}
                        {r.message && (
                          <div className="mt-1.5 flex gap-1.5 text-xs text-gray-500">
                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-300" />
                            <span className="leading-snug">{r.message}</span>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {status === "confirmed" && (
                            <>
                              <button
                                onClick={() => setStatus(r, "completed")}
                                disabled={busyId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50">
                                <CheckCircle className="w-3 h-3" /> Mark completed
                              </button>
                              <button
                                onClick={() => setStatus(r, "no_show")}
                                disabled={busyId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50">
                                <Ban className="w-3 h-3" /> No-show
                              </button>
                              <button
                                onClick={() => {
                                  if (!window.confirm(`Cancel ${r.userName || "this reservation"}?`)) return;
                                  setStatus(r, "cancelled");
                                }}
                                disabled={busyId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50">
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>
                            </>
                          )}
                          {status !== "confirmed" && (
                            <span className="text-[11px] text-gray-400 italic">No further actions</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="text-xs text-gray-500 block">
      <div className="mb-1">{label}</div>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
    </label>
  );
}
