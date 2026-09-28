export type Risk = "low" | "medium" | "high";

export interface Classification {
  type: string;
  risk: Risk;
  blurb: string;
  icon: string;
}

export interface DetectedDevice {
  id: string;
  name: string;
  rssi: number | null;
  uuids: string[];
  lastSeen: number;
  count: number;
}

const RULES: Array<{ match: RegExp; result: Classification }> = [
  {
    match: /airtag|find ?my|smart ?tag/i,
    result: { type: "Location Tracker", risk: "high", icon: "crosshair", blurb: "Find My / SmartTag network beacon — can report its position back to its owner." },
  },
  {
    match: /tile|chipolo|pebblebee|eufy.*tag/i,
    result: { type: "Bluetooth Tracker", risk: "high", icon: "crosshair", blurb: "Crowd-sourced Bluetooth item tracker." },
  },
  {
    match: /cam|ipc|wyze|ring|blink|arlo|ezviz|tapo|reolink|hikvision|dahua|nvr/i,
    result: { type: "Camera / Video Device", risk: "medium", icon: "camera", blurb: "Signature matches known consumer camera brands — visually inspect the area." },
  },
  {
    match: /airpods|buds|beats|sony|bose|jbl|soundcore|earbuds|headset|momentum/i,
    result: { type: "Audio Device", risk: "low", icon: "headphones", blurb: "Wireless headphones or earbuds advertising for pairing." },
  },
  {
    match: /watch|band|fitbit|garmin|amazfit|mi band|whoop|oura|coros/i,
    result: { type: "Wearable", risk: "low", icon: "watch", blurb: "Smartwatch or fitness band worn by someone in range." },
  },
  {
    match: /echo|alexa|homepod|nest|sonos|home mini|speaker/i,
    result: { type: "Smart Speaker / Hub", risk: "low", icon: "speaker", blurb: "Voice-assistant speaker or smart-home hub." },
  },
  {
    match: /roku|chromecast|fire ?tv|apple ?tv|bravia|webos|shield/i,
    result: { type: "TV / Media Streamer", risk: "low", icon: "tv", blurb: "Television or streaming stick broadcasting for remotes." },
  },
  {
    match: /iphone|galaxy|pixel|huawei|xiaomi|oneplus|redmi|oppo|vivo/i,
    result: { type: "Smartphone", risk: "medium", icon: "smartphone", blurb: "A phone actively advertising over BLE." },
  },
  {
    match: /lock|august|yale|schlage|switchbot|aqara|hue|lifx|tuya|shelly|govee|meross/i,
    result: { type: "Smart-Home Device", risk: "medium", icon: "home", blurb: "Connected lock, bulb, or sensor from a local smart-home setup." },
  },
  {
    match: /macbook|ipad|imac|windows|logitech|mx |keyboard|mouse|trackpad|surface/i,
    result: { type: "Computer / Peripheral", risk: "low", icon: "laptop", blurb: "Computer or wireless peripheral in pairing range." },
  },
  {
    match: /tesla|bmw|mercedes|audi|toyota|ford|hyundai|kia|rivian/i,
    result: { type: "Vehicle", risk: "low", icon: "car", blurb: "Vehicle keyless-entry or infotainment beacon." },
  },
];

export function classifyDevice(name: string): Classification {
  for (const rule of RULES) {
    if (rule.match.test(name)) return rule.result;
  }
  if (name.trim().length === 0) {
    return { type: "Anonymous Beacon", risk: "medium", icon: "radio", blurb: "Broadcasting without a public name — common for trackers, sensors, and covert hardware." };
  }
  return { type: "Unknown RF Device", risk: "medium", icon: "help", blurb: "No signature match. Unidentified transmitters in private spaces deserve a visual sweep." };
}

export function estimateDistance(rssi: number, measuredPower = -59): number {
  const d = Math.pow(10, (measuredPower - rssi) / 20);
  return Math.max(0.1, Math.round(d * 10) / 10);
}

export function signalBars(rssi: number | null): number {
  if (rssi === null) return 1;
  if (rssi >= -55) return 4;
  if (rssi >= -68) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 2) return "now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}
