export class CalculatorTool {
  /**
   * Safely evaluates arithmetic expressions if query is purely mathematical
   */
  public evaluateIfMath(query: string): string | null {
    const trimmed = query.trim().toLowerCase();

    // Check if query looks like a direct math question (e.g. "what is 2 + 2", "calculate 15 * 8", "2^10")
    const mathMatch = trimmed.match(/^(?:what is|calculate|eval|compute|math|calc)?\s*([0-9\s\+\-\*\/\^\(\)\.\%\,\=\?]+)$/);
    if (!mathMatch) return null;

    const expression = mathMatch[1].replace(/[=\?]/g, '').trim();
    if (!expression || !/[0-9]/.test(expression)) return null;

    try {
      // Replace power operator
      const sanitized = expression.replace(/\^/g, '**').replace(/%/g, '/100');
      
      // Strict regex check before Function constructor for safety
      if (!/^[0-9\s\+\-\*\/\(\)\.\*]+$/.test(sanitized)) {
        return null;
      }

      // Safe arithmetic evaluation
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return `Exact Calculation: ${expression} = ${result}`;
      }
    } catch {
      // Not a valid math expression
    }

    return null;
  }
}

export const calculatorTool = new CalculatorTool();
