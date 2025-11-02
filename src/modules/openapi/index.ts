import { Request } from "../../shared/interfaces";

function joinPaths(base: string, relative: string): string {
    const a = base.endsWith('/') ? base.slice(0, -1) : base;
    const b = relative.startsWith('/') ? relative.slice(1) : relative;

    if (a === '' || a === '/') {
        return `/${b}`;
    }

    return `${a}/${b}`;
}

export const getSwaggerPaths = async (openApiURL: string): Promise<Request[]> => {
    const response = await fetch(openApiURL);
    const data = await response.json();
    const paths = data.paths;
    const keys = Object.keys(paths);

    let basePath = '';

    if (data.servers && data.servers.length > 0) {
        try {
            const serverUrl = new URL(data.servers[0].url);
            basePath = serverUrl.pathname;
        } catch (e) {
            basePath = data.servers[0].url;
        }
    } else if (data.basePath) {
        basePath = data.basePath;
    }

    return keys.map((key) => {
        const methods = Object.keys(paths[key]);
        const fullUrl = joinPaths(basePath, key);

        return {
            method: methods,
            url: fullUrl
        }
    });
}