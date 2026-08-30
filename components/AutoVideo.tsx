'use client'

import { useState } from 'react'

export default function AutoVideo({ src }: { src: string }) {
  const [ratio, setRatio] = useState<number | null>(null)

  return (
    <div
      className="max-w-3xl mx-auto bg-charcoal/5 overflow-hidden"
      style={ratio ? { aspectRatio: ratio } : { minHeight: 200 }}
    >
      <video
        src={src}
        controls
        playsInline
        className="w-full h-full object-contain"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight)
        }}
      />
    </div>
  )
}
