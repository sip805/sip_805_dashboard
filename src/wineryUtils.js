// ══════════════════════════════════════════════════════════════
// wineryUtils.js — Shared canonical winery + profile merge logic
//
// This file is duplicated across all three Sip805 apps
// (admin, dashboard, consumer) to keep them independent repos.
// If you change this logic, update all three copies.
//
// ARCHITECTURE:
// - Firestore "wineries" collection = canonical source of truth
// - Firestore "wineryProfiles" = owner-editable overrides
// - Hardcoded STATIC_WINERIES = temporary fallback only
// ══════════════════════════════════════════════════════════════

// Fields that owners CAN override via wineryProfiles
const OVERRIDABLE_FIELDS = [
  "desc", "description", "phone", "hours", "website",
  "dogFriendly", "tags", "experiences", "photoURL"
];

// Fields that are LOCKED to the canonical winery record
// and cannot be changed by owner profile edits
const LOCKED_FIELDS = [
  "id", "wineryId", "name", "region", "rating", "reviews",
  "price", "featured", "status", "createdAt", "createdBy"
];

/**
 * Merge a canonical Firestore winery record with owner profile overrides.
 * Canonical fields always win for locked fields.
 * Profile overrides only apply to approved editable fields.
 *
 * @param {Object} canonicalWinery - Base winery from Firestore "wineries" collection
 * @param {Object|null} profileOverrides - Owner edits from "wineryProfiles" collection
 * @returns {Object} Merged winery record
 */
export function mergeCanonicalWineryWithProfile(canonicalWinery, profileOverrides) {
  if (!profileOverrides) return { ...canonicalWinery };

  const merged = { ...canonicalWinery };

  for (const key of OVERRIDABLE_FIELDS) {
    const val = profileOverrides[key];
    if (val === undefined || val === null || val === "") continue;
    if (typeof val === "boolean") { merged[key] = val; continue; }
    if (Array.isArray(val) && val.length > 0) { merged[key] = val; continue; }
    if (typeof val === "string" && val.trim()) { merged[key] = val; continue; }
  }

  return merged;
}

/**
 * Merge Firestore wineries with the static fallback array.
 * Firestore records take priority when they exist.
 * Static wineries fill in gaps for records not yet migrated.
 *
 * @param {Array} firestoreWineries - Records from Firestore "wineries" collection
 * @param {Array} staticWineries - Hardcoded fallback array (temporary)
 * @returns {Array} Merged, deduplicated winery list
 */
export function mergeFirestoreWithStatic(firestoreWineries, staticWineries) {
  // Index Firestore wineries by their wineryId for fast lookup
  const fsById = new Map();
  const fsIds = new Set();
  firestoreWineries.forEach(w => {
    const wid = w.wineryId ?? w.id;
    fsById.set(wid, w);
    fsIds.add(wid);
  });

  // Start with all Firestore wineries
  const result = [...firestoreWineries];

  // Fill in static wineries that are NOT yet in Firestore
  // This is the temporary compatibility layer. Once all wineries
  // are seeded into Firestore, this block does nothing.
  for (const sw of staticWineries) {
    if (!fsIds.has(sw.id)) {
      result.push({ ...sw, _source: "static" });
    }
  }

  return result;
}

/**
 * Bulk merge winery list with all profile overrides.
 *
 * @param {Array} wineries - List of canonical winery records
 * @param {Object} overridesMap - Map of wineryId -> profile overrides
 * @returns {Array} Wineries with profile overrides applied
 */
export function applyAllProfileOverrides(wineries, overridesMap) {
  if (!overridesMap || Object.keys(overridesMap).length === 0) return wineries;

  return wineries.map(w => {
    const wid = String(w.wineryId ?? w.id);
    const ov = overridesMap[wid];
    return ov ? mergeCanonicalWineryWithProfile(w, ov) : w;
  });
}

export { OVERRIDABLE_FIELDS, LOCKED_FIELDS };
