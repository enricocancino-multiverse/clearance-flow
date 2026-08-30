"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminDashboardComponent from "@/components/AdminDashboard";
import ProfilePage from "@/components/ProfilePage";
import type { ProfileData } from "@/components/ProfilePage";
import { DEPT_CONFIG } from "@/types";

type ViewType = "dashboard" | "profile";

export default function AdminDashboard() {
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const [view, setView] = React.useState<ViewType>("dashboard");

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-white p-8">Loading...</main>;
  }

  if (!session || !session.faculty?.is_superadmin) {
    router.replace("/");
    return null;
  }

  const { account, faculty } = session;
  const cfg = DEPT_CONFIG[faculty.department];

  const userProfile: ProfileData = {
    id: account.account_id,
    name: account.email.split("@")[0],
    role: "superadmin",
    dept: faculty.department,
    position: "SuperAdmin · System Administrator",
    email: account.email,
    bio: account.bio || "No bio yet.",
    avatarUrl: account.avatar_url,
    coverUrl: null,
    highlights: [],
    joinedAt: new Date(account.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    }),
  };

  const handleBack = () => {
    if (view === "profile") {
      setView("dashboard");
    } else {
      logout();
      router.replace("/");
    }
  };

  if (view === "profile") {
    return (
      <ProfilePage
        profile={userProfile}
        isOwner={true}
        onBack={handleBack}
        onBrowse={() => router.push("/freespace")}
      />
    );
  }

  return (
    <AdminDashboardComponent
      onBack={handleBack}
      onViewProfile={() => setView("profile")}
    />
  );
}
