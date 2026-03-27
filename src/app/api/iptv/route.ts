import { NextRequest, NextResponse } from 'next/server'

// CREDENCIALES VERIFICADOS - filex.me
const IPTV_SERVER = {
  name: 'FILEX IPTV',
  server: 'filex.me',
  port: 8080,
  username: '10101010',
  password: '10101010'
}

interface Channel {
  id: string
  name: string
  logo: string
  url: string
  category: string
  streamId: string
  categoryId: string
}

// Cache for categories
let categoriesCache: any[] = []
let categoriesCacheTime = 0
const CACHE_DURATION = 3600000 // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const categoryId = searchParams.get('category_id')
  const search = searchParams.get('search')

  // Get stream URL for specific channel
  if (action === 'stream' && searchParams.get('streamId')) {
    const streamId = searchParams.get('streamId')
    const ext = searchParams.get('ext') || 'm3u8'
    
    const streamUrl = `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/live/${IPTV_SERVER.username}/${IPTV_SERVER.password}/${streamId}.${ext}`
    
    return NextResponse.json({ streamUrl })
  }

  // Get categories from Xtream API
  if (action === 'categories') {
    try {
      // Use cache if available
      if (categoriesCache.length > 0 && Date.now() - categoriesCacheTime < CACHE_DURATION) {
        return NextResponse.json({ categories: categoriesCache, server: IPTV_SERVER.name })
      }

      const response = await fetch(
        `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_categories`,
        { next: { revalidate: 3600 } }
      )
      
      const categories = await response.json()
      categoriesCache = categories
      categoriesCacheTime = Date.now()
      
      return NextResponse.json({ categories, server: IPTV_SERVER.name })
    } catch (error) {
      return NextResponse.json({ categories: [], error: 'Failed to fetch categories' })
    }
  }

  // Get channels from specific category or all (limited)
  if (action === 'channels') {
    try {
      let url = `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_streams`
      
      if (categoryId) {
        url += `&category_id=${categoryId}`
      }

      const response = await fetch(url, { next: { revalidate: 1800 } })
      const rawChannels = await response.json()

      // Transform to our format
      const channels: Channel[] = rawChannels.slice(0, categoryId ? 2000 : 500).map((ch: any) => ({
        id: `ch-${ch.stream_id}`,
        name: ch.name,
        logo: ch.stream_icon || '',
        url: `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/live/${IPTV_SERVER.username}/${IPTV_SERVER.password}/${ch.stream_id}.m3u8`,
        category: ch.category_id || 'General',
        streamId: String(ch.stream_id),
        categoryId: String(ch.category_id)
      }))

      // Apply search filter
      let filteredChannels = channels
      if (search) {
        const searchLower = search.toLowerCase()
        filteredChannels = channels.filter(c => 
          c.name.toLowerCase().includes(searchLower)
        )
      }

      return NextResponse.json({
        success: true,
        total: rawChannels.length,
        showing: filteredChannels.length,
        channels: filteredChannels,
        server: IPTV_SERVER.name
      })
    } catch (error: any) {
      console.error('Error fetching channels:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        channels: []
      }, { status: 500 })
    }
  }

  // Default: return featured channels from popular categories
  try {
    // Fetch popular categories first
    const catResponse = await fetch(
      `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_categories`,
      { next: { revalidate: 3600 } }
    )
    const categories = await catResponse.json()
    
    // Get featured categories (USA Sports, UK Sports, Cricket, etc.)
    const featuredCategoryIds = ['625', '599', '176', '547', '626', '4', '630', '631']
    
    const channelPromises = featuredCategoryIds.slice(0, 4).map(async (catId) => {
      try {
        const response = await fetch(
          `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_streams&category_id=${catId}`,
          { next: { revalidate: 1800 } }
        )
        return await response.json()
      } catch {
        return []
      }
    })

    const channelResults = await Promise.all(channelPromises)
    const allRawChannels = channelResults.flat()

    // Transform channels
    const channels: Channel[] = allRawChannels.map((ch: any) => ({
      id: `ch-${ch.stream_id}`,
      name: ch.name,
      logo: ch.stream_icon || '',
      url: `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/live/${IPTV_SERVER.username}/${IPTV_SERVER.password}/${ch.stream_id}.m3u8`,
      category: ch.category_id || 'General',
      streamId: String(ch.stream_id),
      categoryId: String(ch.category_id)
    }))

    // Get category names mapping
    const categoryMap: Record<string, string> = {}
    categories.forEach((cat: any) => {
      categoryMap[cat.category_id] = cat.category_name
    })

    // Add category names to channels
    const channelsWithCategoryNames = channels.map(ch => ({
      ...ch,
      categoryName: categoryMap[ch.categoryId] || ch.category
    }))

    return NextResponse.json({
      success: true,
      total: channels.length,
      categories: categories.slice(0, 50).map((c: any) => c.category_name),
      categoryMap,
      channels: channelsWithCategoryNames,
      server: IPTV_SERVER.name
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      channels: []
    }, { status: 500 })
  }
}
