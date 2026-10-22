import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function toNumber(value) {
  return Number(String(value).replace(",", "."));
}

function formatKg(value) {
  return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function getLevel(diffPct) {
  if (diffPct === null) {
    return {
      label: "Primeira sessão",
      text: "Sessão de referência. A próxima será comparada com esta.",
      color: "text-purple-300",
    };
  }
  if (diffPct >= 5) {
    return {
      label: "Mais intensa",
      text: "Você levantou mais volume do que na última vez.",
      color: "text-green-400",
    };
  }
  if (diffPct <= -5) {
    return {
      label: "Mais leve",
      text: "Volume menor que na última sessão.",
      color: "text-amber-400",
    };
  }
  return {
    label: "Similar",
    text: "Intensidade parecida com a da última sessão.",
    color: "text-sky-400",
  };
}

export default function TaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  const startedAt = useRef(new Date());

  const [task, setTask] = useState(null);
  const [items, setItems] = useState([]); // exercícios do treino
  const [sets, setSets] = useState({}); // { [task_exercise_id]: [{weight, reps}] }
  const [previous, setPrevious] = useState(null); // última sessão

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  async function load() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, status, project_id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (taskError || !taskData) {
      setError(taskError?.message || "Treino não encontrado.");
      setLoading(false);
      return;
    }

    setTask(taskData);

    const { data: teData, error: teError } = await supabase
      .from("task_exercises")
      .select("id, exercise_id, required_sets, exercise_order, exercises(name)")
      .eq("task_id", taskId)
      .order("exercise_order", { ascending: true });

    if (teError) {
      setError(teError.message);
      setLoading(false);
      return;
    }

    const list = teData || [];
    setItems(list);

    const initial = {};
    list.forEach((item) => {
      initial[item.id] = Array.from({ length: item.required_sets }, () => ({
        weight: "",
        reps: "",
      }));
    });
    setSets(initial);

    // última sessão deste treino (comparação e sugestão de kg)
    const { data: lastData } = await supabase
      .from("workout_sessions")
      .select(
        "id, total_volume, finished_at, session_sets(exercise_id, set_number, weight_kg, reps)"
      )
      .eq("task_id", taskId)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setPrevious(lastData || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [taskId]);

  function lastSet(exerciseId, setNumber) {
    return previous?.session_sets?.find(
      (s) => s.exercise_id === exerciseId && s.set_number === setNumber
    );
  }

  function updateSet(itemId, index, field, value) {
    setSets((current) => {
      const copy = { ...current };
      copy[itemId] = copy[itemId].map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      );
      return copy;
    });
  }

  function addSet(itemId) {
    setSets((current) => ({
      ...current,
      [itemId]: [...current[itemId], { weight: "", reps: "" }],
    }));
  }

  function removeSet(itemId, index) {
    setSets((current) => {
      if (current[itemId].length <= 1) return current;
      return {
        ...current,
        [itemId]: current[itemId].filter((_, i) => i !== index),
      };
    });
  }

  async function finishSession() {
    setError("");

    const payload = [];

    for (const item of items) {
      const rows = sets[item.id] || [];

      for (let i = 0; i < rows.length; i++) {
        const weight = toNumber(rows[i].weight);
        const reps = Number(rows[i].reps);

        if (
          rows[i].weight === "" ||
          rows[i].reps === "" ||
          Number.isNaN(weight) ||
          weight < 0 ||
          !Number.isInteger(reps) ||
          reps < 1
        ) {
          setError(
            `Preencha kg e repetições válidos em "${item.exercises?.name}" (série ${i + 1}).`
          );
          return;
        }

        payload.push({
          exercise_id: item.exercise_id,
          set_number: i + 1,
          weight_kg: weight,
          reps,
        });
      }
    }

    if (payload.length === 0) {
      setError("Nenhuma série para salvar.");
      return;
    }

    setSaving(true);

    const { error: rpcError } = await supabase.rpc("save_workout_session", {
      p_task_id: taskId,
      p_started_at: startedAt.current.toISOString(),
      p_sets: payload,
    });

    setSaving(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const volume = payload.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
    const prevVolume = previous ? Number(previous.total_volume) : null;
    const diffPct =
      prevVolume && prevVolume > 0
        ? ((volume - prevVolume) / prevVolume) * 100
        : null;

    setSummary({
      volume,
      totalSets: payload.length,
      maxWeight: Math.max(...payload.map((s) => s.weight_kg)),
      minutes: Math.max(
        1,
        Math.round((Date.now() - startedAt.current.getTime()) / 60000)
      ),
      prevVolume,
      diffPct,
    });
  }

  // ---------- estados de tela ----------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">Carregando treino...</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>{error || "Treino não encontrado."}</p>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300"
        >
          ← Voltar para o projeto
        </button>
      </main>
    );
  }

  // ---------- resumo da sessão ----------

  if (summary) {
    const level = getLevel(summary.diffPct);

    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-400">Sessão concluída</p>
            <h1 className="mt-1 text-2xl font-bold">{task.title}</h1>

            <p className={`mt-6 text-3xl font-bold ${level.color}`}>
              {level.label}
            </p>
            <p className="mt-2 text-sm text-slate-400">{level.text}</p>

            {summary.diffPct !== null && (
              <p className="mt-2 text-sm text-slate-300">
                {summary.diffPct >= 0 ? "+" : ""}
                {summary.diffPct.toFixed(1)}% de volume vs. sessão anterior
              </p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xl font-bold">
                  {formatKg(summary.volume)}
                </p>
                <p className="text-xs text-slate-400">kg de volume</p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xl font-bold">{summary.totalSets}</p>
                <p className="text-xs text-slate-400">séries</p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xl font-bold">
                  {formatKg(summary.maxWeight)}
                </p>
                <p className="text-xs text-slate-400">maior carga (kg)</p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xl font-bold">{summary.minutes}</p>
                <p className="text-xs text-slate-400">minutos</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="mt-8 w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
            >
              Voltar para o projeto
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---------- registro da sessão ----------

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Voltar para o projeto
        </button>

        <h1 className="text-3xl font-bold">{task.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Registre o kg e as repetições de cada série.
          {previous
            ? " Os valores em cinza são da sua última sessão."
            : " Esta será sua primeira sessão neste treino."}
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-400">
            Este treino não tem exercícios cadastrados.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="mb-4 font-semibold">
                  {idx + 1}. {item.exercises?.name || "Exercício"}
                </h2>

                <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-3 text-xs text-slate-500">
                  <span>Série</span>
                  <span>Kg</span>
                  <span>Reps</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {(sets[item.id] || []).map((row, i) => {
                    const last = lastSet(item.exercise_id, i + 1);

                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[2.5rem_1fr_1fr_2rem] items-center gap-3"
                      >
                        <span className="text-sm text-slate-400">{i + 1}</span>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.weight}
                          onChange={(e) =>
                            updateSet(item.id, i, "weight", e.target.value)
                          }
                          placeholder={last ? formatKg(last.weight_kg) : "0"}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.reps}
                          onChange={(e) =>
                            updateSet(
                              item.id,
                              i,
                              "reps",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder={last ? String(last.reps) : "0"}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeSet(item.id, i)}
                          title="Remover série"
                          className="text-slate-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(item.id)}
                  className="mt-3 text-sm text-purple-400 hover:text-purple-300"
                >
                  + Adicionar série
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <button
            type="button"
            onClick={finishSession}
            disabled={saving}
            className="mt-8 w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Finalizar sessão"}
          </button>
        )}
      </div>
    </main>
  );
}