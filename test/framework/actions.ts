import * as request from 'supertest';

const API_HTTP_ADDRESS = 'http://localhost:3000';

/**
 * Makes a HTTP GET request.
 * @param input Specifies the route and the base URL that should be used to make
 *        the HTTP GET request.
 */
export async function apiGetRequestAsync(input: { route: string; baseURL?: string }): Promise<request.Response> {
    return request(input.baseURL || API_HTTP_ADDRESS).get(input.route);
}
