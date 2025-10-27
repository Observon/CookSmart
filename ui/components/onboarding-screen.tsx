"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChefHat, Package, Calculator, Sparkles, ArrowRight, Check } from "lucide-react"

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: <ChefHat className="w-16 h-16 text-primary" />,
      title: "Bem-vindo ao CookSmart!",
      description:
        "Calcule o custo real das suas receitas de forma simples e profissional. Vamos te mostrar como funciona!",
      image: "/chef-cooking.png",
    },
    {
      icon: <Package className="w-16 h-16 text-primary" />,
      title: "Cadastre seus Ingredientes",
      description:
        "Primeiro, adicione os ingredientes que você usa. Informe o custo e a quantidade de cada um para cálculos precisos.",
      image: "/ingredients-on-kitchen-counter.jpg",
    },
    {
      icon: <Calculator className="w-16 h-16 text-primary" />,
      title: "Crie suas Receitas",
      description:
        "Monte suas receitas selecionando ingredientes e quantidades. O app calcula automaticamente o custo total e por porção.",
      image: "/recipe-book-with-calculator.jpg",
    },
    {
      icon: <Sparkles className="w-16 h-16 text-primary" />,
      title: "Escaneie Notas Fiscais",
      description:
        "Use a câmera para escanear notas fiscais e atualizar preços automaticamente. Economize tempo e mantenha tudo atualizado!",
      image: "/scanning-receipt-with-phone.jpg",
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-6">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Pular
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md space-y-8">
          {/* Icon */}
          <div className="flex justify-center">{step.icon}</div>

          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg bg-muted">
            <img src={step.image || "/placeholder.svg"} alt={step.title} className="w-full h-64 object-cover" />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-foreground">{step.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button onClick={handleNext} className="w-full h-12 text-base font-semibold" size="lg">
            {currentStep < steps.length - 1 ? (
              <>
                Próximo
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Começar
                <Check className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
