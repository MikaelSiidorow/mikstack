/**
 * Processes template markers in file contents.
 *
 * Variables: {{varName}} — replaced with values from the context.
 * Conditional blocks:
 *   // {{#if:featureName}}      — included when featureName is truthy
 *   // {{#if:!featureName}}     — included when featureName is falsy
 *   ...content...
 *   // {{/if:featureName}}
 *
 * Supports //, #, and <!-- --> comment styles for markers.
 */

export type TemplateContext = Record<string, string | boolean>;

const CONDITIONAL_BLOCK_RE =
  /^[^\S\n]*(?:\/\/|#|<!--)[^\S\n]*\{\{#if:(!?\w+)\}\}[^\S\n]*(?:-->)?[^\S\n]*\n([\s\S]*?)^[^\S\n]*(?:\/\/|#|<!--)[^\S\n]*\{\{\/if:\1\}\}[^\S\n]*(?:-->)?[^\S\n]*\n?/gm;

const VARIABLE_RE = /\{\{(\w+)\}\}/g;

export function renderTemplate(content: string, context: TemplateContext): string {
  // Process conditional blocks first
  let result = content.replace(CONDITIONAL_BLOCK_RE, (_match, name: string, body: string) => {
    const negated = name.startsWith("!");
    const key = negated ? name.slice(1) : name;
    const value = context[key];
    if (negated ? !value : value) return body;
    return "";
  });

  // Then replace variables
  result = result.replace(VARIABLE_RE, (_match, name: string) => {
    const value = context[name];
    if (value === undefined) {
      throw new Error(`Undefined template variable: {{${name}}}`);
    }
    return String(value);
  });

  return result;
}
