"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
} from "lucide-react";
import Link from "next/link";

type SetLog = {
  exerciseId: Id<"exercises">;
  setIndex: number;
  repsActual: number;
  weight: number;
  saved: boolean;
};

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [setLogs, setSetLogs] = useState<Record<string, SetLog>>({});
  const [completingSession, setCompletingSession] = useState(false);

  const todayTemplate = useQuery(api.plans.getTodayTemplate, {
    date: selectedDate,
  });
  const sessionData = useQuery(api.sessions.getSessionByDate, {
    date: selectedDate,
  });

  const getOrCreateSession = useMutation(api.sessions.getOrCreateSession);
  const logSet = useMutation(api.sessions.logSet);
  const completeSession = useMutation(api.sessions.completeSession);

  // Initialize set logs from existing session data
  useEffect(() => {
    if (sessionData?.sets) {
      const logs: Record<string, SetLog> = {};
      for (const set of sessionData.sets) {
        const key = `${set.exerciseId}-${set.setIndex}`;
        logs[key] = {
          exerciseId: set.exerciseId,
          setIndex: set.setIndex,
          repsActual: set.repsActual,
          weight: set.weight,
          saved: true,
        };
      }
      setSetLogs(logs);
    } else {
      setSetLogs({});
    }
  }, [sessionData]);

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
    value: number
  ) => {
    const key = getSetKey(exerciseId, setIndex);
    setSetLogs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        exerciseId,
        setIndex,
        [field]: value,
        repsActual: prev[key]?.repsActual ?? 0,
        weight: prev[key]?.weight ?? 0,
        saved: false,
      },
    }));
  };

  const saveSet = async (exerciseId: Id<"exercises">, setIndex: number) => {
    const key = getSetKey(exerciseId, setIndex);
    const setData = setLogs[key];
    if (!setData || (setData.repsActual === 0 && setData.weight === 0)) return;

    try {
      const sessionId = await getOrCreateSession({
        date: selectedDate,
        planId: todayTemplate?.plan?._id,
      });

      await logSet({
        sessionId,
        exerciseId,
        setIndex,
        repsActual: setData.repsActual,
        weight: setData.weight,
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
      await completeSession({ sessionId: sessionData._id });
    } catch (error) {
      console.error("Failed to complete session:", error);
    } finally {
      setCompletingSession(false);
    }
  };

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const isCompleted = sessionData?.completedAt != null;

  const totalSetsLogged = Object.values(setLogs).filter(
    (s) => s.saved && s.weight > 0
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
          <button
            onClick={() => handleDateChange("prev")}
            className="btn btn-ghost p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 text-center min-w-[160px]">
            <p className="font-semibold">
              {isToday ? "Today" : format(new Date(selectedDate), "EEE, MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedDate), "yyyy")}
            </p>
          </div>
          <button
            onClick={() => handleDateChange("next")}
            className="btn btn-ghost p-2"
            disabled={isToday}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Session Status */}
      {isCompleted && (
        <div className="card bg-primary-muted border-primary/30 flex items-center gap-4">
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
            <Calendar className="w-8 h-8 text-muted" />
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
                      <div>
                        <h3 className="font-semibold">{exercise.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.muscleGroup}
                          {exercise.equipment && ` • ${exercise.equipment}`}
                        </p>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto -mx-5 px-5">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-muted-foreground border-b border-border">
                            <th className="pb-2 font-medium">Set</th>
                            <th className="pb-2 font-medium">Target</th>
                            <th className="pb-2 font-medium">Weight (lb)</th>
                            <th className="pb-2 font-medium">Reps</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {planExercise.sets.map(
                            (set: { repsTarget: number }, setIndex: number) => {
                              const key = getSetKey(exercise._id, setIndex);
                              const setLog = setLogs[key];
                              const isSaved = setLog?.saved;

                              return (
                                <tr
                                  key={setIndex}
                                  className="border-b border-border/50 last:border-0"
                                >
                                  <td className="py-3">
                                    <span className="w-8 h-8 bg-card rounded-full inline-flex items-center justify-center text-sm font-medium">
                                      {setIndex + 1}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className="text-muted-foreground">
                                      {set.repsTarget} reps
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      step="2.5"
                                      value={setLog?.weight || ""}
                                      onChange={(e) =>
                                        updateSetLog(
                                          exercise._id,
                                          setIndex,
                                          "weight",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="input w-24 text-center"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={setLog?.repsActual || ""}
                                      onChange={(e) =>
                                        updateSetLog(
                                          exercise._id,
                                          setIndex,
                                          "repsActual",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="input w-20 text-center"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="py-3">
                                    {!isCompleted && (
                                      <button
                                        onClick={() =>
                                          saveSet(exercise._id, setIndex)
                                        }
                                        disabled={
                                          isSaved ||
                                          !setLog?.weight ||
                                          !setLog?.repsActual
                                        }
                                        className={`btn p-2 ${
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
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
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
