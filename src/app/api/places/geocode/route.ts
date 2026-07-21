import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const latlng = searchParams.get("latlng");

  if (!placeId && !latlng) {
    return NextResponse.json({ error: "Missing place_id or latlng parameter" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API Key not configured on server." }, { status: 500 });
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${apiKey}`;
    if (placeId) {
      url += `&place_id=${encodeURIComponent(placeId)}`;
    } else if (latlng) {
      url += `&latlng=${encodeURIComponent(latlng)}`;
    }

    const referer = request.headers.get("referer") || "http://localhost:3000/";
    const res = await fetch(url, {
      headers: {
        Referer: referer
      }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocode API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
