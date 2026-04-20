import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Helper: verify Admin
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.jabatan !== "Admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// PUT /api/users/[id] — Update biodata (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { nip, nama, jabatan, golongan, nama_satpel, username } = await request.json();

    if (!nama || !username) {
      return NextResponse.json({ success: false, message: "Nama dan Username wajib diisi" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({
        nip: nip || null,
        nama,
        jabatan: jabatan || null,
        golongan: golongan || null,
        nama_satpel: nama_satpel || null,
        username,
      })
      .eq("id_user", id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Username sudah digunakan" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: "Data pegawai berhasil diperbarui" });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui data pegawai" }, { status: 500 });
  }
}

// PATCH /api/users/[id] — Reset password (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ success: false, message: "Password baru wajib diisi" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id_user", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Password berhasil diatur ulang" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, message: "Gagal mengatur ulang password" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — Remove user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Prevent admin from deleting themselves (optional but recommended)
    if (admin.id_user === parseInt(id)) {
      return NextResponse.json({ success: false, message: "Admin tidak dapat menghapus akun sendiri" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id_user", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Data pegawai berhasil dihapus" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus data pegawai" }, { status: 500 });
  }
}
