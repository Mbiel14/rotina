import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { daysAgo } from "../lib/health";

// tabelas que pertencem ao usuário, e não a uma rotina específica
const GLOBAL_TABLES = ["meal_logs"];

export default function useLogs(table, projectId, dateCol, days = 7) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from(table)
      .select("*")
      .gte(dateCol, daysAgo(days - 1));

    if (projectId && !GLOBAL_TABLES.includes(table)) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query
      .order(dateCol, { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setRows(data || []);
      setError("");
    }

    setLoading(false);
  }, [table, projectId, dateCol, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, reload: load };
}