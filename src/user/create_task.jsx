import { supabase } from "../lib/supabaseClient";

export async function createTask({
  projectId,
  name,
  requiredExercises,
  exercises,
}) {
  if (!projectId) {
    throw new Error("Projeto não informado.");
  }

  if (!name?.trim()) {
    throw new Error("Informe o nome da tarefa.");
  }

  const exerciseCount = Number(requiredExercises);

  if (!exerciseCount || exerciseCount < 1) {
    throw new Error(
      "A quantidade de exercícios deve ser maior que zero."
    );
  }

  if (!Array.isArray(exercises)) {
    throw new Error("Lista de exercícios inválida.");
  }

  if (exercises.length !== exerciseCount) {
    throw new Error(
      `Você precisa adicionar exatamente ${exerciseCount} exercícios.`
    );
  }

  for (const exercise of exercises) {
    if (!exercise.exercise_id) {
      throw new Error(
        "Todos os exercícios precisam ser selecionados."
      );
    }

    if (
      !exercise.required_sets ||
      Number(exercise.required_sets) < 1
    ) {
      throw new Error(
        "Todos os exercícios precisam ter pelo menos 1 série."
      );
    }
  }

  const { data, error } = await supabase.rpc(
    "create_task",
    {
      p_project_id: projectId,
      p_name: name.trim(),
      p_required_exercises: exerciseCount,
      p_exercises: exercises.map(
        (exercise, index) => ({
          exercise_id: exercise.exercise_id,
          required_sets: Number(
            exercise.required_sets
          ),
          exercise_order: index + 1,
        })
      ),
    }
  );

  if (error) {
    console.error("Erro ao criar task:", error);
    throw new Error(error.message);
  }

  return data;
}