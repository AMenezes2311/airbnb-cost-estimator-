/**
 * Funções puras responsáveis pelos cálculos de consumo e custo.
 */

import { Trip, TripWithCalculations, Totals, ApartmentId } from "@/lib/types";

interface ApartmentRule {
  id: ApartmentId;
  label: string;
  baseCost: number;
  includedGuests: number;
  extraGuestCost: number;
}

const APARTMENT_COLORS: Record<ApartmentId, string> = {
  A407: "#FDEAD8",
  B403: "#E5F4DA",
  B404: "#E0F2FF",
  B405: "#F3E8FF",
  C204: "#FFF3D4",
};

const APARTMENT_RULES: Record<ApartmentId, ApartmentRule> = {
  A407: {
    id: "A407",
    label: "Apartamento A407",
    baseCost: 80, // 2 camas de casal (2x20) + 2 camas de solteiro (2x15) + 10 limpeza
    includedGuests: 6,
    extraGuestCost: 15,
  },
  B403: {
    id: "B403",
    label: "Apartamento B403",
    baseCost: 27, // 1 cama de casal (12) + 1 cama de solteiro (9) + 6 limpeza
    includedGuests: 3,
    extraGuestCost: 9,
  },
  B404: {
    id: "B404",
    label: "Apartamento B404",
    baseCost: 27,
    includedGuests: 3,
    extraGuestCost: 9,
  },
  B405: {
    id: "B405",
    label: "Apartamento B405",
    baseCost: 27,
    includedGuests: 3,
    extraGuestCost: 9,
  },
  C204: {
    id: "C204",
    label: "Apartamento C204",
    baseCost: 27,
    includedGuests: 3,
    extraGuestCost: 9,
  },
};

export const APARTMENT_OPTIONS = Object.values(APARTMENT_RULES).map(
  ({ id, label }) => ({
    value: id,
    label,
  }),
);

export function getApartmentLabel(id: ApartmentId): string {
  return APARTMENT_RULES[id]?.label ?? id;
}

export function getApartmentColor(id: ApartmentId): string {
  return APARTMENT_COLORS[id] ?? "#F5F5F5";
}

export function calculateNights(
  checkIn: string | Date,
  checkOut: string | Date,
): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function calculateDuvetCost(duvets: number, cleanings: number): number {
  const safeCount = Math.max(0, duvets);
  const costPerDuvet = 5; // Custo fixo por manta
  return safeCount * costPerDuvet;
}

export function calculateApartmentCost(
  apartment: ApartmentId,
  guests: number,
  cleanings: number,
): number {
  const rule = APARTMENT_RULES[apartment];
  if (!rule) return 0;
  const extraGuests = Math.max(0, guests - rule.includedGuests);
  const cleaningCount = Math.max(1, cleanings);
  const perCleaningCost = rule.baseCost + extraGuests * rule.extraGuestCost;
  return Math.round(perCleaningCost * cleaningCount * 100) / 100;
}

export function addCalculationsToTrip(trip: Trip): TripWithCalculations {
  const nights = calculateNights(trip.check_in, trip.check_out);
  const estimated_cost = calculateApartmentCost(
    trip.apartment,
    trip.guests,
    trip.cleanings,
  );
  const duvet_cost = calculateDuvetCost(trip.duvets, trip.cleanings);
  let total_cost = Math.round((estimated_cost + duvet_cost) * 100) / 100;
  console.log("this is the current apartment:", trip.apartment);

  if (trip.apartment === "A407") {
    let cleaningCost = 120 * trip.cleanings;
    total_cost += cleaningCost;
  } else {
    let cleaningCost = 70 * trip.cleanings;
    total_cost += cleaningCost;
  }

  return {
    ...trip,
    nights,
    estimated_cost,
    duvet_cost,
    total_cost,
  };
}

export function calculateTotals(trips: TripWithCalculations[]): Totals {
  const total_guests = trips.reduce((acc, trip) => acc + trip.guests, 0);
  const total_duvet_cost = trips.reduce(
    (acc, trip) => acc + trip.duvet_cost,
    0,
  );
  const total_cost = trips.reduce((acc, trip) => acc + trip.total_cost, 0);

  return {
    total_guests,
    total_duvet_cost: Math.round(total_duvet_cost * 100) / 100,
    total_cost: Math.round(total_cost * 100) / 100,
    trip_count: trips.length,
  };
}

export function validateTripDates(
  checkIn: string,
  checkOut: string,
): string | null {
  if (!checkIn || !checkOut) {
    return "Informe as datas de check-in e check-out";
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Datas inválidas";
  }

  if (end <= start) {
    return "O check-out precisa ser depois do check-in";
  }

  return null;
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}
