import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL;

async function handler(req: NextRequest) {
  // Lấy path sau /api/proxy/ → forward đến backend
  const proxyPath = req.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  const search = req.nextUrl.search ?? "";
  const targetUrl = `${BACKEND}${proxyPath}${search}`;

  // Forward tất cả headers từ client, đặc biệt là Authorization
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    // Bỏ qua host header để tránh backend reject
    if (key.toLowerCase() !== "host") {
      forwardHeaders.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
  };

  // Forward body cho POST/PUT/PATCH
  if (!["GET", "HEAD", "DELETE"].includes(req.method)) {
    fetchOptions.body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, fetchOptions);
    const body = await backendRes.text();

    return new NextResponse(body, {
      status: backendRes.status,
      headers: {
        "Content-Type":
          backendRes.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[Proxy Error]", targetUrl, err);
    return NextResponse.json(
      {
        success: false,
        message: "Proxy: Cannot connect to backend",
        data: null,
      },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
