import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate estimated 1RM using Epley formula
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Calculate total volume (weight × reps)
export function calculateVolume(
  sets: { weight: number; reps: number }[]
): number {
  return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}

// Format weight with units
export function formatWeight(weight: number, units: "lb" | "kg" = "kg"): string {
  return `${weight} ${units}`;
}

// Format large numbers (e.g., 12500 -> 12.5k)
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

// Get day name from weekday number (0=Monday, 6=Sunday - Monday-based)
export function getDayName(weekday: number): string {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return days[weekday] ?? "Unknown";
}

// Get short day name (0=Monday, 6=Sunday - Monday-based)
export function getShortDayName(weekday: number): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[weekday] ?? "???";
}

// Convert JS weekday (0=Sunday) to Monday-based (0=Monday, 6=Sunday)
export function jsWeekdayToMonday(jsWeekday: number): number {
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}

// Generate progression suggestion
export function getProgressionSuggestion(
  recentWeights: number[],
  recentReps: number[],
  targetReps: number = 8,
  weightUnit: "kg" | "lb" = "kg"
): {
  action: "increase" | "decrease" | "maintain";
  reason: string;
  amount?: number;
} {
  if (recentWeights.length < 2) {
    return {
      action: "maintain",
      reason: "Keep training! Need more data for suggestions.",
    };
  }

  const lastWeight = recentWeights[0];
  const prevWeight = recentWeights[1];
  const lastReps = recentReps[0];
  const prevReps = recentReps[1];

  const weightStable = Math.abs(lastWeight - prevWeight) < 5;
  const hittingReps = lastReps >= targetReps && prevReps >= targetReps;
  const struggling = lastReps < targetReps - 2 && prevReps < targetReps - 2;

  if (weightStable && hittingReps) {
    const increment = lastWeight > 100 ? 5 : 2.5;
    return {
      action: "increase",
      amount: increment,
      reason: `Consistent performance! Try adding ${increment} ${weightUnit}.`,
    };
  }

  if (struggling) {
    return {
      action: "decrease",
      amount: Math.round(lastWeight * 0.1),
      reason: "Consider a 10% deload to work on form and reps.",
    };
  }

  return {
    action: "maintain",
    reason: "Keep working at this weight. Progress takes time!",
  };
}
