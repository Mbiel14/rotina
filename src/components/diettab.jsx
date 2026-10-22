import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useLogs from "../user/uselogs";
import { today, currentWeekDays, formatDate } from "../lib/health";
import { estimateTdee } from "../lib/nutrition";
import { inputClass, cardClass, primaryBtn } from "./ui";

const MEAL_TYPES = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Outro"];

const num = (v) => Number(String(v).replace(",", "."));

export default function DietTab({ profile }) {
  const { rows, loading, error, reload } = useLogs(
    "meal_logs",
    null,
    "log_date"
  );

  const [date, setDate] = useState(today());
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ---------- cálculos ----------

  const customGoal = Number(profile?.calorie_goal) || null;
  const goal = customGoal || estimateTdee(profile);
  const goalLabel = customGoal ? "sua meta" : "manutenção estimada";

  const days = currentWeekDays();

  const totals = {};
  const proteins = {};
  rows.forEach((r) => {
    totals[r.log_date] = (totals[r.log_date] || 0) + Number(r.calories);
    proteins[r.log_date] =
      (proteins[r.log_date] || 0) + Number(r.protein_g || 0);
  });

  const todayKcal = Math.round(totals[today()] || 0);
  const todayProtein = Math.round(proteins[today()] || 0);

  const loggedDays = days.filter((d) => (totals[d] || 0) > 0);
  const avg = loggedDays.length
    ? Math.round(
        loggedDays.reduce((s, d) => s + totals[d], 0) / loggedDays.length
      )
    : null;

  const max = Math.max(goal || 0, ...days.map((d) => totals[d] || 0), 1);
  const pct = goal ? Math.min(100, (todayKcal / goal) * 100) : 0;
  const diff = goal ? todayKcal - Math.round(goal) : null;

  const daysWithMeals = days
    .slice()
    .reverse()
    .filter((d) => rows.some((r) => r.log_date === d));

  // ---------- ações ----------

  async function save(e) {
    e.preventDefault();

    if (!name.trim()) return setMsg("Informe o que você comeu.");

    if (calories === "" || Number.isNaN(num(calories)) || num(calories) < 0) {
      return setMsg("Informe as calorias (kcal).");
    }

    if (protein !== "" && (Number.isNaN(num(protein)) || num(protein) < 0)) {
      return setMsg("Proteína inválida.");
    }

    setSaving(true);
    setMsg("");

    const { error } = await supabase.from("meal_logs").insert({
      log_date: date,
      meal_type: mealType,
      name: name.trim(),
      calories: num(calories),
      protein_g: protein === "" ? null : num(protein),
    });

    setSaving(false);
    if (error) return setMsg(error.message);

    setName("");
    setCalories("");
    setProtein("");
    reload();
  }

  async function remove(id) {
    const { error } = await supabase.from("meal_logs").delete().eq("id", id);
    if (error) return setMsg(error.message);
    reload();
  }

  // ---------- tela ----------

  return (
    <div className="space-y-6">
      {/* HOJE */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Hoje</p>
            <p className="mt-1 text-4xl font-bold text-white">
              {todayKcal}
              <span className="ml-2 text-base font-medium text-slate-400">
                kcal
              </span>
            </p>
          </div>

          <div className="text-right text-sm text-slate-400">
            <p>
              Proteína:{" "}
              <strong className="text-white">{todayProtein} g</strong>
            </p>
            {avg !== null && (
              <p className="mt-1">
                Média (7 dias): <strong className="text-white">{avg} kcal</strong>
              </p>
            )}
          </div>
        </div>

        {goal ? (
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">
                {Math.round(goal)} kcal ({goalLabel})
              </span>
              <span
                className={diff > 0 ? "text-amber-400" : "text-slate-300"}
              >
                {diff > 0
                  ? `${diff} kcal acima`
                  : `${Math.abs(diff)} kcal restantes`}
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  diff > 0 ? "bg-amber-400" : "bg-purple-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-400">
            Para ver o progresso, informe peso, altura, sexo e nascimento, ou
            defina uma meta diária no{" "}
            <Link to="/profile" className="text-purple-400 hover:text-purple-300">
              perfil
            </Link>
            .
          </p>
        )}
      </div>

      {/* GRÁFICO */}
      <div className={cardClass}>
        <h3 className="mb-1 font-semibold text-white">Progresso da semana</h3>
        <p className="mb-4 text-sm text-slate-400">
          Refeições registradas em cada dia · calorias por dia
        </p>

        <div className="relative flex h-40 items-end gap-2">
          {goal && (
            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-purple-400/60"
              style={{ bottom: `${(goal / max) * 100}%` }}
            />
          )}

          {days.map((d) => (
            <div key={d} className="flex h-full flex-1 flex-col justify-end">
              <div
                title={`${formatDate(d)}: ${Math.round(totals[d] || 0)} kcal`}
                className={`w-full rounded-t-md ${
                  d === today() ? "bg-purple-500" : "bg-white/20"
                }`}
                style={{ height: `${((totals[d] || 0) / max) * 100}%` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          {days.map((d) => (
            <span
              key={d}
              className={`flex-1 text-center text-xs ${
                d === today() ? "font-semibold text-purple-300" : "text-slate-500"
              }`}
            >
              {new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", {
                weekday: "short",
              }).replace(".", "")}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const hasMeals = rows.some((row) => row.log_date === d);
            const weekday = new Date(`${d}T00:00:00`).toLocaleDateString(
              "pt-BR",
              { weekday: "short" }
            ).replace(".", "");

            return (
              <div
                key={d}
                className={`rounded-xl border p-3 ${
                  hasMeals
                    ? "border-purple-500/30 bg-purple-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <p className="text-xs capitalize text-slate-400">{weekday}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {hasMeals ? `${Math.round(totals[d] || 0)} kcal` : "—"}
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    hasMeals ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {hasMeals ? "Registrado" : "Sem registro"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* REGISTRO */}
      <form onSubmit={save} className={`${cardClass} grid gap-3 sm:grid-cols-2`}>
        <h3 className="font-semibold text-white sm:col-span-2">
          Registrar refeição
        </h3>

        <label className="text-sm text-slate-400">
          Data
          <input
            type="date"
            max={today()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="text-sm text-slate-400">
          Refeição
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m} className="bg-slate-900">
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-400 sm:col-span-2">
          O que você comeu
          <input
            type="text"
            placeholder="Ex: arroz, feijão e frango grelhado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="text-sm text-slate-400">
          Calorias (kcal)
          <input
            type="text"
            inputMode="decimal"
            placeholder="650"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="text-sm text-slate-400">
          Proteína (g), opcional
          <input
            type="text"
            inputMode="decimal"
            placeholder="40"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className={`${primaryBtn} sm:col-span-2`}
        >
          {saving ? "Salvando..." : "Registrar refeição"}
        </button>
      </form>

      {(msg || error) && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
          {msg || error}
        </div>
      )}

      {/* LISTA POR DIA */}
      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : daysWithMeals.length === 0 ? (
        <p className="text-slate-400">Nenhuma refeição nos últimos 7 dias.</p>
      ) : (
        <div className="space-y-6">
          {daysWithMeals.map((d) => (
            <div key={d}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-white">
                  {d === today() ? "Hoje" : formatDate(d)}
                </span>
                <span className="text-slate-400">
                  {Math.round(totals[d] || 0)} kcal
                </span>
              </div>

              <div className="space-y-2">
                {rows
                  .filter((r) => r.log_date === d)
                  .map((r) => (
                    <div
                      key={r.id}
                      className={`${cardClass} flex items-center justify-between py-3`}
                    >
                      <div>
                        <p className="font-medium text-white">{r.name}</p>
                        <p className="text-sm text-slate-500">
                          {r.meal_type} · {Math.round(r.calories)} kcal
                          {r.protein_g != null
                            ? ` · ${Number(r.protein_g)} g prot.`
                            : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => remove(r.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}