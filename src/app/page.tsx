"use client";

import { useState } from "react";
import Image from "next/image";
import MySwal, { SwalCenter, SwalToast } from "@/utils/swal";
import "@/assets/css/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Simpan token dan data user ke localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        SwalCenter.fire({
          icon: "success",
          title: "Login Berhasil",
          text: `Selamat datang, ${data.user.nama}`,
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "/home";
        });
      } else {
        SwalCenter.fire({
          icon: "error",
          title: "Login Gagal",
          text: data.message || "Username atau password salah",
        });
      }
    } catch {
      SwalCenter.fire({
        icon: "error",
        title: "Koneksi Bermasalah",
        text: "Tidak dapat terhubung ke server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative orbs */}
      <div className="login-decor-orb login-decor-orb--1" />
      <div className="login-decor-orb login-decor-orb--2" />
      <div className="login-decor-orb login-decor-orb--3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrapper">
          <Image
            src="/presenda.png"
            alt="Presenda Logo"
            className="login-logo"
            width={80}
            height={80}
          />
          <h1 className="login-brand-name">Presenda</h1>
          <p className="login-brand-tagline">Sistem Presensi-Agenda Digital</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <svg
              className="login-error-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-username">
              Username
            </label>
            <div className="login-input-wrapper">
              <svg
                className="login-input-icon"
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
              <input
                id="login-username"
                type="text"
                className="login-input"
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrapper">
              <svg
                className="login-input-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`login-submit ${isLoading ? "login-submit--loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-spinner" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text" suppressHydrationWarning>
            <strong>Presenda</strong> &mdash; Sistem Presensi Agenda
            <br />
            &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
