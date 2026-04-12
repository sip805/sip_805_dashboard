// Firebase — Sip805 Winery Dashboard (Owner-only)
//
// This file contains ONLY winery-owner functions.
// Admin functions (approve/reject claims, platform stats, etc.)
// live in the separate sip805-admin app.

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

// Auth
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

// Winery Owner Profile (wineryOwners/{uid})
export async function getOwnerProfile(uid) {
  const snap = await getDoc(doc(db, "wineryOwners", uid));
  return snap.exists() ? snap.data() : null;
}

// Winery Claims (wineryClaims/{uid})
export async function submitClaim(uid, email, wineryId, wineryName) {
  return setDoc(doc(db, "wineryClaims", uid), {
    uid, email, wineryId, wineryName,
    status: "pending",
    submittedAt: serverTimestamp(),
  });
}

export async function getClaimStatus(uid) {
  const snap = await getDoc(doc(db, "wineryClaims", uid));
  return snap.exists() ? snap.data() : null;
}

// Winery Profile Edits (wineryProfiles/{wineryId})
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
