export {};

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  switch (pathname) {
    case '/maps':       // Public for map files.
    case '/resources':  // Public for resources.
    case '/servers': {  // Private for map files.
      let servers;
      switch (request.cf?.continent) {
        case 'NA': // North America
          servers = [
            'https://cdn-us1.organicmaps.app/', // BackBlaze US-West + CF, unmetered
            'https://cdn-uk1.organicmaps.app/', // Mythic Beasts, 200TB
            'https://cdn-nl1.organicmaps.app/', // Mythic Beasts, 200TB
            'https://cdn.organicmaps.app/', // Hetzner BareMetal DE unmetered
          ];
          break;
        default:
          // Everything else
          servers = [
            'https://cdn-pl1.organicmaps.app/', // OVH PL, unmetered
            'https://cdn-fi1.organicmaps.app/', // Hetzner Cloud FI, 20TB
            'https://cdn-uk1.organicmaps.app/', // Mythic Beasts, 200TB
            'https://cdn-nl1.organicmaps.app/', // Mythic Beasts, 200TB
            'https://cdn-eu2.organicmaps.app/', // Hetzner Cloud DE, 20TB
            'https://cdn.organicmaps.app/', // Hetzner BareMetal DE unmetered
          ];
      }
      return new Response(JSON.stringify(servers), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response('', { status: 404 });
}
