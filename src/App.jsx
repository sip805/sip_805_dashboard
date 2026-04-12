// ══════════════════════════════════════════════════════════════
// App.jsx — Root state router for the Sip805 winery dashboard
//
// Flow:
//   1. Landing page (marketing + demo) — public, no auth
//   2. Sign Up / Sign In — creates or authenticates Firebase user
//   3. Auth check:
//      a. wineryOwners/{uid} exists → APPROVED → Dashboard
//      b. wineryClaims/{uid} exists & pending → ClaimPending
//      c. Neither → ClaimWinery (submit a new claim)
//   4. Dashboard — locked to the owner's approved winery
//
// Admin functions (approve/reject) live in the separate
// sip805-admin app — nothing admin-related here.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { onAuthChange, getOwnerProfile, getClaimStatus } from "./firebaseClient.js";
import Landing from "./Landing.jsx";
import SignUp from "./components/SignUp.jsx";
import SignIn from "./components/SignIn.jsx";
import ClaimWinery from "./components/ClaimWinery.jsx";
import ClaimPending from "./components/ClaimPending.jsx";
import DashboardShell from "./components/DashboardShell.jsx";

// Screens the router can show
const SCREENS = {
  LANDING: "landing",
  SIGN_UP: "signUp",
  SIGN_IN: "signIn",
  LOADING: "loading",
  CLAIM_WINERY: "claimWinery",
  CLAIM_PENDING: "claimPending",
  DASHBOARD: "dashboard",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [claim, setClaim] = useState(null);

  // ── Auth listener ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOwnerProfile(null);
        setClaim(null);
        if (![SCREENS.LANDING, SCREENS.SIGN_UP, SCREENS.SIGN_IN].includes(screen)) {
          setScreen(SCREENS.LANDING);
        }
        return;
      }

      setUser(firebaseUser);
      setScreen(SCREENS.LOADING);

      try {
        // 1. Check if they're an approved owner
        const profile = await getOwnerProfile(firebaseUser.uid);
        if (profile) {
          setOwnerProfile(profile);
          setScreen(SCREENS.DASHBOARD);
          return;
        }

        // 2. Check if they have a pending claim
        const claimData = await getClaimStatus(firebaseUser.uid);
        if (claimData && claimData.status === "pending") {
          setClaim(claimData);
          setScreen(SCREENS.CLAIM_PENDING);
          return;
        }

        // 3. No profile, no pending claim → new user needs to claim
        setScreen(SCREENS.CLAIM_WINERY);
      } catch (err) {
        console.error("Error checking owner status:", err);
        setScreen(SCREENS.CLAIM_WINERY);
      }
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render the current screen ─────────────────────────────
  switch (screen) {
    case SCREENS.LANDING:
      return (
        <Landing
          onSignUp={() => setScreen(SCREENS.SIGN_UP)}
          onSignIn={() => setScreen(SCREENS.SIGN_IN)}
        />
      );

    case SCREENS.SIGN_UP:
      return (
        <SignUp
          onSwitchToSignIn={() => setScreen(SCREENS.SIGN_IN)}
        />
      );

    case SCREENS.SIGN_IN:
      return (
        <SignIn
          onSwitchToSignUp={() => setScreen(SCREENS.SIGN_UP)}
        />
      );

    case SCREENS.LOADING:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Loading your dashboard...</p>
          </div>
        </div>
      );

    case SCREENS.CLAIM_WINERY:
      return (
        <ClaimWinery
          user={user}
          onClaimSubmitted={(claimData) => {
            setClaim(claimData);
            setScreen(SCREENS.CLAIM_PENDING);
          }}
        />
      );

    case SCREENS.CLAIM_PENDING:
      return (
        <ClaimPending claim={claim} />
      );

    case SCREENS.DASHBOARD:
      return (
        <DashboardShell user={user} ownerProfile={ownerProfile} />
      );

    default:
      return null;
  }
}
