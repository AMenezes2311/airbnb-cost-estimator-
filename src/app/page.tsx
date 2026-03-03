"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TripForm from "@/components/TripForm";
import TripList from "@/components/TripList";
import TotalsSection from "@/components/TotalsSection";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/hooks/useAuth";
import { calculateTotals, getApartmentLabel } from "@/lib/calculations";
import { TripWithCalculations, CreateTripInput } from "@/lib/types";

export default function Home() {
  const {
    trips,
    loading,
    error,
    isSupabaseConfigured,
    addTrip,
    updateTrip,
    deleteTrip,
  } = useTrips();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [editingTrip, setEditingTrip] = useState<TripWithCalculations | null>(
    null,
  );
  const [sortMode, setSortMode] = useState<"date" | "apartment">("date");

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };
  const totals = calculateTotals(trips);
  const sortedTrips = useMemo(() => {
    const copy = [...trips];
    if (sortMode === "date") {
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return copy.sort((a, b) => {
      const labelDiff = getApartmentLabel(a.apartment).localeCompare(
        getApartmentLabel(b.apartment),
        "pt-BR",
      );
      if (labelDiff !== 0) return labelDiff;
      return new Date(b.check_in).getTime() - new Date(a.check_in).getTime();
    });
  }, [trips, sortMode]);

  const handleSubmit = async (input: CreateTripInput) => {
    if (editingTrip) {
      await updateTrip(editingTrip.id, input);
      setEditingTrip(null);
      return;
    }
    await addTrip(input);
  };

  const handleEditSelection = (trip: TripWithCalculations) => {
    setEditingTrip(trip);
  };

  const handleCancelEdit = () => setEditingTrip(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center text-gray-600">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          Carregando painel...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Planeje insumos de limpeza para cada estadia
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Controle manual de reservas do Airbnb com acompanhamento de
                hóspedes e custo total.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {user && (
                <span className="text-sm text-gray-500 hidden sm:inline">
                  {user.email}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <TripForm
          onSubmit={handleSubmit}
          isEditing={Boolean(editingTrip)}
          editingTrip={editingTrip ?? undefined}
          onCancelEdit={handleCancelEdit}
        />

        {trips.length > 0 && <TotalsSection totals={totals} />}

        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Histórico de estadias
              </h2>
              <p className="text-sm text-gray-600">
                {sortMode === "date"
                  ? "As mais recentes aparecem primeiro."
                  : "A lista está agrupada por apartamento (A → Z)."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="text-gray-500">{trips.length} registro(s)</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Ordenar por:</span>
                <button
                  type="button"
                  onClick={() => setSortMode("date")}
                  className={`rounded-full border px-3 py-1 font-semibold transition ${sortMode === "date" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  Data
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("apartment")}
                  className={`rounded-full border px-3 py-1 font-semibold transition ${sortMode === "apartment" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  Apartamento
                </button>
              </div>
            </div>
          </div>
          <TripList
            trips={sortedTrips}
            onDelete={deleteTrip}
            onEdit={handleEditSelection}
          />
        </section>
      </div>
    </div>
  );
}
