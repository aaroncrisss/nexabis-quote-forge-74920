/**
 * Format a number as currency string
 * CLP: $ 1.234.567 (no decimals, dot as thousands separator)
 * USD: $ 1,234.57 (2 decimals, comma as thousands separator)
 */
export function formatCurrency(value: number, currency: string = "CLP"): string {
    if (isNaN(value) || value === null || value === undefined) return "$ 0";

    const rounded = currency === "CLP" ? Math.round(value) : value;

    if (currency === "USD") {
        return "$ " + rounded.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // CLP: Chilean format with dots
    return "$ " + rounded.toLocaleString("es-CL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

/**
 * Parse a currency input string back to a number
 * Handles "1.234.567", "1,234.57", "$1234", etc.
 */
export function parseCurrencyInput(value: string): number {
    if (!value) return 0;
    // Remove currency symbols, spaces, and non-numeric chars except dots and commas
    const cleaned = value.replace(/[^0-9.,\-]/g, "");

    // If it has both dots and commas, determine which is the decimal separator
    if (cleaned.includes(",") && cleaned.includes(".")) {
        // If comma comes last, it's the decimal separator (e.g., "1.234,56")
        if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
            return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
        }
        // If dot comes last, it's the decimal separator (e.g., "1,234.56")
        return parseFloat(cleaned.replace(/,/g, "")) || 0;
    }

    // Only dots: if there are multiple, they're thousands separators
    if (cleaned.includes(".")) {
        const parts = cleaned.split(".");
        if (parts.length > 2) {
            // Multiple dots = thousands separator e.g., "1.234.567"
            return parseFloat(cleaned.replace(/\./g, "")) || 0;
        }
        // Single dot could be decimal
        return parseFloat(cleaned) || 0;
    }

    // Only commas: treat as thousands separator
    if (cleaned.includes(",")) {
        return parseFloat(cleaned.replace(/,/g, "")) || 0;
    }

    return parseFloat(cleaned) || 0;
}

/**
 * Format a number input on blur for display
 */
export function formatNumberInput(value: string | number, currency: string = "CLP"): string {
    const num = typeof value === "string" ? parseCurrencyInput(value) : value;
    if (num === 0 && typeof value === "string" && value === "") return "";
    return formatCurrency(num, currency);
}
