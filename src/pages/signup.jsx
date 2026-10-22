import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "Conta criada! Verifique seu e-mail para confirmar o cadastro."
    );

    setLoading(false);
  }

  async function handleGoogleSignup() {
    setError("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError("Não foi possível continuar com o Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-8">

        {/* Título */}
        <h1 className="text-3xl font-bold text-white">
          Criar conta
        </h1>

        <p className="mt-2 text-slate-400">
          Crie sua conta no sixseven.
        </p>

        {/* Formulário */}
        <form
          onSubmit={handleSignup}
          className="mt-8 space-y-5"
        >

          {/* E-mail */}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
          />

          {/* Senha */}
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
          />

          {/* Confirmar senha */}
          <input
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
          />

          {/* Erro */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Criar conta */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta →"}
          </button>
        </form>

        {/* Separador */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs text-slate-500">
            OU
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg font-bold">
            G
          </span>

          {googleLoading
            ? "Conectando..."
            : "Cadastrar com Google"}
        </button>

        {/* Voltar para login */}
        <div className="mt-6 text-center">
          <span className="text-sm text-slate-500">
            Já tem uma conta?{" "}
          </span>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-purple-400 transition hover:text-purple-300"
          >
            Entrar
          </button>
        </div>

      </div>
    </main>
  );
}
