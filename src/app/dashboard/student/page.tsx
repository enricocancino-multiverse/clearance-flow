"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import StudentDashboardComponent from "@/components/StudentDashboard";
import ProfilePage from "@/components/ProfilePage";
import StudentDirectory from "@/components/StudentDirectory";
import type { ProfileData } from "@/components/ProfilePage";
import { DEPT_CONFIG } from "@/types";

type ViewType = "dashboard" | "profile" | "directory";

export default function StudentDashboard() {
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const { isDark } = useTheme();
  const [view, setView] = useState<ViewType>("dashboard");
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-white p-8">Loading...</main>;
  }

  if (!session || !session.student) {
    router.replace("/");
    return null;
  }

  const { account, student } = session;
  const cfg = DEPT_CONFIG[student.department];

  const initials = account.email.slice(0, 2).toUpperCase();
  const yearSuffix = ["st", "nd", "rd", "th"][Math.min(student.year_level - 1, 3)];

  // Get user's own profile data
  const userProfile: ProfileData = {
    id: account.account_id,
    name: account.email.split("@")[0],
    role: "student",
    dept: student.department,
    studentNumber: student.school_id,
    yearLevel: student.year_level,
    section: student.section,
    bio: account.bio || "No bio yet.",
    avatarUrl: account.avatar_url,
    coverUrl: null,
    highlights: [],
    joinedAt: new Date(account.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    }),
  };

  // Handle back navigation
  const handleBack = () => {
    if (view === "profile" || view === "directory") {
      setView("dashboard");
      setViewingProfile(null);
    } else {
      logout();
      router.replace("/");
    }
  };

  // Handle profile view
  const handleViewProfile = (profile: ProfileData) => {
    setViewingProfile(profile);
    setView("profile");
  };

  if (view === "profile" && viewingProfile) {
    return (
      <ProfilePage
        profile={viewingProfile}
        isOwner={viewingProfile.id === account.account_id}
        onBack={handleBack}
        onBrowse={() => setView("directory")}
      />
    );
  }

  if (view === "directory") {
    return (
      <StudentDirectory
        onBack={handleBack}
        onViewProfile={handleViewProfile}
        currentUserId={account.account_id}
      />
    );
  }

  return (
    <StudentDashboardComponent
      currentUserId={account.account_id}
      userName={account.email.split("@")[0]}
      studentNumber={student.school_id}
      yearLevel={student.year_level}
      section={student.section}
      dept={student.department}
      onViewProfile={() => handleViewProfile(userProfile)}
      onBrowse={() => setView("directory")}
    />
  );
}
