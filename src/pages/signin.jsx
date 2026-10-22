import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError("Não foi possível entrar com o Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-8">

        <h1 className="text-3xl font-bold text-white">
          Bem-vindo de volta
        </h1>

        <p className="mt-2 text-slate-400">
          Entre na sua conta para continuar.
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none focus:border-purple-500"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none focus:border-purple-500"
          />

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs text-slate-500">
            OU
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg font-bold">
            G
          </span>

          {googleLoading
            ? "Conectando..."
            : "Continuar com Google"}
        </button>

        <div className="mt-6 text-center">
          <span className="text-sm text-slate-500">
            Não tem uma conta?{" "}
          </span>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-sm font-semibold text-purple-400 transition hover:text-purple-300"
          >
            Cadastre-se
          </button>
        </div>

      </div>
    </main>
  );
}
