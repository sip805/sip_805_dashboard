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

import { useState, useEffect, useMemo } from "react";
import {
  onAuthChange, getOnboardingState, getActiveWineries, getWineryById, logOut,
  getActiveTrails
} from "./firebaseClient.js";
import { mergeFirestoreWithStatic } from "./wineryUtils.js";
import { WINERIES as STATIC_WINERIES } from "./data/wineries.js";
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
  const [firestoreWineries, setFirestoreWineries] = useState(null);
  const [firestoreTrails, setFirestoreTrails] = useState(null);
  const [wineryRecord, setWineryRecord] = useState(null);
  const [loadingWinery, setLoadingWinery] = useState(false);

  // Compute merged wineries from Firestore + static fallback
  const allWineries = useMemo(
    () => mergeFirestoreWithStatic(firestoreWineries || [], STATIC_WINERIES),
    [firestoreWineries]
  );

  // ARCHITECTURE: Load shared data from Firestore (admin is control plane).
  // Wineries and trails are read from Firestore; static arrays are fallbacks.
  useEffect(() => {
    const loadSharedData = async () => {
      try {
        const [wineries, trails] = await Promise.all([
          getActiveWineries(),
          getActiveTrails().catch(() => []),
        ]);
        setFirestoreWineries(wineries);
        setFirestoreTrails(trails);
      } catch (err) {
        console.error("Error loading Firestore data:", err);
        setFirestoreWineries([]);
        setFirestoreTrails([]);
      }
    };
    loadSharedData();
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOwnerProfile(null);
        setOnboardingData(null);
        setWineryRecord(null);
        setScreen(SCREENS.LANDING);
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
            // Load the winery record from Firestore.
            // Guard: only attempt lookup if wineryId is a valid number.
            // A NaN or non-numeric wineryId would cause getWineryById to
            // query for doc "NaN", which never exists.
            {
              const numId = Number(state.data?.wineryId);
              const hasValidId = Number.isFinite(numId) && numId >= 1;
              if (hasValidId) {
                setLoadingWinery(true);
                try {
                  const winery = await getWineryById(numId);
                  setWineryRecord(winery);
                } catch (err) {
                  console.error("Error loading winery record:", err);
                  setWineryRecord(null);
                } finally {
                  setLoadingWinery(false);
                }
              } else {
                console.warn(
                  `Owner profile has invalid wineryId: ${JSON.stringify(state.data?.wineryId)}. ` +
                  `Dashboard will use fallback data. Run the admin repair utility to fix this.`
                );
                setWineryRecord(null);
              }
            }
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
          wineries={allWineries}
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
          wineries={allWineries}
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
      if (loadingWinery) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-4">Loading winery details...</p>
            </div>
          </div>
        );
      }
      return (
        <DashboardShell
          user={user}
          ownerProfile={ownerProfile}
          winery={wineryRecord}
          firestoreTrails={firestoreTrails}
        />
      );

    default:
      return null;
  }
}
