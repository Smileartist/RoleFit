/**
 * Safely parse JSON from AI responses.
 * Handles truncated strings, markdown code fences, trailing commas, etc.
 */
export function safeJsonParse(text, fallback = null) {
  if (!text || typeof text !== 'string') return fallback;

  // 1. Strip markdown code fences (```json ... ```)
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 3. Try to extract JSON object/array from text
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {}

    // 4. Try fixing common issues: trailing commas, unterminated strings
    let fixable = jsonMatch[1];
    // Remove trailing commas before } or ]
    fixable = fixable.replace(/,\s*([}\]])/g, '$1');
    // Try to close unterminated strings by adding missing quotes + brackets
    const openBraces = (fixable.match(/{/g) || []).length;
    const closeBraces = (fixable.match(/}/g) || []).length;
    const openBrackets = (fixable.match(/\[/g) || []).length;
    const closeBrackets = (fixable.match(/\]/g) || []).length;

    // Close any unterminated string
    if (fixable.match(/:\s*"[^"]*$/m)) {
      fixable += '"';
    }
    // Close missing brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixable += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixable += '}';
    // Remove trailing commas again
    fixable = fixable.replace(/,\s*([}\]])/g, '$1');

    try {
      return JSON.parse(fixable);
    } catch {}
  }

  // 5. Return fallback
  return fallback;
}
