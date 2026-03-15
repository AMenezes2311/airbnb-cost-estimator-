/**
 * Hook central responsável por persistir estadias no Supabase e recalcular totais.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trip, CreateTripInput, TripWithCalculations } from "@/lib/types";
import { addCalculationsToTrip } from "@/lib/calculations";
import { createClient } from "@/lib/supabase-browser";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsWithCalcs, setTripsWithCalcs] = useState<TripWithCalculations[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

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
      if (!supabase) {
        setError(
          "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
        );
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error: fetchError } = await supabase
          .from("trips")
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
  }, [supabase]);

  const addTrip = async (input: CreateTripInput): Promise<Trip> => {
    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error: insertError } = await supabase
        .from("trips")
        .insert({ ...input, user_id: user.id })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setTrips((prev) => [data, ...prev]);
      return data as Trip;
    } catch {
      const message = "Não foi possível salvar a estadia";
      setError(message);
      throw new Error(message);
    }
  };

  const deleteTrip = async (id: string) => {
    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("trips")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setTrips((prev) => prev.filter((trip) => trip.id !== id));
    } catch {
      const message = "Não foi possível remover a estadia";
      setError(message);
      throw new Error(message);
    }
  };

  const updateTrip = async (id: string, input: CreateTripInput): Promise<Trip> => {
    if (!supabase) {
      const message =
        "Supabase não configurado. Verifique o arquivo .env.local.";
      setError(message);
      throw new Error(message);
    }

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("trips")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setTrips((prev) =>
        prev.map((trip) => (trip.id === id ? (data as Trip) : trip)),
      );
      return data as Trip;
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
    isSupabaseConfigured: Boolean(supabase),
    addTrip,
    updateTrip,
    deleteTrip,
  };
}
