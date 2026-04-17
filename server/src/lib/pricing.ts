export interface PriceBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  totalPrice: number;
  driverEarning: number;
  systemCommission: number;
}

export function calculateTripPrice(
  distanceKm: number,
  durationMin: number
): PriceBreakdown {
  const BASE_FARE = Number(process.env.BASE_FARE ?? 15);
  const RATE_PER_KM = Number(process.env.RATE_PER_KM ?? 8);
  const RATE_PER_MIN = Number(process.env.RATE_PER_MIN ?? 1.5);
  const DRIVER_CUT = Number(process.env.DRIVER_CUT_PERCENT ?? 80) / 100;

  const baseFare = BASE_FARE;
  const distanceCharge = distanceKm * RATE_PER_KM;
  const timeCharge = durationMin * RATE_PER_MIN;
  const totalPrice = Math.round((baseFare + distanceCharge + timeCharge) * 100) / 100;
  const driverEarning = Math.round(totalPrice * DRIVER_CUT * 100) / 100;
  const systemCommission = Math.round((totalPrice - driverEarning) * 100) / 100;

  return { baseFare, distanceCharge, timeCharge, totalPrice, driverEarning, systemCommission };
}

// Haversine formula — straight-line distance between two GPS coords in km
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate human-readable user ID
export function generateUserId(role: "DRIVER" | "PASSENGER"): string {
  const prefix = role === "DRIVER" ? "d" : "p";
  const year = new Date().getFullYear();
  const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `${prefix}${year}${digits}`;
}
