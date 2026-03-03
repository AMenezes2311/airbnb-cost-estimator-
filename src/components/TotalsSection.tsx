"use client";

import { Totals } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface TotalsSectionProps {
  totals: Totals;
}

export default function TotalsSection({ totals }: TotalsSectionProps) {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Totais consolidados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title="Estadias"
          value={totals.trip_count.toString()}
          accent="text-blue-700"
        />
        <Card
          title="Hóspedes totais"
          value={totals.total_guests.toLocaleString("pt-BR")}
          accent="text-indigo-700"
        />
        <Card
          title="Custo mantas"
          value={formatCurrency(totals.total_duvet_cost)}
          accent="text-purple-700"
        />
        <Card
          title="Custo total"
          value={formatCurrency(totals.total_cost)}
          accent="text-green-700"
        />
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
