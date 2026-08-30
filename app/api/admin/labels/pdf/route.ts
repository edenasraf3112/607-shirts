import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { existsSync } from 'fs'
import QRCode from 'qrcode'
import { groupOrdersByCustomer } from '@/lib/customerGroups'
import { attachPickupNumbers } from '@/lib/pickupNumbers'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

const SITE = 'https://nehorayleizer.com'

const LOCAL_CHROME_PATHS = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

async function makeQR(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    width: 120,
    color: { dark: '#1A1A1A', light: '#FAFAF8' },
  })
}

function buildSizeBreakdown(items: any[]): { size: string; qty: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const size = (item.size ?? item.variant ?? '').toString().trim()
    const qty = Math.max(Number(item.quantity ?? item.qty ?? 1), 1)
    map.set(size, (map.get(size) ?? 0) + qty)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const ai = SIZE_ORDER.indexOf(a.toUpperCase())
      const bi = SIZE_ORDER.indexOf(b.toUpperCase())
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.localeCompare(b)
    })
    .map(([size, qty]) => ({ size, qty }))
}

function labelHtml(order: any): string {
  const items: any[] = Array.isArray(order.items) ? order.items : []
  const sizes = buildSizeBreakdown(items)
  const totalQty = sizes.reduce((s, r) => s + r.qty, 0)
  const price = Number(order.total).toLocaleString('he-IL')

  const uniqueProducts = Array.from(new Set(items.map((i: any) => (i.product_name ?? '').toString().trim()).filter(Boolean)))
  const productsLine = uniqueProducts.join(' · ')

  const sizeRowsHtml = sizes
    .map(({ size, qty }) => `<div class="size-row"><span class="sz-name">${size}</span><span class="sz-sep"> – </span><span class="sz-qty">${qty}</span></div>`)
    .join('')

  return `
    <div class="label" dir="rtl">
      <div class="lbl-head">
        <span class="lbl-brand">Nehoray Leizer</span>
        <span class="lbl-num">#${order.number}</span>
      </div>

      <div class="lbl-body">
        <!-- size box: top-left (LTR first child) -->
        <div class="size-box">
          <div class="size-total">כמות: ${totalQty}</div>
          ${sizeRowsHtml}
        </div>
        <!-- customer info: right column, RTL -->
        <div class="customer-info">
          <div class="ornament"></div>
          <div class="lbl-name">${order.customer_name}</div>
          <div class="lbl-field">${order.customer_phone}</div>
          ${order.customer_email ? `<div class="lbl-field lbl-field-sm">${order.customer_email}</div>` : ''}
          ${order.customer_address ? `<div class="lbl-field">${order.customer_address}</div>` : ''}
          ${productsLine ? `<div class="lbl-items">${productsLine}</div>` : ''}
        </div>
      </div>

      <div class="lbl-divider"></div>

      <div class="lbl-foot">
        <div class="qr-wrap">
          ${order.qrSvg}
          <span class="qr-sub">scan to confirm</span>
        </div>
        <div class="price-block">
          <div class="price-lbl">סכום</div>
          <div class="price-val"><span class="price-sym">₪</span>${price}</div>
        </div>
      </div>
    </div>`
}

function buildHtml(orders: any[]): string {
  const pages: any[][] = []
  for (let i = 0; i < orders.length; i += 6) pages.push(orders.slice(i, i + 6))

  const pagesHtml = pages
    .map(group => `<div class="page">${group.map(o => labelHtml(o)).join('')}</div>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: white;
      direction: ltr;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .page {
      width: 794px;
      height: 1123px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(3, 1fr);
      gap: 14px;
      padding: 28px;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .page:last-child { page-break-after: avoid; break-after: avoid; }

    .label {
      border: 1.5px solid #1A1A1A;
      background: #FAFAF8;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
      min-height: 0;
    }

    /* ── Header ── */
    .lbl-head {
      background: #1A1A1A !important;
      color: #FAFAF8 !important;
      padding: 7px 12px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .lbl-brand {
      font-family: Georgia, serif;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .lbl-num {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    /* ── Body: size-box LEFT + customer-info RIGHT ── */
    .lbl-body {
      padding: 10px 12px 6px;
      flex: 1;
      display: flex;
      flex-direction: row;
      direction: ltr;
      align-items: flex-start;
      gap: 8px;
      overflow: hidden;
    }

    /* Size breakdown box – top-left */
    .size-box {
      flex-shrink: 0;
      background: #F0EDE8 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border: 1px solid #D8D3CC;
      padding: 7px 11px;
      direction: ltr;
      text-align: left;
    }
    .size-total {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      font-weight: bold;
      color: #1A1A1A;
      margin-bottom: 4px;
      direction: rtl;
      text-align: right;
    }
    .size-row {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      color: #1A1A1A;
      line-height: 1.6;
      direction: ltr;
    }
    .sz-name { font-weight: 700; min-width: 30px; display: inline-block; }
    .sz-sep  { color: #9B958F; }
    .sz-qty  { color: #3A3530; }

    /* Customer info – right column, RTL */
    .customer-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
      direction: rtl;
      text-align: right;
    }
    .ornament {
      width: 28px;
      height: 3px;
      background: #A89060 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin-bottom: 4px;
      flex-shrink: 0;
      border-radius: 1px;
    }
    .lbl-name {
      font-family: Georgia, serif;
      font-size: 54px;
      font-weight: bold;
      color: #1A1A1A;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.01em;
    }
    .lbl-field {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 34px;
      color: #3A3530;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
      font-weight: 600;
    }
    .lbl-field-sm {
      font-size: 21px;
      color: #6B6560;
      font-weight: 400;
    }
    .lbl-items {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #9B958F;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Divider ── */
    .lbl-divider {
      height: 1px;
      background: #E0DCD6 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0 14px;
      flex-shrink: 0;
    }

    /* ── Footer: QR left, price right ── */
    .lbl-foot {
      padding: 10px 12px 13px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
      flex-shrink: 0;
      direction: ltr;
    }
    .qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .qr-wrap svg {
      display: block;
      width: 96px !important;
      height: 96px !important;
    }
    .qr-sub {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8px;
      color: #9B958F;
      direction: ltr;
      letter-spacing: 0.02em;
    }
    .price-block { text-align: right; direction: ltr; }
    .price-lbl {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #6B6560;
      margin-bottom: 4px;
    }
    .price-val {
      font-family: Georgia, serif;
      font-size: 52px;
      font-weight: bold;
      color: #1A1A1A;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .price-sym {
      font-size: 28px;
      vertical-align: super;
      letter-spacing: 0;
    }
  </style>
</head>
<body>${pagesHtml}</body>
</html>`
}

export async function GET() {
  if (!isAuthed()) return new NextResponse('Unauthorized', { status: 401 })

  let orders: any[] = []
  try {
    const { data } = await getServiceClient()
      .from('orders')
      .select('id, customer_name, customer_phone, customer_email, customer_address, total, status, items')
      .is('deleted_at', null)
      .not('status', 'eq', 'delivered')
      .order('created_at', { ascending: false })
    orders = data || []
  } catch {}

  const groups = groupOrdersByCustomer(orders)
  await attachPickupNumbers(groups)
  const groupsWithQR = await Promise.all(
    groups.map(async (g) => ({ ...g, qrSvg: await makeQR(`${SITE}/track/${g.orderIds.join(',')}`) }))
  )

  const html = buildHtml(groupsWithQR)

  let executablePath: string
  let launchArgs: string[]

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default
    executablePath = await chromium.executablePath()
    launchArgs = chromium.args
  } else {
    executablePath = LOCAL_CHROME_PATHS.find(existsSync) ?? 'google-chrome'
    launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }

  const puppeteer = (await import('puppeteer-core')).default

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    headless: true as any,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const pdfBuffer = await page.pdf({
      width: '794px',
      height: '1123px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="labels-${groupsWithQR.length}.pdf"`,
      },
    })
  } finally {
    await browser.close()
  }
}
