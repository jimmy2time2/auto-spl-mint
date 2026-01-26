import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  symbol: string;
  position: "center" | "top" | "bottom";
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Mind9",
    description: "You're entering an experiment in autonomous finance. An AI with its own wallet, its own decisions, and zero human control. It creates tokens when it feels like it.",
    symbol: "◉",
    position: "center",
  },
  {
    id: "countdown",
    title: "The Countdown",
    description: "Nobody knows exactly when. The AI wakes up every 3-12 hours based on market chaos, its mood, and pure randomness. When the timer hits zero — a new token is born.",
    symbol: "○",
    position: "center",
  },
  {
    id: "mood",
    title: "It Has Moods",
    description: "INSPIRED. GREEDY. CHAOTIC. The AI's emotional state shapes what it creates. A bored AI makes different tokens than an excited one. Watch its mood. Predict its moves.",
    symbol: "◐",
    position: "center",
  },
  {
    id: "trading",
    title: "Trade What It Builds",
    description: "The moment a token launches, it's live. Connect your wallet, pick your position, and ride the wave. Early traders often become lucky wallet recipients.",
    symbol: "→",
    position: "center",
  },
  {
    id: "rewards",
    title: "Random Rewards",
    description: "The AI randomly selects active traders and airdrops them tokens. No applications. No requirements. Just be active — and you might get lucky.",
    symbol: "✦",
    position: "center",
  },
  {
    id: "logbook",
    title: "Nothing Hidden",
    description: "Every thought. Every decision. Every launch. It's all public in the Logbook. This AI operates in the open — judge it by its actions.",
    symbol: "≡",
    position: "center",
  },
];

const TOUR_STORAGE_KEY = "mind9_tour_completed";

export const OnboardingTour = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already completed the tour
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Small delay before showing tour
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
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
        className="absolute inset-0 bg-foreground/80 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div 
        className={`relative bg-card border-4 border-primary p-6 md:p-8 max-w-md mx-4 transition-all duration-150 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 hover:bg-muted transition-colors"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 transition-all ${
                idx === currentStep 
                  ? "bg-primary scale-125" 
                  : idx < currentStep 
                    ? "bg-primary/50" 
                    : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Symbol */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 border border-primary/50 flex items-center justify-center">
            <span className="text-2xl">{step.symbol}</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-3">
            {step.title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step Counter */}
        <div className="text-center mb-4">
          <span className="metric-label text-xs">
            {currentStep + 1} OF {tourSteps.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 h-12 font-bold uppercase tracking-wide"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className={`h-12 font-bold uppercase tracking-wide ${isFirstStep ? "flex-1" : "flex-1"}`}
          >
            {isLastStep ? (
              <>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip Link */}
        <button
          onClick={handleSkip}
          className="w-full mt-4 text-center text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
        >
          Skip Tour
        </button>
      </div>
    </div>
  );
};

// Hook to manually trigger the tour (e.g., from a help button)
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
