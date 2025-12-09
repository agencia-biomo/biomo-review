import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para exibição relativa (ex: "há 2 horas")
 * Aceita Date, string ISO, ou timestamp do Firebase
 */
export function formatRelativeDate(date: Date | string | { seconds: number } | undefined | null): string {
  if (!date) {
    return 'Data desconhecida';
  }

  let d: Date;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (typeof date === 'object' && 'seconds' in date) {
    d = new Date(date.seconds * 1000);
  } else {
    return 'Data desconhecida';
  }

  if (isNaN(d.getTime())) {
    return 'Data desconhecida';
  }

  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}
