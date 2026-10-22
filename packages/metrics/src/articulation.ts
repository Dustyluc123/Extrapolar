// Articulação e perfil (Caderno 7): funções puras.

export interface FrontMembership {
  frontId: number;
  /** Título no arquivo oficial ("Membro", "Coordenador"; às vezes "Coordernador"). */
  role: string;
}

export interface FrontsSummary {
  total: number;
  /** Frentes em que é coordenador. */
  coordinated: number[];
  /** Todas as frentes (ids, sem repetição, em ordem). */
  all: number[];
}

/** Coordenador, inclusive com a grafia "Coordernador" encontrada no arquivo oficial. */
export function isCoordinatorRole(role: string): boolean {
  return /^coorde(r)?nador/i.test(role.trim());
}

export function summarizeFronts(memberships: readonly FrontMembership[]): FrontsSummary {
  const all = [...new Set(memberships.map((m) => m.frontId))].sort((a, b) => a - b);
  const coordinated = [
    ...new Set(memberships.filter((m) => isCoordinatorRole(m.role)).map((m) => m.frontId)),
  ].sort((a, b) => a - b);
  return { total: all.length, coordinated, all };
}

export interface DatedRole {
  /** AAAA-MM-DD */
  start: string;
  /** AAAA-MM-DD ou null (em andamento). */
  end: string | null;
}

/** Cargos que se sobrepõem ao período [from, to] (AAAA-MM-DD), em ordem de início. */
export function rolesInPeriod<T extends DatedRole>(
  roles: readonly T[],
  from: string,
  to: string,
): T[] {
  return roles
    .filter((r) => r.start <= to && (r.end === null || r.end >= from))
    .sort((a, b) => a.start.localeCompare(b.start));
}
