// ==============================================================
// App.jsx - Root state router for the Sip805 winery dashboard
//
// TWO-PATH ONBOARDING FLOW WITH REJECTION HANDLING:
//
//   1. Landing page (marketing + demo) - public, no auth
//   2. Sign Up / Sign In
//   3. Auth check (via getOnboardingState):
//      a. wineryOwners/{uid} approved     -> Dashboard
//      b. wineryClaims/{uid} pending      -> ClaimPending
//      c. wineryClaims/{uid} rejected     -> ClaimRejected
//      d. winerySubmissions/{uid} pending  -> SubmissionPending
//      e. winerySubmissions/{uid} rejected/needs_more_info -> SubmissionRejected
//      f. No records                       -> ClaimWinery (two choices):
//         Path A: select existing winery   -> submit claim
//         Path B: "Add My Winery"          -> AddWinery form
//   4. Dashboard - locked to the owner's approved winery
//
// Priority: approved owner > pending > rejected > fresh onboarding
//
// Admin functions live in the separate sip805-admin app.
// ==============================================================

import { useState, useEffect } from "react";
import {
  onAuthChange, getOnboardingState, logOut
} from "./firebaseClient.js";
import Landing from "./Landing.jsx";
import SignUp from "./components/SignUp.jsx";
import SignIn from "./components/SignIn.jsx";
import ClaimWinery from "./components/ClaimWinery.jsx";
import AddWinery from "./components/AddWinery.jsx";
import ClaimPending from "./components/ClaimPending.jsx";
import ClaimRejected from "./components/ClaimRejected.jsx";
import SubmissionPending from "./components/SubmissionPending.jsx";
import SubmissionRejected from "./components/SubmissionRejected.jsx";
import DashboardShell from "./components/DashboardShell.jsx";

const SCREENS = {
  LANDING: "landing",
  SIGN_UP: "signUp",
  SIGN_IN: "signIn",
  LOADING: "loading",
  CLAIM_WINERY: "claimWinery",
  ADD_WINERY: "addWinery",
  CLAIM_PENDING: "claimPending",
  CLAIM_REJECTED: "claimRejected",
  SUBMISSION_PENDING: "submissionPending",
  SUBMISSION_REJECTED: "submissionRejected",
  DASHBOARD: "dashboard",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOwnerProfile(null);
        setOnboardingData(null);
        if (![SCREENS.LANDING, SCREENS.SIGN_UP, SCREENS.SIGN_IN].includes(screen)) {
          setScreen(SCREENS.LANDING);
        }
        return;
      }

      setUser(firebaseUser);
      setScreen(SCREENS.LOADING);

      try {
        const state = await getOnboardingState(firebaseUser.uid);
        setOnboardingData(state.data);

        switch (state.screen) {
          case "dashboard":
            setOwnerProfile(state.data);
            setScreen(SCREENS.DASHBOARD);
            break;
          case "claimPending":
            setScreen(SCREENS.CLAIM_PENDING);
            break;
          case "claimRejected":
            setScreen(SCREENS.CLAIM_REJECTED);
            break;
          case "submissionPending":
            setScreen(SCREENS.SUBMISSION_PENDING);
            break;
          case "submissionRejected":
            setScreen(SCREENS.SUBMISSION_REJECTED);
            break;
          default:
            setScreen(SCREENS.CLAIM_WINERY);
        }
      } catch (err) {
        console.error("Error checking onboarding state:", err);
        setScreen(SCREENS.CLAIM_WINERY);
      }
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: retry from a rejected state -> back to onboarding
  const handleRetry = () => {
    setOnboardingData(null);
    setScreen(SCREENS.CLAIM_WINERY);
  };

  switch (screen) {
    case SCREENS.LANDING:
      return (
        <Landing
          onSignUp={() => setScreen(SCREENS.SIGN_UP)}
          onSignIn={() => setScreen(SCREENS.SIGN_IN)}
        />
      );

    case SCREENS.SIGN_UP:
      return <SignUp onSwitchToSignIn={() => setScreen(SCREENS.SIGN_IN)} />;

    case SCREENS.SIGN_IN:
      return <SignIn onSwitchToSignUp={() => setScreen(SCREENS.SIGN_UP)} />;

    case SCREENS.LOADING:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Loading your dashboard...</p>
          </div>
        </div>
      );

    // Path A: claim an existing winery (or branch to Path B)
    case SCREENS.CLAIM_WINERY:
      return (
        <ClaimWinery
          user={user}
          onAddWinery={() => setScreen(SCREENS.ADD_WINERY)}
          onClaimSubmitted={(data) => {
            setOnboardingData({ wineryName: data.wineryName, status: "pending" });
            setScreen(SCREENS.CLAIM_PENDING);
          }}
        />
      );

    // Path B: submit a brand-new winery
    case SCREENS.ADD_WINERY:
      return (
        <AddWinery
          user={user}
          onBack={() => setScreen(SCREENS.CLAIM_WINERY)}
          onSubmitted={(data) => {
            setOnboardingData({ wineryName: data.wineryName, status: "pending" });
            setScreen(SCREENS.SUBMISSION_PENDING);
          }}
          onClaimExisting={(winery) => {
            // User found a duplicate and wants to claim it instead
            setScreen(SCREENS.CLAIM_WINERY);
          }}
        />
      );

    // Pending screens
    case SCREENS.CLAIM_PENDING:
      return <ClaimPending claim={onboardingData} />;

    case SCREENS.SUBMISSION_PENDING:
      return <SubmissionPending submission={onboardingData} />;

    // Rejected screens
    case SCREENS.CLAIM_REJECTED:
      return <ClaimRejected claim={onboardingData} onRetry={handleRetry} />;

    case SCREENS.SUBMISSION_REJECTED:
      return <SubmissionRejected submission={onboardingData} onRetry={handleRetry} />;

    // Dashboard: locked to approved owner
    case SCREENS.DASHBOARD:
      return <DashboardShell user={user} ownerProfile={ownerProfile} />;

    default:
      return null;
  }
}
