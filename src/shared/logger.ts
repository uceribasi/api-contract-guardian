type Level = "silent" | "info" | "verbose";

let level: Level = "info";

export const setLogLevel = (v: boolean, q: boolean) => {
    if (q) level = "silent";
    else if (v) level = "verbose";
    else level = "info";
};

export const log = (...args: any[]) => {
    if (level !== "silent") console.log(...args);
};

export const debug = (...args: any[]) => {
    if (level === "verbose") console.log(...args);
};

export const error = (...args: any[]) => {
    console.error(...args);
};

export const getLevel = () => level;
