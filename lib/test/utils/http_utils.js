"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpPostAsync = exports.httpGetAsync = exports.constructRoute = void 0;
const httpRequest = require("supertest");
const API_HTTP_ADDRESS = 'http://localhost:3000';
/**
 * Constructs a 0x-api route based on a proto route.
 * @param protoRoute The data that specifies a 0x-api route.
 */
function constructRoute(protoRoute) {
    const queryArray = protoRoute.queryParams ? Object.entries(protoRoute.queryParams) : [];
    if (!queryArray.length) {
        return protoRoute.baseRoute;
    }
    const stringifiedQueryParams = queryArray.map(([param, value]) => `${param}=${value}`).join('&');
    return `${protoRoute.baseRoute}?${stringifiedQueryParams}`;
}
exports.constructRoute = constructRoute;
/**
 * Makes a HTTP GET request.
 * @param input Specifies the route and the base URL that should be used to make
 *        the HTTP GET request.
 */
async function httpGetAsync(input) {
    return httpRequest(input.app || input.baseURL || API_HTTP_ADDRESS).get(input.route);
}
exports.httpGetAsync = httpGetAsync;
/**
 * Makes a HTTP POST request.
 * @param input Specifies the route and the base URL that should be used to make
 *        the HTTP POST request.
 */
async function httpPostAsync(input) {
    const request = httpRequest(input.app || input.baseURL || API_HTTP_ADDRESS)
        .post(input.route)
        .send(input.body);
    if (input.headers) {
        for (const [field, value] of Object.entries(input.headers)) {
            request.set(field, value);
        }
    }
    return request;
}
exports.httpPostAsync = httpPostAsync;
//# sourceMappingURL=http_utils.js.map