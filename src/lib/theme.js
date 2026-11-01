import { createContext, useContext } from "react";

export function tokens(dark) {
  return {
    dark,
    app: dark ? "bg-background text-foreground" : "bg-slate-50 text-slate-800",
    panel: dark ? "bg-card/80 backdrop-blur-sm" : "bg-white",
    panelBorder: dark ? "border-border" : "border-slate-200",
    border: dark ? "border-border" : "border-slate-200",
    borderSubtle: dark ? "border-border/60" : "border-slate-100",
    divide: dark ? "divide-border" : "divide-slate-100",
    text: dark ? "text-foreground" : "text-slate-800",
    textDim: dark ? "text-muted-foreground" : "text-slate-500",
    textFaint: dark ? "text-muted-foreground/70" : "text-slate-400",
    column: dark ? "bg-card/50" : "bg-slate-100",
    card: dark ? "bg-card" : "bg-white",
    cardBorder: dark ? "border-border" : "border-slate-200",
    cardHover: dark ? "hover:bg-muted/70 hover:border-primary/40" : "hover:border-primary/40",
    rowHover: dark ? "hover:bg-muted/50" : "hover:bg-slate-50",
    input: dark
      ? "bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary/60"
      : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary",
    inputBare: dark ? "bg-muted border-border" : "bg-slate-100 border-transparent",
    chipIdle: dark ? "text-muted-foreground hover:bg-muted" : "text-slate-500 hover:bg-slate-100",
    navActive: dark
      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,92,92,0.18)]"
      : "bg-primary/10 text-primary border border-primary/30",
    navIdle: dark
      ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    groupLabel: dark ? "text-muted-foreground/60" : "text-slate-400",
    kbd: dark ? "bg-muted border-border text-muted-foreground" : "bg-slate-100 border-slate-300 text-slate-500",
  };
}
export const ThemeCtx = createContext({ dark: true });
export const useTheme = () => useContext(ThemeCtx);
