import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/users/non-admin — Daftar user (tanpa admin)
export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("users")
      .select("id_user, nip, nama, jabatan, golongan, nama_satpel")
      .neq("jabatan", "Admin")
      .order("nama", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data user" },
      { status: 500 }
    );
  }
}
