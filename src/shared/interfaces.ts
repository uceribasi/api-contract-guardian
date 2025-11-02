export interface Request {
    url: string;
    method: string | string[];
    tool?: string;
    args?: any;
}