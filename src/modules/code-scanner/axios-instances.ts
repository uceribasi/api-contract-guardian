import { SourceFile, SyntaxKind } from "ts-morph";

export type AxiosBaseMap = Map<string, string>; // api -> "https://.../v1"

export function collectAxiosBaseURLs(sourceFiles: SourceFile[]): AxiosBaseMap {
    const map: AxiosBaseMap = new Map();

    for (const sf of sourceFiles) {
        // const api = axios.create({ baseURL: "https://..." })
        const vars = sf.getVariableDeclarations();
        for (const v of vars) {
            const init = v.getInitializer();
            if (!init || !init.isKind(SyntaxKind.CallExpression)) continue;

            const call = init;
            const expr = call.getExpression();

            // axios.create(...)
            if (
                expr.isKind(SyntaxKind.PropertyAccessExpression) &&
                expr.getExpression().getText() === "axios" &&
                expr.getName() === "create"
            ) {
                const configArg = call.getArguments()[0];
                if (configArg && configArg.isKind(SyntaxKind.ObjectLiteralExpression)) {
                    const baseProp = configArg
                        .getProperties()
                        .find((p) => p.isKind(SyntaxKind.PropertyAssignment) && p.getName() === "baseURL");

                    const baseInit = (baseProp as any)?.getInitializer?.();
                    const base = baseInit?.getText?.().replace(/^['"`]|['"`]$/g, "");
                    if (base) {
                        map.set(v.getName(), base);
                    }
                }
            }
        }
    }

    return map;
}
