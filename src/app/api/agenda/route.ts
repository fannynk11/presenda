import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

// Helper verify token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

// GET /api/agenda
export async function GET(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("agenda")
    .select("*")
    .order("tanggal", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

// POST /api/agenda
export async function POST(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 }
    );
  }

  if (user.jabatan !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const { judul, tanggal, waktu_mulai, tempat, deskripsi } = body;

  const today = new Date().toISOString().split("T")[0];

  let status = "mendatang";

  if (tanggal === today) status = "aktif";
  else if (tanggal < today) status = "selesai";

  const { data, error } = await supabase
    .from("agenda")
    .insert([
      {
        judul,
        tanggal,
        waktu_mulai,
        tempat,
        deskripsi,
        status,
        created_by: user.id_user,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Agenda berhasil dibuat",
      data,
    },
    { status: 201 }
  );
}