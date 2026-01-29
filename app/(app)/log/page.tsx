"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Calendar,
  Save,
  Trophy,
  Flame,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAchievementToasts } from "@/app/components/achievement-toast";
import { StreakBadge } from "@/app/components/streak-badge";

type SetLog = {
  exerciseId: Id<"exercises">;
  setIndex: number;
  repsActual: number | null;
  weight: number | null;
  saved: boolean;
};

function LogPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  
  const [selectedDate, setSelectedDate] = useState(
    dateParam || format(new Date(), "yyyy-MM-dd")
  );
  const [setLogs, setSetLogs] = useState<Record<string, SetLog>>({});
  const [completingSession, setCompletingSession] = useState(false);
  const [completedStreak, setCompletedStreak] = useState<number | null>(null);
  const [hasInitializedWeights, setHasInitializedWeights] = useState(false);

  const todayTemplate = useQuery(api.plans.getTodayTemplate, {
    date: selectedDate,
  });
  const sessionData = useQuery(api.sessions.getSessionByDate, {
    date: selectedDate,
  });
  const userData = useQuery(api.users.getCurrentUser);

  // Get exercise IDs for querying last weights
  const exerciseIds = useMemo(() => {
    if (!todayTemplate?.exercises) return [];
    return todayTemplate.exercises
      .filter((e: { exercise?: { _id: Id<"exercises"> } | null }) => e.exercise?._id)
      .map((e: { exercise?: { _id: Id<"exercises"> } | null }) => e.exercise!._id);
  }, [todayTemplate?.exercises]);

  // Query last weights for all exercises in today's workout
  const lastWeights = useQuery(
    api.sessions.getLastWeightsForExercises,
    exerciseIds.length > 0 ? { exerciseIds } : "skip"
  );

  // Query suggestions for all exercises
  const exerciseSuggestions = useQuery(
    api.progress.getBatchExerciseSuggestions,
    exerciseIds.length > 0 ? { exerciseIds } : "skip"
  );

  const { showAchievements, AchievementToasts } = useAchievementToasts();

  const weightUnit = userData?.units || "kg";

  const getOrCreateSession = useMutation(api.sessions.getOrCreateSession);
  const logSet = useMutation(api.sessions.logSet);
  const completeSession = useMutation(api.sessions.completeSession);

  // Sync with URL date param
  useEffect(() => {
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    }
  }, [dateParam, selectedDate]);

  // Reset initialization flag when date changes
  useEffect(() => {
    setHasInitializedWeights(false);
  }, [selectedDate]);

  // Initialize set logs from existing session data OR pre-fill with last weights
  useEffect(() => {
    if (sessionData?.sets && sessionData.sets.length > 0) {
      // Session has logged sets - merge with existing local state to preserve unsaved entries
      setSetLogs((prev) => {
        const logs: Record<string, SetLog> = { ...prev };
        for (const set of sessionData.sets) {
          const key = `${set.exerciseId}-${set.setIndex}`;
          // Only update if not in local state OR if local state is already saved (sync from DB)
          // This preserves unsaved local edits
          if (!prev[key] || prev[key].saved) {
            logs[key] = {
              exerciseId: set.exerciseId,
              setIndex: set.setIndex,
              repsActual: set.repsActual,
              weight: set.weight,
              saved: true,
            };
          }
        }
        return logs;
      });
      setHasInitializedWeights(true);
    } else if (lastWeights && todayTemplate?.exercises && !hasInitializedWeights) {
      // No session data yet - pre-fill weights from previous workouts
      const logs: Record<string, SetLog> = {};
      for (const planExercise of todayTemplate.exercises) {
        const exercise = planExercise.exercise;
        if (!exercise) continue;

        const exerciseLastWeights = lastWeights[exercise._id];
        if (!exerciseLastWeights) continue;

        for (let setIndex = 0; setIndex < planExercise.sets.length; setIndex++) {
          const key = `${exercise._id}-${setIndex}`;
          // Use the weight from the same set index, or fallback to set 0
          const prefillWeight = exerciseLastWeights[setIndex] ?? exerciseLastWeights[0] ?? null;
          if (prefillWeight !== null) {
            logs[key] = {
              exerciseId: exercise._id,
              setIndex,
              repsActual: null, // Don't pre-fill reps
              weight: prefillWeight,
              saved: false, // Not saved yet
            };
          }
        }
      }
      if (Object.keys(logs).length > 0) {
        setSetLogs(logs);
      }
      setHasInitializedWeights(true);
    } else if (sessionData === null && !lastWeights) {
      // No session and no last weights - clear logs
      setSetLogs({});
    }
  }, [sessionData, lastWeights, todayTemplate?.exercises, hasInitializedWeights]);

  const handleDateChange = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const getSetKey = (exerciseId: Id<"exercises">, setIndex: number) =>
    `${exerciseId}-${setIndex}`;

  const updateSetLog = (
    exerciseId: Id<"exercises">,
    setIndex: number,
    field: "repsActual" | "weight",
    value: number | null
  ) => {
    const key = getSetKey(exerciseId, setIndex);
    setSetLogs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        exerciseId,
        setIndex,
        repsActual: field === "repsActual" ? value : (prev[key]?.repsActual ?? null),
        weight: field === "weight" ? value : (prev[key]?.weight ?? null),
        saved: false,
      },
    }));
  };

  const saveSet = async (exerciseId: Id<"exercises">, setIndex: number) => {
    const key = getSetKey(exerciseId, setIndex);
    const setData = setLogs[key];
    // Only save if we have actual values
    if (!setData || setData.repsActual === null || setData.weight === null) return;

    try {
      const sessionId = await getOrCreateSession({
        date: selectedDate,
        planId: todayTemplate?.plan?._id,
      });

      await logSet({
        sessionId,
        exerciseId,
        setIndex,
        repsActual: setData.repsActual ?? 0,
        weight: setData.weight ?? 0,
      });

      setSetLogs((prev) => ({
        ...prev,
        [key]: { ...prev[key], saved: true },
      }));
    } catch (error) {
      console.error("Failed to save set:", error);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!sessionData?._id) return;
    setCompletingSession(true);
    try {
      const result = await completeSession({ sessionId: sessionData._id });

      // Handle streak result
      if (result.streakResult) {
        setCompletedStreak(result.streakResult.streak);

        // Show achievement toasts for new achievements
        if (result.streakResult.newAchievements.length > 0) {
          showAchievements(result.streakResult.newAchievements);
        }
      }
    } catch (error) {
      console.error("Failed to complete session:", error);
    } finally {
      setCompletingSession(false);
    }
  };

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const isCompleted = sessionData?.completedAt != null;

  const totalSetsLogged = Object.values(setLogs).filter(
    (s) => s.saved && (s.weight ?? 0) > 0
  ).length;
  const totalSetsPlanned =
    todayTemplate?.exercises?.reduce(
      (sum: number, e: { sets: unknown[] }) => sum + e.sets.length,
      0
    ) ?? 0;

  const isLoading = todayTemplate === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Log Workout
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your sets and weights
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-card rounded-lg p-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDateChange("prev")}
            className="btn btn-ghost p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="px-2 py-1 text-center min-w-[100px] max-sm:min-w-[200px]">
            <p className="font-semibold">
              {isToday ? "Today" : format(new Date(selectedDate), "EEE, MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedDate), "yyyy")}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDateChange("next")}
            className="btn btn-ghost p-2"
            disabled={isToday}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Achievement Toasts */}
      <AchievementToasts />

      {/* Session Status */}
      {isCompleted && (
        <div className="card bg-primary-muted border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Workout Completed!</h3>
              <p className="text-sm text-muted-foreground">
                Finished at {format(new Date(sessionData.completedAt!), "h:mm a")}
              </p>
            </div>
          </div>
          {completedStreak !== null && completedStreak > 0 && (
            <StreakBadge streak={completedStreak} size="md" showLabel />
          )}
        </div>
      )}

      {/* Progress Bar */}
      {totalSetsPlanned > 0 && !isCompleted && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {totalSetsLogged} / {totalSetsPlanned} sets
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(totalSetsLogged / totalSetsPlanned) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* No Plan State */}
      {!todayTemplate?.day || todayTemplate.exercises.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {todayTemplate?.plan ? "Rest Day" : "No Workout Plan"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {todayTemplate?.plan
              ? "Take a well-deserved break. Recovery is part of progress!"
              : "Create a workout plan to start logging your exercises."}
          </p>
          {!todayTemplate?.plan && (
            <Link href="/plan" className="btn btn-primary">
              Create Plan
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Exercise List */}
          <div className="space-y-4">
            {todayTemplate.exercises.map(
              (
                planExercise: {
                  _id: string;
                  exercise?: {
                    _id: Id<"exercises">;
                    name: string;
                    muscleGroup?: string;
                    equipment?: string;
                  } | null;
                  sets: { repsTarget: number }[];
                },
                exIndex: number
              ) => {
                const exercise = planExercise.exercise;
                if (!exercise) return null;

                return (
                  <div
                    key={planExercise._id}
                    className="card"
                    style={{ animationDelay: `${exIndex * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary-muted rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{exercise.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.muscleGroup}
                          {exercise.equipment && ` • ${exercise.equipment}`}
                        </p>
                      </div>
                      {/* Suggestion Badge */}
                      {exerciseSuggestions?.[exercise._id]?.suggestion && !isCompleted && (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            exerciseSuggestions[exercise._id].suggestion === "increase"
                              ? "bg-primary/10 text-primary"
                              : exerciseSuggestions[exercise._id].suggestion === "decrease"
                                ? "bg-orange-500/10 text-orange-500"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {exerciseSuggestions[exercise._id].suggestion === "increase" ? (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              <span>{exerciseSuggestions[exercise._id].suggestedWeight} {weightUnit}</span>
                            </>
                          ) : exerciseSuggestions[exercise._id].suggestion === "decrease" ? (
                            <>
                              <TrendingDown className="w-3 h-3" />
                              <span>{exerciseSuggestions[exercise._id].suggestedWeight} {weightUnit}</span>
                            </>
                          ) : (
                            <span>Maintain</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-2 mt-2">
                      {/* Header - hidden on mobile */}
                      <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 text-sm text-muted-foreground pb-2 border-b border-border">
                        <span className="w-8 font-medium">Set</span>
                        <span className="font-medium">Target</span>
                        <span className="font-medium">Weight</span>
                        <span className="font-medium">Reps</span>
                        <span className="w-10"></span>
                      </div>

                      {planExercise.sets.map(
                        (set: { repsTarget: number }, setIndex: number) => {
                          const key = getSetKey(exercise._id, setIndex);
                          const setLog = setLogs[key];
                          const isSaved = setLog?.saved;

                          return (
                            <div
                              key={setIndex}
                              className="flex items-end gap-3 py-2 border-b border-border/50 last:border-0"
                            >
                              {/* Set number - hidden on mobile */}
                              <span className="hidden sm:inline-flex w-8 h-9 bg-background rounded-full items-center justify-center text-sm font-medium shrink-0">
                                {setIndex + 1}
                              </span>

                              {/* Target - hidden on mobile */}
                              <span className="hidden sm:flex flex-1 text-muted-foreground text-sm h-9 items-center">
                                {set.repsTarget} reps
                              </span>

                              {/* Mobile: Set badge */}
                              <span className="sm:hidden w-8 h-9 bg-background rounded-full inline-flex items-center justify-center text-xs font-medium shrink-0">
                                {setIndex + 1}
                              </span>

                              {/* Weight input */}
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="2.5"
                                  value={setLog?.weight ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateSetLog(
                                      exercise._id,
                                      setIndex,
                                      "weight",
                                      val === "" ? null : parseFloat(val)
                                    );
                                  }}
                                  disabled={isCompleted}
                                  className="input w-full text-center"
                                  placeholder={weightUnit}
                                />
                              </div>

                              {/* Reps input */}
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={setLog?.repsActual ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateSetLog(
                                      exercise._id,
                                      setIndex,
                                      "repsActual",
                                      val === "" ? null : parseInt(val)
                                    );
                                  }}
                                  disabled={isCompleted}
                                  className="input w-full text-center"
                                  placeholder="reps"
                                />
                              </div>

                              {/* Save button */}
                              <div className="shrink-0">
                                {!isCompleted && (
                                  <button
                                    onClick={() =>
                                      saveSet(exercise._id, setIndex)
                                    }
                                    disabled={
                                      isSaved ||
                                      setLog?.weight === null ||
                                      setLog?.weight === undefined ||
                                      setLog?.repsActual === null ||
                                      setLog?.repsActual === undefined
                                    }
                                    className={`btn p-2 h-9 ${
                                      isSaved
                                        ? "btn-ghost text-primary"
                                        : "btn-secondary"
                                    }`}
                                  >
                                    {isSaved ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Complete Workout Button */}
          {!isCompleted && totalSetsLogged > 0 && (
            <div className="sticky bottom-4">
              <button
                onClick={handleCompleteWorkout}
                disabled={completingSession || !sessionData?._id}
                className="btn btn-primary w-full py-4 text-base shadow-lg"
              >
                {completingSession ? (
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Flame className="w-5 h-5" />
                    Complete Workout ({totalSetsLogged} sets logged)
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogPageFallback() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-card rounded animate-pulse" />
      <div className="card h-96 animate-pulse" />
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<LogPageFallback />}>
      <LogPageContent />
    </Suspense>
  );
}
