export const dynamic = 'force-dynamic'
import { getServiceClient } from '@/lib/supabase'
import QRCode from 'qrcode'
import LabelsPrintButton from './_LabelsPrintButton'
import { groupOrdersByCustomer } from '@/lib/customerGroups'
import { attachPickupNumbers } from '@/lib/pickupNumbers'

const SITE = 'https://nehorayleizer.com'
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

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

async function makeQR(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    width: 88,
    color: { dark: '#1A1A1A', light: '#FAFAF8' },
  })
}

export default async function LabelsPage() {
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
    groups.map(async (g) => ({
      ...g,
      qrSvg: await makeQR(`${SITE}/track/${g.orderIds.join(',')}`),
    }))
  )

  const pages = chunk(groupsWithQR, 6)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #ccc9c3;
          font-family: Georgia, 'Times New Roman', serif;
          padding: 24px 16px;
          direction: ltr;
        }

        .intro {
          text-align: center;
          font-family: system-ui, sans-serif;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5a5450;
          margin-bottom: 16px;
        }

        .controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn-back {
          padding: 7px 16px;
          border: 1px solid #6B6560;
          color: #6B6560;
          text-decoration: none;
          font-size: 12px;
          font-family: system-ui, sans-serif;
        }

        /* A4 sheet — fixed row height so every label matches */
        .sheet {
          background: white;
          width: 100%;
          max-width: 680px;
          margin: 0 auto 28px;
          box-shadow: 0 6px 32px rgba(0,0,0,.22);
          padding: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-rows: 235px;
          gap: 10px;
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
          direction: rtl;
        }

        /* Header bar */
        .lbl-head {
          background: #1A1A1A;
          color: #FAFAF8;
          padding: 5px 9px 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .lbl-brand {
          font-family: Georgia, serif;
          font-size: 7.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: .9;
        }
        .lbl-num {
          font-family: system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
        }

        /* Body: size-box top-left + customer info right, RTL */
        .lbl-body {
          padding: 8px 10px 4px;
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
          padding: 3px 7px;
          direction: ltr;
        }
        .sz-row {
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9px;
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
          width: 22px;
          height: 1px;
          background: #A89060;
          margin-bottom: 4px;
        }

        /* H1 — name */
        .lbl-name {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: bold;
          color: #1A1A1A;
          line-height: 1.15;
          letter-spacing: .01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* H2 — phone / address */
        .lbl-field {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #3A3530;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* H3 — email */
        .lbl-field-sm {
          font-size: 10px;
          font-weight: 400;
          color: #6B6560;
        }
        .lbl-icon {
          font-size: 9px;
          opacity: .5;
          flex-shrink: 0;
        }

        /* Divider */
        .lbl-divider {
          height: 1px;
          background: #E0DCD6;
          margin: 6px 10px 0;
        }

        /* Footer */
        .lbl-foot {
          padding: 6px 10px 8px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .price-lbl {
          font-family: system-ui, sans-serif;
          font-size: 6.5px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6B6560;
          opacity: .65;
          margin-bottom: 1px;
        }
        .price-val {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: bold;
          color: #1A1A1A;
          letter-spacing: -.02em;
          line-height: 1;
        }
        .price-sym {
          font-size: 14px;
          vertical-align: super;
        }

        .qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .qr-wrap svg { display: block; width: 56px !important; height: 56px !important; }
        .qr-sub {
          font-family: system-ui, sans-serif;
          font-size: 5px;
          letter-spacing: .02em;
          color: #6B6560;
          opacity: .55;
          direction: ltr;
        }

        @media print {
          .controls { display: none !important; }
          body {
            background: white !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet {
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 190mm !important;
            width: 190mm !important;
            padding: 0 !important;
            gap: 4mm !important;
            grid-auto-rows: 89mm !important;
            page-break-after: always;
            break-after: page;
            margin-bottom: 0 !important;
          }
          .label {
            height: 89mm !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .lbl-head { background: #1A1A1A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <div className="controls">
        <a
          href="/api/admin/labels"
          target="_blank"
          style={{ padding: '8px 20px', background: '#1A1A1A', color: '#FAFAF8', textDecoration: 'none', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}
        >
          🖨️ פתח להדפסה ({groupsWithQR.length})
        </a>
        <a className="btn-back" href="/admin/orders">← חזרה להזמנות</a>
      </div>

      {groupsWithQR.length === 0 ? (
        <p className="intro">אין הזמנות פעילות</p>
      ) : (
        <>
          <p className="intro">{groupsWithQR.length} מדבקות · {pages.length} דפים · 2 × 3</p>
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="sheet">
              {page.map((group: any) => {
                const items: any[] = Array.isArray(group.items) ? group.items : []
                const sizes = buildSizeBreakdown(items)
                return (
                  <div key={group.key} className="label">
                    <div className="lbl-head">
                      <span className="lbl-brand">Nehoray Leizer</span>
                      <span className="lbl-num">#{group.number}</span>
                    </div>
                    <div className="lbl-body">
                      {sizes.length > 0 && (
                        <div className="size-box">
                          {sizes.map(({ size, qty }) => (
                            <div key={size} className="sz-row">{size} – {qty}</div>
                          ))}
                        </div>
                      )}
                      <div className="customer-info">
                        <div className="ornament" />
                        <div className="lbl-name">{group.customer_name}</div>
                        <div className="lbl-field"><span className="lbl-icon">☎</span>{group.customer_phone}</div>
                        {group.customer_email && (
                          <div className="lbl-field lbl-field-sm"><span className="lbl-icon">@</span>{group.customer_email}</div>
                        )}
                        {group.customer_address && (
                          <div className="lbl-field">{group.customer_address}</div>
                        )}
                      </div>
                    </div>
                    <div className="lbl-divider" />
                    <div className="lbl-foot">
                      <div>
                        <div className="price-lbl">סכום</div>
                        <div className="price-val">
                          <span className="price-sym">₪</span>{group.total}
                        </div>
                      </div>
                      <div className="qr-wrap">
                        <div dangerouslySetInnerHTML={{ __html: group.qrSvg }} />
                        <span className="qr-sub">scan to confirm</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
