import { describe, expect, test } from '@jest/globals';
import { handleRequest, SERVER, DONATE_URL, DONATE_URL_RU } from '../src/index';

const URL = 'https://worker/servers';
const LAST_DATA_VERSION = SERVER.planet.dataVersions[SERVER.planet.dataVersions.length - 1];

// Note: CF lowercases all headers.
describe('X-OM-DataVersion', () => {
  test('no X-OM-DataVersion', async () => {
    const req = new Request(URL);
    const result = await handleRequest(req);
    expect(result.status).toBe(200);
    expect(JSON.parse(await result.text())).toEqual([SERVER.backblaze.url]);
  });

  test('has X-OM-DataVersion', async () => {
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

  test('Default routing to planet', async () => {
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

describe('X-OM-AppVersion DonateUrl', () => {
  test('Old versions without X-OM-AppVersion and old metaserver JSON format', async () => {
    const req = new Request(URL);
    const response = await handleRequest(req);
    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text())).toEqual([SERVER.backblaze.url]);
  });

  const server = SERVER.fi1;

  test('Newer metaserver JSON format with donates support', async () => {
    let req = new Request(URL, {
      headers: {
        'X-OM-AppVersion': '2022.08.23-1-Google',
        'X-OM-DataVersion': String(server.dataVersions[0]),
      },
    });
    const response = await handleRequest(req);
    expect(response.status).toBe(200);
    const result = JSON.parse(await response.text());
    expect(result.servers).toBeDefined();
    expect(result.servers.length).toBeGreaterThan(0);
    expect(result.servers).toContain(server.url);
    expect(result.settings).toBeDefined();
    expect(result.settings.DonateUrl).toBeDefined();
    expect(result.settings.DonateUrl).toEqual(DONATE_URL);
  });

  test('Newer metaserver JSON format with donates support', async () => {
    let req = new Request(URL, {
      headers: {
        'X-OM-AppVersion': '2022.08.23-1-Google',
        'X-OM-DataVersion': String(server.dataVersions[0]),
      },
      //@ts-ignore
      cf: { country: 'RU' },
    });
    const response = await handleRequest(req);
    expect(response.status).toBe(200);
    const result = JSON.parse(await response.text());
    expect(result.settings.DonateUrl).toBeDefined();
    expect(result.settings.DonateUrl).toEqual(DONATE_URL_RU);
  });

  test('Older iOS versions with X-OM-AppVersion but without donates', async () => {
    let req = new Request(URL, {
      headers: {
        'X-OM-AppVersion': '2022.11.20',
        'X-OM-DataVersion': String(server.dataVersions[0]),
      },
    });
    const response = await handleRequest(req);
    expect(response.status).toBe(200);
    const result = JSON.parse(await response.text());
    expect(result.settings).not.toBeDefined();
  });

  test('Newer iOS versions with donate menu support', async () => {
    let req = new Request(URL, {
      headers: {
        'X-OM-AppVersion': '2022.11.20-4-ios',
        'X-OM-DataVersion': String(server.dataVersions[0]),
      },
    });
    const response = await handleRequest(req);
    expect(response.status).toBe(200);
    const result = JSON.parse(await response.text());
    expect(result.settings.DonateUrl).toBeDefined();
    expect(result.settings.DonateUrl).toEqual(DONATE_URL);
  });
});
