"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FreespaceDashboard from "@/components/FreespaceDashboard";
import ProfilePage from "@/components/ProfilePage";
import type { ProfileData } from "@/components/ProfilePage";

export default function FreespaceDirectory() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-white p-8">Loading...</main>;
  }

  if (!session) {
    router.replace("/");
    return null;
  }

  const handleBack = () => {
    if (viewingProfile) {
      setViewingProfile(null);
      return;
    }
    if (session.account.role === "student") {
      router.push("/dashboard/student");
      return;
    }
    if (session.faculty?.is_superadmin) {
      router.push("/dashboard/admin");
      return;
    }
    if (session.account.role === "faculty") {
      router.push("/dashboard/faculty");
      return;
    }
    router.push("/");
  };

  if (viewingProfile) {
    return (
      <ProfilePage
        profile={viewingProfile}
        isOwner={viewingProfile.id === session.account.account_id}
        onBack={handleBack}
        onBrowse={() => setViewingProfile(null)}
      />
    );
  }

  return (
    <FreespaceDashboard
      currentUserId={session.account.account_id}
      currentUserName={session.account.email.split("@")[0]}
      onBack={handleBack}
      onViewProfile={setViewingProfile}
    />
  );
}
