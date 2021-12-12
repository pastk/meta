export { };

const SERVER = {
  backblaze: 'https://cdn-us1.organicmaps.app/', // BackBlaze + CloudFlare (US-West) unmetered.
  uk1: 'https://cdn-uk1.organicmaps.app/',       // Mythic Beasts VPS (London, UK) 200TB/mo.
  nl1: 'https://cdn-nl1.organicmaps.app/',       // Mythic Beasts VPS (Amsterdam, NL) 200TB/mo.
  planet: 'https://cdn.organicmaps.app/',        // Hetzner BareMetal (Falkenstein, Germany) unmetered
  fi1: 'https://cdn-fi1.organicmaps.app/',       // Hetzner Cloud (Helsinki, Finland), 20TB/mo
  de1: 'https://cdn-eu2.organicmaps.app/',       // Hetzner Cloud (Falkenstein, Germany), 20TB/mo
  us2: 'https://cdn-us2.organicmaps.app/',       // Hetzner Cloud (Asburn, US East), 20TB/mo
 
};

// Main entry point.
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

// Starting from September release, our clients have 'X-OM-DataVersion' header with the value
// of their current maps data version, for example, "211022" (October 22, 2021).
// It is lowercased by Cloudflare.
// Returns 0 if data version is absent or invalid, or a valid integer version.
function extractDataVersion(request: Request): Number {
  const strDataVersion = request.headers.get('x-om-dataversion');
  if (strDataVersion) {
    const dataVersion = parseInt(strDataVersion);
    if (!Number.isNaN(dataVersion) && dataVersion >= 210000 && dataVersion <= 500000)
      return dataVersion;
  }
  return 0;
}

// TODO: Implement automated version checks from this metaserver script.
// It should check by cron if actual files are really available on all servers.
const LAST_AVAILABLE_VERSION = 211002;
const BEFORE_LAST_AVAILABLE_VERSION = 211022;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  switch (pathname) {
    case '/maps':       // Public for map files.
    case '/resources':  // Public for resources.
    case '/servers': {  // Private for map files.
      let servers;
      const dataVersion = extractDataVersion(request);
      if (dataVersion < LAST_AVAILABLE_VERSION) {
        // Old maps versions are available only on BackBlaze.
        servers = [SERVER.backblaze];
      } else if (dataVersion < BEFORE_LAST_AVAILABLE_VERSION) {
        // Some servers have one additional version available.
        servers = [SERVER.uk1, SERVER.nl1, SERVER.backblaze];
      } else switch (request.cf?.continent) {
        // See https://developers.cloudflare.com/firewall/cf-firewall-language/fields for a list of all continents.
        case 'NA': // North America
        case 'SA': // South America
        case 'OC': // Oceania
          servers = [SERVER.backblaze, SERVER.us2, SERVER.uk1, SERVER.nl1, SERVER.planet];
          break;
        default: // Every other continent + Tor networks.
          servers = [SERVER.planet, SERVER.uk1, SERVER.nl1, SERVER.fi1, SERVER.de1];
      }
      return new Response(JSON.stringify(servers), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response('', { status: 404 });
}
