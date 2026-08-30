"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentDirectory from "@/components/StudentDirectory";
import ProfilePage from "@/components/ProfilePage";
import type { ProfileData } from "@/components/ProfilePage";

type ViewType = "directory" | "profile";

export default function FreespaceDirectory() {
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const [view, setView] = useState<ViewType>("directory");
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-white p-8">Loading...</main>;
  }

  if (!session) {
    router.replace("/");
    return null;
  }

  const handleBack = () => {
    if (view === "profile") {
      setView("directory");
      setViewingProfile(null);
    } else {
      logout();
      router.replace("/");
    }
  };

  const handleViewProfile = (profile: ProfileData) => {
    setViewingProfile(profile);
    setView("profile");
  };

  if (view === "profile" && viewingProfile) {
    return (
      <ProfilePage
        profile={viewingProfile}
        isOwner={viewingProfile.id === session.account.account_id}
        onBack={handleBack}
        onBrowse={() => setView("directory")}
      />
    );
  }

  return (
    <StudentDirectory
      onBack={handleBack}
      onViewProfile={handleViewProfile}
      currentUserId={session.account.account_id}
    />
  );
}
