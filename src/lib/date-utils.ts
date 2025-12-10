import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para exibição relativa (ex: "há 2 horas")
 * Aceita Date, string ISO, ou timestamp do Firebase
 */
export function formatRelativeDate(date: Date | string | { seconds?: number; _seconds?: number } | undefined | null): string {
  if (!date) {
    return 'Data desconhecida';
  }

  let d: Date;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (typeof date === 'object') {
    // Firebase timestamps can come as { seconds } or { _seconds }
    const seconds = 'seconds' in date ? date.seconds : '_seconds' in date ? date._seconds : null;
    if (seconds) {
      d = new Date(seconds * 1000);
    } else {
      return 'Data desconhecida';
    }
  } else {
    return 'Data desconhecida';
  }

  if (isNaN(d.getTime())) {
    return 'Data desconhecida';
  }

  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}
