/**
 * Utilidades para formateo de moneda chilena (CLP)
 */

/**
 * Formatea un número como moneda CLP con puntos de miles y símbolo $
 * @param value - Valor numérico o string a formatear
 * @param includeSymbol - Si debe incluir el símbolo $ (default: true)
 * @returns String formateado con puntos y símbolo (ej: $ 10.000)
 */
export const formatCurrency = (value: string | number, includeSymbol: boolean = true): string => {
    // Eliminar todo excepto números
    const cleaned = String(value).replace(/\D/g, '');

    if (!cleaned) return '';

    // Convertir a número y formatear con puntos de miles
    const number = parseInt(cleaned, 10);
    const formatted = number.toLocaleString('es-CL');

    return includeSymbol ? `$ ${formatted}` : formatted;
};

/**
 * Limpia el formato de moneda para obtener el número puro
 * @param formatted - String formateado
 * @returns Número sin formato
 */
export const parseCurrency = (formatted: string): number => {
    const cleaned = formatted.replace(/\D/g, '');
    return parseInt(cleaned, 10) || 0;
};

/**
 * Formatea para mostrar con símbolo de moneda
 * @param value - Valor a formatear
 * @param symbol - Símbolo de moneda (default: $)
 * @returns String formateado con símbolo
 */
export const formatCurrencyDisplay = (value: string | number, symbol: string = '$'): string => {
    const formatted = formatCurrency(value);
    return formatted ? `${symbol} ${formatted}` : '';
};
