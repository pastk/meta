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

// 2022.11.20 for iOS versions released before November 21 (without donate menu)
// 2022.11.24-4-ios for newer iOS versions (with donate menu)
// 2022.12.24-10-Google for Android
const VERSION_RE = /(\d{4}).(\d{1,2}).(\d{1,2})(?:$|-(\d{1,9})(?:-([^-]+))?)/;
// Returns code like 221224 for both platforms, build and flavor for Android and newer iOS versions.
export function parseAppVersion(
  versionName: string | null,
): { code: number; build?: number; flavor?: string | undefined } | null {
  if (!versionName) {
    return null;
  }

  const m = versionName.match(VERSION_RE);
  if (m === null || m.length < 4) {
    return null;
  }
  const yyyy = parseInt(m[1]);
  if (Number.isNaN(yyyy) || yyyy > 2099 || yyyy < 2022) {
    return null;
  }
  const mm = parseInt(m[2]);
  if (Number.isNaN(mm) || mm > 12 || mm < 1) {
    return null;
  }
  const dd = parseInt(m[3]);
  if (Number.isNaN(dd) || dd > 31 || dd < 1) {
    return null;
  }

  const code = parseInt(String(yyyy % 100) + String(mm).padStart(2, '0') + String(dd).padStart(2, '0'));
  // Older iOS versions without donate button.
  if (m[4] === undefined) {
    return { code: code };
  }

  const buildNumber = parseInt(m[4]);
  const build = Number.isNaN(buildNumber) ? 0 : buildNumber;
  // 'ios' for iOS devices.
  const flavor = (m[5] !== undefined && m[5].toLowerCase()) || undefined;

  return {
    code: code,
    flavor: flavor,
    build: build,
  };
}
