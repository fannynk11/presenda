"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MySwal, { SwalCenter } from "@/utils/swal";
import "@/assets/css/Profil.css"; 
import "@/assets/css/Home.css";
interface UserData {
  nama: string;
  jabatan: string;
  nip: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.replace("/");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = async () => {
    const result = await SwalCenter.fire({
      title: "Keluar dari Akun?",
      text: "Anda harus login kembali untuk mengakses data Anda.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // Hapus session di server (cookie)
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout API failed", err);
      }
      
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="profil-page">
      <header className="profil-header">
        <h1 className="profil-header-title">Profil Pengguna</h1>
      </header>

      <main className="profil-content">
        <div className="profil-card">
          <div className="profil-avatar">
            <span className="profil-avatar-text">{getInitials(user.nama)}</span>
          </div>
          <h2 className="profil-name">{user.nama}</h2>
          <span className="profil-role">{user.jabatan}</span>

          <div className="profil-details">
            <div className="profil-detail-item">
              <span className="profil-detail-label">NIP</span>
              <span className="profil-detail-value">{user.nip || "-"}</span>
            </div>
            <div className="profil-detail-item">
              <span className="profil-detail-label">Status Akun</span>
              <span className="profil-detail-value" style={{ color: "#059669" }}>Aktif</span>
            </div>
          </div>
        </div>

        <button className="profil-btn-logout" onClick={handleLogout}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Keluar dari Akun
        </button>
      </main>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <nav className="home-bottom-nav">
        <Link href="/home" className="home-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>Home</span>
        </Link>
        <Link href="/agenda" className="home-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>Agenda</span>
        </Link>
        {user.jabatan === 'Admin' && (
          <Link href="/pegawai" className="home-nav-item">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Pegawai</span>
          </Link>
        )}
        <Link href="/arsip" className="home-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
          <span>Arsip</span>
        </Link>
        <Link href="/profil" className="home-nav-item home-nav-item--active">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Profil</span>
        </Link>
      </nav>
    </div>
  );
}
