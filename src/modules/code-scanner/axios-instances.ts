import { SourceFile, SyntaxKind } from "ts-morph";
import {resolveStringFromNode} from "../../shared/resolve-url";

export type AxiosBaseMap = Map<string, string>;

export function collectAxiosBaseURLs(sourceFiles: SourceFile[]): AxiosBaseMap {
    const map: AxiosBaseMap = new Map();

    for (const sf of sourceFiles) {
        const vars = sf.getVariableDeclarations();
        for (const v of vars) {
            const init = v.getInitializer();
            if (!init || !init.isKind(SyntaxKind.CallExpression)) continue;

            const call = init;
            const expr = call.getExpression();

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
                    const base = resolveStringFromNode(baseInit);
                    if (base) {
                        map.set(v.getName(), base);
                    }
                }
            }
        }
    }

    return map;
}
