import { parseDataVersion, parseAppVersion } from './versions';

// TODO: Implement automated version checks from this metaserver script.
// It should check by cron if actual files are really available on all servers.
export const SERVER = {
  backblaze: {
    // BackBlaze + CloudFlare (US-West) unmetered.
    url: 'https://cdn-us1.organicmaps.app/',
    dataVersions: [
      210529, 210703, 210729, 210825, 211002, 211022, 211122, 220103, 220204, 220314, 220415, 220515, 220613, 220718,
      220816, 220912, 221029, 221119, 221216, 230121, 230210, 230227, 230329, 230503, 230602, 230710, 230814, 230920,
      231113, 231213, 240105, 240202, 240228,
    ],
  },
  uk1: {
    // Mythic Beasts VPS (London, UK) 200TB/mo.
    url: 'https://cdn-uk1.organicmaps.app/',
    dataVersions: [240105, 240202, 240228],
  },
  nl1: {
    // // Mythic Beasts VPS (Amsterdam, NL) 200TB/mo.
    url: 'https://cdn-nl1.organicmaps.app/',
    dataVersions: [240105, 240202, 240228],
  },
  planet: {
    // Hetzner BareMetal (Falkenstein, Germany) unmetered
    url: 'https://cdn.organicmaps.app/',
    dataVersions: [
      220103, 220204, 220314, 220415, 220515, 220613, 220718, 220816, 220912, 221029, 221119, 221216, 230121, 230210,
      230227, 230329, 230503, 230602, 230710, 230814, 230920, 231113, 231213, 240105, 240202, 240228,
    ],
  },
  beta: {
    // Alias of the planet above that is proxied via CF and with enabled /maps/ *.mwm caching,
    // to speed-up downloads for beta testers.
    url: 'https://cdn-beta.organicmaps.app/',
    // Can have any non-publicly available maps data version.
    dataVersions: [],
  },
  fi1: {
    // Hetzner Cloud (Helsinki, Finland), 20TB/mo
    url: 'https://cdn-fi1.organicmaps.app/',
    dataVersions: [240202, 240228],
  },
  de1: {
    // Hetzner Cloud (Falkenstein, Germany), 20TB/mo
    url: 'https://cdn-eu2.organicmaps.app/',
    dataVersions: [240202, 240228],
  },
  de2: {
    // Hetzner Cloud (Falkenstein, Germany), 20TB/mo
    url: 'https://cdn-de2.organicmaps.app/',
    dataVersions: [240105, 240202, 240228],
  },
  us2: {
    // Hetzner Cloud (Asburn, US East), 20TB/mo
    url: 'https://cdn-us2.organicmaps.app/',
    dataVersions: [240202, 240228],
  },
};

// Exported for tests.
export const DONATE_URL = 'https://organicmaps.app/donate/';
export const DONATE_URL_RU = 'https://donate.organicmaps.ru/';

export async function getServersList(request: Request) {
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore workarounds error TS2339: Property 'continent' does not exist on type 'IncomingRequestCfProperties<unknown>'.
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
        servers = [SERVER.planet, SERVER.uk1, SERVER.nl1, SERVER.fi1, SERVER.de1, SERVER.de2].filter((server) =>
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
    servers = [SERVER.beta, SERVER.planet];
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
      NY?: string;
    };
  } = {
    servers: servers,
  };

  // Disable donates for reviewers for all app versions AFTER this one.
  const lastApprovedAndReleasedGoogleAppVersionCode = 240301;
  const lastApprovedAndReleasediOSAppVersionCode = 240227;
  let donatesEnabled = true;
  if (
    appVersion.flavor === 'google' &&
    ((typeof request.cf?.asOrganization === 'string' && request.cf?.asOrganization.toLowerCase().includes('google')) ||
      appVersion.code > lastApprovedAndReleasedGoogleAppVersionCode)
  ) {
    donatesEnabled = false;
  } else if (appVersion.build === undefined) {
    // Disable donates for older iOS versions without donates menu support.
    donatesEnabled = false;
  } else if (
    appVersion.flavor === 'ios' &&
    ((typeof request.cf?.asOrganization === 'string' && request.cf?.asOrganization.toLowerCase().includes('apple')) ||
      appVersion.code > lastApprovedAndReleasediOSAppVersionCode)
  ) {
    donatesEnabled = false;
  }

  if (donatesEnabled) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore workarounds error TS2339: Property 'country' does not exist on type 'IncomingRequestCfProperties<unknown>'.
    if (request.cf?.country == 'RU') {
      response.settings = {
        DonateUrl: DONATE_URL_RU,
        NY: 'false', // Must be `string` instead of `bool`, otherwise clients will crash
      };
    } else {
      response.settings = {
        DonateUrl: DONATE_URL,
        NY: 'false', // Must be `string` instead of `bool`, otherwise clients will crash
      };
    }
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
