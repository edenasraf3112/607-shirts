import { COLLECTION_PROGRESS_STEPS, type ProgressSteps } from '@/lib/clothing-categories'

type Props = {
  steps?: ProgressSteps | null
  compact?: boolean
}

export default function CollectionProgress({ steps, compact = false }: Props) {
  if (!steps || Object.keys(steps).length === 0) return null

  const completedCount = COLLECTION_PROGRESS_STEPS.filter(s => steps[s.key as keyof ProgressSteps]).length

  if (compact) {
    const lastCompleted = [...COLLECTION_PROGRESS_STEPS].reverse().find(s => steps[s.key as keyof ProgressSteps])
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {COLLECTION_PROGRESS_STEPS.map(step => {
            const done = !!steps[step.key as keyof ProgressSteps]
            return (
              <div
                key={step.key}
                className={`h-1.5 w-4 rounded-full transition-colors ${done ? 'bg-charcoal' : 'bg-light-gray'}`}
              />
            )
          })}
        </div>
        {lastCompleted && (
          <span className="text-xs text-warm-gray">
            {lastCompleted.emoji} {lastCompleted.label}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {COLLECTION_PROGRESS_STEPS.map((step, index) => {
        const done = !!steps[step.key as keyof ProgressSteps]
        const isLast = index === COLLECTION_PROGRESS_STEPS.length - 1

        return (
          <div key={step.key} className="flex gap-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                done ? 'bg-charcoal text-cream' : 'bg-light-gray text-warm-gray'
              }`}>
                {done ? '✓' : step.emoji}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[20px] mt-1 transition-colors ${done ? 'bg-charcoal' : 'bg-light-gray'}`} />
              )}
            </div>

            {/* Text */}
            <div className={`pb-5 ${isLast ? '' : ''}`}>
              <p className={`text-sm font-medium transition-colors ${done ? 'text-charcoal' : 'text-warm-gray'}`}>
                {step.label}
              </p>
              <p className="text-xs text-warm-gray/70 mt-0.5">{step.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
