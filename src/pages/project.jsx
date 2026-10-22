import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABELS = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluído",
};

export default function Project() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadProject() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }

    // PROJETO
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError) {
      setError(projectError.message);
      setLoading(false);
      return;
    }

    setProject(projectData);

    if (!projectData) {
      setLoading(false);
      return;
    }

    // TASKS
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (taskError) {
      setError(taskError.message);
    } else {
      setTasks(taskData || []);
    }

    setLoading(false);
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) return;

    setDeleting(true);
    setError("");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskToDelete.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
      setTaskToDelete(null);
      return;
    }

    setTasks((current) =>
      current.filter((task) => task.id !== taskToDelete.id)
    );
    setTaskToDelete(null);
  }

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // LOADING
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">Carregando projeto...</p>
      </main>
    );
  }

  // PROJETO NÃO ENCONTRADO
  if (!project) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Projeto não encontrado.</p>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300"
        >
          ← Voltar para projetos
        </button>
      </main>
    );
  }

  // TELA
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← Voltar para projetos
          </button>

          <h1 className="text-3xl font-bold">{project.name}</h1>

          {project.description && (
            <p className="mt-2 text-slate-400">{project.description}</p>
          )}
        </div>
      </header>

      {/* TASKS */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Treinos</h2>

            <p className="text-sm text-slate-400">
              Exercícios e tarefas deste projeto
            </p>
          </div>

          <button
            onClick={() => navigate(`/projects/${projectId}/tasks/create`)}
            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
          >
            + Criar treino
          </button>
        </div>

        {/* ERRO */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* LISTA */}
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-slate-400">Nenhum treino neste projeto.</p>

            <button
              onClick={() => navigate(`/projects/${projectId}/tasks/create`)}
              className="mt-4 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
            >
              Criar primeiro treino
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>

                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                    {task.required_exercises ? (
                      <span>{task.required_exercises} exercícios</span>
                    ) : null}

                    {task.status && (
                      <span>{STATUS_LABELS[task.status] || task.status}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      navigate(`/projects/${projectId}/tasks/${task.id}`)
                    }
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Abrir
                  </button>

                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL DE CONFIRMAÇÃO */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Excluir treino?</h2>

            <p className="mt-3 text-sm text-slate-300">
              Você vai excluir <strong>{taskToDelete.title}</strong>.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Os exercícios e o histórico de sessões deste treino também serão
              apagados. Essa ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 py-3 font-semibold hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteTask}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}