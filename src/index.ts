export {};

const SERVERS = ['https://cdn.organicmaps.app/'];

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request).catch((err) => new Response(err.stack, { status: 500 })));
});

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  switch (pathname) {
    case '/servers':
      return new Response(JSON.stringify(SERVERS), {
        headers: { 'Content-Type': 'application/json' },
      });
  }
  return new Response('', { status: 404 });
}
