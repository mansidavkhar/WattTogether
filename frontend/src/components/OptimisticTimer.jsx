import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * V5 Optimistic Timer Component
 * Shows 48-hour countdown for milestone auto-release
 */
const OptimisticTimer = ({ releaseableAt }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const releaseTimestamp = new Date(releaseableAt).getTime() / 1000;
      const difference = releaseTimestamp - now;

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      const hours = Math.floor(difference / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = Math.floor(difference % 60);

      return { hours, minutes, seconds, totalSeconds: difference };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [releaseableAt]);

  if (isExpired) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-green-700">
            ✓ Ready to Release
          </span>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="bg-gray-100 rounded-lg px-3 py-2">
        <span className="text-sm text-gray-500">Loading timer...</span>
      </div>
    );
  }

  const progressPercentage = Math.max(0, Math.min(100, 
    ((48 * 3600 - timeLeft.totalSeconds) / (48 * 3600)) * 100
  ));

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-amber-800">
          ⏳ Cooling Period (48h)
        </span>
        <span className="text-sm font-mono font-semibold text-amber-900">
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-xs text-amber-700 mt-2">
        Auto-releases if no veto reaches 10% quorum
      </p>
    </div>
  );
};

OptimisticTimer.propTypes = {
  releaseableAt: PropTypes.string.isRequired
};

export default OptimisticTimer;
