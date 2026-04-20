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
    if (decoded.jabatan !== 'Admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/users — List all users (Admin only with Pagination & Search)
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("users")
      .select("id_user, nip, nama, jabatan, golongan, nama_satpel, username, created_at", { count: "exact" });

    if (search) {
      // Use double quotes around the pattern so PostgREST can parse spaces correctly
      const pattern = `"%${search.trim()}%"`;
      query = query.or(`nama.ilike.${pattern},username.ilike.${pattern}`);
    }

    const { data, error, count } = await query
      .order("nama", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Get users error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal mengambil data pegawai", 
      debug: error.message,
      error_details: error
    }, { status: 500 });
  }
}

// POST /api/users — Create new user (Admin only)
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { nip, nama, jabatan, golongan, nama_satpel, username, password } = await request.json();

    if (!nama || !username || !password) {
      return NextResponse.json({ success: false, message: "Nama, Username, dan Password wajib diisi" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          nip: nip || null,
          nama,
          jabatan: jabatan || null,
          golongan: golongan || null,
          nama_satpel: nama_satpel || null,
          username,
          password: hashedPassword
        }
      ])
      .select("id_user")
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres duplicate key error code
        return NextResponse.json({ success: false, message: "Username sudah digunakan" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Pegawai berhasil ditambahkan",
      id: newUser.id_user
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ success: false, message: "Gagal menambahkan pegawai" }, { status: 500 });
  }
}
