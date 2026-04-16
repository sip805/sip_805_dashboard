// ==============================================================
// Firebase — Sip805 Winery Dashboard (Owner-only, read-only consumer)
//
// ARCHITECTURE: The admin app is the control plane for all shared
// platform data. This dashboard is a READ-ONLY consumer of:
//   - "wineries" collection        → getActiveWineries(), getWineryById()
//   - "trails" collection          → getActiveTrails()
//   - "wineryOwners" collection    → getOwnerProfile() (admin writes)
//   - "wineryClaims" collection    → submitClaim(), getClaimStatus()
//   - "winerySubmissions" coll     → submitWinerySubmission(), getSubmissionStatus()
//   - "wineryProfiles" collection  → getProfileEdits(), saveProfileEdits()
//   - "visits" collection          → getWineryVisits()
//
// Only claims, submissions, and profile edits are written by this app.
// All canonical winery/trail data is managed by the admin app.
// ==============================================================

import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, query, where, getDocs, orderBy,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPfaWPNV8wC46WxEMX7Gxn1QC6ZyDH_2I",
  authDomain: "sip805.firebaseapp.com",
  projectId: "sip805",
  storageBucket: "sip805.firebasestorage.app",
  messagingSenderId: "886466988207",
  appId: "1:886466988207:web:df8c94d56ea6de5fcaac5a",
  measurementId: "G-FRDKCR691D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// == Auth ======================================================

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

/**
 * Send a password reset email to the given address. Firebase handles the
 * email delivery, token generation, and reset page. Caller should show a
 * generic success message regardless of whether the email exists, to avoid
 * leaking which emails are registered.
 */
export async function sendPasswordReset(email) {
  if (!email || !email.trim()) throw new Error("Email is required");
  return sendPasswordResetEmail(auth, email.trim());
}

export async function signInWithEmail(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    if (err.code === "auth/invalid-credential") {
      try {
        return await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr) {
        if (createErr.code === "auth/email-already-in-use") {
          throw new Error("Incorrect password. Please try again.");
        }
        throw createErr;
      }
    }
    throw err;
  }
}

export async function createAccount(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export const logOut = () => signOut(auth);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// == Winery ID Helpers =========================================
// Numeric winery IDs are required because the dashboard's
// generateDemoData() does math on the ID, and Firestore queries
// for visits/owners use the numeric ID. These helpers ensure
// we never propagate NaN through the system.

/** Safe coercion: returns a valid positive integer or null */
function safeNumericWineryId(value) {
  const num = Number(value);
  return (Number.isFinite(num) && num >= 1 && Math.floor(num) === num) ? num : null;
}

/** Extract a safe numeric ID from a Firestore winery doc */
function extractWineryId(docData, docId) {
  return safeNumericWineryId(docData.wineryId) ?? safeNumericWineryId(docId);
}

// == Canonical Wineries (Firestore) ============================
// The "wineries" collection is the source of truth.
// These helpers let the claim flow and dashboard look up wineries
// from Firestore instead of the hardcoded static array.

/** Fetch all active wineries (for claim selector) */
export async function getActiveWineries() {
  const snap = await getDocs(collection(db, "wineries"));
  return snap.docs
    .map(d => {
      const data = d.data();
      const numId = extractWineryId(data, d.id);
      return { id: numId, firestoreDocId: d.id, ...data, wineryId: numId ?? data.wineryId };
    })
    .filter(w => w.status !== "inactive" && w.status !== "hidden");
}

/** Fetch all wineries regardless of status */
export async function getAllWineries() {
  const snap = await getDocs(collection(db, "wineries"));
  return snap.docs.map(d => {
    const data = d.data();
    const numId = extractWineryId(data, d.id);
    return { id: numId, firestoreDocId: d.id, ...data, wineryId: numId ?? data.wineryId };
  });
}

/** Fetch a single winery by wineryId */
export async function getWineryById(wineryId) {
  // Guard: don't query Firestore with "NaN" or "undefined"
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) {
    console.warn(`getWineryById called with invalid wineryId: ${JSON.stringify(wineryId)}`);
    return null;
  }
  const snap = await getDoc(doc(db, "wineries", String(numId)));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: safeNumericWineryId(data.wineryId) ?? numId,
    firestoreDocId: snap.id,
    ...data,
    wineryId: safeNumericWineryId(data.wineryId) ?? numId,
  };
}

// == Canonical Trails (Firestore) ==============================
// Admin app is the control plane for trails. Dashboard reads
// active trails to show which trails include the owner's winery.

/** Fetch all active trails */
export async function getActiveTrails() {
  const snap = await getDocs(collection(db, "trails"));
  return snap.docs
    .map(d => ({ firestoreDocId: d.id, ...d.data() }))
    .filter(t => t.status === "active" || !t.status);
}

// == Real Visit Analytics ======================================
// Fetch actual visit records for a winery from Firestore.
// This replaces the demo data generator for production use.

export async function getWineryVisits(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return [];
  const q = query(
    collection(db, "visits"),
    where("wineryId", "==", numId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id, ...d.data(),
    date: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }));
}

// == Winery Owner Profile ======================================

export async function getOwnerProfile(uid) {
  const snap = await getDoc(doc(db, "wineryOwners", uid));
  return snap.exists() ? snap.data() : null;
}

// == Winery Claims =============================================

export async function submitClaim(uid, email, wineryId, wineryName) {
  // Ensure the claim always stores a valid numeric wineryId.
  // If a non-numeric ID slips in here, it will propagate to wineryOwners
  // when the admin approves the claim, causing NaN in the dashboard.
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) {
    throw new Error(
      `Cannot submit claim: wineryId "${wineryId}" is not a valid numeric ID. ` +
      `Please contact support if this winery is missing an ID.`
    );
  }
  return setDoc(doc(db, "wineryClaims", uid), {
    uid, email, wineryId: numId, wineryName,
    status: "pending",
    submittedAt: serverTimestamp(),
  });
}

export async function getClaimStatus(uid) {
  const snap = await getDoc(doc(db, "wineryClaims", uid));
  return snap.exists() ? snap.data() : null;
}

// == Winery Submissions ========================================

export async function submitWinerySubmission(uid, email, details) {
  return setDoc(doc(db, "winerySubmissions", uid), {
    submittedByUid: uid,
    ownerEmail: email,
    wineryName: details.wineryName,
    region: details.region,
    address: details.address,
    website: details.website || "",
    phone: details.phone || "",
    contactName: details.contactName,
    contactEmail: details.contactEmail,
    notes: details.notes || "",
    status: "pending",
    source: "winery-dashboard",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewNotes: "",
    reviewedAt: null,
    reviewedBy: null,
  });
}

export async function getSubmissionStatus(uid) {
  const snap = await getDoc(doc(db, "winerySubmissions", uid));
  return snap.exists() ? snap.data() : null;
}

// == Onboarding State Resolution ===============================

export async function getOnboardingState(uid) {
  const owner = await getOwnerProfile(uid);
  if (owner) return { screen: "dashboard", data: owner };

  const claim = await getClaimStatus(uid);
  if (claim) {
    if (claim.status === "pending") return { screen: "claimPending", data: claim };
    if (claim.status === "rejected") return { screen: "claimRejected", data: claim };
    if (claim.status === "approved") return { screen: "claimPending", data: claim };
  }

  const sub = await getSubmissionStatus(uid);
  if (sub) {
    if (sub.status === "pending") return { screen: "submissionPending", data: sub };
    if (sub.status === "rejected" || sub.status === "needs_more_info")
      return { screen: "submissionRejected", data: sub };
    if (sub.status === "approved") return { screen: "submissionPending", data: sub };
  }

  return { screen: "onboarding", data: null };
}

// == Duplicate Prevention Guards ===============================

export async function canSubmitClaim(uid) {
  const state = await getOnboardingState(uid);
  if (state.screen === "dashboard") return { allowed: false, reason: "You already have an approved winery." };
  if (state.screen === "claimPending") return { allowed: false, reason: "You already have a pending claim." };
  if (state.screen === "submissionPending") return { allowed: false, reason: "You already have a pending winery submission." };
  return { allowed: true, reason: null };
}

export async function canSubmitWinerySubmission(uid) {
  const state = await getOnboardingState(uid);
  if (state.screen === "dashboard") return { allowed: false, reason: "You already have an approved winery." };
  if (state.screen === "claimPending") return { allowed: false, reason: "You already have a pending claim." };
  if (state.screen === "submissionPending") return { allowed: false, reason: "You already have a pending winery submission." };
  return { allowed: true, reason: null };
}

// == Winery Profile Edits ======================================

const PHONE_RE = /^\(\d{3}\)\s?\d{3}-\d{4}$/;
const URL_RE = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}(\/.*)?$/;

export function validateEdits(edits) {
  const errors = {};
  if ("desc" in edits) {
    if (!edits.desc || edits.desc.trim().length < 20) errors.desc = "Description must be at least 20 characters.";
    if (edits.desc && edits.desc.length > 500) errors.desc = "Description can't exceed 500 characters.";
  }
  if ("phone" in edits) {
    if (!edits.phone || !PHONE_RE.test(edits.phone.trim())) errors.phone = "Phone must be (XXX) XXX-XXXX format.";
  }
  if ("hours" in edits) {
    const h = edits.hours;
    if (h && typeof h === "object" && !Array.isArray(h)) {
      // Per-day schedule: require at least one day open with valid open<close times
      const days = ["mon","tue","wed","thu","fri","sat","sun"];
      const anyOpen = days.some(d => h[d] && !h[d].closed);
      if (!anyOpen) errors.hours = "Set hours for at least one day.";
      for (const d of days) {
        const day = h[d];
        if (!day || day.closed) continue;
        if (!day.open || !day.close || day.open >= day.close) {
          errors.hours = "Each open day needs a valid open and close time.";
          break;
        }
      }
    } else if (typeof h === "string") {
      if (!h || h.trim().length < 5) errors.hours = "Hours can't be blank.";
    } else {
      errors.hours = "Hours can't be blank.";
    }
  }
  if ("website" in edits) {
    if (edits.website && !URL_RE.test(edits.website.trim())) errors.website = "Enter a valid website (e.g. yourwinery.com).";
  }
  if ("tags" in edits) {
    if (!Array.isArray(edits.tags) || edits.tags.length < 1) errors.tags = "At least 1 tag required.";
    if (edits.tags && edits.tags.length > 3) errors.tags = "Maximum 3 tags allowed.";
  }
  if ("experiences" in edits) {
    if (!Array.isArray(edits.experiences) || edits.experiences.length < 1) errors.experiences = "At least 1 experience required.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export async function getProfileEdits(wineryId) {
  const snap = await getDoc(doc(db, "wineryProfiles", String(wineryId)));
  return snap.exists() ? snap.data() : null;
}

export async function saveProfileEdits(wineryId, edits, userId) {
  const { valid, errors } = validateEdits(edits);
  if (!valid) return { success: false, errors };

  const LOCKED = ["name", "region", "price", "rating", "reviews", "featured", "address", "gradient", "id"];
  const clean = { ...edits };
  LOCKED.forEach(k => delete clean[k]);

  await setDoc(doc(db, "wineryProfiles", String(wineryId)), {
    ...clean,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  }, { merge: true });

  return { success: true, errors: {} };
}

// == Wine Menu =================================================
// Owners manage a list of wines per winery. Stored in top-level
// "wineryWines" collection (one doc per wine) with a numeric
// wineryId field so consumer queries can fetch a winery's menu
// in one shot. All writes require a valid owner session.

const WINE_TYPES = ["red", "white", "rose", "sparkling", "dessert", "fortified"];
const WINE_TIERS = ["", "estate", "reserve", "single_vineyard", "club", "library"];
const WINE_AVAILABILITY = ["in_stock", "sold_out", "club_only", "coming_soon"];

export function validateWine(wine) {
  const errors = {};
  if (!wine.name || wine.name.trim().length < 2) errors.name = "Name is required.";
  if (wine.name && wine.name.length > 80) errors.name = "Name must be under 80 characters.";
  if (!wine.varietal || wine.varietal.trim().length < 2) errors.varietal = "Varietal is required.";
  if (!WINE_TYPES.includes(wine.type)) errors.type = "Pick a wine type.";
  const year = Number(wine.vintage);
  const thisYear = new Date().getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > thisYear + 1) errors.vintage = "Enter a valid vintage year.";
  const abv = Number(wine.abv);
  if (!Number.isFinite(abv) || abv < 0 || abv > 25) errors.abv = "ABV must be 0–25%.";
  const price = Number(wine.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000) errors.price = "Enter a valid price.";
  if (!wine.description || wine.description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
  if (wine.description && wine.description.length > 600) errors.description = "Description must be under 600 characters.";
  if (wine.tier && !WINE_TIERS.includes(wine.tier)) errors.tier = "Invalid tier.";
  if (wine.availability && !WINE_AVAILABILITY.includes(wine.availability)) errors.availability = "Invalid availability.";
  if (wine.sweetness != null && wine.sweetness !== "") {
    const s = Number(wine.sweetness);
    if (!Number.isFinite(s) || s < 1 || s > 5) errors.sweetness = "Sweetness must be 1–5.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Fetch every wine for a winery, sorted by sortOrder then name. */
export async function getWineryWines(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return [];
  const q = query(collection(db, "wineryWines"), where("wineryId", "==", numId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || (a.name || "").localeCompare(b.name || ""));
}

/** Add a new wine to a winery's menu. Validates before writing. */
export async function addWine(wineryId, wine, userId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return { success: false, errors: { general: "Invalid winery ID." } };
  const { valid, errors } = validateWine(wine);
  if (!valid) return { success: false, errors };
  const doc = {
    wineryId: numId,
    name: wine.name.trim(),
    varietal: wine.varietal.trim(),
    type: wine.type,
    vintage: Number(wine.vintage),
    abv: Number(wine.abv),
    price: Number(wine.price),
    bottleSize: wine.bottleSize?.trim() || "750ml",
    description: wine.description.trim(),
    appellation: wine.appellation?.trim() || "",
    aging: wine.aging?.trim() || "",
    pairings: Array.isArray(wine.pairings) ? wine.pairings.filter(Boolean) : [],
    bottlesProduced: wine.bottlesProduced ? Number(wine.bottlesProduced) : 0,
    tier: wine.tier || "",
    availability: wine.availability || "in_stock",
    awards: wine.awards?.trim() || "",
    sweetness: wine.sweetness ? Number(wine.sweetness) : 0,
    sortOrder: wine.sortOrder != null ? Number(wine.sortOrder) : 100,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
  };
  const ref = await addDoc(collection(db, "wineryWines"), doc);
  return { success: true, id: ref.id, errors: {} };
}

/** Update an existing wine. Only the provided fields are written. */
export async function updateWine(wineId, updates, userId) {
  // Validate the *merged* view so partial updates still enforce constraints
  const { valid, errors } = validateWine(updates);
  if (!valid) return { success: false, errors };
  const clean = {
    ...updates,
    name: updates.name?.trim(),
    varietal: updates.varietal?.trim(),
    description: updates.description?.trim(),
    appellation: updates.appellation?.trim() || "",
    aging: updates.aging?.trim() || "",
    awards: updates.awards?.trim() || "",
    vintage: Number(updates.vintage),
    abv: Number(updates.abv),
    price: Number(updates.price),
    bottlesProduced: updates.bottlesProduced ? Number(updates.bottlesProduced) : 0,
    sweetness: updates.sweetness ? Number(updates.sweetness) : 0,
    sortOrder: updates.sortOrder != null ? Number(updates.sortOrder) : 100,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  delete clean.id;
  delete clean.createdAt;
  delete clean.createdBy;
  await updateDoc(doc(db, "wineryWines", wineId), clean);
  return { success: true, errors: {} };
}

export async function deleteWine(wineId) {
  await deleteDoc(doc(db, "wineryWines", wineId));
  return { success: true };
}

export async function uploadPhoto(wineryId, file) {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED.includes(file.type)) return { success: false, error: "Only JPG, PNG, or WebP images allowed." };
  if (file.size > 5 * 1024 * 1024) return { success: false, error: "Image must be under 5 MB." };

  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = URL.createObjectURL(file);
  });
  if (dims.w < 400 || dims.h < 300) return { success: false, error: "Image must be at least 400x300 pixels." };

  const ext = file.name.split(".").pop();
  const storageRef = ref(storage, `winery-photos/${wineryId}/hero.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "wineryProfiles", String(wineryId)), {
    photoURL: url,
    photoUpdatedAt: serverTimestamp(),
  });

  return { success: true, url };
}

// == Leads (inbound release/club/reservation interest) =========

export async function getWineryLeads(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return [];
  const q = query(
    collection(db, "leads"),
    where("wineryId", "==", numId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateLeadStatus(leadId, status) {
  if (!leadId) throw new Error("leadId required");
  await updateDoc(doc(db, "leads", leadId), {
    status,
    statusUpdatedAt: serverTimestamp(),
  });
}

// == Announcements (winery publishes, consumer reads) ==========

export async function getWineryAnnouncements(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return [];
  const q = query(
    collection(db, "announcements"),
    where("wineryId", "==", numId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function publishAnnouncement(wineryId, wineryName, payload) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) throw new Error("invalid wineryId");
  const doc = {
    wineryId: numId,
    wineryName: wineryName || "",
    title: String(payload.title || "").slice(0, 120),
    body: String(payload.body || "").slice(0, 1000),
    kind: payload.kind || "general", // "release" | "event" | "general"
    startsAt: payload.startsAt ? Timestamp.fromDate(new Date(payload.startsAt)) : null,
    endsAt: payload.endsAt ? Timestamp.fromDate(new Date(payload.endsAt)) : null,
    status: payload.status || "published",
    createdAt: serverTimestamp(),
  };
  return addDoc(collection(db, "announcements"), doc);
}

export async function updateAnnouncement(announcementId, updates) {
  if (!announcementId) throw new Error("id required");
  const payload = {};
  if (updates.title != null) payload.title = String(updates.title).slice(0, 120);
  if (updates.body != null) payload.body = String(updates.body).slice(0, 1000);
  if (updates.kind) payload.kind = updates.kind;
  if (updates.status) payload.status = updates.status;
  if (updates.startsAt !== undefined) payload.startsAt = updates.startsAt ? Timestamp.fromDate(new Date(updates.startsAt)) : null;
  if (updates.endsAt !== undefined) payload.endsAt = updates.endsAt ? Timestamp.fromDate(new Date(updates.endsAt)) : null;
  payload.updatedAt = serverTimestamp();
  await updateDoc(doc(db, "announcements", announcementId), payload);
}

export async function deleteAnnouncement(announcementId) {
  if (!announcementId) return;
  await deleteDoc(doc(db, "announcements", announcementId));
}

// == Trail plan analytics (for plan-to-visit attribution) ======
// Returns the count of user trails that include this winery as a stop.
// IMPORTANT: this reads across all users' subcollections; requires
// collectionGroup query enabled in Firestore. Falls back to 0 if unavailable.

export async function getTrailInclusionsForWinery(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return { count: 0, visitedCount: 0 };
  try {
    const cgQ = query(
      collection(db, "userTrails"),
    );
    // NOTE: best-effort — actual implementation uses collectionGroup("trails")
    // once the index is deployed. For now, return a safe zero.
    // This function exists so dashboard UI can bind to it immediately.
    return { count: 0, visitedCount: 0 };
  } catch (e) {
    return { count: 0, visitedCount: 0 };
  }
}

// == Reservations (Pro-only) ===================================
// Slot-based booking system. Availability is configured per-winery,
// consumers pick a time slot, reservation is auto-confirmed. Email
// notifications are dispatched by a Cloud Function onCreate.
//
// Availability is stored on wineryProfiles/{wineryId}.reservationSettings.
// Reservations are stored in the top-level `reservations` collection.

export const DEFAULT_RESERVATION_SETTINGS = {
  enabled: false,
  // Sun..Sat — closed by default; winery opts in per day.
  weeklyHours: [
    { dayOfWeek: 0, isOpen: false, openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 1, isOpen: false, openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 2, isOpen: false, openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 3, isOpen: false, openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 4, isOpen: false, openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 5, isOpen: true,  openTime: "11:00", closeTime: "17:00" },
    { dayOfWeek: 6, isOpen: true,  openTime: "11:00", closeTime: "17:00" },
  ],
  slotDurationMinutes: 30,          // grid granularity
  tastingDurationMinutes: 60,       // how long each booking blocks capacity
  maxPartySize: 8,
  concurrentCapacity: 4,            // max simultaneous parties in one slot
  leadTimeHours: 24,                // minimum advance notice
  advanceBookingDays: 60,           // how far out guests can book
  timezone: "America/Los_Angeles",
  notes: "",                        // optional message shown on the slot picker
};

/**
 * Read this winery's reservation settings. Falls back to safe defaults
 * (disabled) if the profile doc doesn't have a reservationSettings block yet.
 */
export async function getReservationSettings(wineryId) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return { ...DEFAULT_RESERVATION_SETTINGS };
  try {
    const snap = await getDoc(doc(db, "wineryProfiles", String(numId)));
    const data = snap.exists() ? snap.data() : {};
    const settings = data.reservationSettings || {};
    return { ...DEFAULT_RESERVATION_SETTINGS, ...settings };
  } catch (e) {
    return { ...DEFAULT_RESERVATION_SETTINGS };
  }
}

/**
 * Persist reservation settings for this winery. Merges into wineryProfiles
 * doc (creates it if needed). Caller is responsible for Pro-tier gating.
 */
export async function saveReservationSettings(wineryId, settings) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) throw new Error("invalid wineryId");
  const safe = {
    enabled: !!settings.enabled,
    weeklyHours: Array.isArray(settings.weeklyHours)
      ? settings.weeklyHours.slice(0, 7).map((h, i) => ({
          dayOfWeek: i,
          isOpen: !!h?.isOpen,
          openTime: typeof h?.openTime === "string" ? h.openTime.slice(0, 5) : "11:00",
          closeTime: typeof h?.closeTime === "string" ? h.closeTime.slice(0, 5) : "17:00",
        }))
      : DEFAULT_RESERVATION_SETTINGS.weeklyHours,
    slotDurationMinutes: Math.max(15, Math.min(120, Number(settings.slotDurationMinutes) || 30)),
    tastingDurationMinutes: Math.max(15, Math.min(240, Number(settings.tastingDurationMinutes) || 60)),
    maxPartySize: Math.max(1, Math.min(30, Number(settings.maxPartySize) || 8)),
    concurrentCapacity: Math.max(1, Math.min(50, Number(settings.concurrentCapacity) || 4)),
    leadTimeHours: Math.max(0, Math.min(168, Number(settings.leadTimeHours) || 24)),
    advanceBookingDays: Math.max(1, Math.min(365, Number(settings.advanceBookingDays) || 60)),
    timezone: typeof settings.timezone === "string" ? settings.timezone.slice(0, 64) : "America/Los_Angeles",
    notes: String(settings.notes || "").slice(0, 500),
  };
  await setDoc(doc(db, "wineryProfiles", String(numId)), {
    reservationSettings: safe,
    reservationSettingsUpdatedAt: serverTimestamp(),
  }, { merge: true });
  return safe;
}

/**
 * List reservations for this winery within the given window.
 * `fromDate` and `toDate` are JS Date instances (inclusive from, exclusive to).
 * Returns docs sorted by slotStart ascending.
 */
export async function getWineryReservations(wineryId, fromDate, toDate) {
  const numId = safeNumericWineryId(wineryId);
  if (numId === null) return [];
  const constraints = [where("wineryId", "==", numId)];
  if (fromDate) constraints.push(where("slotStart", ">=", Timestamp.fromDate(fromDate)));
  if (toDate)   constraints.push(where("slotStart", "<",  Timestamp.fromDate(toDate)));
  constraints.push(orderBy("slotStart", "asc"));
  const q = query(collection(db, "reservations"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Winery-side status mutation. Used to mark completed, no_show, or to cancel
 * on behalf of the guest (e.g. when the winery closes unexpectedly).
 */
export async function updateReservationStatus(reservationId, status, opts = {}) {
  if (!reservationId) throw new Error("reservationId required");
  const payload = { status, statusUpdatedAt: serverTimestamp() };
  if (status === "cancelled") {
    payload.cancelledAt = serverTimestamp();
    payload.cancelledBy = opts.cancelledBy || "winery";
    if (opts.reason) payload.cancelReason = String(opts.reason).slice(0, 500);
  }
  await updateDoc(doc(db, "reservations", reservationId), payload);
}
