"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SwalCenter } from "@/utils/swal";
import "@/assets/css/Home.css";

// Agenda type definition
interface LaporanItem {
  // Not needed here directly but keep generic structure
}

interface AgendaItem {
  id_agenda: number;
  judul: string;
  tanggal: string;
  waktu_mulai: string;
  tempat: string;
  status: "aktif" | "selesai" | "mendatang";
}

interface UserData {
  nama: string;
  jabatan: string;
  nip: string;
}

function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);

  useEffect(() => {
    // Cek apakah user sudah login
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

    const fetchAgendas = async () => {
      try {
        const res = await fetch("/api/agenda", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setAgendas(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch agendas", err);
      }
    };
    fetchAgendas();

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
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout API failed", err);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    }
  };

  const [greeting, setGreeting] = useState("Selamat Datang");
  const [todayFormatted, setTodayFormatted] = useState("");

  // Dynamic greeting berdasarkan waktu (hanya di client agar tidak hydration mismatch)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    setTodayFormatted(new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }));
  }, []);

  // Format tanggal Indonesia
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("id-ID", { month: "short" }),
    };
  };  // Calculate stats from real data
  const agendaAktif = agendas.filter((a) => a.status === "aktif");
  const agendaMendatang = agendas.filter((a) => a.status === "mendatang");
  const agendaSelesai = agendas.filter((a) => a.status === "selesai");

  const stats = {
    aktif: agendaAktif.length,
    mendatang: agendaMendatang.length,
    arsip: agendaSelesai.length,
  };

  const statusLabel: Record<string, string> = {
    aktif: "Aktif",
    selesai: "Selesai",
    mendatang: "Mendatang",
  };

  if (!user) return null;

  return (
    <div className="home-page">
      {/* ===== TOP HEADER ===== */}
      <header className="home-header">
        <div className="home-header-brand">
          <Image
            src="/presenda.png"
            alt="Presenda"
            className="home-header-logo"
            width={36}
            height={36}
          />
          <h1 className="home-header-title">Presenda</h1>
        </div>

        <div className="home-header-actions">
          <button className="home-btn-logout" onClick={handleLogout}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Keluar
          </button>
        </div>
      </header>

      {/* ===== GREETING ===== */}
      <section className="home-greeting">
        <p className="home-greeting-text">{greeting},</p>
        <h2 className="home-greeting-name">{user.nama}</h2>
        <p className="home-greeting-date">{todayFormatted}</p>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className="home-content">
        {/* Stat Cards */}
        <div className="home-stats">
          {/* Total Agenda Aktif */}
          <Link href="/agenda" className="home-stat-card" style={{ textDecoration: 'none' }}>
            <div className="home-stat-icon home-stat-icon--aktif">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div className="home-stat-info">
              <span className="home-stat-number">{stats.aktif}</span>
              <span className="home-stat-label">Agenda Aktif</span>
            </div>
          </Link>

          {/* Agenda Mendatang */}
          <Link href="/agenda" className="home-stat-card" style={{ textDecoration: 'none' }}>
            <div className="home-stat-icon home-stat-icon--mendatang">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="home-stat-info">
              <span className="home-stat-number">{stats.mendatang}</span>
              <span className="home-stat-label">Agenda Mendatang</span>
            </div>
          </Link>

          {/* Arsip */}
          <Link href="/arsip" className="home-stat-card" style={{ textDecoration: 'none' }}>
            <div className="home-stat-icon home-stat-icon--arsip">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <div className="home-stat-info">
              <span className="home-stat-number">{stats.arsip}</span>
              <span className="home-stat-label">Arsip</span>
            </div>
          </Link>
        </div>

        {/* Quick Action */}
        {user.jabatan === 'Admin' && (
          <div className="home-quick-action">
            <Link
              href="/agenda"
              className="home-btn-create"
              style={{ textDecoration: 'none' }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Buat Agenda Baru
            </Link>
          </div>
        )}

        {/* Agenda Terbaru */}
        <section>
          <div className="home-section-header">
            <h3 className="home-section-title">Agenda Terbaru</h3>
            <Link href="/agenda" className="home-section-link">
              Lihat Semua →
            </Link>
          </div>

          <div className="home-agenda-list">
            {agendaAktif.length === 0 ? (
              <div className="home-agenda-empty">
                <p>Belum ada agenda aktif terdekat.</p>
              </div>
            ) : (
              agendaAktif.slice(0, 5).map((agenda) => {
                const date = formatDate(agenda.tanggal);
                return (
                  <Link key={agenda.id_agenda} href="/agenda" className="home-agenda-card" style={{ textDecoration: 'none' }}>
                    {/* Date Badge */}
                    <div className="home-agenda-date-badge">
                      <span className="home-agenda-date-day">{date.day}</span>
                      <span className="home-agenda-date-month">{date.month}</span>
                    </div>

                    {/* Info */}
                    <div className="home-agenda-info">
                      <h4 className="home-agenda-title">{agenda.judul}</h4>
                      <div className="home-agenda-meta">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{agenda.tempat}</span>
                      </div>
                      <span
                        className={`home-agenda-status home-agenda-status--${agenda.status}`}
                      >
                        <span className="home-agenda-status-dot" />
                        {statusLabel[agenda.status]}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ===== BOTTOM NAVIGATION (Mobile) ===== */}
      <nav className="app-bottom-nav">
        <Link href="/home" className="app-nav-item app-nav-item--active">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/agenda" className="app-nav-item">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Agenda</span>
        </Link>

        {user.jabatan === "Admin" && (
          <Link href="/pegawai" className="app-nav-item">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Pegawai</span>
          </Link>
        )}

        <Link href="/arsip" className="app-nav-item">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <span>Arsip</span>
        </Link>

        <Link href="/profil" className="app-nav-item">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Profil</span>
        </Link>
      </nav>
    </div>
  );
}

export default Home;
