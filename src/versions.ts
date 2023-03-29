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
// 2022.12.24-3-3f4ca43-Linux or 2022.12.24-3-3f4ca43-dirty-Linux for Linux
// 2022.12.24-3-3f4ca43-Darwin for Mac
const VERSION_RE =
  /(?<year>\d{4})\.(?<month>\d{1,2})\.(?<day>\d{1,2})(?:$|-(?<build>[0-9]+)(?:-[0-9a-f]+)?(?:-dirty)?-(?<flavor>[A-Za-z3264]+))/;
// Returns code like 221224 for both platforms, build and flavor for Android and newer iOS versions.
export function parseAppVersion(
  versionName: string | null,
): { code: number; build?: number; flavor?: string | undefined } | null {
  if (!versionName) {
    return null;
  }

  const m = versionName.match(VERSION_RE);
  if (m === null || m.length < 4 || !m.groups) {
    return null;
  }
  const yyyy = parseInt(m.groups.year);
  if (Number.isNaN(yyyy) || yyyy > 2099 || yyyy < 2022) {
    return null;
  }
  const mm = parseInt(m.groups.month);
  if (Number.isNaN(mm) || mm > 12 || mm < 1) {
    return null;
  }
  const dd = parseInt(m.groups.day);
  if (Number.isNaN(dd) || dd > 31 || dd < 1) {
    return null;
  }

  const code = parseInt(String(yyyy % 100) + String(mm).padStart(2, '0') + String(dd).padStart(2, '0'));
  // Older iOS versions without donate button.
  if (!m.groups.build) {
    return { code: code };
  }

  const buildNumber = parseInt(m.groups.build);
  const build = Number.isNaN(buildNumber) ? 0 : buildNumber;
  // 'ios' for iOS devices.
  const flavor = (m.groups.flavor !== undefined && m.groups.flavor.toLowerCase()) || undefined;

  return {
    code: code,
    flavor: flavor,
    build: build,
  };
}
