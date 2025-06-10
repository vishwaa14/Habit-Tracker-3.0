import React from 'react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ currentStreak, longestStreak }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Streak Information</h3>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Current Streak:</span> {currentStreak} days
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Longest Streak:</span> {longestStreak} days
        </p>
      </div>
    </div>
  );
};

export default StreakDisplay;
