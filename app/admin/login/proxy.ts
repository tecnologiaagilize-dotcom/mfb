import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  /*
   * IMPORTANTE:
   *
   * A página de login administrativo
   * precisa ser totalmente pública.
   *
   * Não consultamos Supabase,
   * sessão ou cookies nesta rota.
   */
  if (
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  let response =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  /*
   * Valida a sessão somente nas
   * áreas realmente protegidas.
   */
  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  /*
   * ÁREA DO MEMBRO
   */
  if (
    pathname.startsWith(
      "/membro"
    )
  ) {
    if (!user) {
      const url =
        request.nextUrl.clone();

      url.pathname =
        "/entrar";

      return NextResponse.redirect(
        url
      );
    }
  }

  /*
   * ÁREA ADMINISTRATIVA
   */
  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    if (!user) {
      const url =
        request.nextUrl.clone();

      url.pathname =
        "/admin/login";

      return NextResponse.redirect(
        url
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/membro/:path*",
    "/admin/:path*",
  ],
};
