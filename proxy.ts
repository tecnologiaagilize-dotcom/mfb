import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Valida a sessão do usuário.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ==========================================
  // ÁREA DO MEMBRO
  // ==========================================

  if (pathname.startsWith("/membro")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar";

      return NextResponse.redirect(url);
    }
  }

  // ==========================================
  // ÁREA ADMINISTRATIVA
  // ==========================================

  if (pathname.startsWith("/admin")) {
    // A tela de login administrativo permanece pública.
    if (pathname === "/admin/login") {
      return response;
    }

    // Sem sessão -> login administrativo.
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";

      return NextResponse.redirect(url);
    }

    /*
     * A autorização específica do administrador
     * será validada dentro da área /admin.
     *
     * O proxy fica responsável apenas pela sessão,
     * evitando que uma consulta RLS no Edge/Proxy
     * envie incorretamente um administrador para /membro.
     */
  }

  return response;
}

export const config = {
  matcher: ["/membro/:path*", "/admin/:path*"],
};
