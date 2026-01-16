"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExerciseSelector } from "@/app/components/exercise-selector";
import { AIPlanGenerator } from "@/app/components/ai-plan-generator";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Calendar,
  Edit2,
  Sparkles,
} from "lucide-react";
import { getDayName, getShortDayName } from "@/app/lib/utils";
import { toast } from "sonner";

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
  const aiUsage = useQuery(api.users.getAIUsage);
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
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Id<"plans"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  // Seed exercises on first load if needed
  const exercises = useQuery(api.exercises.getAllExercises);
  if (exercises && exercises.length === 0) {
    seedExercises();
  }

  const handleDeletePlan = async (planId: Id<"plans">) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deletePlanMutation({ planId });
      toast.success("Plan deleted successfully");
      setPlanToDelete(null);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const initializeFromPlan = useCallback(() => {
    if (activePlan) {
      setPlanName(activePlan.name);
      setDays(
        activePlan.days.map(
          (day: {
            weekday: number;
            name?: string;
            exercises: {
              exerciseId: Id<"exercises">;
              exercise?: { name: string } | null;
              sets: { repsTarget: number; notes?: string }[];
            }[];
          }) => ({
            weekday: day.weekday,
            name: day.name,
            exercises: day.exercises.map(
              (
                e: {
                  exerciseId: Id<"exercises">;
                  exercise?: { name: string } | null;
                  sets: { repsTarget: number; notes?: string }[];
                },
                idx: number
              ) => ({
                exerciseId: e.exerciseId,
                exerciseName: e.exercise?.name ?? "Unknown",
                order: idx,
                sets: e.sets,
              })
            ),
          })
        )
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
    setIsAIGenerated(false);
  };

  const handleAIPlanGenerated = (plan: {
    planName: string;
    description: string;
    days: {
      weekday: number;
      name?: string;
      exercises: {
        exerciseId: string;
        exerciseName: string;
        sets: { repsTarget: number; notes?: string }[];
      }[];
    }[];
  }) => {
    setPlanName(plan.planName);
    setDays(
      plan.days.map((day, idx) => ({
        weekday: day.weekday,
        name: day.name,
        exercises: day.exercises.map((ex, exIdx) => ({
          exerciseId: ex.exerciseId as Id<"exercises">,
          exerciseName: ex.exerciseName,
          order: exIdx,
          sets: ex.sets,
        })),
      }))
    );
    setShowAIGenerator(false);
    setIsEditing(true);
    setExpandedDay(0);
    setIsAIGenerated(true);
  };

  const startEditing = () => {
    initializeFromPlan();
    setIsEditing(true);
    setIsAIGenerated(false);
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
                  sets: [
                    { repsTarget: 8 },
                    { repsTarget: 8 },
                    { repsTarget: 8 },
                  ],
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
    const toastId = toast.loading("Saving plan...");
    try {
      await createPlan({
        name: planName,
        isAIGenerated,
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
      toast.success("Plan saved successfully!", { id: toastId });
      setIsEditing(false);
      setIsAIGenerated(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error("Failed to save plan. Please try again.", { id: toastId });
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={startNewPlan} className="btn btn-secondary">
                <Plus className="w-4 h-4" />
                Create Manually
              </button>
              <button
                onClick={() => setShowAIGenerator(true)}
                disabled={aiUsage?.isLimitReached}
                className="btn btn-ai"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </button>
            </div>
          </div>

          {/* AI Plan Generator Modal */}
          <AIPlanGenerator
            open={showAIGenerator}
            onOpenChange={setShowAIGenerator}
            onPlanGenerated={handleAIPlanGenerated}
          />
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
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={startEditing} className="btn btn-secondary text-sm sm:text-base">
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={startNewPlan} className="btn btn-secondary text-sm sm:text-base">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setShowAIGenerator(true)}
              disabled={aiUsage?.isLimitReached}
              className="btn btn-ai text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
        </div>

        {/* Day Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {activePlan.days.map(
            (day: {
              _id: string;
              weekday: number;
              name?: string;
              exercises: {
                _id: string;
                exercise?: { name: string } | null;
                sets: { repsTarget: number }[];
              }[];
            }) => (
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
                    {day.exercises.map(
                      (
                        exercise: {
                          _id: string;
                          exercise?: { name: string } | null;
                          sets: { repsTarget: number }[];
                        },
                        idx: number
                      ) => (
                        <div
                          key={exercise._id}
                          className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                        >
                          <span className="text-sm">
                            {exercise.exercise?.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {exercise.sets.length}×
                            {exercise.sets[0]?.repsTarget}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Rest Day</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Plan History */}
        {allPlans && allPlans.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Plan History</h3>
            <div className="space-y-2">
              {allPlans
                .sort(
                  (a: { planVersion: number }, b: { planVersion: number }) =>
                    b.planVersion - a.planVersion
                )
                .map(
                  (plan: {
                    _id: Id<"plans">;
                    name: string;
                    planVersion: number;
                    active: boolean;
                  }) => (
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
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  await setActivePlan({ planId: plan._id });
                                  toast.success("Plan activated!");
                                } catch (error) {
                                  toast.error("Failed to activate plan");
                                }
                              }}
                              className="btn btn-ghost text-xs px-3 py-1"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => setPlanToDelete(plan._id)}
                              className="btn btn-ghost text-xs px-2 py-1 text-danger hover:text-danger hover:bg-danger/10"
                              title="Delete plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {planToDelete && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-danger/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm mb-6">
                Are you sure you want to delete this workout plan? All
                associated data will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setPlanToDelete(null)}
                  disabled={isDeleting}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlan(planToDelete)}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Plan Generator Modal */}
        <AIPlanGenerator
          open={showAIGenerator}
          onOpenChange={setShowAIGenerator}
          onPlanGenerated={handleAIPlanGenerated}
        />
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
                          className="bg-background rounded-lg p-4 border border-border"
                        >
                          {/* Exercise Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted cursor-grab hidden sm:block" />
                              <span className="font-medium">
                                {exercise.exerciseName}
                              </span>
                            </div>
                            <button
                              onClick={() => removeExercise(dayIndex, exIndex)}
                              className="btn btn-ghost p-1.5 text-muted hover:text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Sets Section */}
                          <div className="space-y-3">
                            <span className="text-sm text-muted-foreground">
                              Sets (reps per set):
                            </span>

                            {/* Sets Grid */}
                            <div className="flex flex-wrap gap-2">
                              {exercise.sets.map((set, setIndex) => (
                                <input
                                  key={setIndex}
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={set.repsTarget}
                                  onChange={(e) => {
                                    const newSets = [...exercise.sets];
                                    newSets[setIndex] = {
                                      ...newSets[setIndex],
                                      repsTarget: parseInt(e.target.value) || 8,
                                    };
                                    updateExerciseSets(
                                      dayIndex,
                                      exIndex,
                                      newSets
                                    );
                                  }}
                                  className="input w-16 text-center py-2 text-sm"
                                />
                              ))}
                            </div>

                            {/* Add/Remove Set Buttons */}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  const newSets = [
                                    ...exercise.sets,
                                    { repsTarget: 8 },
                                  ];
                                  updateExerciseSets(dayIndex, exIndex, newSets);
                                }}
                                className="btn btn-secondary text-xs py-1.5 px-3"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Set
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
                                  className="btn btn-ghost text-xs py-1.5 px-3 text-muted hover:text-danger hover:bg-danger/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Remove Set
                                </button>
                              )}
                            </div>
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
      <ExerciseSelector
        open={showExerciseSelector !== null}
        onOpenChange={(open) => !open && setShowExerciseSelector(null)}
        onSelect={(id, name) => {
          if (showExerciseSelector !== null) {
            addExercise(showExerciseSelector, id, name);
          }
        }}
      />
    </div>
  );
}
