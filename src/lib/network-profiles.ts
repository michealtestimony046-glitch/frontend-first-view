export const NETWORK_PROFILE_TYPES = ["FAST", "SLOW_3G", "OFFLINE"] as const;

export type NetworkProfileType = (typeof NETWORK_PROFILE_TYPES)[number];

export type NetworkProfileConditions = {
  offline: boolean;
  latency: number;
  downloadThroughput: number;
  uploadThroughput: number;
};

export type NetworkProfileDisplay = {
  label: string;
  shortLabel: string;
  tooltip: string;
  accessibilityText: string;
};

/** CDP expects throughput in bytes per second; 500 kbps is 62,500 B/s. */
export const NETWORK_PROFILE_CONDITIONS: Record<NetworkProfileType, NetworkProfileConditions> = {
  FAST: { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  SLOW_3G: { offline: false, latency: 400, downloadThroughput: 62_500, uploadThroughput: 62_500 },
  OFFLINE: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
};

export const NETWORK_PROFILE_DISPLAY: Record<NetworkProfileType, NetworkProfileDisplay> = {
  FAST: {
    label: "Fast (Wi-Fi / 4G)",
    shortLabel: "Fast",
    tooltip: "0ms added latency, Unthrottled",
    accessibilityText: "Fast (Wi-Fi / 4G), 0ms added latency, Unthrottled",
  },
  SLOW_3G: {
    label: "Slow 3G",
    shortLabel: "Slow 3G",
    tooltip: "400ms latency, 500 kbps down/up",
    accessibilityText: "Slow 3G, 400ms latency, 500 kbps down/up",
  },
  OFFLINE: {
    label: "Offline",
    shortLabel: "Offline",
    tooltip: "0 kbps, Severed connection",
    accessibilityText: "Offline, 0 kbps, Severed connection",
  },
};

export function isNetworkProfileType(value: unknown): value is NetworkProfileType {
  return typeof value === "string" && (NETWORK_PROFILE_TYPES as readonly string[]).includes(value);
}

export function parseNetworkProfile(value: unknown): NetworkProfileType {
  return isNetworkProfileType(value) ? value : "FAST";
}

export function networkProfileDisplay(value: unknown): NetworkProfileDisplay {
  return NETWORK_PROFILE_DISPLAY[parseNetworkProfile(value)];
}
