// ══════════════════════════════════════════════════════════════
// Firebase Configuration — Sip805 Dashboard
// Uses the SAME Firebase project as the consumer app
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, getDocs, orderBy, serverTimestamp,
  onSnapshot, limit, Timestamp
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

// ── Auth ─────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export async function signInWithEmail(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    throw err;
  }
}

export const logOut = () => signOut(auth);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// ── Winery Owner Profile ─────────────────────────────────────
export async function getWineryProfile(uid) {
  const snap = await getDoc(doc(db, "wineryOwners", uid));
  return snap.exists() ? snap.data() : null;
}

export async function createWineryProfile(uid, data) {
  return setDoc(doc(db, "wineryOwners", uid), {
    ...data,
    tier: "free",
    createdAt: serverTimestamp(),
  });
}

// ── Analytics Reads ──────────────────────────────────────────
export async function getWineryVisits(wineryId) {
  const q = query(
    collection(db, "visits"),
    where("wineryId", "==", wineryId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }));
}

export async function getAllVisits() {
  const q = query(collection(db, "visits"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }));
}

// ── Analytics Events (written by consumer app) ───────────────
export async function logAnalyticsEvent(eventType, data) {
  return addDoc(collection(db, "analyticsEvents"), {
    eventType,
    ...data,
    createdAt: serverTimestamp(),
  });
}

// ══════════════════════════════════════════════════════════════
// WINERY PROFILE EDITS — Auto-publish with guardrails
// ══════════════════════════════════════════════════════════════
//
// Firestore collection: "wineryProfiles"
// Document ID: winery ID (e.g., "1" for DAOU)
//
// Editable fields:
//   desc, phone, hours, website, dogFriendly, tags[], experiences[],
//   photoURL, photoUpdatedAt
//
// Locked fields (NOT in this collection — hardcoded in consumer app):
//   name, region, price, rating, reviews, featured, address, gradient
//
// The consumer app merges: hardcoded defaults ← Firestore overrides
// So wineries can never "nuke" their listing — defaults always exist.
// ══════════════════════════════════════════════════════════════

// ── Validation rules ────────────────────────────────────────
const PHONE_RE = /^\(\d{3}\)\s?\d{3}-\d{4}$/;
const URL_RE = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}(\/.*)?$/;

export function validateWineryEdits(edits) {
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
    if (edits.tags && edits.tags.some(t => t.length < 2 || t.length > 25)) errors.tags = "Each tag must be 2–25 characters.";
  }

  if ("experiences" in edits) {
    if (!Array.isArray(edits.experiences) || edits.experiences.length < 1) errors.experiences = "At least 1 experience required.";
    if (edits.experiences && edits.experiences.some(e => !e.name || !e.duration)) errors.experiences = "Each experience needs a name and duration.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Read winery profile overrides ───────────────────────────
export async function getWineryProfileEdits(wineryId) {
  const snap = await getDoc(doc(db, "wineryProfiles", String(wineryId)));
  return snap.exists() ? snap.data() : null;
}

// ── Save winery profile edits (with validation) ─────────────
export async function saveWineryProfileEdits(wineryId, edits, userId) {
  const { valid, errors } = validateWineryEdits(edits);
  if (!valid) return { success: false, errors };

  // Strip any locked fields an owner might try to sneak in
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

// ── Upload winery photo to Firebase Storage ─────────────────
export async function uploadWineryPhoto(wineryId, file) {
  // Validate file
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED.includes(file.type)) {
    return { success: false, error: "Only JPG, PNG, or WebP images allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Image must be under 5 MB." };
  }

  // Validate dimensions
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = URL.createObjectURL(file);
  });
  if (dims.w < 400 || dims.h < 300) {
    return { success: false, error: "Image must be at least 400x300 pixels." };
  }

  const ext = file.name.split(".").pop();
  const storageRef = ref(storage, `winery-photos/${wineryId}/hero.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Save URL to Firestore profile
  await updateDoc(doc(db, "wineryProfiles", String(wineryId)), {
    photoURL: url,
    photoUpdatedAt: serverTimestamp(),
  });

  return { success: true, url };
}
