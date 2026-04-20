"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import MySwal, { SwalCenter, SwalToast } from "@/utils/swal";
import "@/assets/css/Agenda.css";
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

function Agenda() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  // Presensi State
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [presensiList, setPresensiList] = useState<any[]>([]);
  const [loadingPresensi, setLoadingPresensi] = useState(false);

  // Form state
  const [form, setForm] = useState({
    judul: "",
    tanggal: "",
    waktu_mulai: "",
    tempat: "",
    deskripsi: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  // Get token on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!t || !userData) {
      router.replace("/");
    } else {
      setToken(t);
      try {
        setUser(JSON.parse(userData));
      } catch {
        router.replace("/");
      }
    }
  }, [router]);

  // Fetch agendas
  const fetchAgendas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/agenda", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Filter out agendas that are completely finished from the main list
        const activeAgendas = data.data.filter((a: AgendaItem) => a.status !== 'selesai');
        setAgendas(activeAgendas);
      }
    } catch {
      console.error("Gagal mengambil data agenda");
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

  // Create agenda
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setShowCreateModal(false);
        setForm({ judul: "", tanggal: "", waktu_mulai: "", tempat: "", deskripsi: "" });
        fetchAgendas();
        SwalCenter.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Agenda baru telah berhasil dibuat.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete agenda
  const handleDelete = async (id: number) => {
    const result = await SwalCenter.fire({
      title: "Hapus Agenda?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
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
        SwalCenter.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Agenda telah berhasil dihapus dari sistem.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch {
      SwalCenter.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menghapus agenda",
      });
    }
  };

  // Mark agenda as selesai
  const handleMarkSelesai = async (id: number) => {
    const result = await SwalCenter.fire({
      title: "Selesaikan Agenda?",
      text: "Agenda akan dipindah ke folder Arsip.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesai",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/agenda/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "selesai" })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedAgenda(null);
        fetchAgendas();
        SwalCenter.fire({
          icon: "success",
          title: "Selesai!",
          text: "Agenda telah berhasil dipindah ke Arsip.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        SwalCenter.fire({
          icon: "error",
          title: "Gagal",
          text: data.message || "Gagal memperbarui status",
        });
      }
    } catch {
      SwalCenter.fire({
        icon: "error",
        title: "Terjadi kesalahan sistem",
      });
    }
  };

  // Copy link
  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("id-ID", { month: "short" }),
      full: date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  };

  const formatTime = (timeStr: string) => {
    return timeStr ? timeStr.substring(0, 5) : "";
  };

  const statusLabel: Record<string, string> = {
    aktif: "Aktif",
    selesai: "Selesai",
    mendatang: "Mendatang",
  };

  const getPresensiLink = (id: number) => {
    return `${window.location.origin}/presensi/${id}`;
  };

  const displayedAgendas = agendas.filter((a) => {
    const matchSearch = a.judul.toLowerCase().includes(searchQuery.toLowerCase()) || a.tempat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "semua" ? true : a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="agenda-page">
      {/* ===== HEADER ===== */}
      <header className="agenda-header">
        <div className="agenda-header-left">
          <Link href="/home" className="agenda-btn-back">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="agenda-header-title">Agenda</h1>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <main className="agenda-content">
        {/* Create Button */}
        {user?.jabatan === 'Admin' && (
          <div className="agenda-create-section">
            <button className="agenda-btn-create" onClick={() => setShowCreateModal(true)}>
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat Agenda Baru
            </button>
          </div>
        )}

        {/* Filter Section */}
        <div className="agenda-filters">
          <input 
            type="text" 
            className="agenda-search-input" 
            placeholder="Cari acara atau tempat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="agenda-filter-group">
            <select 
              className="agenda-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="mendatang">Mendatang</option>
            </select>
          </div>
        </div>

        {/* Agenda List */}
        {loading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner" />
          </div>
        ) : displayedAgendas.length === 0 ? (
          <div className="agenda-empty">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="agenda-empty-title">Agenda Tidak Ditemukan</p>
            <p className="agenda-empty-text">Coba ubah kata kunci atau filter status</p>
          </div>
        ) : (
          <div className="agenda-list">
            {displayedAgendas.map((agenda, index) => {
              const date = formatDate(agenda.tanggal);
              return (
                <div
                  key={agenda.id_agenda}
                  className="agenda-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setSelectedAgenda(agenda)}
                >
                  <div className="agenda-card-date">
                    <span className="agenda-card-day">{date.day}</span>
                    <span className="agenda-card-month">{date.month}</span>
                  </div>
                  <div className="agenda-card-info">
                    <h3 className="agenda-card-title">{agenda.judul}</h3>
                    <div className="agenda-card-meta">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(agenda.waktu_mulai)}</span>
                    </div>
                    <div className="agenda-card-meta">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{agenda.tempat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                      <span className={`agenda-card-status agenda-card-status--${agenda.status}`}>
                        <span className="agenda-card-status-dot" />
                        {statusLabel[agenda.status]}
                      </span>
                      {agenda.status !== 'selesai' && user?.jabatan === 'Admin' && (
                        <button
                          className="agenda-btn-quick-selesai"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkSelesai(agenda.id_agenda);
                          }}
                        >
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Selesaikan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div className="agenda-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agenda-modal-header">
              <h2 className="agenda-modal-title">Buat Agenda Baru</h2>
              <button className="agenda-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="agenda-modal-body">
              <form className="agenda-form" onSubmit={handleCreate}>
                {formError && <div className="agenda-form-error">{formError}</div>}

                <div className="agenda-form-group">
                  <label className="agenda-form-label">
                    Nama Kegiatan <span>*</span>
                  </label>
                  <input
                    type="text"
                    className="agenda-form-input"
                    placeholder="Contoh: Rapat Koordinasi Bulanan"
                    value={form.judul}
                    onChange={(e) => setForm({ ...form, judul: e.target.value })}
                    required
                  />
                </div>

                <div className="agenda-form-row">
                  <div className="agenda-form-group">
                    <label className="agenda-form-label">
                      Tanggal <span>*</span>
                    </label>
                    <input
                      type="date"
                      className="agenda-form-input"
                      value={form.tanggal}
                      onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                      required
                    />
                  </div>
                  <div className="agenda-form-group">
                    <label className="agenda-form-label">
                      Waktu Mulai <span>*</span>
                    </label>
                    <input
                      type="time"
                      className="agenda-form-input"
                      value={form.waktu_mulai}
                      onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="agenda-form-group">
                  <label className="agenda-form-label">
                    Tempat Pelaksanaan <span>*</span>
                  </label>
                  <input
                    type="text"
                    className="agenda-form-input"
                    placeholder="Contoh: Ruang Rapat Utama Lt. 2"
                    value={form.tempat}
                    onChange={(e) => setForm({ ...form, tempat: e.target.value })}
                    required
                  />
                </div>

                <div className="agenda-form-group">
                  <label className="agenda-form-label">Deskripsi (opsional)</label>
                  <textarea
                    className="agenda-form-textarea"
                    placeholder="Deskripsi kegiatan..."
                    value={form.deskripsi}
                    onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  />
                </div>

                <button type="submit" className="agenda-form-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="agenda-spinner" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Agenda"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {selectedAgenda && (
        <div className="agenda-modal-overlay" onClick={() => setSelectedAgenda(null)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agenda-modal-header">
              <h2 className="agenda-modal-title">Detail Agenda</h2>
              <button className="agenda-modal-close" onClick={() => setSelectedAgenda(null)}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="agenda-modal-body">
              {/* Agenda Info */}
              <div className="agenda-detail-info">
                <h3 className="agenda-detail-title">{selectedAgenda.judul}</h3>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDate(selectedAgenda.tanggal).full}</span>
                </div>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Pukul {formatTime(selectedAgenda.waktu_mulai)} WIB</span>
                </div>

                <div className="agenda-detail-row">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedAgenda.tempat}</span>
                </div>

                {selectedAgenda.deskripsi && (
                  <p className="agenda-detail-desc">{selectedAgenda.deskripsi}</p>
                )}

                <span className={`agenda-card-status agenda-card-status--${selectedAgenda.status}`}>
                  <span className="agenda-card-status-dot" />
                  {statusLabel[selectedAgenda.status]}
                </span>
              </div>

              {/* Link Presensi */}
              <div className="agenda-link-section">
                <span className="agenda-link-label">Link Presensi</span>
                <div className="agenda-link-box">
                  <span className="agenda-link-url">
                    {getPresensiLink(selectedAgenda.id_agenda)}
                  </span>
                  <button
                    className={`agenda-btn-copy ${copied ? "agenda-btn-copy--copied" : ""}`}
                    onClick={() => handleCopy(getPresensiLink(selectedAgenda.id_agenda))}
                  >
                    {copied ? (
                      <>
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* QR Code */}
                <div className="agenda-qr-section">
                  <div className="agenda-qr-wrapper">
                    <QRCodeSVG
                      value={getPresensiLink(selectedAgenda.id_agenda)}
                      size={200}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#1b5e20"
                      includeMargin={false}
                    />
                  </div>
                  <p className="agenda-qr-text">
                    Scan QR code untuk mengisi presensi
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="agenda-detail-actions">
                <button
                  className="agenda-btn-download"
                  onClick={() => generatePDF(selectedAgenda, presensiList, "/logo_mini.png")}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-3-3m3 3l3-3m-9 5h12" />
                  </svg>
                  Unduh PDF Daftar Hadir
                </button>

                {selectedAgenda.status !== 'selesai' && user?.jabatan === 'Admin' && (
                  <button
                    onClick={() => handleMarkSelesai(selectedAgenda.id_agenda)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      border: '1.5px solid #c8e6c9',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#c8e6c9'; e.currentTarget.style.borderColor = '#2e7d32'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#e8f5e9'; e.currentTarget.style.borderColor = '#c8e6c9'; }}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Tandai Selesai & Arsipkan
                  </button>
                )}

                {user?.jabatan === 'Admin' && (
                  <button
                    className="agenda-btn-delete"
                    onClick={() => handleDelete(selectedAgenda.id_agenda)}
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Hapus Agenda
                  </button>
                )}
              </div>

              {/* Daftar Hadir */}
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
        <Link href="/home" className="app-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/agenda" className="app-nav-item app-nav-item--active">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Agenda</span>
        </Link>

        {user?.jabatan === 'Admin' && (
          <Link href="/pegawai" className="app-nav-item">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <span>Arsip</span>
        </Link>

        <Link href="/profil" className="app-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

export default Agenda;
