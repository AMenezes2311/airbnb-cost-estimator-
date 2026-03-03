"use client";

import { TripWithCalculations } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getApartmentLabel,
  getApartmentColor,
} from "@/lib/calculations";

interface TripListProps {
  trips: TripWithCalculations[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (trip: TripWithCalculations) => void;
}

export default function TripList({ trips, onDelete, onEdit }: TripListProps) {
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Remover esta estadia?");
    if (!confirmed) return;
    try {
      await onDelete(id);
    } catch (err) {
      alert("Erro ao remover a estadia.");
    }
  };

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
        Nenhuma estadia cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Apartamento</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Hóspedes totais</th>
              <th className="px-4 py-3">Mantas</th>
              <th className="px-4 py-3">Limpezas</th>
              <th className="px-4 py-3">Custo total</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: getApartmentColor(trip.apartment),
                    }}
                  >
                    {getApartmentLabel(trip.apartment)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {formatDate(trip.check_in)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {formatDate(trip.check_out)}
                </td>
                <td className="px-4 py-3 text-gray-900">{trip.guests}</td>
                <td className="px-4 py-3 text-gray-900">{trip.duvets}</td>
                <td className="px-4 py-3 text-gray-900">{trip.cleanings}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {formatCurrency(trip.total_cost)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-sm font-semibold">
                    <button
                      onClick={() => onEdit(trip)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
