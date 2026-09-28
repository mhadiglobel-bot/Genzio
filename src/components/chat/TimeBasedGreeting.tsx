import React, { useState, useEffect, useMemo } from 'react';

export interface TimeBasedGreetingProps {
  className?: string;
  /** Optional custom greeting override */
  customGreeting?: string;
}

/**
 * TimeBasedGreeting
 *
 * Displays a stable, time-contextual greeting based on the user's local time:
 * - 05:00 – 11:59: "Good morning • Ready when you are"
 * - 12:00 – 13:59: "Good afternoon • What are we working on?"
 * - 14:00 – 17:59: "Good afternoon • Let's make some progress"
 * - 18:00 – 21:59: "Good evening • What can I help you accomplish?"
 * - 22:00 – 23:59: "Good night • Ready for whatever you're working on"
 * - 00:00 – 04:59: "Late night mode • Let's keep things focused"
 *
 * Uses a soft CSS fade transition on updates.
 */
export const TimeBasedGreeting: React.FC<TimeBasedGreetingProps> = ({
  className = '',
  customGreeting,
}) => {
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  // Check local time every 30 seconds to transition smoothly when an hour boundary passes
  useEffect(() => {
    const interval = setInterval(() => {
      const nowHour = new Date().getHours();
      setCurrentHour(nowHour);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const greetingText = useMemo(() => {
    if (customGreeting) return customGreeting;

    const hour = currentHour;

    if (hour >= 5 && hour < 12) {
      return 'Good morning • Ready when you are';
    } else if (hour >= 12 && hour < 14) {
      return 'Good afternoon • What are we working on?';
    } else if (hour >= 14 && hour < 18) {
      return "Good afternoon • Let's make some progress";
    } else if (hour >= 18 && hour < 22) {
      return 'Good evening • What can I help you accomplish?';
    } else if (hour >= 22 && hour < 24) {
      return "Good night • Ready for whatever you're working on";
    } else {
      // 00:00 – 04:59
      return "Late night mode • Let's keep things focused";
    }
  }, [currentHour, customGreeting]);

  return (
    <div
      className={`text-[13px] sm:text-[14px] font-normal sm:font-medium tracking-normal text-slate-400 opacity-75 text-center select-none transition-opacity duration-500 ease-in-out ${className}`}
      style={{
        fontFamily: '"Inter", "Manrope", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      key={greetingText}
    >
      <span>{greetingText}</span>
    </div>
  );
};
