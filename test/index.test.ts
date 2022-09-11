import { describe, expect, test } from '@jest/globals';
import { handleRequest, SERVER } from '../src/index';

const URL = 'https://worker/servers';
const LAST_DATA_VERSION = SERVER.planet.dataVersions[SERVER.planet.dataVersions.length - 1];

describe('old versions', () => {
  test('no dataVersion', async () => {
    const req = new Request(URL);
    const result = await handleRequest(req);
    expect(result.status).toBe(200);
    expect(JSON.parse(await result.text())).toEqual([SERVER.backblaze.url]);
  });
  test('has dataVersion', async () => {
    const server = SERVER.fi1;
    let req = new Request(URL, {
      headers: {
        'X-OM-DataVersion': String(server.dataVersions[0]),
      },
    });
    const result = await handleRequest(req);
    expect(result.status).toBe(200);
    expect(JSON.parse(await result.text())).toContain(server.url);
  });
  test('default routing to planet', async () => {
    let req = new Request(URL, {
      headers: {
        'X-OM-DataVersion': '210000', // this version doesn't exist on servers
      },
    });
    const result = await handleRequest(req);
    expect(result.status).toBe(200);
    expect(JSON.parse(await result.text())).toEqual([SERVER.planet.url]);
  });
});
