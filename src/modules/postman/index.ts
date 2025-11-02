import * as fs from 'fs';
import { Collection, Item } from 'postman-collection';
import { Request } from "../../shared/interfaces";

function joinPaths(base: string, relative: string): string {
    const a = base.endsWith('/') ? base.slice(0, -1) : base;
    const b = relative.startsWith('/') ? relative.slice(1) : relative;

    if (a === '' || a === '/') {
        return `/${b}`;
    }

    return `${a}/${b}`;
}

function getPathFromUrl(url: string): string {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        try {
            let fullUrl = url;
            if (url.startsWith('//')) {
                fullUrl = 'https:' + url;
            }
            const parsedUrl = new URL(fullUrl);
            return parsedUrl.pathname;
        } catch (e) {
            return '';
        }
    }

    return url;
}

export const getPostmanPaths = async (postmanPathOrUrl: string): Promise<Request[]> => {
    let jsonData;
    try {
        if (postmanPathOrUrl.startsWith('http://') || postmanPathOrUrl.startsWith('https://')) {
            const response = await fetch(postmanPathOrUrl);
            if (!response.ok) {
                throw new Error(`Data could not be retrieved from the Postman Collection URL: ${response.statusText}`);
            }
            jsonData = await response.json();
        } else {
            const fileContent = fs.readFileSync(postmanPathOrUrl, 'utf-8');
            jsonData = JSON.parse(fileContent);
        }
    } catch (e: any) {
        throw new Error(`Data could not be retrieved from the Postman Collection URL: ${e.message}`);
    }

    const myCollection = new Collection(jsonData);

    let basePath = '';
    const baseUrlVariable = myCollection.variables.all().find((v: any) => v.key === 'baseUrl');

    if (baseUrlVariable && baseUrlVariable.value) {
        basePath = getPathFromUrl(baseUrlVariable.value as string);
    }

    const pathsMap = new Map<string, Set<string>>();

    myCollection.forEachItem((item: Item) => {
        if (!item.request) return;

        const pathParts = item.request.url.path;
        const method = item.request.method.toLowerCase();

        if (!pathParts || !method) return;

        const relativePath = '/' + pathParts.map((segment) =>
            segment.startsWith(':') ? `{${segment.slice(1)}}` : segment
        ).join('/');

        const finalUrl = joinPaths(basePath, relativePath);

        if (!pathsMap.has(finalUrl)) {
            pathsMap.set(finalUrl, new Set<string>());
        }
        pathsMap.get(finalUrl)!.add(method);
    });

    const requests: Request[] = Array.from(pathsMap.entries()).map(([url, methodsSet]) => ({
        url: url,
        method: Array.from(methodsSet)
    }));

    return requests;
}