import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Rotas de autenticacao - SEMPRE permitir acesso
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Rotas publicas - nao requerem autenticacao
  const publicRoutes = ["/login", "/p"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // API routes para acesso publico
  const publicApiRoutes = ["/api/projects", "/api/feedbacks", "/api/comments", "/api/upload", "/api/notifications"];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se e rota publica ou API publica, permite acesso
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Se nao esta logado e tenta acessar rota protegida
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (NextAuth routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
