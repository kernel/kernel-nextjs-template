import type { HighlighterCore, ThemeRegistrationAny } from "shiki/core";

/**
 * Kernel syntax theme: charcoal canvas, beige text, kernel green for the parts
 * that carry the meaning. Code inherits its color from the closed brand palette
 * like everything else.
 */
const kernelTheme: ThemeRegistrationAny = {
  name: "kernel",
  type: "dark",
  colors: {
    "editor.background": "#212225",
    "editor.foreground": "#edeef0",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#60646c" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier"],
      settings: { foreground: "#81b300" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "variable.function",
      ],
      settings: { foreground: "#81b300" },
    },
    {
      scope: ["string", "string.template", "punctuation.definition.string"],
      settings: { foreground: "#e1dccf" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.other"],
      settings: { foreground: "#d0d2d9" },
    },
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#edeef0" },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#a3a7ad" },
    },
  ],
};

let highlighter: Promise<HighlighterCore> | null = null;

/**
 * Lazily build the highlighter once per page with only the javascript grammar,
 * so the editor bundle stays out of the first paint.
 */
export function getHighlighter() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, js] =
      await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
        import("shiki/langs/javascript.mjs"),
      ]);

    return createHighlighterCore({
      themes: [kernelTheme],
      langs: [js.default],
      engine: createJavaScriptRegexEngine(),
    });
  })();

  return highlighter;
}
