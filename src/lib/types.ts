/**
 * Tipos centrais utilizados em toda a aplicação
 */

export type ApartmentId = "A407" | "B403" | "B404" | "B405" | "C204";

export interface Trip {
  id: string;
  check_in: string; // ISO date string
  check_out: string; // ISO date string
  guests: number;
  duvets: number;
  cleanings: number;
  apartment: ApartmentId;
  created_at: string;
}

export interface CreateTripInput {
  check_in: string;
  check_out: string;
  guests: number;
  duvets: number;
  cleanings: number;
  apartment: ApartmentId;
}

export interface TripWithCalculations extends Trip {
  nights: number;
  estimated_cost: number;
  duvet_cost: number;
  total_cost: number;
}

export interface Totals {
  total_guests: number;
  total_cost: number;
  total_duvet_cost: number;
  trip_count: number;
}
