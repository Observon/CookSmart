"use client"
import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ArrowRight, Check } from "lucide-react"

const MOBILE_BREAKPOINT = 768
const TOOLTIP_PADDING = 16
const TOOLTIP_DESKTOP_WIDTH = 320
const TOOLTIP_APPROX_HEIGHT = 200

interface TutorialStep {
  target: string
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  onComplete: () => void
  onSkip: () => void
}

export function TutorialOverlay({ steps, onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const hasSteps = steps.length > 0
  const lastIndex = hasSteps ? steps.length - 1 : 0
  const safeIndex = hasSteps ? Math.min(currentStep, lastIndex) : 0
  const step = hasSteps ? steps[safeIndex] : null

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    updateIsMobile()
    window.addEventListener("resize", updateIsMobile)

    return () => {
      window.removeEventListener("resize", updateIsMobile)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!step) {
      setTargetRect(null)
      return
    }

    const updateTargetPosition = () => {
      const target = document.querySelector(step.target)
      setTargetRect(target ? target.getBoundingClientRect() : null)
    }

    updateTargetPosition()
    window.addEventListener("resize", updateTargetPosition)
    window.addEventListener("scroll", updateTargetPosition)

    return () => {
      window.removeEventListener("resize", updateTargetPosition)
      window.removeEventListener("scroll", updateTargetPosition)
    }
  }, [step])

  const handleNext = () => {
    if (!step) {
      onComplete()
      return
    }

    if (safeIndex < lastIndex) {
      setCurrentStep((previous) => Math.min(previous + 1, lastIndex))
    } else {
      onComplete()
    }
  }

  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (!targetRect || !step || typeof window === "undefined") {
      return {}
    }

    if (isMobile) {
      return {
        bottom: TOOLTIP_PADDING,
        left: TOOLTIP_PADDING,
        right: TOOLTIP_PADDING,
        transform: "none",
      }
    }

    const tooltipHeight = TOOLTIP_APPROX_HEIGHT
    const tooltipWidth = TOOLTIP_DESKTOP_WIDTH

    const horizontalCenter = Math.max(
      TOOLTIP_PADDING,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING,
      ),
    )
    const clampTop = (value: number) =>
      Math.max(
        TOOLTIP_PADDING,
        Math.min(value, window.innerHeight - tooltipHeight - TOOLTIP_PADDING),
      )

    let positionStyle: CSSProperties = {}

    switch (step.position) {
      case "bottom": {
        const desiredTop = targetRect.bottom + TOOLTIP_PADDING
        const hasSpaceBelow =
          window.innerHeight - targetRect.bottom - TOOLTIP_PADDING >= tooltipHeight

        if (!hasSpaceBelow && targetRect.top >= tooltipHeight + TOOLTIP_PADDING * 2) {
          const aboveTop = targetRect.top - tooltipHeight - TOOLTIP_PADDING
          positionStyle = {
            top: clampTop(aboveTop),
            left: horizontalCenter,
          }
        } else {
          positionStyle = {
            top: clampTop(desiredTop),
            left: horizontalCenter,
          }
        }
        break
      }
      case "top": {
        const desiredTop = targetRect.top - tooltipHeight - TOOLTIP_PADDING
        const hasSpaceAbove = targetRect.top >= tooltipHeight + TOOLTIP_PADDING * 2

        if (hasSpaceAbove) {
          positionStyle = {
            top: clampTop(desiredTop),
            left: horizontalCenter,
          }
        } else if (window.innerHeight - targetRect.bottom - TOOLTIP_PADDING >= tooltipHeight) {
          const belowTop = targetRect.bottom + TOOLTIP_PADDING
          positionStyle = {
            top: clampTop(belowTop),
            left: horizontalCenter,
          }
        } else {
          positionStyle = {
            top: clampTop(desiredTop),
            left: horizontalCenter,
          }
        }
        break
      }
      case "left":
        positionStyle = {
          top: clampTop(targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          right: window.innerWidth - targetRect.left + TOOLTIP_PADDING,
        }
        break
      case "right":
        positionStyle = {
          top: clampTop(targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          left: targetRect.right + TOOLTIP_PADDING,
        }
        break
      default:
        positionStyle = {}
    }

    return {
      ...positionStyle,
      transform:
        step.position === "top" || step.position === "bottom"
          ? "translateX(0)"
          : "translateY(-10%)",
    }
  }, [isMobile, step, targetRect])

  if (!step) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onSkip} />

      {/* Highlight */}
      {targetRect && (
        <div
          className="absolute border-4 border-chart-4 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        className={`absolute p-5 space-y-4 bg-card shadow-2xl ${isMobile ? "w-auto" : "w-80"}`}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onSkip} className="flex-shrink-0 -mt-2 -mr-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full ${index === currentStep ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <Button onClick={handleNext} size="sm">
            {currentStep < steps.length - 1 ? (
              <>
                Próximo
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Concluir
                <Check className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
