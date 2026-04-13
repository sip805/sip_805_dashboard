// ==============================================================
// Firebase — Sip805 Winery Dashboard (Owner-only)
//
// MIGRATION NOTE: This app now reads wineries from the Firestore
// "wineries" collection instead of the hardcoded WINERIES array.
// The static array in data/wineries.js is kept as fallback only.
// ==============================================================

import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, orderBy,
  serverTimestamp
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
    if (!edits.hours || edits.hours.trim().length < 5) errors.hours = "Hours can't be blank.";
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
