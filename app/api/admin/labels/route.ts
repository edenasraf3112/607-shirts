import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import QRCode from 'qrcode'
import { groupOrdersByCustomer } from '@/lib/customerGroups'
import { attachPickupNumbers } from '@/lib/pickupNumbers'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

const SITE = 'https://nehorayleizer.com'
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

async function makeQR(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    width: 120,
    color: { dark: '#1A1A1A', light: '#FAFAF8' },
  })
}

function formatPrice(n: number) {
  return `₪${n.toLocaleString('he-IL')}`
}

function buildSizeBreakdown(items: any[]): { size: string; qty: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const size = (item.size ?? '').toString().trim()
    const qty = Math.max(Number(item.quantity ?? 1), 1)
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

function labelHtml(order: any, qrSvg: string): string {
  const items: any[] = Array.isArray(order.items) ? order.items : []
  const sizes = buildSizeBreakdown(items)
  const sizeRowsHtml = sizes
    .map(({ size, qty }) => `<div class="sz-row">${size} – ${qty}</div>`)
    .join('')

  return `
    <div class="label" dir="rtl">
      <div class="lbl-head">
        <span class="lbl-brand">Nehoray Leizer</span>
        <span class="lbl-num">#${order.number}</span>
      </div>
      <div class="lbl-body">
        ${sizeRowsHtml ? `<div class="size-box">${sizeRowsHtml}</div>` : ''}
        <div class="customer-info">
          <div class="ornament"></div>
          <div class="lbl-name">${order.customer_name}</div>
          <div class="lbl-field">☎ ${order.customer_phone}</div>
          ${order.customer_email ? `<div class="lbl-field lbl-field-sm">@ ${order.customer_email}</div>` : ''}
          ${order.customer_address ? `<div class="lbl-field">${order.customer_address}</div>` : ''}
        </div>
      </div>
      <div class="lbl-divider"></div>
      <div class="lbl-foot">
        <div>
          <div class="price-lbl">סכום</div>
          <div class="price-val">${formatPrice(order.total)}</div>
        </div>
        <div class="qr-wrap">
          ${qrSvg}
          <span class="qr-sub">scan to confirm</span>
        </div>
      </div>
    </div>`
}

function pageHtml(group: any[]): string {
  return `<div class="page">${group.map(o => labelHtml(o, o.qrSvg)).join('')}</div>`
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

  const pages: any[][] = []
  for (let i = 0; i < groupsWithQR.length; i += 6) pages.push(groupsWithQR.slice(i, i + 6))

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>מדבקות משלוח — Nehoray Leizer</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #ccc9c3;
      padding: 16px;
      direction: ltr;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
      font-family: system-ui, sans-serif;
    }
    .controls button {
      padding: 10px 28px;
      background: #1A1A1A;
      color: #FAFAF8;
      border: none;
      font-size: 14px;
      cursor: pointer;
    }
    .controls a {
      color: #6B6560;
      font-size: 13px;
      text-decoration: none;
    }

    /* On screen: responsive sheet — fixed row height so every label matches */
    .page {
      background: white;
      width: 100%;
      max-width: 680px;
      margin: 0 auto 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 230px;
      gap: 10px;
      padding: 12px;
    }

    /* One label — height comes from the grid row, not content */
    .label {
      border: 1.5px solid #1A1A1A;
      background: #FAFAF8;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .lbl-head {
      background: #1A1A1A;
      color: #FAFAF8;
      padding: 4px 8px 3px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .lbl-brand {
      font-family: Georgia, serif;
      font-size: 8px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .lbl-num {
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 700;
    }

    /* Body: size-box top-left + customer info right, RTL */
    .lbl-body {
      padding: 7px 9px 5px;
      flex: 1;
      display: flex;
      flex-direction: row;
      direction: ltr;
      align-items: flex-start;
      gap: 6px;
      overflow: hidden;
    }
    .size-box {
      flex-shrink: 0;
      background: #F0EDE8;
      border: 1px solid #D8D3CC;
      padding: 3px 6px;
      direction: ltr;
    }
    .sz-row {
      display: block;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8px;
      font-weight: 700;
      color: #1A1A1A;
      line-height: 1.5;
      white-space: nowrap;
    }
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
      width: 18px;
      height: 1px;
      background: #A89060;
      margin-bottom: 3px;
      flex-shrink: 0;
    }
    /* H1 — name */
    .lbl-name {
      font-family: Georgia, serif;
      font-size: 24px;
      font-weight: bold;
      color: #1A1A1A;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* H2 — phone / address */
    .lbl-field {
      font-family: system-ui, sans-serif;
      font-size: 14px;
      color: #3A3530;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
      line-height: 1.3;
    }
    /* H3 — email */
    .lbl-field-sm {
      font-size: 9px;
      font-weight: 400;
      color: #6B6560;
    }

    .lbl-divider {
      height: 1px;
      background: #E0DCD6;
      margin: 0 9px;
      flex-shrink: 0;
    }

    .lbl-foot {
      padding: 5px 9px 6px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .price-lbl {
      font-family: system-ui, sans-serif;
      font-size: 6px;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #6B6560;
      margin-bottom: 1px;
    }
    .price-val {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: bold;
      color: #1A1A1A;
      line-height: 1;
    }

    .qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .qr-wrap svg {
      display: block;
      width: 52px !important;
      height: 52px !important;
    }
    .qr-sub {
      font-family: system-ui, sans-serif;
      font-size: 5px;
      color: #9B958F;
      direction: ltr;
    }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .controls { display: none !important; }
      .page {
        width: 210mm !important;
        height: 297mm !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 8mm !important;
        gap: 4mm !important;
        grid-template-columns: 1fr 1fr !important;
        grid-template-rows: repeat(3, 1fr) !important;
        page-break-after: always;
        break-after: page;
        overflow: hidden;
      }
      .label {
        overflow: hidden;
        height: 100% !important;
        min-height: 0 !important;
      }
      .lbl-head {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <a href="/api/admin/labels/pdf" download="labels.pdf" style="padding:10px 28px;background:#1A1A1A;color:#FAFAF8;text-decoration:none;font-size:14px;font-family:system-ui,sans-serif;">⬇️ הורד PDF (${groupsWithQR.length})</a>
    <button onclick="window.print()" style="padding:10px 28px;background:transparent;color:#6B6560;border:1px solid #6B6560;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif;">🖨️ הדפס (מחשב בלבד)</button>
    <a href="/admin/orders" style="color:#6B6560;font-size:13px;text-decoration:none;">← חזרה להזמנות</a>
  </div>
  ${pages.map(pageHtml).join('\n')}
  <script>
    // Remove last page's page-break to avoid blank final page
    const pages = document.querySelectorAll('.page');
    if (pages.length > 0) pages[pages.length - 1].style.pageBreakAfter = 'avoid';
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
