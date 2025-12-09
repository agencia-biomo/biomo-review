import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session token from __session cookie (Firebase Hosting only forwards this cookie)
  const sessionToken = request.cookies.get("__session")?.value;

  console.log("[MIDDLEWARE] Path:", pathname, "| Has __session:", !!sessionToken);

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
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
