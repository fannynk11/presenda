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

// GET /api/agenda/[id] — Detail 1 agenda (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: agenda, error } = await supabase
      .from("agenda")
      .select("*")
      .eq("id_agenda", id)
      .single();

    if (error || !agenda) {
      console.error("Supabase error for GET /api/agenda/[id]:", error?.message || "Agenda not found");
      return NextResponse.json(
        { success: false, message: "Agenda tidak ditemukan" },
        { status: 404 }
      );
    }

    // Since we removed the join, we can just return the data directly
    // If you need manual creator name, you might need a second query or a proper FK in Supabase
    const formattedData = {
      ...agenda,
      creator_name: "Admin" // Consistent placeholder for now
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Get agenda detail error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail agenda" },
      { status: 500 }
    );
  }
}

// DELETE /api/agenda/[id] — Hapus agenda
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 }
    );
  }

  // Cek role admin
  if (user.jabatan !== 'Admin') {
    return NextResponse.json(
      { success: false, message: "Hanya Admin yang dapat menghapus agenda" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from("agenda")
      .delete()
      .eq("id_agenda", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Agenda berhasil dihapus" });
  } catch (error) {
    console.error("Delete agenda error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus agenda" },
      { status: 500 }
    );
  }
}

// PUT /api/agenda/[id] — Update status agenda
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 }
    );
  }

  // Cek role admin
  if (user.jabatan !== 'Admin') {
    return NextResponse.json(
      { success: false, message: "Hanya Admin yang dapat mengubah status agenda" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    if (status !== "selesai" && status !== "aktif" && status !== "mendatang") {
      return NextResponse.json(
        { success: false, message: "Status tidak valid" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("agenda")
      .update({ status })
      .eq("id_agenda", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Status agenda berhasil diubah menjadi ${status}` });
  } catch (error) {
    console.error("Update agenda error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status agenda" },
      { status: 500 }
    );
  }
}
