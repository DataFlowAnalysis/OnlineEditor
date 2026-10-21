import { injectable } from "inversify";

@injectable()
export class URLParameters {
    private queryParameters: URLSearchParams;
    private routes: string[];

    constructor(url?: string) {
        const location = document.createElement("a");
        location.href = url || window.location.href;
        this.queryParameters = new URLSearchParams(location.search);
        this.routes = location.pathname.split("/");
    }

    public get(key: string): string | undefined {
        const queryResult = this.queryParameters.get(key);
        if (queryResult) {
            return queryResult;
        }
        const routeExists = this.routes.includes(key);
        return routeExists ? "true" : undefined;
    }

    public getBoolean(key: string) {
        return Boolean(this.get(key));
    }
}
