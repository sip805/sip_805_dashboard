// Tier helpers for dashboard feature gates.
//
// We store tier as a lowercase string on wineryOwners/{uid}.tier.
// Known values, in ascending order of entitlement: "free" < "pro" < "enterprise".
// Using a rank makes it so future tiers slot in cleanly and gates read naturally
// (`hasPro(tier)` instead of `tier === "pro" || tier === "enterprise" || ...`).

const RANK = { free: 0, pro: 1, enterprise: 2 };

function normalize(tier) {
  const t = typeof tier === "string" ? tier.trim().toLowerCase() : "";
  return t in RANK ? t : "free";
}

export function tierRank(tier) {
  return RANK[normalize(tier)];
}

// Has at least Pro-level entitlements (true for pro AND enterprise).
export function hasPro(tier) {
  return tierRank(tier) >= RANK.pro;
}

// Has Enterprise-level entitlements.
export function hasEnterprise(tier) {
  return tierRank(tier) >= RANK.enterprise;
}

// Human-readable plan label for UI chrome (sidebar, business info card, etc.).
export function tierLabel(tier) {
  const t = normalize(tier);
  if (t === "enterprise") return "Enterprise Plan";
  if (t === "pro") return "Pro Plan";
  return "Free Plan";
}

// Short label — for tight spots like the business info card.
export function tierShortLabel(tier) {
  const t = normalize(tier);
  if (t === "enterprise") return "Enterprise";
  if (t === "pro") return "Pro";
  return "Free";
}
