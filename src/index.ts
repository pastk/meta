export {};

import { parseDataVersion, parseAppVersion } from './utils';

// TODO: Implement automated version checks from this metaserver script.
// It should check by cron if actual files are really available on all servers.
export const SERVER = {
  backblaze: {
    // BackBlaze + CloudFlare (US-West) unmetered.
    url: 'https://cdn-us1.organicmaps.app/',
    dataVersions: [
      210529, 210703, 210729, 210825, 211002, 211022, 211122, 220103, 220204, 220314, 220415, 220515, 220613, 220718,
      220816, 220912, 221029,
    ],
  },
  uk1: {
    // Mythic Beasts VPS (London, UK) 200TB/mo.
    url: 'https://cdn-uk1.organicmaps.app/',
    dataVersions: [220816, 220912, 221029],
  },
  nl1: {
    // // Mythic Beasts VPS (Amsterdam, NL) 200TB/mo.
    url: 'https://cdn-nl1.organicmaps.app/',
    dataVersions: [220816, 220912, 221029],
  },
  planet: {
    // Hetzner BareMetal (Falkenstein, Germany) unmetered
    url: 'https://cdn.organicmaps.app/',
    dataVersions: [
      220103, 220204, 220314, 220415, 220515, 220613, 220718, 220816, 220912, 221019 /* beta only */, 221029,
    ],
  },
  fi1: {
    // Hetzner Cloud (Helsinki, Finland), 20TB/mo
    url: 'https://cdn-fi1.organicmaps.app/',
    dataVersions: [220912, 221029],
  },
  de1: {
    // Hetzner Cloud (Falkenstein, Germany), 20TB/mo
    url: 'https://cdn-eu2.organicmaps.app/',
    dataVersions: [220912, 221029],
  },
  us2: {
    // Hetzner Cloud (Asburn, US East), 20TB/mo
    url: 'https://cdn-us2.organicmaps.app/',
    dataVersions: [220912, 221029],
  },
};

const DONATE_URL = 'https://organicmaps.app/donate/';
const DONATE_URL_RU = 'https://organicmaps.app/ru/donate/';

// Main entry point.
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

export async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  switch (pathname) {
    case '/maps': // Public for map files.
    case '/resources': // Public for resources.
    case '/servers': {
      // Private for map files.
      let servers;
      // Starting from 2021-09, our clients have 'X-OM-DataVersion' header with the value
      // of their current maps data version, for example, "211022" (October 22, 2021).
      // It is lowercased by Cloudflare.
      const dataVersion = parseDataVersion(request.headers.get('x-om-dataversion'));
      if (dataVersion === null) {
        // Older clients download from the archive.
        servers = [SERVER.backblaze];
      } else {
        switch (request.cf?.continent) {
          // See https://developers.cloudflare.com/firewall/cf-firewall-language/fields for a list of all continents.
          case 'NA': // North America
          case 'SA': // South America
          case 'OC': // Oceania
            servers = [SERVER.backblaze, SERVER.us2, SERVER.uk1, SERVER.nl1, SERVER.planet].filter((server) =>
              server.dataVersions.includes(dataVersion),
            );
            break;
          default:
            // Every other continent + Tor networks.
            servers = [SERVER.planet, SERVER.uk1, SERVER.nl1, SERVER.fi1, SERVER.de1].filter((server) =>
              server.dataVersions.includes(dataVersion),
            );
            // Only fallback to the archive in the US if nothing was found closer.
            if (servers.length == 0 && SERVER.backblaze.dataVersions.includes(dataVersion)) {
              servers = [SERVER.backblaze];
            }
        }
      }
      // Fallback to the planet with freshly generated/beta data.
      if (servers.length == 0) {
        servers = [SERVER.planet];
      }
      servers = servers.map((server) => server.url);

      // Header "X-OM-AppVersion: 2022.09.22-3-Google" (lowercased by CF) is supported from August 23, 2022.
      const appVersion = parseAppVersion(request.headers.get('x-om-appversion'));
      if (!appVersion) {
        // Old format for <220823
        return new Response(JSON.stringify(servers), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // New format for >=220823
      const response: {
        servers: string[];
        settings?: {
          DonateUrl?: string;
        };
      } = {
        servers: servers,
      };

      // Disable donates for Google reviewers for all google app versions AFTER this one.
      const lastApprovedAndReleasedGoogleAppVersionCode = 221102;
      let donatesEnabled = true;
      if (
        appVersion.flavor === 'google' &&
        ((request.cf?.asOrganization || '').toLowerCase().includes('google') ||
          appVersion.code > lastApprovedAndReleasedGoogleAppVersionCode)
      ) {
        donatesEnabled = false;
      }

      if (donatesEnabled) {
        // To count enabled donations.
        console.log('Donates enabled');
        if (request.cf?.country == 'RU') {
          response.settings = {
            DonateUrl: DONATE_URL_RU,
          };
        } else {
          response.settings = {
            DonateUrl: DONATE_URL,
          };
        }
      }

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response('', { status: 404 });
}
