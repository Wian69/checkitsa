'use client'
import { useState } from 'react'

export default function EvidenceViewer({ image, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    if (!image) return null

    // Handle JSON array from DB (multiple images)
    let imageUrl = image
    try {
        if (image.startsWith('[')) {
            const parsed = JSON.parse(image)
            if (Array.isArray(parsed) && parsed.length > 0) {
                imageUrl = parsed[0] // Show first evidence for now
            }
        }
    } catch (e) { }

    return (
        <div>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-emerald-400 transition-colors"
                >
                    📎 View Evidence
                </button>
            ) : (
                <div className="mt-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-gray-400 mb-2 hover:text-white"
                    >
                        Hide Evidence ✕
                    </button>
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="Scam Evidence"
                            className="max-w-full h-auto object-contain max-h-[400px]"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
