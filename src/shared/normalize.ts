export const normalizeMethod = (m: string | undefined) =>
    (m || "get").toLowerCase();

export const stripQueryAndSlash = (p: string) => {
    const [noQuery] = p.split("?");
    if (!noQuery) return "/";
    const trimmed = noQuery.endsWith("/") && noQuery !== "/" ? noQuery.slice(0, -1) : noQuery;
    return trimmed || "/";
};

export const safeDecode = (p: string) => {
    try { return decodeURIComponent(p); } catch { return p; }
};

export const toPathOnly = (url: string) => {
    try {
        const u = new URL(url);
        return u.pathname;
    } catch {
        const qIdx = url.indexOf("?");
        const base = qIdx >= 0 ? url.slice(0, qIdx) : url;
        const slashIdx = base.indexOf("/");
        return slashIdx >= 0 ? base.slice(slashIdx) : base;
    }
};

export const normalizePath = (raw: string) =>
    stripQueryAndSlash(safeDecode(toPathOnly(raw)));
