'use client'

import { useState } from 'react'
import { Send, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'

const DEFAULT_SUBJECT = 'הקולקציה הראשונה נפתחה להזמנות — Nehoray Leizer'

const DEFAULT_BODY = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:48px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1A1A1A;max-width:520px;width:100%;">
        <tr>
          <td style="padding:48px 40px 32px;text-align:center;">
            <img src="https://nehorayleizer.com/assets/branding/brand-logo.png" alt="Nehoray Leizer" style="max-height:64px;max-width:200px;width:auto;filter:invert(1);" />
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#C8C0B4;font-family:Arial,sans-serif;text-transform:uppercase;">הקולקציה הראשונה</p>
            <h1 style="margin:0 0 24px;font-size:32px;font-weight:300;color:#FAFAF8;font-family:Georgia,serif;line-height:1.2;">
              ההזמנות נפתחו
            </h1>
            <div style="height:1px;background:rgba(255,255,255,0.15);margin-bottom:24px;"></div>
            <p style="margin:0 0 28px;font-size:14px;color:#C8C0B4;line-height:1.8;font-family:Arial,sans-serif;">
              חיכית לזה — הקולקציה הראשונה של Nehoray Leizer<br>
              פתוחה להזמנות עד <strong style="color:#FAFAF8;">16.07</strong>.<br><br>
              כל חולצה מיוצרת לפי הזמנה, בכמות מוגבלת.
            </p>
            <a href="https://nehorayleizer.com/shop/all" style="display:inline-block;padding:14px 40px;background:#FAFAF8;color:#1A1A1A;text-decoration:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">
              לצפייה בקולקציה
            </a>
            <p style="margin:32px 0 0;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;">
              קיבלת מייל זה כי נרשמת לרשימת הממתינים.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#111;text-align:center;">
            <p style="margin:0;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">
              Nehoray Leizer &nbsp;·&nbsp; <a href="https://nehorayleizer.com" style="color:#6B6560;text-decoration:none;">nehorayleizer.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

export default function WaitlistEmailSender({ count }: { count: number }) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; total?: number } | null>(null)

  async function send(testOnly: boolean) {
    if (!subject.trim()) { toast.error('חסר נושא'); return }
    if (testOnly && !testEmail.trim()) { toast.error('הזן אימייל לבדיקה'); return }
    if (!testOnly && !confirm(`לשלוח לכל ${count} הנרשמים?`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/send-waitlist-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, bodyHtml: body, testOnly, testEmail }),
      })
      const data = await res.json()
      if (!data.ok) { toast.error(data.error || 'שגיאה'); return }
      setResult({ sent: data.sent, total: data.total })
      toast.success(testOnly ? `נשלח בדיקה ל-${testEmail}` : `נשלח ל-${data.sent} נרשמים`)
    } catch {
      toast.error('שגיאה בשליחה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-charcoal">שליחת מייל השקה</h2>
        <span className="text-xs text-warm-gray bg-cream-dark px-3 py-1 rounded-full">{count} נמענים</span>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          ✓ נשלח בהצלחה ל-{result.sent}{result.total ? `/${result.total}` : ''} נמענים
        </div>
      )}

      <div>
        <label className="text-xs text-warm-gray block mb-1">נושא המייל</label>
        <input
          className="w-full border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-warm-gray block mb-1">תוכן HTML (ניתן לערוך)</label>
        <textarea
          className="w-full border border-light-gray px-3 py-2 text-sm font-mono focus:outline-none focus:border-charcoal h-40 resize-y"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1">
          <label className="text-xs text-warm-gray block mb-1">שלח בדיקה ל-</label>
          <input
            type="email"
            placeholder="האימייל שלך לבדיקה"
            className="w-full border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
          />
        </div>
        <button
          onClick={() => send(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-charcoal text-charcoal text-sm hover:bg-cream-dark transition-colors disabled:opacity-40"
        >
          <TestTube size={14} /> שלח בדיקה
        </button>
        <button
          onClick={() => send(false)}
          disabled={loading || count === 0}
          className="flex items-center gap-2 px-5 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-40"
        >
          <Send size={14} /> שלח לכולם ({count})
        </button>
      </div>
    </div>
  )
}
