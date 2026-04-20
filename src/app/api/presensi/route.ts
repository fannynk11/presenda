import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/presensi — Submit presensi
export async function POST(request: NextRequest) {
  try {
    const { id_agenda, id_user, status_hadir, tanda_tangan, alasan_izin, isManual, manualName, manualJabatan } = await request.json();

    let finalIdUser = id_user;

    // Jika pegawai baru/magang mengetik nama manual
    if (isManual && manualName) {
      const usernameManual = `manual_${Date.now()}`;
      
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          nama: manualName,
          jabatan: manualJabatan || null,
          username: usernameManual,
          password: 'dummy_pass'
        })
        .select("id_user")
        .single();

      if (userError) {
        console.error("Error inserting manual user:", userError);
        return NextResponse.json(
          { success: false, message: "Gagal membuat user baru: " + userError.message },
          { status: 400 }
        );
      }

      finalIdUser = newUser.id_user;
    }

    // Validasi input
    if (!id_agenda || !finalIdUser || !status_hadir) {
      return NextResponse.json(
        {
          success: false,
          message: "Data presensi tidak lengkap"
        },
        { status: 400 }
      );
    }

    // Validasi: jika hadir harus ada tanda tangan
    if (status_hadir === "hadir" && !tanda_tangan) {
      return NextResponse.json(
        { success: false, message: "Tanda tangan harus diisi untuk kehadiran" },
        { status: 400 }
      );
    }

    // Validasi: jika izin harus ada alasan
    if (status_hadir === "izin" && !alasan_izin) {
      return NextResponse.json(
        { success: false, message: "Alasan izin harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah user sudah presensi di agenda ini
    const { data: existing, error: existingError } = await supabase
      .from("presensi")
      .select("id_presensi")
      .eq("id_agenda", id_agenda)
      .eq("id_user", finalIdUser)
      .maybeSingle();

    if (existingError) {
      console.error("Check existing error:", existingError);
    }

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Sistem mendeteksi Anda sudah mengisi presensi untuk agenda ini" },
        { status: 409 }
      );
    }

    // Insert presensi
    const { error: insertError } = await supabase
      .from("presensi")
      .insert({
        id_agenda,
        id_user: finalIdUser,
        status_hadir,
        tanda_tangan: status_hadir === "hadir" ? tanda_tangan : null,
        alasan_izin: status_hadir === "izin" ? alasan_izin : null,
      });

    if (insertError) {
      console.error("Insert presensi error:", insertError);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan presensi" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: status_hadir === "hadir"
          ? "Presensi berhasil disimpan. Terima kasih!"
          : "Izin berhasil disimpan.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit presensi error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan presensi" },
      { status: 500 }
    );
  }
}
