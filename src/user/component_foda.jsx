import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ExerciseAutocomplete from "./search";
import { createTask } from "./create_task";

export default function CreateTask() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [requiredExercises, setRequiredExercises] = useState(1);

  const [exercises, setExercises] = useState([
    {
      exercise_id: null,
      name: "",
      required_sets: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeExerciseCount(value) {
    const count = Math.max(1, Number(value));

    setRequiredExercises(count);

    setExercises((current) => {
      if (current.length > count) {
        return current.slice(0, count);
      }

      return [
        ...current,
        ...Array.from(
          { length: count - current.length },
          () => ({
            exercise_id: null,
            name: "",
            required_sets: 1,
          })
        ),
      ];
    });
  }

  function selectExercise(index, exercise) {
    setExercises((current) => {
      const copy = [...current];

      copy[index] = {
        ...copy[index],
        exercise_id: exercise.id,
        name: exercise.name,
      };

      return copy;
    });
  }

  function changeSets(index, value) {
    setExercises((current) => {
      const copy = [...current];

      copy[index] = {
        ...copy[index],
        required_sets: Math.max(1, Number(value)),
      };

      return copy;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    // Validações
    if (!name.trim()) {
      setError("Digite o nome da tarefa.");
      return;
    }

    if (!projectId) {
      setError("rotina não identificado.");
      return;
    }

    if (exercises.length !== requiredExercises) {
      setError(
        `Você precisa adicionar ${requiredExercises} exercício(s).`
      );
      return;
    }

    const invalidExercise = exercises.some(
      (exercise) => !exercise.exercise_id
    );

    if (invalidExercise) {
      setError(
        "Selecione um exercício para cada campo."
      );
      return;
    }

    const invalidSets = exercises.some(
      (exercise) =>
        !exercise.required_sets ||
        exercise.required_sets < 1
    );

    if (invalidSets) {
      setError(
        "Cada exercício precisa ter pelo menos 1 série."
      );
      return;
    }

    setLoading(true);

    try {
      await createTask({
        projectId,
        name: name.trim(),
        requiredExercises,
        exercises,
      });

      alert("Tarefa criada com sucesso!");

      navigate(`/projects/${projectId}`);

    } catch (err) {
      setError(
        err?.message || "Erro ao criar tarefa."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">

        {/* Voltar */}

        <button
          type="button"
          onClick={() =>
            navigate(`/projects/${projectId}`)
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Voltar para as rotinas
        </button>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >

          <h1 className="mb-2 text-2xl font-bold">
            Criar treino
          </h1>

          <p className="mb-8 text-sm text-slate-400">
            Adicione os exercícios e defina a quantidade
            obrigatória de séries.
          </p>

          {/* ERRO */}

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* NOME */}

          <div className="mb-6">

            <label className="mb-2 block text-sm font-medium">
              Nome da tarefa
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Ex: Treino de Peito"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
            />

          </div>

          {/* QUANTIDADE */}

          <div className="mb-8">

            <label className="mb-2 block text-sm font-medium">
              Quantidade de exercícios
            </label>

            <input
              type="number"
              min="1"
              max="50"
              value={requiredExercises}
              onChange={(e) =>
                changeExerciseCount(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500"
            />

          </div>

          {/* EXERCÍCIOS */}

          <div className="space-y-5">

            {exercises.map((exercise, index) => (

              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >

                <h2 className="mb-4 font-semibold">
                  Exercício {index + 1}
                </h2>

                <div className="mb-4">

                  <label className="mb-2 block text-sm text-slate-400">
                    Exercício
                  </label>

                  <ExerciseAutocomplete
                    value={exercise}
                    onSelect={(selected) =>
                      selectExercise(index, selected)
                    }
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm text-slate-400">
                    Séries obrigatórias
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={exercise.required_sets}
                    onChange={(e) =>
                      changeSets(
                        index,
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500"
                  />

                </div>

              </div>

            ))}

          </div>

          {/* BOTÃO */}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : "Criar tarefa"}
          </button>

        </form>

      </div>
    </main>
  );
}