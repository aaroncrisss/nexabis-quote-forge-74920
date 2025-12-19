/**
 * Formato y validación de RUT chileno
 */

/**
 * Formatea un RUT chileno con el formato XX.XXX.XXX-X
 * @param value - RUT sin formato o parcialmente formateado
 * @returns RUT formateado
 */
export const formatRUT = (value: string): string => {
    // Eliminar todo excepto números y K
    const cleaned = value.replace(/[^0-9kK]/g, '');

    if (!cleaned) return '';

    // Separar cuerpo y dígito verificador
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();

    if (!body) return cleaned;

    // Formatear el cuerpo con puntos
    const formattedBody = body
        .split('')
        .reverse()
        .join('')
        .match(/.{1,3}/g)
        ?.join('.')
        .split('')
        .reverse()
        .join('') || body;

    // Retornar con guión antes del DV
    return `${formattedBody}-${dv}`;
};

/**
 * Limpia el formato del RUT para almacenamiento
 * @param rut - RUT formateado
 * @returns RUT sin formato (solo números y K)
 */
export const cleanRUT = (rut: string): string => {
    return rut.replace(/[^0-9kK]/g, '');
};

/**
 * Valida el formato básico de un RUT (no valida DV)
 * @param rut - RUT a validar
 * @returns true si el formato es válido
 */
export const isValidRUTFormat = (rut: string): boolean => {
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[0-9kK]$/;
    return rutRegex.test(rut);
};
