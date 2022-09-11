export {};

// TODO: Implement automated version checks from this metaserver script.
// It should check by cron if actual files are really available on all servers.
const SERVER = {
  backblaze: {
    // BackBlaze + CloudFlare (US-West) unmetered.
    url: 'https://cdn-us1.organicmaps.app/',
    dataVersions: [
      210529, 210703, 210729, 210825, 211002, 211022, 211122, 220103, 220204, 220314, 220415, 220515, 220613, 220718,
      220816,
    ],
  },
  uk1: {
    // Mythic Beasts VPS (London, UK) 200TB/mo.
    url: 'https://cdn-uk1.organicmaps.app/',
    dataVersions: [220613, 220718, 220816],
  },
  nl1: {
    // // Mythic Beasts VPS (Amsterdam, NL) 200TB/mo.
    url: 'https://cdn-nl1.organicmaps.app/',
    dataVersions: [220613, 220718, 220816],
  },
  planet: {
    // Hetzner BareMetal (Falkenstein, Germany) unmetered
    url: 'https://cdn.organicmaps.app/',
    dataVersions: [220103, 220204, 220314, 220415, 220515, 220613, 220718, 220816],
  },
  fi1: {
    // Hetzner Cloud (Helsinki, Finland), 20TB/mo
    url: 'https://cdn-fi1.organicmaps.app/',
    dataVersions: [220718, 220816],
  },
  de1: {
    // Hetzner Cloud (Falkenstein, Germany), 20TB/mo
    url: 'https://cdn-eu2.organicmaps.app/',
    dataVersions: [220718, 220816],
  },
  us2: {
    // Hetzner Cloud (Asburn, US East), 20TB/mo
    url: 'https://cdn-us2.organicmaps.app/',
    dataVersions: [220718, 220816],
  },
};

// Main entry point.
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

// Starting from September release, our clients have 'X-OM-DataVersion' header with the value
// of their current maps data version, for example, "211022" (October 22, 2021).
// It is lowercased by Cloudflare.
// Returns 0 if data version is absent or invalid, or a valid integer version.
function extractDataVersion(request: Request): number {
  const strDataVersion = request.headers.get('x-om-dataversion');
  if (strDataVersion) {
    const dataVersion = parseInt(strDataVersion);
    if (!Number.isNaN(dataVersion) && dataVersion >= 210000 && dataVersion <= 500000) {
      return dataVersion;
    }
  }
  return 0;
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  switch (pathname) {
    case '/maps': // Public for map files.
    case '/resources': // Public for resources.
    case '/servers': {
      // Private for map files.
      let servers;
      const dataVersion = extractDataVersion(request);
      if (dataVersion == 0) {
        servers = [SERVER.backblaze];
      } else
        switch (request.cf?.continent) {
          // See https://developers.cloudflare.com/firewall/cf-firewall-language/fields for a list of all continents.
          case 'NA': // North America
          case 'SA': // South America
          case 'OC': // Oceania
            servers = [SERVER.backblaze, SERVER.us2, SERVER.uk1, SERVER.nl1, SERVER.planet].filter((server) =>
              server.dataVersions.includes(dataVersion),
            );
            if (servers.length == 0) {
              servers = [SERVER.planet];
            }
            break;
          default:
            // Every other continent + Tor networks.
            servers = [SERVER.planet, SERVER.uk1, SERVER.nl1, SERVER.fi1, SERVER.de1].filter((server) =>
              server.dataVersions.includes(dataVersion),
            );
            if (servers.length == 0) {
              if (SERVER.backblaze.dataVersions.includes(dataVersion)) {
                servers = [SERVER.backblaze];
              } else {
                servers = [SERVER.planet];
              }
            }
        }

      const response = servers.map((server) => server.url);
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response('', { status: 404 });
}
