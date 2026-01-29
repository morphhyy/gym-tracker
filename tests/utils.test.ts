import { describe, it, expect } from "vitest";
import {
  calculateE1RM,
  calculateVolume,
  formatWeight,
  formatLargeNumber,
  getDayName,
  getShortDayName,
  jsWeekdayToMonday,
  getProgressionSuggestion,
} from "@/app/lib/utils";

describe("calculateE1RM", () => {
  it("returns the weight when reps is 1", () => {
    expect(calculateE1RM(200, 1)).toBe(200);
  });

  it("calculates correctly for multiple reps using Epley formula", () => {
    // 200 lbs x 8 reps = 200 * (1 + 8/30) = 200 * 1.267 = 253.4
    expect(calculateE1RM(200, 8)).toBeCloseTo(253.3, 1);
  });

  it("calculates correctly for high reps", () => {
    // 100 lbs x 15 reps = 100 * (1 + 15/30) = 100 * 1.5 = 150
    expect(calculateE1RM(100, 15)).toBe(150);
  });
});

describe("calculateVolume", () => {
  it("returns 0 for empty sets", () => {
    expect(calculateVolume([])).toBe(0);
  });

  it("calculates volume correctly for single set", () => {
    expect(calculateVolume([{ weight: 100, reps: 10 }])).toBe(1000);
  });

  it("calculates volume correctly for multiple sets", () => {
    expect(
      calculateVolume([
        { weight: 100, reps: 10 },
        { weight: 100, reps: 8 },
        { weight: 95, reps: 8 },
      ])
    ).toBe(2560);
  });
});

describe("formatWeight", () => {
  it("formats weight with lb units", () => {
    expect(formatWeight(135, "lb")).toBe("135 lb");
  });

  it("formats weight with kg units", () => {
    expect(formatWeight(60, "kg")).toBe("60 kg");
  });

  it("defaults to kg", () => {
    expect(formatWeight(225)).toBe("225 kg");
  });
});

describe("formatLargeNumber", () => {
  it("returns number as-is for small values", () => {
    expect(formatLargeNumber(500)).toBe("500");
  });

  it("formats thousands with k suffix", () => {
    expect(formatLargeNumber(12500)).toBe("12.5k");
  });

  it("formats millions with M suffix", () => {
    expect(formatLargeNumber(1500000)).toBe("1.5M");
  });
});

describe("getDayName", () => {
  it("returns correct day names", () => {
    expect(getDayName(0)).toBe("Monday");
    expect(getDayName(4)).toBe("Friday");
    expect(getDayName(6)).toBe("Sunday");
  });

  it("returns Unknown for invalid weekday", () => {
    expect(getDayName(7)).toBe("Unknown");
    expect(getDayName(-1)).toBe("Unknown");
  });
});

describe("getShortDayName", () => {
  it("returns correct short day names", () => {
    expect(getShortDayName(0)).toBe("Mon");
    expect(getShortDayName(4)).toBe("Fri");
    expect(getShortDayName(6)).toBe("Sun");
  });
});

describe("jsWeekdayToMonday", () => {
  it("converts JS Sunday (0) to our Sunday (6)", () => {
    expect(jsWeekdayToMonday(0)).toBe(6);
  });

  it("converts JS Monday (1) to our Monday (0)", () => {
    expect(jsWeekdayToMonday(1)).toBe(0);
  });

  it("converts JS Friday (5) to our Friday (4)", () => {
    expect(jsWeekdayToMonday(5)).toBe(4);
  });
});

describe("getProgressionSuggestion", () => {
  it("returns maintain with not enough data", () => {
    const result = getProgressionSuggestion([100], [8]);
    expect(result.action).toBe("maintain");
  });

  it("suggests increase when weights are stable and reps are hit", () => {
    const result = getProgressionSuggestion([100, 100], [10, 9], 8);
    expect(result.action).toBe("increase");
    expect(result.amount).toBe(2.5);
  });

  it("suggests decrease when struggling with reps", () => {
    const result = getProgressionSuggestion([100, 100], [4, 3], 8);
    expect(result.action).toBe("decrease");
  });

  it("suggests maintain when making progress", () => {
    const result = getProgressionSuggestion([105, 100], [8, 10], 8);
    expect(result.action).toBe("maintain");
  });

  it("uses larger increment for heavier weights", () => {
    const result = getProgressionSuggestion([200, 200], [10, 10], 8);
    expect(result.action).toBe("increase");
    expect(result.amount).toBe(5);
  });
});
