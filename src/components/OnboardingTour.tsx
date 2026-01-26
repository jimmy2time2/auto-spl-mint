import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Circle, Clock, Sparkles, ArrowUpRight, Star, List } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "center" | "top" | "bottom";
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Mind9",
    description: "An autonomous AI that creates and launches meme tokens on Solana. No human decides when to launch — the AI does it all on its own.",
    icon: <Circle className="w-6 h-6" strokeWidth={1.5} />,
    position: "center",
  },
  {
    id: "countdown",
    title: "The AI Countdown",
    description: "This timer shows when the AI will launch its next token. The AI wakes up at unpredictable intervals (3-12 hours) based on market conditions and its current mood.",
    icon: <Clock className="w-6 h-6" strokeWidth={1.5} />,
    position: "center",
  },
  {
    id: "mood",
    title: "AI Mood System",
    description: "The AI has moods like INSPIRED, GREEDY, or CHAOTIC that affect its decisions. Watch its mood to predict what kind of token it might create next.",
    icon: <Sparkles className="w-6 h-6" strokeWidth={1.5} />,
    position: "center",
  },
  {
    id: "trading",
    title: "Start Trading",
    description: "Click 'Start Trading' to buy and sell tokens the AI creates. Connect your Solana wallet and trade as soon as new tokens launch.",
    icon: <ArrowUpRight className="w-6 h-6" strokeWidth={1.5} />,
    position: "center",
  },
  {
    id: "rewards",
    title: "Lucky Wallet Rewards",
    description: "Active traders can receive random airdrops! The AI selects 'lucky wallets' based on trading activity and distributes rewards automatically.",
    icon: <Star className="w-6 h-6" strokeWidth={1.5} />,
    position: "center",
  },
  {
    id: "logbook",
    title: "Full Transparency",
    description: "Visit the Logbook to see every decision the AI makes. All actions are logged publicly — nothing is hidden.",
    icon: <List className="w-6 h-6" strokeWidth={1.5} />,
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

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 border-2 border-primary flex items-center justify-center bg-background">
            {step.icon}
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
