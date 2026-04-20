import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generatePDF = async (agenda: any, presensiList: any[], logoUrl: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Load logo image as base64
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = logoUrl;
      img.onload = () => {
        // Prepare Logo
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        const logoBase64 = canvas.toDataURL("image/png");

        drawPDF(doc, agenda, presensiList, logoBase64);
        resolve();
      };
      img.onerror = () => {
        // Proceed without logo if failed to load
        console.warn("Gagal memuat logo untuk PDF");
        drawPDF(doc, agenda, presensiList, "");
        resolve();
      };
    } catch (err) {
      reject(err);
    }
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawPDF(doc: jsPDF, agenda: any, presensiList: any[], logoBase64: string) {
  const pageWidth = doc.internal.pageSize.getWidth(); // A4: 210

  // ==========================================
  // HEADER KOP SURAT
  // ==========================================
  doc.setFont("helvetica");

  // =========================
  // CONFIG & DIMENSIONS
  // =========================
  const marginX = 14;
  const startY = 15;
  const boxWidth = pageWidth - marginX * 2; // 182

  const headerHeight = 45;
  const topHeight = 25; // Baris atas (Logo & Info Balai)
  const bottomHeight = headerHeight - topHeight; // 20

  const col1W = 32; // Lebar box Logo
  const col2X = marginX + col1W; // Awal tulisan balai

  const col3W = 75; // Lebar tabel Metadata Kanan bawah
  const col3X = marginX + boxWidth - col3W; // Awal tabel Metadata Kanan

  const metaSplitW = 28; // Lebar kolom Label di dalam Metadata tabel
  const metaSplitX = col3X + metaSplitW; // Garis vertical pembatas Label - Value

  // =========================
  // DRAW GRID LINES
  // =========================
  doc.setLineWidth(0.3);

  // 1. Kotak besar terluar
  doc.rect(marginX, startY, boxWidth, headerHeight);

  // 2. Garis horizontal UTAMA pemisah KOP ATAS dan BAWAH
  doc.line(marginX, startY + topHeight, marginX + boxWidth, startY + topHeight);

  // 3. Garis vertikal pembatas LOGO
  doc.line(col2X, startY, col2X, startY + topHeight);

  // 4. Garis vertikal pemisah area KIRI dan tabel METADATA KANAN
  doc.line(col3X, startY + topHeight, col3X, startY + headerHeight);

  // 5 & 6. Garis horizontal pemisah di area BAWAH
  const rowH = bottomHeight / 4; // 5

  doc.line(col3X, startY + topHeight + rowH * 1, marginX + boxWidth, startY + topHeight + rowH * 1);
  doc.line(col3X, startY + topHeight + rowH * 2, marginX + boxWidth, startY + topHeight + rowH * 2);

  doc.line(marginX, startY + topHeight + rowH * 3, marginX + boxWidth, startY + topHeight + rowH * 3);

  // 7. Garis vertikal pemisah LABEL dan ISI di dalam tabel METADATA
  doc.line(metaSplitX, startY + topHeight, metaSplitX, startY + headerHeight);

  // =========================
  // ISI KONTEN (TEKS & GAMBAR)
  // =========================

  // 1. Logo (Center in Top-Left Box)
  if (logoBase64) {
    const logoSize = 21;
    doc.addImage(
      logoBase64,
      "PNG",
      marginX + (col1W - logoSize) / 2,
      startY + (topHeight - logoSize) / 2,
      logoSize,
      logoSize
    );
  }

  // 2. Teks Balai Karantina (Center in Top-Right Box)
  const topTextW = boxWidth - col1W;
  const centerTopX = col2X + topTextW / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BALAI KARANTINA HEWAN, IKAN DAN TUMBUHAN", centerTopX, startY + 7, { align: "center" });
  doc.text("KALIMANTAN TENGAH", centerTopX, startY + 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Jl. G. Obos km.5,5 Menteng, Kec. Jekan Raya, Kota Palangka Raya, Kalimantan Tengah 73112", centerTopX, startY + 16.5, { align: "center" });
  doc.text("Telp/Fax : (0536) 3247484, 3247485, 3247400. Informasi Pengaduan : 0811-525-5050", centerTopX, startY + 20.5, { align: "center" });

  // 3. Teks FORMULIR & SISTEM MANAJEMEN
  const centerBottomLeftX = marginX + (col3X - marginX) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FORMULIR", centerBottomLeftX, startY + topHeight + (rowH * 3) / 2 + 2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("SISTEM MANAJEMEN TERINTEGRASI", centerBottomLeftX, startY + topHeight + rowH * 3 + 3.5, { align: "center" });

  // 4. Tabel Metadata Kanan Bawah
  doc.setFontSize(7);
  const textLeftPad = col3X + 2;
  const valLeftPad = metaSplitX + 2;

  // Row 1
  doc.text("No. Dokumen", textLeftPad, startY + topHeight + 3.5);
  doc.text(": F.7.1.1.3", valLeftPad, startY + topHeight + 3.5);

  // Row 2
  doc.text("Terbitan/Revisi", textLeftPad, startY + topHeight + rowH + 3.5);
  doc.text(": 01/00", valLeftPad, startY + topHeight + rowH + 3.5);

  // Row 3
  doc.text("Tgl. Terbit/Revisi", textLeftPad, startY + topHeight + rowH * 2 + 3.5);
  doc.text(": 12-07-2024/-", valLeftPad, startY + topHeight + rowH * 2 + 3.5);

  // Row 4
  doc.text("Halaman", textLeftPad, startY + topHeight + rowH * 3 + 3.5);
  doc.text(": 1 dari 1", valLeftPad, startY + topHeight + rowH * 3 + 3.5);

  // ==========================================
  // BOX JUDUL: DAFTAR HADIR
  // ==========================================
  const titleY = startY + headerHeight;
  doc.rect(marginX, titleY, boxWidth, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DAFTAR HADIR", pageWidth / 2, titleY + 5.5, { align: "center" });


  // ==========================================
  // INFO KEGIATAN
  // ==========================================
  const infoY = titleY + 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const infoLabelX = marginX + 2;
  const infoColonX = infoLabelX + 40;

  doc.text("Nama Kegiatan", infoLabelX, infoY);
  doc.text(`: ${agenda.judul}`, infoColonX, infoY);

  doc.text("Tanggal Pelaksanaan", infoLabelX, infoY + 6);
  doc.text(`: ${formatDate(agenda.tanggal)}`, infoColonX, infoY + 6);

  doc.text("Waktu Pelaksanaan", infoLabelX, infoY + 12);
  doc.text(`: ${agenda.waktu_mulai.substring(0, 5)} WIB s.d Selesai`, infoColonX, infoY + 12);

  doc.text("Tempat Pelaksanaan", infoLabelX, infoY + 18);
  doc.text(`: ${agenda.tempat}`, infoColonX, infoY + 18);

  // ==========================================
  // TABEL PRESENSI MENGGUNAKAN AUTOTABLE
  // ==========================================
  const tableStartY = infoY + 28;

  const tableData = presensiList.map((p, index) => [
    (index + 1).toString(),
    p.nama,
    p.jabatan,
    p.status_hadir === "izin" ? "Izin: " + (p.alasan_izin || "") : "" // placeholder string for signature col
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["NO", "NAMA", "JABATAN", "TANDA TANGAN"]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: 20,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      valign: "middle"
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15, valign: "middle" },
      1: { cellWidth: 60, valign: "middle" },
      2: { cellWidth: 60, valign: "middle" },
      3: { cellWidth: 47, valign: "middle" } // signature area width
    },
    // We adjust row height for drawing signature
    didParseCell: (data) => {
      // For body cells
      if (data.section === 'body') {
        data.cell.styles.minCellHeight = 18; // Enough height to draw signature
      }
    },
    // Hook called after each cell is drawn
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        // Draw the signature image
        const record = presensiList[data.row.index];
        if (record.status_hadir === "hadir" && record.tanda_tangan) {
          try {
            const imgData = record.tanda_tangan;
            const dim = data.cell;
            // Pad inside the cell
            const pad = 2;
            doc.addImage(
              imgData,
              "PNG",
              dim.x + pad,
              dim.y + pad,
              dim.width - 2 * pad,
              dim.height - 2 * pad,
              undefined,
              "FAST"
            );
          } catch (e) {
            console.error("Gagal parse image ttd form row", data.row.index, e);
          }
        }
      }
    }
  });

  // Save the generated document
  doc.save(`Daftar_Hadir_${agenda.judul.replace(/ /g, "_")}.pdf`);
}
