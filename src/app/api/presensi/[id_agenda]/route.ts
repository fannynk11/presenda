import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

// Helper: verify JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("verifyToken: No Authorization header or missing Bearer prefix");
    return null;
  }
  try {
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      console.error("verifyToken: JWT_SECRET is not set in .env.local!");
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET) as any;
  } catch (error: any) {
    console.error("verifyToken failed:", error.name, error.message);
    return null;
  }
}

// GET /api/presensi/[id_agenda] — Data presensi per agenda
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_agenda: string }> }
) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 }
    );
  }

  try {
    const { id_agenda } = await params;
    
    const { data: rows, error } = await supabase
      .from("presensi")
      .select(`
        id_presensi, status_hadir, tanda_tangan, alasan_izin, created_at,
        users!inner (id_user, nama, nip, jabatan, golongan, nama_satpel, username)
      `)
      .eq("id_agenda", id_agenda)
      .neq("users.username", "admin")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error fetching presensi:", error);
      throw error;
    }

    // Flatten data to match old format
    const flattenedData = rows.map((p: any) => ({
      id_user: p.users.id_user,
      nama: p.users.nama,
      nip: p.users.nip,
      jabatan: p.users.jabatan,
      golongan: p.users.golongan,
      nama_satpel: p.users.nama_satpel,
      id_presensi: p.id_presensi,
      status_hadir: p.status_hadir,
      tanda_tangan: p.tanda_tangan,
      alasan_izin: p.alasan_izin,
      created_at: p.created_at
    }));

    return NextResponse.json({ success: true, data: flattenedData });
  } catch (error) {
    console.error("Get presensi error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data presensi" },
      { status: 500 }
    );
  }
}
