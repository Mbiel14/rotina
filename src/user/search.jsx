import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ExerciseAutocomplete({ value, onSelect }) {
  const [search, setSearch] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setSearched(false);
    setErrorMsg("");

    // só busca quando o usuário está digitando
    if (!open || !search.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);

      const { data, error } = await supabase.rpc("search_exercises", {
        p_search: search.trim(),
        p_limit: 10,
      });

      if (cancelled) return;

      if (error) {
        console.error("Erro em search_exercises:", error);
        setErrorMsg(error.message);
        setResults([]);
      } else {
        setResults(data || []);
      }

      setSearched(true);
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  function handleChange(e) {
    setSearch(e.target.value);
    setOpen(true);
  }

  function handleSelect(exercise) {
    setSearch(exercise.name);
    setResults([]);
    setOpen(false);
    setSearched(false);
    onSelect(exercise);
  }

  return (
    <div className="autocomplete">
      <input
        type="text"
        className="autocomplete-input"
        value={search}
        placeholder="Digite o exercício..."
        onChange={handleChange}
        onFocus={() => search.trim() && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && loading && (
        <div className="autocomplete-status">Pesquisando...</div>
      )}

      {open && errorMsg && (
        <div className="autocomplete-status autocomplete-error">
          Erro: {errorMsg}
        </div>
      )}

      {open && searched && !loading && !errorMsg && results.length === 0 && (
        <div className="autocomplete-status">Nenhum exercício encontrado</div>
      )}

      {open && results.length > 0 && (
        <div className="autocomplete-results">
          {results.map((exercise) => (
            <button
              type="button"
              key={exercise.id}
              className="autocomplete-item"
              onMouseDown={() => handleSelect(exercise)}
            >
              {exercise.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}