"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Plus, X, Check, Dumbbell } from "lucide-react";

// Use generic string type for IDs - will be typed properly once Convex types are generated
type ExerciseId = string;

interface ExerciseSelectorProps {
  onSelect: (exerciseId: ExerciseId, exerciseName: string) => void;
  onClose: () => void;
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");

  const exercises = useQuery(api.exercises.getAllExercises);
  const createExercise = useMutation(api.exercises.createExercise);

  const muscleGroups = useMemo(() => {
    if (!exercises) return [];
    const groups = new Set(exercises.map((e: { muscleGroup?: string }) => e.muscleGroup).filter(Boolean));
    return Array.from(groups).sort() as string[];
  }, [exercises]);

  type Exercise = { _id: string; name: string; muscleGroup?: string; equipment?: string };
  
  const filteredExercises = useMemo(() => {
    if (!exercises) return [] as Exercise[];
    const searchLower = search.toLowerCase();
    return (exercises as Exercise[]).filter(
      (e: Exercise) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.muscleGroup?.toLowerCase().includes(searchLower) ||
        e.equipment?.toLowerCase().includes(searchLower)
    );
  }, [exercises, search]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    for (const exercise of filteredExercises) {
      const group = exercise.muscleGroup || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(exercise);
    }
    return groups;
  }, [filteredExercises]);

  const handleCreate = async () => {
    if (!newExerciseName.trim()) return;

    const id = await createExercise({
      name: newExerciseName.trim(),
      muscleGroup: newMuscleGroup || undefined,
    });

    onSelect(id, newExerciseName.trim());
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Exercise</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showCreateForm ? (
          <>
            {/* Search */}
            <div className="relative my-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                autoFocus
              />
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto -mx-5 px-5">
              {exercises === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-muted-foreground">No exercises found</p>
                  <button
                    onClick={() => {
                      setShowCreateForm(true);
                      setNewExerciseName(search);
                    }}
                    className="btn btn-primary mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    Create "{search}"
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedExercises).map(([group, groupExercises]) => (
                    <div key={group}>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                        {group}
                      </h3>
                      <div className="space-y-1">
                        {groupExercises.map((exercise: Exercise) => (
                          <button
                            key={exercise._id}
                            onClick={() => onSelect(exercise._id as ExerciseId, exercise.name)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-card transition-colors text-left group"
                          >
                            <div>
                              <span className="font-medium">{exercise.name}</span>
                              {exercise.equipment && (
                                <span className="text-muted-foreground text-sm ml-2">
                                  ({exercise.equipment})
                                </span>
                              )}
                            </div>
                            <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Button */}
            <div className="pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-secondary w-full"
              >
                <Plus className="w-4 h-4" />
                Create Custom Exercise
              </button>
            </div>
          </>
        ) : (
          /* Create Form */
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Exercise Name
              </label>
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="e.g., Incline Dumbbell Curl"
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Muscle Group (optional)
              </label>
              <select
                value={newMuscleGroup}
                onChange={(e) => setNewMuscleGroup(e.target.value)}
                className="input select"
              >
                <option value="">Select muscle group</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newExerciseName.trim()}
                className="btn btn-primary flex-1"
              >
                Create & Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
