const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ---- KONFIGURĀCIJA ----
const DELAY_MS = 3000

// Uzstādi uz null, lai skrapotu VISAS kategorijas.
// Uzstādi uz masīvu ar atslēgām, lai skrapotu tikai tās (piem. tikai jaunās kategorijas).
const ACTIVE_CATEGORY_KEYS = ['suņi', 'kaķi', 'eksotiskie_dzīvnieki', 'mēbeles', 'dārglietas']

const ELECTRONICS_SUBCATEGORY_LABELS = {
  'pc': 'Dators',
  'noutbooks': 'Piezīmjdators',
  'tablets': 'Planšetdators',
  'game-consoles': 'Spēļu konsole',
  'monitors': 'Monitors',
  'printers-scanners-cartridges': 'Printeris / Skeneris',
  'completing-pc': 'Dators (komplektējošie)',
  'completing-notebook': 'Piezīmjdators (komplektējošie)',
  'accessories': 'Datoru aksesuārs',
  'cash-registers-systems-soft': 'Kases sistēma',
  'multimedia': 'Multimedija',
  'games': 'Datorspēle',
  'hubs-switch-routers': 'Tīkla iekārta',
  'repairing-pcs': 'Remonts',
  'installation-of-program-providing': 'Programmatūra',
  'other': 'Cita elektronika',
}

function extractElectronicsSubcategory(detailHref) {
  const parts = detailHref.split('/').filter(Boolean)
  const idx = parts.indexOf('computers')
  if (idx !== -1 && parts.length > idx + 1) {
    return parts[idx + 1]
  }
  return parts[parts.length - 2] || ''
}

function makeAnimalParseRow(fallbackLabel) {
  return function parseRow($, cells, row) {
    const breed = $(cells[0]).text().trim()
    const age = $(cells[1]).text().trim()
    const priceText = $(cells[2]).text().trim()
    const region = row.find('.ads_region').text().trim()

    const breedLabel = (breed && breed !== '-') ? breed : fallbackLabel
    const ageLabel = (age && age !== '-') ? age : ''

    return {
      title: region ? `${breedLabel}, ${region}` : breedLabel,
      details: ageLabel,
      priceText,
    }
  }
}

const CATEGORIES = [
  {
    key: 'auto',
    startUrl: 'https://www.ss.lv/lv/transport/cars/today-5/',
    pagesToFetch: 15,
    minCells: 5,
    parseRow($, cells) {
      const makeModelRaw = $(cells[0]).html() || ''
      const makeModel = makeModelRaw
        .split(/<br\s*\/?>/i)
        .map((s) => $('<div>').html(s).text().trim())
        .filter(Boolean)
        .join(' ')

      const year = $(cells[1]).text().trim()
      const volume = $(cells[2]).text().trim()
      const mileage = $(cells[3]).text().trim()
      const priceText = $(cells[4]).text().trim()

      return {
        title: `${makeModel}, ${year}`,
        details: `${mileage}, ${volume}`,
        priceText,
      }
    },
  },
  {
    key: 'dzīvoklis_pārdošana',
    startUrl: 'https://www.ss.lv/lv/real-estate/flats/today-5/sell/',
    pagesToFetch: 10,
    minCells: 5,
    parseRow($, cells) {
      const locRaw = $(cells[0]).html() || ''
      const locParts = locRaw
        .split(/<br\s*\/?>/i)
        .map((s) => $('<div>').html(s).text().trim())
        .filter(Boolean)
      const region = locParts[0] || ''
      const street = locParts[1] || ''

      const rooms = $(cells[1]).text().trim()
      const area = $(cells[2]).text().trim()
      const series = $(cells[3]).text().trim()
      const priceText = $(cells[4]).text().trim()

      return {
        title: `${rooms}-istabu dzīvoklis, ${region}`,
        details: `${street}, ${area} m², ${series}`,
        priceText,
      }
    },
  },
  {
    key: 'zeme',
    startUrl: 'https://www.ss.lv/lv/real-estate/plots-and-lands/today-5/sell/',
    pagesToFetch: 8,
    minCells: 3,
    parseRow($, cells) {
      const locRaw = $(cells[0]).html() || ''
      const locParts = locRaw
        .split(/<br\s*\/?>/i)
        .map((s) => $('<div>').html(s).text().trim())
        .filter(Boolean)
      const region = locParts[0] || ''
      const street = locParts[1] || ''

      const area = $(cells[1]).text().trim()
      const priceText = $(cells[2]).text().trim()

      return {
        title: `Zemes gabals, ${region}`,
        details: `${street}, ${area}`,
        priceText,
      }
    },
  },
  {
    key: 'elektronika',
    startUrl: 'https://www.ss.lv/lv/electronics/computers/today-5/',
    pagesToFetch: 10,
    minCells: 1,
    parseRow($, cells, row, title, detailHref) {
      const priceText = $(cells[cells.length - 1]).text().trim()
      const region = row.find('.ads_region').text().trim()

      const subSlug = extractElectronicsSubcategory(detailHref)
      const subLabel = ELECTRONICS_SUBCATEGORY_LABELS[subSlug] || 'Elektronika'
      const cleanTitle = region ? `${subLabel}, ${region}` : subLabel

      const trimmedAdText = title.length > 140 ? title.slice(0, 140).trim() + '…' : title

      return {
        title: cleanTitle,
        details: trimmedAdText,
        priceText,
      }
    },
  },
  {
    key: 'suņi',
    startUrl: 'https://www.ss.lv/lv/animals/dogs/today-5/',
    pagesToFetch: 10,
    minCells: 3,
    parseRow: makeAnimalParseRow('Suns'),
  },
  {
    key: 'kaķi',
    startUrl: 'https://www.ss.lv/lv/animals/cats/today-5/',
    pagesToFetch: 6,
    minCells: 3,
    parseRow: makeAnimalParseRow('Kaķis'),
  },
  {
    key: 'eksotiskie_dzīvnieki',
    startUrl: 'https://www.ss.lv/lv/animals/exotic-animals/today-5/',
    pagesToFetch: 2,
    minCells: 3,
    parseRow: makeAnimalParseRow('Eksotisks dzīvnieks'),
  },
  {
    key: 'mēbeles',
    startUrl: 'https://www.ss.lv/lv/home-stuff/furniture-interior/today-5/',
    pagesToFetch: 10,
    minCells: 1,
    parseRow($, cells, row, title) {
      const priceText = $(cells[cells.length - 1]).text().trim()
      const condition = $(cells[cells.length - 2]).text().trim()
      const region = row.find('.ads_region').text().trim()

      const conditionLabel = condition === 'jaun.' ? 'Jauns' : condition === 'lietota' ? 'Lietots' : ''
      const shortTitle = title.length > 100 ? title.slice(0, 100).trim() + '…' : title

      return {
        title: shortTitle,
        details: [region, conditionLabel].filter(Boolean).join(' · '),
        priceText,
      }
    },
  },
  {
    key: 'dārglietas',
    startUrl: 'https://www.ss.lv/lv/home-stuff/jewelry/today-5/nophoto/',
    pagesToFetch: 10,
    minCells: 1,
    parseRow($, cells, row, title) {
      const priceText = $(cells[cells.length - 1]).text().trim()
      const region = row.find('.ads_region').text().trim()
      const shortTitle = title.length > 100 ? title.slice(0, 100).trim() + '…' : title

      return {
        title: shortTitle,
        details: region || 'Dārglietas, rotaslietas',
        priceText,
      }
    },
  },
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
  const match = text.match(/[\d.,]+/)
  if (!match) return null
  const cleaned = match[0].replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.round(num)
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

function parseListings(html, categoryConfig) {
  const $ = cheerio.load(html)
  const listings = []

  $('tr[id^="tr_"]').each((_, el) => {
    const row = $(el)
    const titleLink = row.find('td.msg2 .d1 a')
    const title = titleLink.text().trim()
    const detailHref = titleLink.attr('href')
    const cells = row.find('td.msga2-o, td.msga2-r')

    if (!title || !detailHref || cells.length < categoryConfig.minCells) return

    const parsed = categoryConfig.parseRow($, cells, row, title, detailHref)
    const price = cleanPrice(parsed.priceText)
    if (!price || price < 5) return

    listings.push({
      category: categoryConfig.key,
      title: parsed.title,
      details: parsed.details,
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

  const categoriesToRun = ACTIVE_CATEGORY_KEYS
    ? CATEGORIES.filter((c) => ACTIVE_CATEGORY_KEYS.includes(c.key))
    : CATEGORIES

  console.log(`Skrapos šīs kategorijas: ${categoriesToRun.map((c) => c.key).join(', ')}`)

  for (const categoryConfig of categoriesToRun) {
    console.log(`\n=== POSMS 1: ${categoryConfig.key} ===`)

    for (let page = 1; page <= categoryConfig.pagesToFetch; page++) {
      const url = pageUrl(categoryConfig.startUrl, page)
      console.log(`Ielādē lapu ${page}: ${url}`)

      try {
        const html = await fetchPage(url)
        const listings = parseListings(html, categoryConfig)
        console.log(`  Atrasti ${listings.length} sludinājumi šajā lapā`)
        allListings.push(...listings)
      } catch (err) {
        console.error(`  Kļūda: ${err.message}`)
      }

      if (page < categoryConfig.pagesToFetch) {
        await sleep(DELAY_MS)
      }
    }

    await sleep(DELAY_MS)
  }

  console.log(`\nKopā atrasti ${allListings.length} sludinājumi visās kategorijās.`)
  console.log(`\n=== POSMS 2: detaļu vākšana katram sludinājumam ===`)
  console.log(`(Tas prasīs apmēram ${Math.round((allListings.length * DELAY_MS) / 60000)} minūtes)`)

  const finalListings = []

  for (let i = 0; i < allListings.length; i++) {
    const listing = allListings[i]

    try {
      const detail = await scrapeDetail(listing.detailUrl)
      console.log(`[${i + 1}/${allListings.length}] (${listing.category}) ${listing.title} — ${detail.images.length} foto`)

      finalListings.push({
        category: listing.category,
        title: listing.title,
        details: listing.details,
        correct_price: listing.correct_price,
        image_url: detail.images[0] || null,
        image_urls: detail.images,
        description: detail.description || null,
        specs: detail.specs,
        source_url: listing.detailUrl,
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
        source_url: listing.detailUrl,
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