"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MySwal, { SwalCenter, SwalToast } from "@/utils/swal";
import "@/assets/css/Pegawai.css";

interface UserItem {
  id_user: number;
  nip: string | null;
  nama: string;
  jabatan: string | null;
  golongan: string | null;
  nama_satpel: string | null;
  username: string;
  created_at: string;
}

export default function PegawaiPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    jabatan: "",
    golongan: "",
    nama_satpel: "",
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auth check
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    
    if (!t || !u) {
      router.replace("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(u);
      if (parsedUser.jabatan !== 'Admin') {
        router.replace("/home");
      } else {
        setToken(t);
        setCurrentUser(parsedUser);
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    // Clear current list to show user that search is happening
    if (debouncedSearchQuery) {
      setUsers([]);
    }
    
    try {
      const res = await fetch(`/api/users?page=${currentPage}&search=${debouncedSearchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch (err: any) {
      console.error("Gagal mengambil data pegawai", err);
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan saat mengambil data" });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setFormData({
      nip: "",
      nama: "",
      jabatan: "",
      golongan: "",
      nama_satpel: "",
      username: "",
      password: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({
      nip: user.nip || "",
      nama: user.nama,
      jabatan: user.jabatan || "",
      golongan: user.golongan || "",
      nama_satpel: user.nama_satpel || "",
      username: user.username,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleOpenPassword = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: "" });
    setShowPasswordModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchUsers();
        SwalToast.fire({ icon: "success", title: "Pegawai berhasil ditambahkan" });
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch {
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id_user}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchUsers();
        SwalToast.fire({ icon: "success", title: "Data pegawai diperbarui" });
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch {
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id_user}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: formData.password }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPasswordModal(false);
        SwalToast.fire({ icon: "success", title: "Password berhasil diubah" });
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch {
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan sistem" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await SwalCenter.fire({
      title: "Hapus Data Pegawai?",
      text: "Seluruh data terkait pegawai ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        SwalToast.fire({ icon: "success", title: "Data pegawai dihapus" });
      } else {
        MySwal.fire({ icon: "error", title: "Gagal", text: data.message });
      }
    } catch {
      MySwal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan sistem" });
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (!currentUser) return null;

  return (
    <div className="pegawai-page">
      <header className="pegawai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/home" style={{ color: 'white' }}>
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="pegawai-header-title">Data Pegawai</h1>
        </div>
        <button className="pegawai-btn-add" onClick={handleOpenAdd}>
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </header>

      <main className="pegawai-content">
        <div className="pegawai-search-container">
          <svg className="pegawai-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            className="pegawai-search-input" 
            placeholder="Cari nama, NIP, atau username..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {loading ? (
          <div className="pegawai-loading"><div className="pegawai-spinner" /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Pegawai tidak ditemukan.
          </div>
        ) : (
          <>
            <div className="pegawai-list">
              {users.map((u) => (
                <div key={u.id_user} className="pegawai-card">
                  <div className="pegawai-card-left">
                    <div className="pegawai-avatar">{getInitials(u.nama)}</div>
                    <div className="pegawai-info">
                      <p className="pegawai-name">{u.nama}</p>
                      <p className="pegawai-role">{u.jabatan || 'Staf'} {u.golongan ? `• ${u.golongan}` : ''}</p>
                      {u.nip && <p className="pegawai-nip">NIP. {u.nip}</p>}
                    </div>
                  </div>
                  <div className="pegawai-actions">
                    <button className="pegawai-btn-action pegawai-btn-edit" onClick={() => handleOpenEdit(u)} title="Edit Profil">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="pegawai-btn-action pegawai-btn-password" onClick={() => handleOpenPassword(u)} title="Ganti Password">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                    <button className="pegawai-btn-action pegawai-btn-delete" onClick={() => handleDelete(u.id_user)} title="Hapus Pegawai">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="pegawai-pagination">
                <button 
                  className="pegawai-page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button 
                    key={p} 
                    className={`pegawai-page-btn ${currentPage === p ? 'pegawai-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}

                <button 
                  className="pegawai-page-btn" 
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="pegawai-pagination-info">
                  Menampilkan {(currentPage - 1) * pagination.limit + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} dari {pagination.total} pegawai
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODALS (Add & Edit combined logic for simplicity) */}
      {(showAddModal || showEditModal) && (
        <div className="pegawai-modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="pegawai-modal" onClick={e => e.stopPropagation()}>
            <div className="pegawai-modal-header">
              <h2 className="pegawai-modal-title">{showAddModal ? "Tambah Pegawai" : "Edit Biodata"}</h2>
              <button className="pegawai-modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="pegawai-modal-body">
              <form className="pegawai-form" onSubmit={showAddModal ? handleAdd : handleEdit}>
                <div className="pegawai-form-group">
                  <label className="pegawai-form-label">Nama Lengkap <span>*</span></label>
                  <input type="text" required className="pegawai-form-input" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                </div>
                
                <div className="pegawai-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="pegawai-form-group">
                    <label className="pegawai-form-label">NIP</label>
                    <input type="text" className="pegawai-form-input" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                  </div>
                  <div className="pegawai-form-group">
                    <label className="pegawai-form-label">Golongan</label>
                    <input type="text" className="pegawai-form-input" value={formData.golongan} onChange={e => setFormData({...formData, golongan: e.target.value})} />
                  </div>
                </div>

                <div className="pegawai-form-group">
                  <label className="pegawai-form-label">Jabatan / Posisi</label>
                  <input type="text" className="pegawai-form-input" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
                </div>
                
                <div className="pegawai-form-group">
                  <label className="pegawai-form-label">Satuan Pelaksana (Satpel)</label>
                  <input type="text" className="pegawai-form-input" value={formData.nama_satpel} onChange={e => setFormData({...formData, nama_satpel: e.target.value})} />
                </div>

                <div className="pegawai-form-group">
                  <label className="pegawai-form-label">Username <span>*</span></label>
                  <input type="text" required className="pegawai-form-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                
                {showAddModal && (
                  <div className="pegawai-form-group">
                    <label className="pegawai-form-label">Password <span>*</span></label>
                    <input type="password" required className="pegawai-form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                )}
                
                <button type="submit" className="pegawai-form-submit" disabled={submitting}>
                  {submitting ? "Menyimpan..." : (showAddModal ? "Simpan Pegawai" : "Update Biodata")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="pegawai-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="pegawai-modal" onClick={e => e.stopPropagation()}>
            <div className="pegawai-modal-header">
              <h2 className="pegawai-modal-title">Reset Password</h2>
              <button className="pegawai-modal-close" onClick={() => setShowPasswordModal(false)}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="pegawai-modal-body">
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
                Mengatur ulang password untuk <strong>{selectedUser.nama}</strong>.
              </div>
              <form className="pegawai-form" onSubmit={handleResetPassword}>
                <div className="pegawai-form-group">
                  <label className="pegawai-form-label">Password Baru <span>*</span></label>
                  <input type="password" required className="pegawai-form-input" placeholder="Masukkan password baru..." value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <button type="submit" className="pegawai-form-submit" disabled={submitting}>
                  {submitting ? "Mengubah..." : "Simpan Password Baru"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION (Mobile) ===== */}
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
              className={`app-nav-item ${item.href === "/pegawai" ? "app-nav-item--active" : ""}`}
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
