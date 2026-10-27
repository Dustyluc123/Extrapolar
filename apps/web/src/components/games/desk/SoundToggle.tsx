// Botão de som da mesa: desligado por padrão; a escolha fica neste navegador.
import { setSoundEnabled, useSoundEnabled } from "../../../lib/games/sound";

export function SoundToggle() {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      className="desk-sound"
      aria-pressed={on}
      onClick={() => setSoundEnabled(!on)}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
        {on ? (
          <path
            d="M13 7.2a4 4 0 0 1 0 5.6M15.2 5a7 7 0 0 1 0 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M13 7.5l5 5m0-5l-5 5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
      <span>
        Som<span aria-hidden="true">: {on ? "ligado" : "desligado"}</span>
      </span>
    </button>
  );
}
