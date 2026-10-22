import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function getAvatarUrl(path) {
  if (!path) return null;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export default function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_path, birth_date, sex, weight_kg, height_cm, calorie_goal"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setProfile({
        id: user.id,
        email: user.email,
        full_name: data?.full_name || "",
        avatar_path: data?.avatar_path || null,
        avatar_url: getAvatarUrl(data?.avatar_path),
        birth_date: data?.birth_date || "",
        sex: data?.sex || "",
        weight_kg: data?.weight_kg ?? "",
        height_cm: data?.height_cm ?? "",
        calorie_goal: data?.calorie_goal ?? "",
      });
    } catch (loadError) {
      console.error("Erro ao carregar perfil:", loadError);
      setProfile(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o perfil."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, loading, error, reload: load };
}