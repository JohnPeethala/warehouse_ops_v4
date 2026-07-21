import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API Key not configured on server." }, { status: 500 });
  }

  try {
    // Mimic the exact location bias and restrictions from the frontend
    // location bias: Hyderabad (17.3850, 78.4867) radius: 50000m
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&components=country:in&location=17.3850,78.4867&radius=50000&key=${apiKey}`;

    const referer = request.headers.get("referer") || "http://localhost:3000/";
    
    const res = await fetch(url, {
      headers: {
        Referer: referer
      }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Places API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
