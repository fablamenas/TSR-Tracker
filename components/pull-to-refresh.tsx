"use client"

import { useEffect } from "react"

export function PullToRefresh() {
  useEffect(() => {
    let startY = 0
    let isTracking = false
    let hasTriggered = false
    const threshold = 80

    const handleTouchStart = (event: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      if (scrollTop === 0) {
        startY = event.touches[0]?.clientY ?? 0
        isTracking = true
        hasTriggered = false
      } else {
        isTracking = false
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTracking || hasTriggered) return
      const currentY = event.touches[0]?.clientY ?? 0
      if (currentY - startY > threshold) {
        hasTriggered = true
        window.location.reload(true)
      }
    }

    const handleTouchEnd = () => {
      isTracking = false
      hasTriggered = false
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  return null
}
