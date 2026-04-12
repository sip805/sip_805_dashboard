// ==============================================================
// App.jsx - Root state router for the Sip805 winery dashboard
//
// TWO-PATH ONBOARDING FLOW:
//
//   1. Landing page (marketing + demo) - public, no auth
//   2. Sign Up / Sign In - creates or authenticates Firebase user
//   3. Auth check:
//      a. wineryOwners/{uid} exists    -> APPROVED -> Dashboard
//      b. wineryClaims/{uid} pending   -> ClaimPending
//      c. winerySubmissions/{uid} pending -> SubmissionPending
//      d. Neither -> ClaimWinery (two choices):
//         Path A: select existing winery -> submit claim
//         Path B: "Add My Winery" -> AddWinery form -> submission
//   4. Dashboard - locked to the owner's approved winery
//
// Admin functions (approve/reject) live in the separate
// sip805-admin app - nothing admin-related here.
// ==============================================================

import { useState, useEffect } from "react";
import { Clock, LogOut as LogOutIcon, Mail } from "lucide-react";
import {
  onAuthChange, getOwnerProfile, getClaimStatus,
  getSubmissionStatus, logOut
} from "./firebaseClient.js";
import Landing from "./Landing.jsx";
import SignUp from "./components/SignUp.jsx";
import SignIn from "./components/SignIn.jsx";
import ClaimWinery from "./components/ClaimWinery.jsx";
import AddWinery from "./components/AddWinery.jsx";
import ClaimPending from "./components/ClaimPending.jsx";
import DashboardShell from "./components/DashboardShell.jsx";

const SCREENS = {
  LANDING: "landing",
  SIGN_UP: "signUp",
  SIGN_IN: "signIn",
  LOADING: "loading",
  CLAIM_WINERY: "claimWinery",
  ADD_WINERY: "addWinery",
  CLAIM_PENDING: "claimPending",
  SUBMISSION_PENDING: "submissionPending",
  DASHBOARD: "dashboard",
};

// -- Inline pending screen for new-winery submissions --
// Similar to ClaimPending but with copy specific to new submissions
// (longer review time, different messaging).
function SubmissionPending({ wineryName }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Submission Under Review</h2>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          Your new winery submission for <span className="font-semibold">{wineryName}</span> is being reviewed.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Our team will add your winery to the Sip805 platform and grant you dashboard access once approved.
        </p>
        <p className="text-xs text-gray-400 mt-1">New winery reviews usually take 1-3 business days.</p>
        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">Questions? Reach out to us:</p>
          <a href="mailto:support@sip805.com" className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium mt-2 hover:underline">
            <Mail className="w-4 h-4" /> support@sip805.com
          </a>
        </div>
        <button onClick={logOut} className="mt-6 flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-gray-700 transition">
          <LogOutIcon className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// -- Main App component --
export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [pendingName, setPendingName] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOwnerProfile(null);
        setPendingName("");
        if (![SCREENS.LANDING, SCREENS.SIGN_UP, SCREENS.SIGN_IN].includes(screen)) {
          setScreen(SCREENS.LANDING);
        }
        return;
      }

      setUser(firebaseUser);
      setScreen(SCREENS.LOADING);

      try {
        // 1. Approved owner? -> dashboard
        const profile = await getOwnerProfile(firebaseUser.uid);
        if (profile) {
          setOwnerProfile(profile);
          setScreen(SCREENS.DASHBOARD);
          return;
        }

        // 2. Pending claim on existing winery?
        const claim = await getClaimStatus(firebaseUser.uid);
        if (claim && claim.status === "pending") {
          setPendingName(claim.wineryName || "your winery");
          setScreen(SCREENS.CLAIM_PENDING);
          return;
        }

        // 3. Pending new-winery submission?
        const sub = await getSubmissionStatus(firebaseUser.uid);
        if (sub && sub.status === "pending") {
          setPendingName(sub.wineryName || "your winery");
          setScreen(SCREENS.SUBMISSION_PENDING);
          return;
        }

        // 4. Nothing yet -> show claim / add winery screen
        setScreen(SCREENS.CLAIM_WINERY);
      } catch (err) {
        console.error("Error checking owner status:", err);
        setScreen(SCREENS.CLAIM_WINERY);
      }
    });

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Path A - claim an existing winery (or branch to Path B)
    case SCREENS.CLAIM_WINERY:
      return (
        <ClaimWinery
          user={user}
          onAddWinery={() => setScreen(SCREENS.ADD_WINERY)}
          onClaimSubmitted={(claimData) => {
            setPendingName(claimData.wineryName || "your winery");
            setScreen(SCREENS.CLAIM_PENDING);
          }}
        />
      );

    // Path B - submit a brand-new winery
    case SCREENS.ADD_WINERY:
      return (
        <AddWinery
          user={user}
          onBack={() => setScreen(SCREENS.CLAIM_WINERY)}
          onSubmitted={(data) => {
            setPendingName(data.wineryName || "your winery");
            setScreen(SCREENS.SUBMISSION_PENDING);
          }}
        />
      );

    case SCREENS.CLAIM_PENDING:
      return <ClaimPending wineryName={pendingName} />;

    case SCREENS.SUBMISSION_PENDING:
      return <SubmissionPending wineryName={pendingName} />;

    case SCREENS.DASHBOARD:
      return <DashboardShell user={user} ownerProfile={ownerProfile} />;

    default:
      return null;
  }
}
