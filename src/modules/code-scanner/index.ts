import {
    Project,
    SyntaxKind,
    CallExpression,
    PropertyAccessExpression,
} from "ts-morph";
import { glob } from "glob";
import chalk from "chalk";
import { parseNodeValue, parseUrlArgument } from "./utils";
import { normalizeMethod, normalizePath } from "../../shared/normalize";
import { collectAxiosBaseURLs, AxiosBaseMap } from "./axios-instances";
import {log} from "../../shared/logger";

interface Request {
    args?: any;
    url: string;
    method: string;
    tool: string;
}

const logRequest = (requestType: string, url: string, tool: string) => {
    const t = requestType.toLowerCase();
    const palette: Record<string, (s: string) => string> = {
        get: chalk.blue,
        post: chalk.yellow,
        put: chalk.cyan,
        delete: chalk.red,
        patch: chalk.magenta,
    };
    const paint = palette[t] || chalk;
    log(paint(`Called ${t.toUpperCase()} request with ${tool} for --> ${url}`));
};

function buildAbsoluteLike(base: string | undefined, pathOrUrl: string): string {
    if (!base) return pathOrUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    if (base.endsWith("/") && pathOrUrl.startsWith("/")) return base + pathOrUrl.slice(1);
    if (!base.endsWith("/") && !pathOrUrl.startsWith("/")) return base + "/" + pathOrUrl;
    return base + pathOrUrl;
}

const findRequestsWithFetch = (callExpression: CallExpression, basePath: string): Request | null => {
    const expression = callExpression.getExpression();

    if (expression.isKind(SyntaxKind.Identifier)) {
        if (expression.getText() !== "fetch") return null;
    }
    else if (expression.isKind(SyntaxKind.PropertyAccessExpression)) {
        const objText = expression.getExpression().getText();
        const prop = expression.getName();
        const allowedObjs = new Set(["window", "globalThis", "self"]);
        if (prop !== "fetch" || !allowedObjs.has(objText)) return null;
    }
    else {
        return null;
    }

    const [urlArg, optsArg] = callExpression.getArguments();
    const rawUrl = parseUrlArgument(urlArg);
    if (!rawUrl) return null;

    const optionsObject = parseNodeValue(optsArg);
    const method = normalizeMethod(
        optionsObject && typeof optionsObject === "object" && !Array.isArray(optionsObject) && (optionsObject as any).method
            ? String((optionsObject as any).method)
            : "get"
    );

    const normalizedPath = normalizePath(rawUrl);
    let path = rawUrl;
    if (normalizedPath.includes(basePath)) {
        path = normalizedPath;
    } else {
        if (normalizedPath.startsWith('/') && basePath.endsWith('/')) {
            path = `${basePath.slice(0, basePath.length - 1)}${normalizedPath}`;
        } else {
            path = `${basePath}${normalizedPath}`;
        }
    }


    logRequest(method, path, expression.getKindName() === "PropertyAccessExpression" ? "fetch(qualified)" : "fetch");

    return {
        method,
        url: path,
        tool: "fetch",
        ...(optionsObject ? { args: optionsObject } : {}),
    };
};

const HTTP_METHODS = new Set([
    "get", "post", "put", "delete", "patch", "head", "options"
]);

const findRequestsWithAxios = (
    callExpression: CallExpression,
    baseMap: AxiosBaseMap,
    basePath: string,
): Request | null => {
    const expression = callExpression.getExpression();
    if (!expression.isKind(SyntaxKind.PropertyAccessExpression)) return null;

    const propAccess = expression as PropertyAccessExpression;
    const callee = propAccess.getExpression();
    const methodName = propAccess.getName();

    if (!callee.isKind(SyntaxKind.Identifier)) return null;
    const calleeName = callee.getText();

    const isAxios = calleeName === "axios";
    const isAxiosInstance = baseMap.has(calleeName);
    if (!isAxios && !isAxiosInstance) return null;

    const methodLower = methodName.toLowerCase();
    if (!HTTP_METHODS.has(methodLower)) return null;

    const [urlArg, optsArg] = callExpression.getArguments();
    const rawUrl = parseUrlArgument(urlArg);
    if (!rawUrl) return null;

    const base = isAxiosInstance ? baseMap.get(calleeName) : undefined;
    const absoluteLike = buildAbsoluteLike(base, rawUrl);
    const normalizedPath = normalizePath(absoluteLike);
    let path = "";
    if (normalizedPath.includes(basePath)) {
        path = normalizedPath;
    } else {
        if (normalizedPath.startsWith('/') && basePath.endsWith('/')) {
            path = `${basePath.slice(0, basePath.length - 1)}${normalizedPath}`;
        } else {
            path = `${basePath}${normalizedPath}`;
        }
    }
    const args = parseNodeValue(optsArg);

    logRequest(methodLower, path, isAxiosInstance ? `axios(${calleeName})` : "axios");
    return { method: methodLower, url: path, tool: "axios", ...(args ? { args } : {}) };
};

export const scanCode = async (basePath: string, globPath: string): Promise<Request[]> => {
    const project = new Project({ compilerOptions: { allowJs: true } });
    const files = await glob(globPath, {
        dot: true,
        ignore: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '.next/**',
            '.git/**',
            '.idea/**'
        ]
    });
    project.addSourceFilesAtPaths(files);

    const sources = project.getSourceFiles();
    const baseMap = collectAxiosBaseURLs(sources);

    const found: Request[] = [];
    for (const sf of sources) {
        const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of calls) {
            const a = findRequestsWithAxios(call, baseMap, basePath);
            if (a) found.push(a);
            const f = findRequestsWithFetch(call, basePath);
            if (f) found.push(f);
        }
    }

    return found;
};
