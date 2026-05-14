import { useState, useEffect } from 'react';

/**
 * Hook to calculate remaining repair time and status.
 * 
 * @param createdAt - The timestamp when the issue was created (Supabase timestamptz)
 * @param repairClockHours - The total hours allowed for the repair
 * @returns { remainingTime, status, canEscalateToAgency, timeLeftMs }
 */
export const useRepairClock = (createdAt: string | Date, repairClockHours: number) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(createdAt).getTime();
      const deadline = start + repairClockHours * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = deadline - now;
      setTimeLeftMs(Math.max(0, diff));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [createdAt, repairClockHours]);

  const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));

  const remainingTime = timeLeftMs > 0 
    ? `${hours}h ${minutes}m` 
    : 'Expired';

  let status: 'Pending' | 'Warning' | 'Expired' = 'Pending';
  if (timeLeftMs === 0) {
    status = 'Expired';
  } else if (timeLeftMs < 2 * 60 * 60 * 1000) {
    status = 'Warning';
  }

  const canEscalateToAgency = status === 'Expired';

  return {
    remainingTime,
    status,
    canEscalateToAgency,
    timeLeftMs
  };
};
