"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MySwal, { SwalCenter, SwalToast } from "@/utils/swal";
import "@/assets/css/Agenda.css"; // Reuse Agenda styles
import { generatePDF } from "@/utils/generatePDF";

interface AgendaItem {
  id_agenda: number;
  judul: string;
  tanggal: string;
  waktu_mulai: string;
  tempat: string;
  deskripsi: string | null;
  status: "aktif" | "selesai" | "mendatang";
  creator_name: string;
  created_at: string;
}

interface UserData {
  nama: string;
  jabatan: string;
  nip: string;
}

function Arsip() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("semua");
  const [yearFilter, setYearFilter] = useState("semua");

  // Presensi State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [presensiList, setPresensiList] = useState<any[]>([]);
  const [loadingPresensi, setLoadingPresensi] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Check auth
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");

    if (!t || !u) {
      router.replace("/");
    } else {
      setToken(t);
      try {
        setCurrentUser(JSON.parse(u));
      } catch {
        router.replace("/");
      }
    }
  }, [router]);

  // Fetch only past/selesai agendas
  const fetchAgendas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/agenda", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Filter: ONLY show 'selesai' agendas that have been marked manually
        const completed = data.data.filter((a: AgendaItem) => a.status === 'selesai');
        setAgendas(completed);
      }
    } catch {
      console.error("Gagal mengambil data arsip agenda");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  // Fetch presensi list when an agenda is selected
  useEffect(() => {
    if (selectedAgenda && token) {
      const fetchPresensi = async () => {
        setLoadingPresensi(true);
        try {
          const res = await fetch(`/api/presensi/${selectedAgenda.id_agenda}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setPresensiList(data.data);
          }
        } catch {
          console.error("Gagal mengambil data daftar hadir");
        } finally {
          setLoadingPresensi(false);
        }
      };
      fetchPresensi();
    } else {
      setPresensiList([]);
    }
  }, [selectedAgenda, token]);

  const handleDelete = async (id: number) => {
    const result = await SwalCenter.fire({
      title: "Hapus Arsip Kegiatan?",
      text: "Data agenda dan seluruh daftar hadir terkait akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/agenda/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedAgenda(null);
        fetchAgendas();
        SwalToast.fire({ icon: "success", title: "Arsip agenda dihapus" });
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch {
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan sistem saat menghapus" });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Derived state for filtering
  const availableYears = Array.from(new Set(agendas.map(a => new Date(a.tanggal).getFullYear().toString()))).sort((a, b) => b.localeCompare(a));

  const displayedAgendas = agendas.filter((a) => {
    const matchSearch = a.judul.toLowerCase().includes(searchQuery.toLowerCase()) || a.tempat.toLowerCase().includes(searchQuery.toLowerCase());
    const dateObj = new Date(a.tanggal);
    const month = (dateObj.getMonth() + 1).toString();
    const year = dateObj.getFullYear().toString();
    
    const matchMonth = monthFilter === "semua" ? true : month === monthFilter;
    const matchYear = yearFilter === "semua" ? true : year === yearFilter;
    
    return matchSearch && matchMonth && matchYear;
  });

  if (!currentUser) return null;

  return (
    <div className="agenda-page">
      {/* Top Header */}
      <div className="agenda-header">
        <div className="agenda-header-left">
          <Link href="/home" className="agenda-btn-back">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="agenda-header-title">Arsip Kegiatan</h1>
        </div>
      </div>

      <div className="agenda-content">
        {/* Filter Section */}
        <div className="agenda-filters">
          <input 
            type="text" 
            className="agenda-search-input" 
            placeholder="Cari arsip acara atau tempat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="agenda-filter-group">
            <select 
              className="agenda-filter-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="semua">Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <select 
              className="agenda-filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="semua">Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List of Agendas */}
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" />
          </div>
        ) : displayedAgendas.length === 0 ? (
          <div className="agenda-empty">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="agenda-empty-title">Arsip Tidak Ditemukan</h2>
            <p className="agenda-empty-text">Coba ubah kata kunci atau filter waktu pencarian.</p>
          </div>
        ) : (
          <div className="agenda-list">
            {displayedAgendas.map((agenda) => {
              const dateObj = new Date(agenda.tanggal);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString("id-ID", { month: "short" });

              return (
                <div key={agenda.id_agenda} className="agenda-card" onClick={() => setSelectedAgenda(agenda)}>
                  <div className="agenda-card-date">
                    <span className="agenda-card-day">{day}</span>
                    <span className="agenda-card-month">{month}</span>
                  </div>
                  <div className="agenda-card-info">
                    <h3 className="agenda-card-title">{agenda.judul}</h3>
                    <div className="agenda-card-meta">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {agenda.waktu_mulai.substring(0, 5)} WIB
                    </div>
                    <div className="agenda-card-status agenda-card-status--selesai">
                       Selesai
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedAgenda && (
        <div className="agenda-modal-overlay" onClick={() => setSelectedAgenda(null)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agenda-modal-header">
              <h2 className="agenda-modal-title">Arsip Kegiatan</h2>
              <button className="agenda-modal-close" onClick={() => setSelectedAgenda(null)}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="agenda-modal-body">
              <div className="agenda-detail-info">
                <h3 className="agenda-detail-title">{selectedAgenda.judul}</h3>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(selectedAgenda.tanggal)}</span>
                </div>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{selectedAgenda.waktu_mulai.substring(0, 5)} WIB s.d Selesai</span>
                </div>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedAgenda.tempat}</span>
                </div>

                {selectedAgenda.deskripsi && (
                  <p className="agenda-detail-desc">{selectedAgenda.deskripsi}</p>
                )}
              </div>

              {/* Download PDF Button */}
              <div className="agenda-detail-actions">
                <button
                  className="agenda-btn-download"
                  onClick={() => generatePDF(selectedAgenda, presensiList, "/logo_mini.png")}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-3-3m3 3l3-3m-9 5h12" />
                  </svg>
                  Unduh PDF Daftar Hadir
                </button>

                {currentUser.jabatan === "Admin" && (
                  <button
                    className="agenda-btn-delete"
                    onClick={() => handleDelete(selectedAgenda.id_agenda)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                      fontWeight: 600,
                      border: '2px solid #fee2e2',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus Agenda
                  </button>
                )}
              </div>

              {/* Daftar Hadir List */}
              <div className="agenda-presensi-section">
                <div className="agenda-presensi-header">
                  <span>Daftar Presensi</span>
                  <span className="agenda-presensi-count">{presensiList.length} Orang</span>
                </div>

                {loadingPresensi ? (
                  <div className="agenda-presensi-empty">Memuat data...</div>
                ) : presensiList.length === 0 ? (
                  <div className="agenda-presensi-empty">Belum ada yang mengisi presensi</div>
                ) : (
                  <div className="agenda-presensi-list">
                    {presensiList.map((p) => (
                      <div key={p.id_user} className="agenda-presensi-item">
                        <div className="agenda-presensi-row">
                          <div className="agenda-presensi-user">
                            <span className="agenda-presensi-name">{p.nama}</span>
                            <span className="agenda-presensi-jabatan">{p.jabatan}</span>
                          </div>
                          <span className={`agenda-presensi-status agenda-presensi-status--${p.status_hadir}`}>
                            {p.status_hadir}
                          </span>
                        </div>

                        {p.status_hadir === "hadir" && p.tanda_tangan && (
                          <div className="agenda-presensi-signature">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.tanda_tangan} alt={`Tanda Tangan ${p.nama}`} />
                          </div>
                        )}

                        {p.status_hadir === "izin" && p.alasan_izin && (
                          <div className="agenda-presensi-alasan">
                            Alasan: {p.alasan_izin}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION ===== */}
      <nav className="app-bottom-nav">
        {[
          { href: "/home", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { href: "/agenda", label: "Agenda", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { href: "/pegawai", label: "Pegawai", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", adminOnly: true },
          { href: "/arsip", label: "Arsip", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
          { href: "/profil", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        ].map((item) => {
          if (item.adminOnly && currentUser.jabatan !== "Admin") return null;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`app-nav-item ${item.href === "/arsip" ? "app-nav-item--active" : ""}`}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Arsip;
