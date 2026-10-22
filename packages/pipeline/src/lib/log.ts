// Mensagens do pipeline no terminal (e no log do GitHub Actions).

export const log = {
  step(message: string) {
    console.log(`\n▸ ${message}`);
  },
  info(message: string) {
    console.log(`  ${message}`);
  },
  warn(message: string) {
    // Formato reconhecido pelo GitHub Actions como aviso.
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::${message}`);
    else console.warn(`  ⚠ ${message}`);
  },
};
