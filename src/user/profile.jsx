import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useProfile from "./useprofile";
import Avatar from "../components/avatar";
import { ageFromBirth, bmiInfo, estimateTdee } from "../lib/nutrition";
import { inputClass, cardClass, primaryBtn } from "../components/ui";

const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const toNum = (v) =>
  v === "" || v == null ? null : Number(String(v).replace(",", "."));

export default function Profile() {
  const navigate = useNavigate();
  const { profile, loading, error, reload } = useProfile();

  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    sex: "",
    weight_kg: "",
    height_cm: "",
    calorie_goal: "",
  });
  const [filled, setFilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "error", text }

  // preenche o formulário só na primeira carga (não apaga o que você digitou
  // quando a foto é trocada)
  useEffect(() => {
    if (profile && !filled) {
      setForm({
        full_name: profile.full_name,
        birth_date: profile.birth_date,
        sex: profile.sex,
        weight_kg: String(profile.weight_kg ?? ""),
        height_cm: String(profile.height_cm ?? ""),
        calorie_goal: String(profile.calorie_goal ?? ""),
      });
      setFilled(true);
    }
  }, [profile, filled]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const ok = (text) => setNotice({ type: "ok", text });
  const fail = (text) => setNotice({ type: "error", text });

  // ---------- números calculados ao vivo ----------

  const rawAge = ageFromBirth(form.birth_date || null);
  const age = rawAge !== null && rawAge >= 0 && rawAge <= 120 ? rawAge : null;
  const weight = toNum(form.weight_kg);
  const height = toNum(form.height_cm);

  const bmi = age !== null && age >= 18 ? bmiInfo(weight, height) : null;
  const tdee = estimateTdee({
    birth_date: form.birth_date,
    sex: form.sex,
    weight_kg: weight,
    height_cm: height,
  });

  // ---------- ações ----------

  async function handleSave(e) {
    e.preventDefault();
    setNotice(null);

    const goal = toNum(form.calorie_goal);

    if (form.birth_date) {
      if (age === null) return fail("Data de nascimento inválida.");
    }
    if (weight !== null && (Number.isNaN(weight) || weight < 20 || weight > 400)) {
      return fail("Peso inválido (entre 20 e 400 kg).");
    }
    if (height !== null && (Number.isNaN(height) || height < 80 || height > 250)) {
      return fail("Altura inválida (em cm, entre 80 e 250).");
    }
    if (
      goal !== null &&
      (!Number.isInteger(goal) || goal < 800 || goal > 6000)
    ) {
      return fail("A meta diária deve ser um número inteiro entre 800 e 6000 kcal.");
    }

    setBusy(true);

    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      full_name: form.full_name.trim(),
      birth_date: form.birth_date || null,
      sex: form.sex || null,
      weight_kg: weight,
      height_cm: height,
      calorie_goal: goal,
      updated_at: new Date().toISOString(),
    });

    setBusy(false);

    if (error) return fail(error.message);

    ok("Perfil salvo!");
    reload();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!TYPES.includes(file.type)) {
      return fail("Use uma imagem JPG, PNG ou WebP.");
    }
    if (file.size > MAX_SIZE) {
      return fail("A imagem deve ter no máximo 2 MB.");
    }

    setBusy(true);
    setNotice(null);

    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setBusy(false);
      return fail(`Erro no upload: ${uploadError.message}`);
    }

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: profile.id,
      avatar_path: path,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      setBusy(false);
      return fail(`Erro ao salvar: ${updateError.message}`);
    }

    if (profile.avatar_path) {
      await supabase.storage.from("avatars").remove([profile.avatar_path]);
    }

    setBusy(false);
    ok("Foto atualizada!");
    reload();
  }

  async function handleRemovePhoto() {
    if (!profile.avatar_path) return;

    setBusy(true);
    setNotice(null);

    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      avatar_path: null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setBusy(false);
      return fail(error.message);
    }

    await supabase.storage.from("avatars").remove([profile.avatar_path]);

    setBusy(false);
    ok("Foto removida.");
    reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  // ---------- estados de tela ----------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">Carregando perfil...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        {error ? (
          <>
            <p>Não foi possível carregar seu perfil.</p>
            <p className="mt-2 text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 rounded-xl bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <p>Faça login para ver seu perfil.</p>
            <Link to="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Ir para o login
            </Link>
          </>
        )}
      </main>
    );
  }

  const displayName = form.full_name.trim() || "Sem nome";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-block text-sm text-slate-400 hover:text-white"
        >
          ← Voltar
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Meu perfil</h1>

        {notice && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm ${
              notice.type === "ok"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* IDENTIDADE */}
        <div className={`${cardClass} flex flex-wrap items-center gap-6`}>
          <Avatar
            url={profile.avatar_url}
            name={form.full_name}
            email={profile.email}
            size={96}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold">{displayName}</p>
            <p className="truncate text-sm text-slate-400">{profile.email}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <label
                className={`cursor-pointer rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/5 ${
                  busy ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {profile.avatar_url ? "Trocar foto" : "Adicionar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUpload}
                  disabled={busy}
                  hidden
                />
              </label>

              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={busy}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  Remover
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG ou WebP, até 2 MB.
            </p>
          </div>
        </div>

        {/* RESUMO */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={cardClass}>
            <p className="text-xs text-slate-400">Idade</p>
            <p className="mt-1 text-2xl font-bold">
              {age !== null ? `${age} anos` : "—"}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs text-slate-400">IMC</p>
            {bmi ? (
              <>
                <p className="mt-1 text-2xl font-bold">
                  {bmi.value.toFixed(1)}
                </p>
                <p className={`text-xs ${bmi.color}`}>{bmi.label}</p>
              </>
            ) : (
              <p className="mt-1 text-2xl font-bold">—</p>
            )}
          </div>

          <div className={cardClass}>
            <p className="text-xs text-slate-400">Manutenção estimada</p>
            <p className="mt-1 text-2xl font-bold">
              {tdee ? `${tdee} kcal` : "—"}
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          IMC e manutenção são estimativas e valem apenas para adultos. Não
          substituem avaliação médica ou nutricional.
        </p>

        {/* DADOS */}
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
            <h2 className="text-lg font-semibold sm:col-span-2">
              Dados pessoais
            </h2>

            <label className="text-sm text-slate-400 sm:col-span-2">
              Nome
              <input
                type="text"
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Seu nome"
                className={`${inputClass} mt-1`}
              />
            </label>

            <label className="text-sm text-slate-400">
              Data de nascimento
              <input
                type="date"
                value={form.birth_date}
                onChange={set("birth_date")}
                className={`${inputClass} mt-1`}
              />
            </label>

            <label className="text-sm text-slate-400">
              Sexo (para estimar calorias)
              <select
                value={form.sex}
                onChange={set("sex")}
                className={`${inputClass} mt-1`}
              >
                <option value="" className="bg-slate-900">
                  Não informar
                </option>
                <option value="M" className="bg-slate-900">
                  Masculino
                </option>
                <option value="F" className="bg-slate-900">
                  Feminino
                </option>
              </select>
            </label>

            <label className="text-sm text-slate-400">
              Peso (kg)
              <input
                type="text"
                inputMode="decimal"
                value={form.weight_kg}
                onChange={set("weight_kg")}
                placeholder="70"
                className={`${inputClass} mt-1`}
              />
            </label>

            <label className="text-sm text-slate-400">
              Altura (cm)
              <input
                type="text"
                inputMode="decimal"
                value={form.height_cm}
                onChange={set("height_cm")}
                placeholder="175"
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <div className={`${cardClass} space-y-3`}>
            <h2 className="text-lg font-semibold">Meta diária de calorias</h2>

            <label className="block text-sm text-slate-400">
              Calorias por dia (kcal)
              <input
                type="text"
                inputMode="numeric"
                value={form.calorie_goal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    calorie_goal: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder={tdee ? String(tdee) : "Ex: 2200"}
                className={`${inputClass} mt-1`}
              />
            </label>

            <p className="text-xs text-slate-500">
              Aparece na aba Dieta. Se deixar em branco, usamos a manutenção
              estimada
              {tdee ? ` (${tdee} kcal)` : " quando houver peso, altura, sexo e nascimento"}
              .
            </p>
          </div>

          <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
            {busy ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        {/* CONTA */}
        <div className={`${cardClass} mt-6 flex items-center justify-between`}>
          <div>
            <h2 className="font-semibold">Conta</h2>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}