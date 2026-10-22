// Datas no horário de Brasília, o mesmo usado nos dados da Câmara.

const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

/** Converte um instante para "AAAA-MM-DDTHH:mm:ss" no horário de Brasília. */
export function toBrasiliaLocalDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Acrescenta segundos a "AAAA-MM-DDTHH:mm" para comparar com horários completos. */
export function withSeconds(localDateTime: string): string {
  return localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
}
