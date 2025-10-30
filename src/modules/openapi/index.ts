export const getSwaggerPaths = async (openApiURL: string) => {
    const response = await fetch(openApiURL);
    const data = await response.json();
    const paths = data.paths;
    const keys = Object.keys(paths);
    const basePath = data.basePath ? data.basePath : data.servers[0].url;

    const swaggerPaths = keys.map((key) => {
        const methods = Object.keys(paths[key]);
        return {
            method: methods,
            url: `${basePath}${key}`
        }
    });

    return {
        basePath,
        paths: swaggerPaths
    }
}