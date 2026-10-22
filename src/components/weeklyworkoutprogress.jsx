import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { currentWeekDays } from "../lib/health";

function dateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function weekday(value) {
  return new Date(`${value}T00:00:00`)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
}

export default function WeeklyWorkoutProgress({ projectIds }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const projectIdsKey = projectIds.join(",");
  const days = currentWeekDays();
  const weekStart = days[0];
  const today = dateKey(new Date());

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      setLoading(true);
      setError("");

      if (!projectIdsKey) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const ids = projectIdsKey.split(",");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (active) {
          setError(authError.message);
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (active) {
          setSessions([]);
          setLoading(false);
        }
        return;
      }

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)
        .in("project_id", ids);

      if (tasksError) {
        if (active) {
          setError(tasksError.message);
          setLoading(false);
        }
        return;
      }

      const taskIds = (tasks || []).map((task) => task.id);
      if (!taskIds.length) {
        if (active) {
          setSessions([]);
          setLoading(false);
        }
        return;
      }

      const start = new Date(`${weekStart}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const { data, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id, task_id, finished_at")
        .in("task_id", taskIds)
        .gte("finished_at", start.toISOString())
        .lt("finished_at", end.toISOString())
        .order("finished_at", { ascending: true });

      if (!active) return;

      if (sessionsError) {
        setError(sessionsError.message);
      } else {
        setSessions(data || []);
      }
      setLoading(false);
    }

    loadSessions();
    return () => {
      active = false;
    };
  }, [projectIdsKey, weekStart]);

  const sessionsByDay = sessions.reduce((grouped, session) => {
    const key = dateKey(session.finished_at);
    grouped[key] = (grouped[key] || 0) + 1;
    return grouped;
  }, {});
  const activeDays = days.filter((day) => sessionsByDay[day]).length;
  const weekSessions = sessions.length;

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-purple-300">Treino</p>
          <h2 className="mt-1 text-xl font-bold">Progresso da semana</h2>
        </div>
        <p className="text-sm text-slate-400">
          {loading
            ? "Carregando..."
            : `${activeDays} de 7 dias · ${weekSessions} ${
                weekSessions === 1 ? "treino registrado" : "treinos registrados"
              }`}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          Não foi possível carregar o progresso semanal: {error}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {days.map((day) => {
            const count = sessionsByDay[day] || 0;
            const isToday = day === today;

            return (
              <div
                key={day}
                className={`rounded-xl border p-3 ${
                  count
                    ? "border-purple-500/30 bg-purple-500/10"
                    : "border-white/10 bg-black/20"
                } ${isToday ? "ring-1 ring-purple-400/50" : ""}`}
              >
                <p className="text-xs capitalize text-slate-400">
                  {weekday(day)}
                  {isToday ? " · Hoje" : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {loading
                    ? "..."
                    : count
                      ? `${count} ${count === 1 ? "treino" : "treinos"}`
                      : "—"}
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    count ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {loading ? " " : count ? "Registrado" : "Sem treino"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
