// ==============================================================
// Duplicate Winery Detection
//
// Client-side utility to catch likely duplicates before submitting
// a new winery to winerySubmissions. Compares user input against
// the existing WINERIES dataset.
//
// Returns an array of { winery, reason, score } matches.
// score: 1.0 = exact name match, 0.7+ = strong similarity
// ==============================================================

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(winery|vineyards|vineyard|cellars|cellar|wines|wine|estate|estates|family)/g, "");
}

function normalizeDomain(url) {
  return (url || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

function diceCoefficient(a, b) {
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s) => {
    const set = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bi = s.substring(i, i + 2);
      set.set(bi, (set.get(bi) || 0) + 1);
    }
    return set;
  };
  const aB = bigrams(a);
  const bB = bigrams(b);
  let overlap = 0;
  for (const [k, v] of aB) {
    overlap += Math.min(v, bB.get(k) || 0);
  }
  return (2 * overlap) / (a.length - 1 + b.length - 1);
}

export function findPotentialWineryDuplicates(details, wineries) {
  const matches = [];
  const inputName = normalize(details.wineryName);
  const inputDomain = normalizeDomain(details.website);

  for (const w of wineries) {
    const reasons = [];
    let bestScore = 0;

    // Exact name match
    if (w.name.toLowerCase() === (details.wineryName || "").toLowerCase()) {
      reasons.push("Exact name match");
      bestScore = Math.max(bestScore, 1.0);
    }

    // Normalized name match
    const wNorm = normalize(w.name);
    if (inputName && wNorm && inputName === wNorm) {
      reasons.push("Name matches after normalization");
      bestScore = Math.max(bestScore, 0.95);
    }

    // Fuzzy name similarity
    if (inputName && wNorm) {
      const sim = diceCoefficient(inputName, wNorm);
      if (sim > 0.7) {
        reasons.push("Similar name (" + Math.round(sim * 100) + "% match)");
        bestScore = Math.max(bestScore, sim * 0.9);
      }
    }

    // Website match
    if (inputDomain && w.website) {
      const wDomain = normalizeDomain(w.website);
      if (inputDomain === wDomain) {
        reasons.push("Same website domain");
        bestScore = Math.max(bestScore, 0.9);
      }
    }

    // Region + partial name overlap
    if (w.region === details.region && bestScore > 0.5) {
      reasons.push("Same region");
      bestScore = Math.min(1.0, bestScore + 0.05);
    }

    if (bestScore >= 0.7) {
      matches.push({ winery: w, reasons, score: bestScore });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}
