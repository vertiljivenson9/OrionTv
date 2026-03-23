import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch user's favorites
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      favorites: favorites.map(f => ({
        id: f.channelId,
        name: f.channelName,
        logo: f.channelLogo,
        country: f.channelCountry,
        addedAt: f.createdAt,
      }))
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST - Add a channel to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channel } = body;

    if (!channel || !channel.id) {
      return NextResponse.json({ error: "Channel data required" }, { status: 400 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId: channel.id,
        }
      }
    });

    if (existing) {
      return NextResponse.json({ message: "Already in favorites" });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        channelId: channel.id,
        channelName: channel.name,
        channelLogo: channel.logo,
        channelCountry: channel.country,
      },
    });

    // Get all favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      message: "Added to favorites",
      favorites: favorites.map(f => ({
        id: f.channelId,
        name: f.channelName,
        logo: f.channelLogo,
        country: f.channelCountry,
      }))
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a channel from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    // Delete the favorite
    await prisma.favorite.delete({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        }
      }
    });

    // Get remaining favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      message: "Removed from favorites",
      favorites: favorites.map(f => ({
        id: f.channelId,
        name: f.channelName,
        logo: f.channelLogo,
        country: f.channelCountry,
      }))
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
