
export const normalizeString = (str: string) : string => {
    const regex = /\{[^}]+\}/g;
    return str.replace(regex, "{var}");
}