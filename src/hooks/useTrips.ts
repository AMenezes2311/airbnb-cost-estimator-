/**
 * Hook central responsável por persistir estadias no Supabase e recalcular totais.
 */

import { useState, useEffect, useCallback } from "react";
import { Trip, CreateTripInput, TripWithCalculations } from "@/lib/types";
import { addCalculationsToTrip } from "@/lib/calculations";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsWithCalcs, setTripsWithCalcs] = useState<TripWithCalculations[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recalculate = useCallback(() => {
    const enriched = trips
      .map((trip) => addCalculationsToTrip(trip))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    setTripsWithCalcs(enriched);
  }, [trips]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  useEffect(() => {
    const loadTrips = async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError(
          "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
        );
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const tripsTable = supabase.from("trips") as any;
        const { data, error: fetchError } = await tripsTable
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setTrips(data ?? []);
      } catch {
        setError("Não foi possível carregar as estadias do Supabase");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  const addTrip = async (input: CreateTripInput) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const tripsTable = supabase.from("trips") as any;
      const { data, error: insertError } = await tripsTable
        .insert(input)
        .select("*")
        .single();

      if (insertError) throw insertError;

      setTrips((prev) => [data, ...prev]);
    } catch {
      const message = "Não foi possível salvar a estadia";
      setError(message);
      throw new Error(message);
    }
  };

  const deleteTrip = async (id: string) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const tripsTable = supabase.from("trips") as any;
      const { error: deleteError } = await tripsTable.delete().eq("id", id);

      if (deleteError) throw deleteError;

      setTrips((prev) => prev.filter((trip) => trip.id !== id));
    } catch {
      const message = "Não foi possível remover a estadia";
      setError(message);
      throw new Error(message);
    }
  };

  const updateTrip = async (id: string, input: CreateTripInput) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const tripsTable = supabase.from("trips") as any;
      const { data, error: updateError } = await tripsTable
        .update(input)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setTrips((prev) =>
        prev.map((trip) => (trip.id === id ? (data as Trip) : trip)),
      );
    } catch {
      const message = "Não foi possível atualizar a estadia";
      setError(message);
      throw new Error(message);
    }
  };

  return {
    trips: tripsWithCalcs,
    loading,
    error,
    isSupabaseConfigured,
    addTrip,
    updateTrip,
    deleteTrip,
  };
}
