import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  isPaused?: boolean;
}

const CountdownTimer = ({ targetDate, isPaused = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isPaused]);

  if (isPaused) {
    return (
      <div className="text-center font-mono">
        <div className="text-4xl font-bold mb-2 terminal-text">
          AUTONOMOUS LAUNCHING: <span className="text-destructive">OFF</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center font-mono">
      <div className="text-sm mb-2 terminal-text">{'>'} AI_LAUNCHING_NEXT_TOKEN_IN</div>
      <div className="flex justify-center gap-4 text-5xl font-bold terminal-text">
        <div className="flex flex-col items-center">
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs">HOURS</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs">MINS</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs">SECS</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
