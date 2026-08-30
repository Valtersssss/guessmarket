const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ---- KONFIGURĀCIJA ----
const DELAY_MS = 3000
const PAGES_PER_BRAND = 2

const BRANDS = [
  { slug: 'alfa-romeo', label: 'Alfa Romeo' },
  { slug: 'audi', label: 'Audi' },
  { slug: 'bmw', label: 'BMW' },
  { slug: 'cadillac', label: 'Cadillac' },
  { slug: 'chevrolet', label: 'Chevrolet' },
  { slug: 'chrysler', label: 'Chrysler' },
  { slug: 'citroen', label: 'Citroen' },
  { slug: 'cupra', label: 'Cupra' },
  { slug: 'dacia', label: 'Dacia' },
  { slug: 'daewoo', label: 'Daewoo' },
  { slug: 'daihatsu', label: 'Daihatsu' },
  { slug: 'dodge', label: 'Dodge' },
  { slug: 'fiat', label: 'Fiat' },
  { slug: 'ford', label: 'Ford' },
  { slug: 'honda', label: 'Honda' },
  { slug: 'hummer', label: 'Hummer' },
  { slug: 'hyundai', label: 'Hyundai' },
  { slug: 'infiniti', label: 'Infiniti' },
  { slug: 'isuzu', label: 'Isuzu' },
  { slug: 'jaguar', label: 'Jaguar' },
  { slug: 'jeep', label: 'Jeep' },
  { slug: 'kia', label: 'Kia' },
  { slug: 'lancia', label: 'Lancia' },
  { slug: 'land-rover', label: 'Land Rover' },
  { slug: 'lexus', label: 'Lexus' },
  { slug: 'lincoln', label: 'Lincoln' },
  { slug: 'mazda', label: 'Mazda' },
  { slug: 'mercedes', label: 'Mercedes' },
  { slug: 'mini', label: 'Mini' },
  { slug: 'mitsubishi', label: 'Mitsubishi' },
  { slug: 'nissan', label: 'Nissan' },
  { slug: 'opel', label: 'Opel' },
  { slug: 'peugeot', label: 'Peugeot' },
  { slug: 'pontiac', label: 'Pontiac' },
  { slug: 'porsche', label: 'Porsche' },
  { slug: 'renault', label: 'Renault' },
  { slug: 'rover', label: 'Rover' },
  { slug: 'saab', label: 'Saab' },
  { slug: 'seat', label: 'Seat' },
  { slug: 'skoda', label: 'Skoda' },
  { slug: 'smart', label: 'Smart' },
  { slug: 'ssangyong', label: 'SsangYong' },
  { slug: 'subaru', label: 'Subaru' },
  { slug: 'suzuki', label: 'Suzuki' },
  { slug: 'tesla', label: 'Tesla' },
  { slug: 'toyota', label: 'Toyota' },
  { slug: 'volkswagen', label: 'Volkswagen' },
  { slug: 'volvo', label: 'Volvo' },
  { slug: 'gaz', label: 'Gaz' },
  { slug: 'iz', label: 'Iž' },
  { slug: 'moskvich', label: 'Moskvich' },
  { slug: 'uaz', label: 'Uaz' },
  { slug: 'vaz', label: 'Vaz' },
  { slug: 'zaz', label: 'Zaz' },
]
// ------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pageUrl(baseUrl, pageNumber) {
  if (pageNumber === 1) return baseUrl
  return baseUrl + `page${pageNumber}.html`
}

function cleanPrice(text) {
  if (/mēn\.|dienā/i.test(text)) return null
  const digits = text.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : null
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
  })
  if (!response.ok) {
    throw new Error(`Kļūda ielādējot ${url}: statuss ${response.status}`)
  }
  return await response.text()
}

function parseListings(html, brandLabel) {
  const $ = cheerio.load(html)
  const listings = []

  $('tr[id^="tr_"]').each((_, el) => {
    const row = $(el)
    const titleLink = row.find('td.msg2 .d1 a')
    const title = titleLink.text().trim()
    const detailHref = titleLink.attr('href')
    const cells = row.find('td.msga2-o, td.msga2-r')

    if (!title || !detailHref || cells.length < 5) return

    const model = $(cells[0]).text().trim()
    const year = $(cells[1]).text().trim()
    const volume = $(cells[2]).text().trim()
    const mileage = $(cells[3]).text().trim()
    const priceText = $(cells[4]).text().trim()
    const price = cleanPrice(priceText)

    if (!price || price < 50) return

    listings.push({
      category: 'auto',
      title: `${brandLabel} ${model}, ${year}`,
      details: `${mileage}, ${volume}`,
      correct_price: price,
      detailUrl: 'https://www.ss.lv' + detailHref,
    })
  })

  return listings
}

function extractAllImages(html) {
  const matches = html.match(/https:\/\/i\.ss\.lv\/gallery\/[^\s"'<>]+\.800\.jpg/g)
  if (!matches) return []
  return [...new Set(matches)]
}

function extractDescription($) {
  const container = $('#msg_div_msg')
  if (container.length === 0) return ''

  let desc = ''
  let stop = false

  container.contents().each((_, node) => {
    if (stop) return
    if (node.type === 'tag' && node.name === 'table') {
      stop = true
      return
    }
    if (node.type === 'tag' && node.attribs && node.attribs.id === 'content_sys_div_msg') {
      return
    }
    if (node.type === 'text') {
      desc += node.data
    }
    if (node.type === 'tag' && node.name === 'br') {
      desc += '\n'
    }
  })

  return desc.replace(/\n{3,}/g, '\n\n').trim()
}

function extractSpecs($) {
  const specs = {}

  $('td.ads_opt_name').each((_, el) => {
    const label = $(el).text().trim().replace(/:$/, '')
    const valueTd = $(el).next('td.ads_opt')
    if (!label || valueTd.length === 0) return

    const clone = valueTd.clone()
    clone.find('img, a').remove()
    const value = clone.text().trim()

    if (label && value && value.length < 100) {
      specs[label] = value
    }
  })

  return specs
}

async function scrapeDetail(detailUrl) {
  const html = await fetchPage(detailUrl)
  const $ = cheerio.load(html)

  return {
    images: extractAllImages(html),
    description: extractDescription($),
    specs: extractSpecs($),
  }
}

async function main() {
  const allListings = []

  for (const brand of BRANDS) {
    console.log(`\n=== ${brand.label} ===`)
    const baseUrl = `https://www.ss.lv/lv/transport/cars/${brand.slug}/`

    for (let page = 1; page <= PAGES_PER_BRAND; page++) {
      const url = pageUrl(baseUrl, page)

      try {
        const html = await fetchPage(url)
        const listings = parseListings(html, brand.label)
        console.log(`  Lapa ${page}: atrasti ${listings.length} sludinājumi`)
        allListings.push(...listings)
      } catch (err) {
        console.error(`  Kļūda (${url}): ${err.message}`)
      }

      if (page < PAGES_PER_BRAND) {
        await sleep(DELAY_MS)
      }
    }

    await sleep(DELAY_MS)
  }

  console.log(`\nKopā atrasti ${allListings.length} sludinājumi visām markām.`)
  console.log(`\n=== Detaļu vākšana katram sludinājumam ===`)
  console.log(`(Tas prasīs apmēram ${Math.round((allListings.length * DELAY_MS) / 60000)} minūtes)`)

  const finalListings = []

  for (let i = 0; i < allListings.length; i++) {
    const listing = allListings[i]

    try {
      const detail = await scrapeDetail(listing.detailUrl)
      console.log(`[${i + 1}/${allListings.length}] ${listing.title} — ${detail.images.length} foto`)

      finalListings.push({
        category: listing.category,
        title: listing.title,
        details: listing.details,
        correct_price: listing.correct_price,
        image_url: detail.images[0] || null,
        image_urls: detail.images,
        description: detail.description || null,
        specs: detail.specs,
      })
    } catch (err) {
      console.error(`[${i + 1}/${allListings.length}] Kļūda: ${err.message}`)
      finalListings.push({
        category: listing.category,
        title: listing.title,
        details: listing.details,
        correct_price: listing.correct_price,
        image_url: null,
        image_urls: [],
        description: null,
        specs: {},
      })
    }

    await sleep(DELAY_MS)
  }

  console.log(`\nIevietoju ${finalListings.length} sludinājumus datubāzē...`)

  const { error } = await supabase.from('questions').insert(finalListings)

  if (error) {
    console.error('Kļūda ievietojot datubāzē:', error)
  } else {
    console.log(`Veiksmīgi ievietoti ${finalListings.length} sludinājumi datubāzē!`)
  }
}

main()