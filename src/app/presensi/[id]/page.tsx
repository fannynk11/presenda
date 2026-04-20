"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import MySwal, { SwalCenter, SwalToast } from "@/utils/swal";
import "@/assets/css/Presensi.css";

interface AgendaData {
  id_agenda: number;
  judul: string;
  tanggal: string;
  waktu_mulai: string;
  tempat: string;
  deskripsi: string | null;
}

interface UserOption {
  id_user: number;
  nama: string;
  jabatan: string;
  nip: string;
  golongan: string;
  nama_satpel: string;
}

function Presensi() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualJabatan, setManualJabatan] = useState("");
  const [statusHadir, setStatusHadir] = useState<"hadir" | "izin" | "">("");
  const [alasanIzin, setAlasanIzin] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Canvas drawing state
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Fetch agenda & users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agendaRes, usersRes] = await Promise.all([
          fetch(`/api/agenda/${id}`),
          fetch("/api/users/non-admin"),
        ]);

        const agendaData = await agendaRes.json();
        const usersData = await usersRes.json();

        if (!agendaData.success) {
          setNotFound(true);
        } else {
          setAgenda(agendaData.data);
        }

        if (usersData.success) {
          setUsers(usersData.data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Setup canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1a1a1a";
  }, []);

  useEffect(() => {
    if (statusHadir === "hadir") {
      // Small delay to ensure canvas is rendered
      setTimeout(setupCanvas, 50);
    }
  }, [statusHadir, setupCanvas]);

  // Canvas drawing helpers
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  // Handle user selection
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    setError("");

    if (userId) {
      const user = users.find((u) => u.id_user === parseInt(userId));
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Silakan pilih nama Anda");
      return;
    }
    if (!statusHadir) {
      setError("Silakan pilih status kehadiran");
      return;
    }
    if (statusHadir === "hadir" && !hasDrawn) {
      setError("Silakan buat tanda tangan Anda");
      return;
    }
    if (statusHadir === "izin" && !alasanIzin.trim()) {
      setError("Silakan isi alasan tidak hadir");
      return;
    }

    if (selectedUserId === "manual" && !manualName.trim()) {
      setError("Silakan isi nama Anda (wajib)");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_agenda: parseInt(id!),
          id_user: selectedUserId === "manual" ? null : parseInt(selectedUserId),
          isManual: selectedUserId === "manual",
          manualName: manualName.trim(),
          manualJabatan: manualJabatan.trim(),
          status_hadir: statusHadir,
          tanda_tangan: statusHadir === "hadir" ? getSignatureData() : null,
          alasan_izin: statusHadir === "izin" ? alasanIzin : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        SwalCenter.fire({
          icon: "success",
          title: "Berhasil!",
          text: data.message,
          confirmButtonText: "Selesai",
        }).then(() => {
          setSuccess(true);
          setSuccessMessage(data.message);
        });
      } else {
        setError(data.message);
        SwalCenter.fire({
          icon: "error",
          title: "Gagal",
          text: data.message,
        });
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr ? timeStr.substring(0, 5) : "";
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="presensi-page">
        <div className="presensi-loading">
          <div className="presensi-loading-spinner" />
        </div>
      </div>
    );
  }

  if (notFound || !agenda) {
    return (
      <div className="presensi-page">
        <div className="presensi-banner">
          <div className="presensi-banner-brand">Presenda</div>
        </div>
        <div className="presensi-content">
          <div className="presensi-card">
            <div className="presensi-not-found">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2>Agenda Tidak Ditemukan</h2>
              <p>Link presensi tidak valid atau agenda telah dihapus.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tentukan apakah agenda aktif (khusus hari H) secara zona waktu lokal
  const getLocalDateString = (d: Date) => {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  const todayStr = getLocalDateString(new Date());
  const agendaDateStr = getLocalDateString(new Date(agenda.tanggal));

  const isAktif = todayStr === agendaDateStr;
  const isMendatang = agendaDateStr > todayStr;

  if (!isAktif) {
    return (
      <div className="presensi-page">
        <div className="presensi-banner">
          <div className="presensi-banner-brand">Presenda</div>
          <h1 className="presensi-banner-title">{agenda.judul}</h1>
        </div>
        <div className="presensi-content">
          <div className="presensi-card">
            <div className="presensi-not-found">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2>Presensi {isMendatang ? "Belum Dibuka" : "Sudah Ditutup"}</h2>
              <p>
                {isMendatang
                  ? "Presensi hanya dapat diisi pada hari pelaksanaan agenda (aktif)."
                  : "Agenda ini sudah selesai. Presensi tidak lagi dapat diisi."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="presensi-page">
        <div className="presensi-banner">
          <div className="presensi-banner-brand">Presenda</div>
          <h1 className="presensi-banner-title">{agenda.judul}</h1>
        </div>
        <div className="presensi-content">
          <div className="presensi-card">
            <div className="presensi-success">
              <div className="presensi-success-icon">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="presensi-success-title">Berhasil!</h2>
              <p className="presensi-success-text">{successMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="presensi-page">
      {/* ===== BANNER ===== */}
      <div className="presensi-banner">
        <div className="presensi-banner-brand">Presenda</div>
        <h1 className="presensi-banner-title">{agenda.judul}</h1>
        <div className="presensi-banner-info">
          <div className="presensi-banner-row">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(agenda.tanggal)}</span>
          </div>
          <div className="presensi-banner-row">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatTime(agenda.waktu_mulai)} WIB</span>
          </div>
          <div className="presensi-banner-row">
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
        </div>
      </div>

      {/* ===== FORM ===== */}
      <div className="presensi-content">
        <div className="presensi-card">
          <form className="presensi-form" onSubmit={handleSubmit}>
            {/* Error */}
            {error && (
              <div className="presensi-error">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Pilih Nama */}
            <div className="presensi-form-group">
              <label className="presensi-form-label">
                Pilih Nama Anda <span>*</span>
              </label>
              <select
                className="presensi-select"
                value={selectedUserId}
                onChange={handleUserChange}
                required
              >
                <option value="">-- Pilih Nama --</option>
                {users.map((user) => (
                  <option key={user.id_user} value={user.id_user}>
                    {user.nama}
                  </option>
                ))}
                <option value="manual">-- Lainnya (Ketik Manual) --</option>
              </select>
            </div>

            {/* Input Manual Jika Memilih Lainnya */}
            {selectedUserId === "manual" && (
              <div className="presensi-manual-wrapper">
                <div className="presensi-manual-header">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Lengkapi Data Diri</span>
                </div>
                
                <div className="presensi-form-group">
                  <label className="presensi-form-label">
                    Nama Lengkap <span>*</span>
                  </label>
                  <input
                    type="text"
                    className="presensi-input"
                    placeholder="Masukkan nama lengkap Anda"
                    value={manualName}
                    onChange={(e) => { setManualName(e.target.value); setError(""); }}
                    required
                  />
                </div>

                <div className="presensi-form-group">
                  <label className="presensi-form-label">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    className="presensi-input"
                    placeholder="Contoh: Siswa Magang"
                    value={manualJabatan}
                    onChange={(e) => setManualJabatan(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Tampilkan info user yang dipilih */}
            {selectedUser && selectedUserId !== "manual" && (
              <div className="presensi-user-info">
                <span className="presensi-user-info-name">{selectedUser.nama}</span>
                <span className="presensi-user-info-jabatan">{selectedUser.jabatan}</span>
              </div>
            )}

            {/* Status Kehadiran */}
            <div className="presensi-form-group">
              <label className="presensi-form-label">
                Status Kehadiran <span>*</span>
              </label>
              <div className="presensi-radio-group">
                <div className="presensi-radio-option">
                  <input
                    type="radio"
                    id="status-hadir"
                    name="status_hadir"
                    value="hadir"
                    checked={statusHadir === "hadir"}
                    onChange={() => { setStatusHadir("hadir"); setError(""); }}
                  />
                  <label htmlFor="status-hadir" className="presensi-radio-label presensi-radio-label--hadir">
                    <span className="presensi-radio-icon">
                      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="presensi-radio-text">Hadir</span>
                  </label>
                </div>

                <div className="presensi-radio-option">
                  <input
                    type="radio"
                    id="status-izin"
                    name="status_hadir"
                    value="izin"
                    checked={statusHadir === "izin"}
                    onChange={() => { setStatusHadir("izin"); setError(""); }}
                  />
                  <label htmlFor="status-izin" className="presensi-radio-label presensi-radio-label--izin">
                    <span className="presensi-radio-icon">
                      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span className="presensi-radio-text">Izin / Tidak Hadir</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tanda Tangan (jika Hadir) */}
            {statusHadir === "hadir" && (
              <div className="presensi-form-group presensi-signature-section">
                <div className="presensi-signature-header">
                  <label className="presensi-form-label">
                    Tanda Tangan <span>*</span>
                  </label>
                  <button type="button" className="presensi-btn-clear" onClick={clearCanvas}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Hapus
                  </button>
                </div>
                <div className="presensi-signature-canvas-wrapper">
                  <canvas
                    ref={canvasRef}
                    className="presensi-signature-canvas"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  {!hasDrawn && (
                    <div className="presensi-signature-placeholder">
                      <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                      </svg>
                      Buat tanda tangan di sini
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alasan Izin (jika Izin) */}
            {statusHadir === "izin" && (
              <div className="presensi-form-group" style={{ animation: "cardFadeUp 0.3s ease both" }}>
                <label className="presensi-form-label">
                  Alasan Tidak Hadir <span>*</span>
                </label>
                <textarea
                  className="presensi-textarea"
                  placeholder="Tuliskan alasan tidak hadir..."
                  value={alasanIzin}
                  onChange={(e) => { setAlasanIzin(e.target.value); setError(""); }}
                  required
                />
              </div>
            )}

            {/* Submit */}
            {statusHadir && (
              <button type="submit" className="presensi-btn-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="presensi-spinner" />
                    Mengirim...
                  </>
                ) : (
                  statusHadir === "hadir" ? "Kirim Presensi" : "Kirim Izin"
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Presensi;
