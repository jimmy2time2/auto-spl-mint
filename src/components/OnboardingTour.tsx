import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TourStep {
  id: string;
  title: string;
  description: string;
  symbol: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "MIND9 SYSTEM",
    description: "Autonomous AI economy. No human control. It creates tokens when it decides to. You trade what it builds.",
    symbol: "○",
  },
  {
    id: "countdown",
    title: "COUNTDOWN",
    description: "AI wakes every 3-12 hours. Nobody knows exactly when. Timer hits zero — new token mints.",
    symbol: "◔",
  },
  {
    id: "mood",
    title: "AI MOOD",
    description: "INSPIRED. GREEDY. CHAOTIC. Its emotional state shapes token themes. Watch the mood indicator.",
    symbol: "◑",
  },
  {
    id: "trading",
    title: "TRADE",
    description: "Tokens go live instantly. Connect wallet, pick position, ride the wave. Early traders get rewards.",
    symbol: "→",
  },
  {
    id: "rewards",
    title: "LUCKY",
    description: "Random airdrops to active traders. No applications. Just activity = chance for rewards.",
    symbol: "*",
  },
  {
    id: "logbook",
    title: "LOGBOOK",
    description: "Every decision logged publicly. Full transparency. Judge the AI by its actions.",
    symbol: "≡",
  },
];

const TOUR_STORAGE_KEY = "mind9_tour_completed";

export const OnboardingTour = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className="relative border-2 border-border bg-card max-w-sm mx-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted">
          <span className="data-sm">ONBOARDING</span>
          <button
            onClick={handleSkip}
            className="data-sm hover:text-muted-foreground"
            aria-label="Close tour"
          >
            [×]
          </button>
        </div>

        {/* Progress */}
        <div className="flex border-b border-border">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 ${
                idx <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Symbol */}
          <div className="text-center mb-3">
            <span className="text-3xl">{step.symbol}</span>
          </div>

          {/* Title */}
          <h3 className="text-center data-md font-bold mb-2">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-center text-sm text-muted-foreground mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Counter */}
          <div className="text-center mb-4">
            <span className="data-sm text-muted-foreground">
              {currentStep + 1}/{tourSteps.length}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 h-9 data-sm"
              >
                ← BACK
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex-1 h-9 data-sm"
            >
              {isLastStep ? 'START →' : 'NEXT →'}
            </Button>
          </div>
        </div>

        {/* Skip */}
        <div className="border-t border-border px-3 py-2 text-center">
          <button
            onClick={handleSkip}
            className="data-sm text-muted-foreground hover:text-foreground"
          >
            SKIP TOUR
          </button>
        </div>
      </div>
    </div>
  );
};

export const useOnboardingTour = () => {
  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  const hasSeenTour = () => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  };

  return { resetTour, hasSeenTour };
};

export default OnboardingTour;
