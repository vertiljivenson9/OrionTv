import { NextResponse } from "next/server";
import { fetchChannels, getCountries, getCategories, filterChannels } from "@/lib/channels";

export const revalidate = 21600; // Cache for 6 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || null;
    const category = searchParams.get("category") || null;
    const getCountriesList = searchParams.get("countries") === "true";
    const getCategoriesList = searchParams.get("categories") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "200"); // Default 200 per page

    // Fetch all channels (cached)
    const allChannels = await fetchChannels();

    // Return only countries list
    if (getCountriesList) {
      return NextResponse.json({
        countries: getCountries(allChannels),
      });
    }

    // Return only categories list
    if (getCategoriesList) {
      return NextResponse.json({
        categories: getCategories(allChannels),
      });
    }

    // Filter channels
    let filteredChannels = filterChannels(allChannels, search, country, category);

    // Calculate pagination
    const total = filteredChannels.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedChannels = filteredChannels.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      channels: paginatedChannels,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      countries: getCountries(allChannels),
      categories: getCategories(allChannels),
    });
  } catch (error) {
    console.error("Error in /api/channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels", channels: [], total: 0 },
      { status: 500 }
    );
  }
}
