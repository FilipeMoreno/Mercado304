import { format as dateFnsFormat, parseISO } from "date-fns";

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date local
 * sem problemas de timezone
 */
export function parseLocalDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  
  // Se já é um objeto Date, retorna como está
  if (dateString instanceof Date) return dateString;
  
  // Para strings no formato YYYY-MM-DD (input date), criar data local
  if (typeof dateString === 'string') {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // mês é 0-based
    }
    
    // Para outros formatos, tentar parseISO
    try {
      return parseISO(dateString);
    } catch {
      return new Date(dateString);
    }
  }
  
  return null;
}

/**
 * Converte uma Date para string no formato YYYY-MM-DD para inputs HTML
 */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!dateObj) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição, lidando corretamente com timezones
 */
export function formatLocalDate(date: Date | string | null | undefined, formatStr: string = "dd/MM/yyyy", options?: any): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!dateObj) return '';
  
  return dateFnsFormat(dateObj, formatStr, options);
}