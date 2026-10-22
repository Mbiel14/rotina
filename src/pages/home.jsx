import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useProfile from "../user/useprofile";
import Avatar from "../components/avatar";
import DietTab from "../components/diettab";
import WeeklyWorkoutProgress from "../components/weeklyworkoutprogress";

const TABS = [
  ["treino", "Treino"],
  ["dieta", "Dieta"],
];

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // a aba fica na URL (?tab=dieta), então "voltar" mantém a aba
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "dieta" ? "dieta" : "treino";

  function changeTab(key) {
    setSearchParams(key === "treino" ? {} : { tab: key }, { replace: true });
  }

  const [projects, setProjects] = useState([]);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const firstName = (profile?.full_name || "").trim().split(" ")[0];

  async function loadProjects() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  }

  async function createProject(event) {
    event.preventDefault();

    if (!projectName.trim()) return;

    setCreating(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado.");
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setCreating(false);
      return;
    }

    setProjects((current) => [data, ...current]);

    setProjectName("");
    setProjectDescription("");
    setShowCreateProject(false);
    setCreating(false);
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return;

    setDeleting(true);
    setError("");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
      setProjectToDelete(null);
      return;
    }

    setProjects((current) =>
      current.filter((project) => project.id !== projectToDelete.id)
    );
    setProjectToDelete(null);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-6 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-slate-400">
                {firstName ? `Olá, ${firstName}` : "Bem-vindo"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {tab === "treino" && (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
                >
                  + Nova rotina
                </button>
              )}

              {profile && (
                <Link
                  to="/profile"
                  title="Meu perfil"
                  className="rounded-full transition hover:ring-4 hover:ring-purple-500/30"
                >
                  <Avatar
                    url={profile.avatar_url}
                    name={profile.full_name}
                    email={profile.email}
                    size={44}
                  />
                </Link>
              )}
            </div>
          </div>

          {/* ABAS */}
          <nav className="mt-5 flex gap-1">
            {TABS.map(([key, text]) => (
              <button
                key={key}
                onClick={() => changeTab(key)}
                className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition ${
                  tab === key
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {text}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {tab === "dieta" && (
          <div className="mx-auto max-w-3xl">
            <DietTab profile={profile} />
          </div>
        )}

        {tab === "treino" && (
          <>
            <WeeklyWorkoutProgress
              projectIds={projects.map((project) => project.id)}
            />

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-slate-400">Carregando rotinas...</p>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <h2 className="text-xl font-semibold">Nenhuma rotina ainda</h2>
                <p className="mt-2 text-slate-400">
                  Crie sua primeira rotina com treinos, sono e cardio.
                </p>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="mt-6 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
                >
                  Criar rotina
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-purple-500/50 hover:bg-white/10"
                  >
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 text-left"
                    >
                      <h2 className="text-lg font-semibold">{project.name}</h2>

                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                          {project.description}
                        </p>
                      )}
                    </button>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Abrir rotina →
                      </button>

                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL: NOVA ROTINA */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova rotina</h2>

              <button
                onClick={() => setShowCreateProject(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createProject} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Nome da rotina"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
                required
              />

              <textarea
                placeholder="Descrição (opcional)"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
              />

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-purple-600 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
              >
                {creating ? "Criando..." : "Criar rotina"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR ROTINA */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Excluir rotina?</h2>

            <p className="mt-3 text-sm text-slate-300">
              Você vai excluir <strong>{projectToDelete.name}</strong>.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Treinos, sessões, registros de sono e cardio desta rotina também
              serão apagados. Essa ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 py-3 font-semibold hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteProject}
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