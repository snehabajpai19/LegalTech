import { NextResponse } from "next/server";

const BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/api/templates`, {
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load templates", error: error.message },
      { status: 500 }
    );
  }
}
