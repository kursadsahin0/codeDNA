export const themeStorageKey = "theme";

/** Runs before paint. Keep the branching aligned with resolveTheme() in theme.ts. */
export const themeInitScript = `(function(){try{var stored=localStorage.getItem(${JSON.stringify(themeStorageKey)});var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var theme=stored==="light"||stored==="dark"?stored:(dark?"dark":"light");var root=document.documentElement;root.classList.toggle("dark",theme==="dark");root.style.colorScheme=theme;}catch(e){}})();`;
