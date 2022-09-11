export {};

export function parseDataVersion(strDataVersion: string | null): number | null {
  if (!strDataVersion) {
    return null;
  }

  const dataVersion = parseInt(strDataVersion);
  if (Number.isNaN(dataVersion) || dataVersion < 210000 || dataVersion > 500000) {
    return null;
  }

  return dataVersion;
}

const VERSION_RE = new RegExp('(\\d{4}).(\\d{1,2}).(\\d{1,2})-(\\d{1,9})(?:-([^-]+))?');
export function parseAppVersion(
  versionName: string | null,
): { code: number; build: number | undefined; flavor: string | undefined } | null {
  if (!versionName) {
    return null;
  }

  const m = versionName.match(VERSION_RE);
  if (m === null || m.length < 6) {
    return null;
  }
  const yyyy = parseInt(m[1]);
  const mm = parseInt(m[2]);
  const dd = parseInt(m[3]);
  const build = Number.isNaN(parseInt(m[4])) ? undefined : parseInt(m[4]);
  const flavor = (m[5] !== undefined && m[5].toLowerCase()) || undefined;
  if (
    Number.isNaN(yyyy) ||
    yyyy > 2099 ||
    yyyy < 2022 ||
    Number.isNaN(mm) ||
    mm > 12 ||
    mm < 1 ||
    Number.isNaN(dd) ||
    dd > 31 ||
    dd < 1
  ) {
    return null;
  }
  const code = parseInt(String(yyyy % 100) + String(mm).padStart(2, '0') + String(dd).padStart(2, '0'));
  return {
    code: code,
    flavor: flavor,
    build: build,
  };
}
