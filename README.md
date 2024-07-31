# Metaserver to monitor map nodes and serve them to clients

[![Deploy master to Production](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/organicmaps/meta)

## Requirements

Install CloudFlare's wrangler and other dev dependencies using npm:

```bash
npm i
```

## Development

Use `npx wrangler dev` for localhost development and for testing using Cloudflare dev tools.

## Update node dependencies to their major versions

```bash
npm run upgrade
```

## Preview on workers.dev

Use `npx wrangler publish` to open and test deployed worker in browser at https://meta-dev.omaps.workers.dev

## Monitor Worker logs

For dev: `npx wrangler tail [--format json]`

For production: `npx wrangler tail --env prod [--format json]`
or
`npm run logs`

## Deployment

All pushes to master automatically deploy prod version to https://meta.omaps.workers.dev/ and https://meta.omaps.app/

Deploy to prod manually using `npx wrangler publish --env prod` or this
[action](https://github.com/organicmaps/meta/actions/workflows/deploy-master-to-prod.yml).

Deploy to test dev version live at https://meta-dev.omaps.workers.dev/ manually using `npx wrangler publish`.

## Known issues

- Cloudflare's free Flexible SSL certificates do not support 4-th level
  subdomains like a.b.example.com, so you can see strange SSL errors.
- HTTPS `fetch` requests from Workers are converted to HTTP ones if the target
  host is in the same Cloudflare zone, see [here](https://community.cloudflare.com/t/does-cloudflare-worker-allow-secure-https-connection-to-fetch-even-on-flexible-ssl/68051/12)
  for more details.
