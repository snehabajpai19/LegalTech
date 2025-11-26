import { NextResponse } from "next/server";

const BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${BASE_URL}/api/generator/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to generate document", error: error.message },
      { status: 500 }
    );
  }
}
