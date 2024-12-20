import React, { useEffect, useState } from 'react';

interface TimerProps {
  duration: number; 
  onCountdownEnd: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onCountdownEnd }) => {
  const [remainingTime, setRemainingTime] = useState<number>(duration);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          onCountdownEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onCountdownEnd]);

  if (isExpired) {
    return <div>Time's up! Now submit your snippet.</div>;
  }

  return (
    <div>
      <h3>Time Remaining: {remainingTime}s</h3>
    </div>
  );
};

export default Timer;
