'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type AdminTask = { id: string; text: string; done: boolean; created_at: string }

export default function TaskChecklist({ tasks }: { tasks: AdminTask[] }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input.trim() }),
    })
    if (!res.ok) toast.error('שגיאה בהוספה')
    else { setInput(''); router.refresh() }
    setLoading(false)
  }

  async function toggleDone(task: AdminTask) {
    const res = await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, done: !task.done }),
    })
    if (!res.ok) toast.error('שגיאה')
    else router.refresh()
  }

  async function removeTask(id: string) {
    const res = await fetch('/api/admin/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) toast.error('שגיאה במחיקה')
    else router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray p-6 space-y-4 max-w-xl">
      <form onSubmit={addTask} className="flex gap-2">
        <input
          className="form-input flex-1"
          placeholder="משימה חדשה..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" disabled={loading} className="px-4 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          הוסף
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-warm-gray text-center py-6">אין משימות פתוחות</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center gap-3 py-2 border-b border-light-gray last:border-0">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task)}
                className="w-4 h-4 accent-charcoal flex-shrink-0"
              />
              <span className={`flex-1 text-sm ${task.done ? 'line-through text-warm-gray' : 'text-charcoal'}`}>
                {task.text}
              </span>
              <button onClick={() => removeTask(task.id)} className="text-warm-gray hover:text-red-500 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
