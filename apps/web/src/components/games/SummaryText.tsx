// Texto de um resumo em linguagem simples, com os links do glossário (`[termo](/glossario#slug)`).
// Os slugs são conferidos no build (lib/games/data.ts): termo inexistente quebra o build.
import { splitGlossaryLinks } from "@extrapolar/shared/glossary-links";

export function SummaryText({ text }: { text: string }) {
  return (
    <>
      {splitGlossaryLinks(text).map((part, i) =>
        part.glossary ? (
          <a
            key={i}
            href={`/glossario#${part.glossary}`}
            className="decoration-accent decoration-dotted decoration-2 underline-offset-4"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
