"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExerciseSelector } from "@/app/components/exercise-selector";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Calendar,
  Edit2,
} from "lucide-react";
import { getDayName, getShortDayName } from "@/app/lib/utils";

type PlanExercise = {
  exerciseId: Id<"exercises">;
  exerciseName: string;
  order: number;
  sets: { repsTarget: number; notes?: string }[];
};

type PlanDay = {
  weekday: number;
  name?: string;
  exercises: PlanExercise[];
};

export default function PlanPage() {
  const activePlan = useQuery(api.plans.getActivePlan);
  const allPlans = useQuery(api.plans.getAllPlans);
  const createPlan = useMutation(api.plans.createPlan);
  const setActivePlan = useMutation(api.plans.setActivePlan);
  const deletePlanMutation = useMutation(api.plans.deletePlan);
  const seedExercises = useMutation(api.exercises.seedExercises);

  const [isEditing, setIsEditing] = useState(false);
  const [planName, setPlanName] = useState("My Workout Plan");
  const [days, setDays] = useState<PlanDay[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState<
    number | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  // Seed exercises on first load if needed
  const exercises = useQuery(api.exercises.getAllExercises);
  if (exercises && exercises.length === 0) {
    seedExercises();
  }

  const initializeFromPlan = useCallback(() => {
    if (activePlan) {
      setPlanName(activePlan.name);
      setDays(
        activePlan.days.map((day: { weekday: number; name?: string; exercises: { exerciseId: Id<"exercises">; exercise?: { name: string } | null; sets: { repsTarget: number; notes?: string }[] }[] }) => ({
          weekday: day.weekday,
          name: day.name,
          exercises: day.exercises.map((e: { exerciseId: Id<"exercises">; exercise?: { name: string } | null; sets: { repsTarget: number; notes?: string }[] }, idx: number) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exercise?.name ?? "Unknown",
            order: idx,
            sets: e.sets,
          })),
        }))
      );
    }
  }, [activePlan]);

  const startNewPlan = () => {
    setPlanName("My Workout Plan");
    setDays(
      Array.from({ length: 7 }, (_, i) => ({
        weekday: i,
        name: undefined,
        exercises: [],
      }))
    );
    setIsEditing(true);
    setExpandedDay(0);
  };

  const startEditing = () => {
    initializeFromPlan();
    setIsEditing(true);
  };

  const addExercise = (
    dayIndex: number,
    exerciseId: Id<"exercises">,
    exerciseName: string
  ) => {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exerciseId,
                  exerciseName,
                  order: day.exercises.length,
                  sets: [{ repsTarget: 8 }, { repsTarget: 8 }, { repsTarget: 8 }],
                },
              ],
            }
          : day
      )
    );
    setShowExerciseSelector(null);
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              exercises: day.exercises
                .filter((_, j) => j !== exerciseIndex)
                .map((e, idx) => ({ ...e, order: idx })),
            }
          : day
      )
    );
  };

  const updateExerciseSets = (
    dayIndex: number,
    exerciseIndex: number,
    sets: { repsTarget: number; notes?: string }[]
  ) => {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((e, j) =>
                j === exerciseIndex ? { ...e, sets } : e
              ),
            }
          : day
      )
    );
  };

  const updateDayName = (dayIndex: number, name: string) => {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, name: name || undefined } : day
      )
    );
  };

  const savePlan = async () => {
    setIsSaving(true);
    try {
      await createPlan({
        name: planName,
        days: days.map((day) => ({
          weekday: day.weekday,
          name: day.name,
          exercises: day.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            order: e.order,
            sets: e.sets,
          })),
        })),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = activePlan === undefined || allPlans === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  // View Mode
  if (!isEditing) {
    if (!activePlan) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Workout Plan
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a weekly workout schedule
            </p>
          </div>

          <div className="card text-center py-16">
            <Calendar className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Plan Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first workout plan to organize your training week and
              track progress.
            </p>
            <button onClick={startNewPlan} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {activePlan.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Version {activePlan.planVersion} • Created{" "}
              {new Date(activePlan.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={startEditing} className="btn btn-secondary">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button onClick={startNewPlan} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        </div>

        {/* Day Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {activePlan.days.map((day: { _id: string; weekday: number; name?: string; exercises: { _id: string; exercise?: { name: string } | null; sets: { repsTarget: number }[] }[] }) => (
            <div
              key={day._id}
              className={`card ${
                day.exercises.length === 0 ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{getDayName(day.weekday)}</h3>
                  {day.name && (
                    <p className="text-sm text-primary">{day.name}</p>
                  )}
                </div>
                <span className="badge badge-secondary">
                  {day.exercises.length} exercise
                  {day.exercises.length !== 1 ? "s" : ""}
                </span>
              </div>

                {day.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {day.exercises.map((exercise: { _id: string; exercise?: { name: string } | null; sets: { repsTarget: number }[] }, idx: number) => (
                    <div
                      key={exercise._id}
                      className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm">
                        {exercise.exercise?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {exercise.sets.length}×{exercise.sets[0]?.repsTarget}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Rest Day</p>
              )}
            </div>
          ))}
        </div>

        {/* Plan History */}
        {allPlans && allPlans.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Plan History</h3>
            <div className="space-y-2">
              {allPlans
                .sort((a: { planVersion: number }, b: { planVersion: number }) => b.planVersion - a.planVersion)
                .map((plan: { _id: Id<"plans">; name: string; planVersion: number; active: boolean }) => (
                  <div
                    key={plan._id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        v{plan.planVersion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.active ? (
                        <span className="badge">Active</span>
                      ) : (
                        <button
                          onClick={() => setActivePlan({ planId: plan._id })}
                          className="btn btn-ghost text-xs px-3 py-1"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {activePlan ? "Edit Plan" : "Create Plan"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Set up your weekly workout schedule
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={savePlan}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Plan
          </button>
        </div>
      </div>

      {/* Plan Name */}
      <div className="card">
        <label className="block text-sm font-medium mb-2">Plan Name</label>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g., Push/Pull/Legs"
          className="input max-w-md"
        />
      </div>

      {/* Days */}
      <div className="space-y-3">
        {days.map((day, dayIndex) => (
          <div key={day.weekday} className="card">
            <button
              onClick={() =>
                setExpandedDay(expandedDay === dayIndex ? null : dayIndex)
              }
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-primary-muted rounded-lg flex items-center justify-center text-primary font-semibold">
                  {getShortDayName(day.weekday)}
                </span>
                <div className="text-left">
                  <h3 className="font-semibold">{getDayName(day.weekday)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {day.exercises.length > 0
                      ? `${day.exercises.length} exercise${day.exercises.length !== 1 ? "s" : ""}`
                      : "Rest Day"}
                    {day.name && ` • ${day.name}`}
                  </p>
                </div>
              </div>
              {expandedDay === dayIndex ? (
                <ChevronUp className="w-5 h-5 text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted" />
              )}
            </button>

            {expandedDay === dayIndex && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                {/* Day Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Day Label (optional)
                  </label>
                  <input
                    type="text"
                    value={day.name || ""}
                    onChange={(e) => updateDayName(dayIndex, e.target.value)}
                    placeholder="e.g., Push Day, Upper Body"
                    className="input max-w-xs"
                  />
                </div>

                {/* Exercises */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Exercises</label>
                    <button
                      onClick={() => setShowExerciseSelector(dayIndex)}
                      className="btn btn-ghost text-sm py-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Exercise
                    </button>
                  </div>

                  {day.exercises.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground text-sm mb-3">
                        No exercises added yet
                      </p>
                      <button
                        onClick={() => setShowExerciseSelector(dayIndex)}
                        className="btn btn-secondary text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Exercise
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day.exercises.map((exercise, exIndex) => (
                        <div
                          key={`${exercise.exerciseId}-${exIndex}`}
                          className="bg-background rounded-lg p-3 border border-border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted cursor-grab" />
                              <span className="font-medium">
                                {exercise.exerciseName}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                removeExercise(dayIndex, exIndex)
                              }
                              className="btn btn-ghost p-1 text-muted hover:text-danger"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Sets */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Sets:
                            </span>
                            {exercise.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className="flex items-center gap-1"
                              >
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={set.repsTarget}
                                  onChange={(e) => {
                                    const newSets = [...exercise.sets];
                                    newSets[setIndex] = {
                                      ...newSets[setIndex],
                                      repsTarget:
                                        parseInt(e.target.value) || 8,
                                    };
                                    updateExerciseSets(
                                      dayIndex,
                                      exIndex,
                                      newSets
                                    );
                                  }}
                                  className="input w-14 text-center p-1 text-sm"
                                />
                                {setIndex < exercise.sets.length - 1 && (
                                  <span className="text-muted-foreground">
                                    ×
                                  </span>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newSets = [
                                  ...exercise.sets,
                                  { repsTarget: 8 },
                                ];
                                updateExerciseSets(
                                  dayIndex,
                                  exIndex,
                                  newSets
                                );
                              }}
                              className="btn btn-ghost p-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {exercise.sets.length > 1 && (
                              <button
                                onClick={() => {
                                  const newSets = exercise.sets.slice(0, -1);
                                  updateExerciseSets(
                                    dayIndex,
                                    exIndex,
                                    newSets
                                  );
                                }}
                                className="btn btn-ghost p-1 text-muted hover:text-danger"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector !== null && (
        <ExerciseSelector
          onSelect={(id, name) => addExercise(showExerciseSelector, id, name)}
          onClose={() => setShowExerciseSelector(null)}
        />
      )}
    </div>
  );
}
