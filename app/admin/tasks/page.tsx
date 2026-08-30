'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { Plus, Trash2, CheckSquare, Square, GripVertical } from 'lucide-react'

type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
}

const STORAGE_KEY = 'nl_admin_tasks'

const QUICK_TASKS = [
  'לשלוח קובץ מידות למפעל',
  'לבדוק תשלומים',
  'לשלוח הודעה ללקוחות',
  'להכין אריזות',
  'להעלות קולקציה חדשה',
  'לעדכן מלאי',
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setTasks(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  function persist(next: Task[]) {
    setTasks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addTask(text: string) {
    if (!text.trim()) return
    const next: Task = { id: crypto.randomUUID(), text: text.trim(), done: false, createdAt: Date.now() }
    persist([next, ...tasks])
    setInput('')
  }

  function toggle(id: string) {
    persist(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function remove(id: string) {
    persist(tasks.filter(t => t.id !== id))
  }

  function clearDone() {
    persist(tasks.filter(t => !t.done))
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  if (!loaded) return <AdminShell><div className="text-center py-16 text-warm-gray">טוען...</div></AdminShell>

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">יומן משימות</h1>
          <p className="text-sm text-warm-gray">
            {pending.length} משימות פתוחות{done.length > 0 ? ` · ${done.length} הושלמו` : ''}
          </p>
        </div>

        {/* Add task */}
        <div className="bg-white rounded-xl border border-light-gray p-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask(input)}
              placeholder="הוסף משימה חדשה..."
              className="flex-1 border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right"
              dir="rtl"
              autoFocus
            />
            <button
              onClick={() => addTask(input)}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-40"
            >
              <Plus size={15} />
              הוסף
            </button>
          </div>

          {/* Quick tasks */}
          <div className="mt-3">
            <p className="text-xs text-warm-gray mb-2">הוסף מהיר:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TASKS.filter(qt => !tasks.some(t => t.text === qt)).map(qt => (
                <button
                  key={qt}
                  onClick={() => addTask(qt)}
                  className="text-xs px-2.5 py-1 border border-dashed border-light-gray rounded-full text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                >
                  + {qt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pending tasks */}
        {pending.length > 0 && (
          <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
            <div className="px-5 py-3 border-b border-light-gray">
              <h2 className="text-sm font-semibold text-charcoal">לביצוע ({pending.length})</h2>
            </div>
            <div className="divide-y divide-light-gray">
              {pending.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream-dark/30 group">
                  <GripVertical size={14} className="text-light-gray flex-shrink-0" />
                  <button onClick={() => toggle(task.id)} className="flex-shrink-0 text-warm-gray hover:text-charcoal">
                    <Square size={18} />
                  </button>
                  <span className="flex-1 text-sm text-charcoal text-right">{task.text}</span>
                  <button
                    onClick={() => remove(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-warm-gray/50 hover:text-red-brand transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done tasks */}
        {done.length > 0 && (
          <div className="bg-white rounded-xl border border-light-gray overflow-hidden opacity-70">
            <div className="px-5 py-3 border-b border-light-gray flex items-center justify-between">
              <h2 className="text-sm font-semibold text-warm-gray">הושלמו ({done.length})</h2>
              <button
                onClick={clearDone}
                className="text-xs text-warm-gray hover:text-red-brand transition-colors"
              >
                נקה הכל
              </button>
            </div>
            <div className="divide-y divide-light-gray">
              {done.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-cream-dark/20 group">
                  <div className="w-[14px] flex-shrink-0" />
                  <button onClick={() => toggle(task.id)} className="flex-shrink-0 text-green-600">
                    <CheckSquare size={18} />
                  </button>
                  <span className="flex-1 text-sm text-warm-gray line-through text-right">{task.text}</span>
                  <button
                    onClick={() => remove(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-warm-gray/50 hover:text-red-brand transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-warm-gray">
            <CheckSquare size={32} className="mx-auto text-light-gray mb-3" />
            <p className="font-serif text-lg">אין משימות</p>
            <p className="text-sm mt-1">הוסף משימה ראשונה למעלה</p>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
