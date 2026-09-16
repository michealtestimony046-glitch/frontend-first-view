export const NETWORK_PROFILE_TYPES = ["FAST", "SLOW_3G", "OFFLINE"] as const;
export type NetworkProfileType = (typeof NETWORK_PROFILE_TYPES)[number];

export interface NetworkProfileDisplay {
  label: string;
  shortLabel: string;
  tooltip: string;
  accessibilityText: string;
}

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
  return typeof value === "string" && NETWORK_PROFILE_TYPES.includes(value as NetworkProfileType);
}

export function parseNetworkProfile(value: unknown): NetworkProfileType {
  if (value == null || value === "") return "FAST";
  if (isNetworkProfileType(value)) return value;
  return "FAST";
}

export function networkProfileDisplay(value: unknown): NetworkProfileDisplay {
  return NETWORK_PROFILE_DISPLAY[parseNetworkProfile(value)];
}
