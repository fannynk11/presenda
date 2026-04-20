import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password harus diisi" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "Username tidak ditemukan" },
        { status: 401 }
      );
    }

    // Bandingkan password dengan bcrypt
    const passwordHash = user.password.replace("$2y$", "$2b$");
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Password salah" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        nama: user.nama,
        jabatan: user.jabatan,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    // Kirim response (tanpa password)
    const { password: _, ...userData } = user;

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      token,
      user: userData,
    });

    // Set cookie untuk middleware
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 jam
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
