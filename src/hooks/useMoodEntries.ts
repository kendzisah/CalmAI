import { useEffect } from 'react';
import { useMoodStore } from '@/stores/moodStore';
import type { MoodType, MoodSource } from '@/types/mood';

export function useMoodEntries() {
  const {
    currentMood,
    todayCheckedIn,
    monthlyCount,
    recentEntries,
    trendData,
    loadRecent,
    checkIn,
    getMonthlyCount,
    getTrendData,
  } = useMoodStore();

  useEffect(() => {
    loadRecent();
  }, []);

  return {
    currentMood,
    todayCheckedIn,
    monthlyCount,
    recentEntries,
    trendData,
    checkIn,
    loadRecent,
    getMonthlyCount,
    getTrendData,
  };
}
