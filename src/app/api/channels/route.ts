// Channels API - Returns parsed channels from M3U playlist
import { NextResponse } from 'next/server';
import { getChannels, getCategories, getChannelsByCategory } from '@/lib/channel-service';

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const grouped = searchParams.get('grouped') === 'true';
    const categoriesOnly = searchParams.get('categories') === 'true';

    // Return only categories
    if (categoriesOnly) {
      const categories = await getCategories();
      return NextResponse.json({ categories });
    }

    // Return grouped by category
    if (grouped) {
      const groupedChannels = await getChannelsByCategory();
      return NextResponse.json({
        grouped: groupedChannels,
        categories: Object.keys(groupedChannels),
      });
    }

    // Get all channels
    const channels = await getChannels();

    // Filter by category
    let filteredChannels = channels;
    if (category) {
      filteredChannels = channels.filter(
        (ch) => ch.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChannels = filteredChannels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(searchLower) ||
          ch.category.toLowerCase().includes(searchLower) ||
          ch.group.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      channels: filteredChannels,
      total: filteredChannels.length,
      categories: await getCategories(),
    });
  } catch (error) {
    console.error('Error in /api/channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels', channels: [], total: 0 },
      { status: 500 }
    );
  }
}
