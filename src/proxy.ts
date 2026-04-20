import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Tentukan rute yang memerlukan login
const protectedRoutes = ["/home", "/agenda", "/arsip", "/profil"];

// Tentukan rute publik
const publicRoutes = ["/", "/api/login", "/api/presensi"];

export function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const token = req.cookies.get("token")?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // 1. Jika mencoba akses rute terproteksi tanpa token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah login tapi mencoba akses halaman login (/)
  if (token && nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

// Konfigurasi matcher
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|presensi.*|logo_mini.png|presenda.png|.*\\.svg).*)",
  ],
};
