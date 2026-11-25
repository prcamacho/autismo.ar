"use client";

import { useEffect, useId, useState } from "react";
import { youtubeWatchUrl } from "./youtube";
import styles from "./articles.module.css";

/** No iframe, thumbnail, API script or third-party request before activation. */
export function YouTubeVideo({
  videoId,
  label,
}: {
  videoId: string;
  label: string;
}) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "slow">(
    "loading",
  );
  const regionId = useId();

  useEffect(() => {
    if (!active || status !== "loading") return;
    const timeout = window.setTimeout(() => setStatus("slow"), 12000);
    return () => window.clearTimeout(timeout);
  }, [active, status]);

  return (
    <figure className={styles.video}>
      <figcaption>{label || "Video de YouTube"}</figcaption>
      <p className={styles.hint}>
        Al cargar el reproductor, tu navegador se conecta con YouTube. Usamos su
        modo de privacidad mejorada.
      </p>
      <div>
        <button
          type="button"
          className="button button-secondary"
          aria-expanded={active}
          aria-controls={regionId}
          onClick={() => {
            setActive(!active);
            setStatus("loading");
          }}
        >
          {active ? "Cerrar reproductor" : "Cargar video"}
        </button>
      </div>
      <div id={regionId} hidden={!active}>
        {active && (
          <iframe
            className={styles.videoFrame}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0`}
            title={`Video de YouTube: ${label || "sin título"}`}
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("slow")}
          />
        )}
      </div>
      <p role="status" className={styles.hint}>
        {active && status === "loading" && "Cargando reproductor de YouTube…"}
        {active &&
          status === "slow" &&
          "El reproductor no respondió a tiempo. Podés cerrarlo y volver a cargarlo, o abrir el video en YouTube."}
      </p>
      <p className={styles.hint}>
        Si el video no está disponible o no permite reproducirse aquí, probá
        abrirlo en YouTube.
      </p>
      <a
        href={youtubeWatchUrl(videoId)}
        className={styles.external}
        target="_blank"
        rel="ugc nofollow noopener noreferrer"
      >
        Ver en YouTube<span className="sr-only"> (otra pestaña)</span> ↗
      </a>
    </figure>
  );
}
