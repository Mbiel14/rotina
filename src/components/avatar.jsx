import { useEffect, useState } from "react";

export default function Avatar({ url, name, email, size = 40 }) {
  const [failed, setFailed] = useState(false);

  // se a URL mudar (foto nova), tenta carregar de novo
  useEffect(() => {
    setFailed(false);
  }, [url]);

  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  const showImage = url && !failed;

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-purple-500/50 bg-purple-500/20 font-semibold text-purple-300"
    >
      {showImage ? (
        <img
          src={url}
          alt={name || "Foto de perfil"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.42 }}>{initial}</span>
      )}
    </div>
  );
}