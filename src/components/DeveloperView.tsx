"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import FacultyDashboard from "@/components/FacultyDashboard";
import FreespaceDashboard from "@/components/FreespaceDashboard";
import ProfilePage, { type ProfileData } from "@/components/ProfilePage";
import StudentDashboard from "@/components/StudentDashboard";
import { createDeveloperSession } from "@/lib/developerSession";
import { DEPT_CONFIG, type UserRole } from "@/types";

type Surface = "student" | "faculty" | "admin" | "directory" | "freespace" | "profile";

const SURFACES: Array<{ id: Surface; label: string; role?: UserRole }> = [
  { id: "student", label: "Student", role: "student" },
  { id: "faculty", label: "Faculty", role: "faculty" },
  { id: "admin", label: "Admin", role: "superadmin" },
  { id: "directory", label: "Directory" },
  { id: "freespace", label: "Free space" },
];

function profileFor(session: ReturnType<typeof createDeveloperSession>): ProfileData {
  const { account, student, faculty } = session;
  return {
    id: account.account_id,
    name: account.email.split("@")[0],
    role: account.role,
    dept: student?.department ?? faculty?.department ?? "cs",
    studentNumber: student?.school_id,
    email: account.email,
    yearLevel: student?.year_level,
    section: student?.section,
    position: faculty?.position,
    bio: account.bio ?? "",
    avatarUrl: account.avatar_url,
    coverUrl: null,
    highlights: [],
    joinedAt: "January 2026",
  };
}

export default function DeveloperView() {
  const router = useRouter();
  const [surface, setSurface] = useState<Surface>("student");
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);
  const session = createDeveloperSession(activeRole);
  const ownProfile = profileFor(session);

  const chooseSurface = (nextSurface: Surface) => {
    setViewingProfile(null);
    setSurface(nextSurface);
  };

  const chooseRole = (role: UserRole, nextSurface: Surface) => {
    setActiveRole(role);
    setViewingProfile(null);
    setSurface(nextSurface);
  };

  const backToRole = () => {
    setViewingProfile(null);
    setSurface(activeRole === "student" ? "student" : activeRole === "faculty" ? "faculty" : "admin");
  };

  const renderSurface = () => {
    if (surface === "profile" && viewingProfile) {
      return (
        <ProfilePage
          profile={viewingProfile}
          isOwner={viewingProfile.id === ownProfile.id}
          onBack={backToRole}
          onBrowse={() => chooseSurface("directory")}
        />
      );
    }

    if (surface === "freespace") {
      return (
        <FreespaceDashboard
          currentUserId={ownProfile.id}
          currentUserName={ownProfile.name}
          onBack={backToRole}
        />
      );
    }

    if (surface === "directory") {
      return (
        <FreespaceDashboard
          initialView="directory"
          currentUserId={ownProfile.id}
          currentUserName={ownProfile.name}
          onBack={backToRole}
          onViewProfile={(profile) => {
            setViewingProfile(profile);
            setSurface("profile");
          }}
        />
      );
    }

    if (surface === "admin") {
      return <AdminDashboard onViewProfile={() => { setViewingProfile(ownProfile); setSurface("profile"); }} onFreespace={() => chooseSurface("freespace")} onSignOut={() => router.push("/")} />;
    }

    if (surface === "faculty") {
      const faculty = session.faculty!;
      return (
        <FacultyDashboard
          deptName={DEPT_CONFIG[faculty.department].label}
          deptKey={faculty.department}
          facultyName={faculty.position}
          onViewProfile={() => { setViewingProfile(ownProfile); setSurface("profile"); }}
          onFreespace={() => chooseSurface("freespace")}
          onSignOut={() => router.push("/")}
        />
      );
    }

    const student = session.student!;
    return (
      <StudentDashboard
        currentUserId={session.account.account_id}
        userName={session.account.email.split("@")[0]}
        studentNumber={student.school_id}
        yearLevel={student.year_level}
        section={student.section}
        dept={student.department}
        onViewProfile={() => { setViewingProfile(ownProfile); setSurface("profile"); }}
        onBrowse={() => chooseSurface("directory")}
        onSignOut={() => router.push("/")}
      />
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Developer view</p>
            <p className="text-sm text-slate-400">Unauthenticated UI workbench</p>
          </div>
          <button type="button" onClick={() => router.push("/")} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500 hover:text-white">
            Back to sign in
          </button>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1" aria-label="Developer surfaces">
          {SURFACES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.role ? chooseRole(item.role, item.id) : chooseSurface(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${surface === item.id ? "bg-blue-500 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <div>{renderSurface()}</div>
    </main>
  );
}