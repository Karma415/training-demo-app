import { useState, useEffect } from 'react';

export function useEscalationEngine(createdAt: string, repairClockHours: number) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [status, setStatus] = useState<'Pending' | 'Warning' | 'Expired'>('Pending');
  const [isLevel2Active, setIsLevel2Active] = useState<boolean>(false);
  const [isLevel3Active, setIsLevel3Active] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(createdAt).getTime();
      const deadline = start + repairClockHours * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        setStatus('Expired');
        setIsLevel2Active(true);
        setIsLevel3Active(true);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatPart = (num: number) => num.toString().padStart(2, '0');
      setTimeRemaining(`${formatPart(hours)}:${formatPart(minutes)}:${formatPart(seconds)}`);

      if (diff < 2 * 60 * 60 * 1000) {
        setStatus('Warning');
      } else {
        setStatus('Pending');
      }
      
      setIsLevel2Active(false);
      setIsLevel3Active(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [createdAt, repairClockHours]);

  return { timeRemaining, status, isLevel2Active, isLevel3Active };
}
