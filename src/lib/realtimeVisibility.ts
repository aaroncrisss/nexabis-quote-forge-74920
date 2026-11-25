/**
 * Utilidades de ciclo de vida por visibilidad de pestaña para ahorrar Disk IO,
 * conexiones Realtime y consultas de respaldo cuando la pestaña está oculta.
 */

export function isTabVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

/**
 * Ejecuta `fn` cada `ms` SOLO mientras la pestaña está visible.
 * Al ocultarse la pestaña se cancela el timer (`clearInterval`) y al volver se reactiva.
 */
export function createVisibleInterval(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    if (disposed || timer !== null || !isTabVisible()) return;
    timer = setInterval(() => {
      if (!disposed && isTabVisible()) fn();
    }, ms);
  };

  const onVisibility = () => {
    if (isTabVisible()) start();
    else stop();
  };

  start();
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  return () => {
    disposed = true;
    stop();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

/**
 * Pausa un recurso (ej. canal Realtime) tras `hiddenGraceMs` con la pestaña oculta,
 * evitando desconexiones por cambios rápidos de pestaña, y notifica al volver.
 */
export function createVisibilityLifecycle({
  hiddenGraceMs = 30_000,
  onPause,
  onResume,
}: {
  hiddenGraceMs?: number;
  onPause: () => void;
  onResume: (info: { wasPaused: boolean; hiddenMs: number }) => void;
}): () => void {
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let paused = !isTabVisible();
  let hiddenAt: number | null = paused ? Date.now() : null;
  let disposed = false;

  const clearGrace = () => {
    if (graceTimer !== null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
  };

  const onVisibility = () => {
    if (disposed) return;
    if (isTabVisible()) {
      clearGrace();
      const hiddenMs = hiddenAt !== null ? Date.now() - hiddenAt : 0;
      const wasPaused = paused;
      paused = false;
      hiddenAt = null;
      onResume({ wasPaused, hiddenMs });
    } else {
      if (hiddenAt === null) hiddenAt = Date.now();
      clearGrace();
      graceTimer = setTimeout(() => {
        graceTimer = null;
        if (!disposed && !isTabVisible() && !paused) {
          paused = true;
          onPause();
        }
      }, hiddenGraceMs);
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  return () => {
    disposed = true;
    clearGrace();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

/** Debounce simple con cancelación para agrupar escrituras/refrescos seguidos. */
export function createDebounced<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };
  wrapped.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return wrapped;
}
