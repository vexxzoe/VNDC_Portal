import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // Redirect non-admins away from /admin pages and /api/users
    if (
      (pathname.startsWith("/admin") || pathname.startsWith("/api/users")) &&
      token?.role !== "admin"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protect all paths EXCEPT:
     *  - /login, /api/auth/*  (auth)
     *  - /_next/*             (Next.js internals)
     *  - /favicon.ico, /icon.svg, /icon.png, /icons/*  (static assets)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|icon\\.svg|icon\\.png|icons).*)",
  ],
};
