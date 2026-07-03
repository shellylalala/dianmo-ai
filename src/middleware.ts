import { NextResponse, type NextRequest } from "next/server";

// 乐观校验：只检查会话 cookie 是否存在（Edge 安全，不引入 Prisma）。
// 真正的会话有效性由页面里的 auth() 负责校验。
export function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
