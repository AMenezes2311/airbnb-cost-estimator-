"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  ApartmentId,
  CreateTripInput,
  Trip,
  TripWithCalculations,
} from "@/lib/types";
import { validateTripDates, APARTMENT_OPTIONS } from "@/lib/calculations";
import { extractTripFromReservationImage } from "@/lib/reservationImageParser";

interface TripFormProps {
  onSubmit: (trip: CreateTripInput) => Promise<Trip | void>;
  onImageSubmit?: (trip: CreateTripInput) => Promise<Trip | void>;
  isEditing?: boolean;
  editingTrip?: TripWithCalculations | null;
  onCancelEdit?: () => void;
}

export default function TripForm({
  onSubmit,
  onImageSubmit,
  isEditing = false,
  editingTrip,
  onCancelEdit,
}: TripFormProps) {
  const defaultApartment = APARTMENT_OPTIONS[0]?.value ?? "A1";
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [duvets, setDuvets] = useState("0");
  const [cleanings, setCleanings] = useState("1");
  const [apartment, setApartment] = useState<ApartmentId>(defaultApartment);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsingImage, setParsingImage] = useState(false);

  const toInputDate = (value: string) => value?.split("T")?.[0] ?? value;

  const resetForm = () => {
    setCheckIn("");
    setCheckOut("");
    setGuests("");
    setDuvets("0");
    setCleanings("1");
    setApartment(defaultApartment);
  };

  useEffect(() => {
    if (isEditing && editingTrip) {
      setCheckIn(toInputDate(editingTrip.check_in));
      setCheckOut(toInputDate(editingTrip.check_out));
      setGuests(editingTrip.guests.toString());
      setDuvets(editingTrip.duvets.toString());
      setCleanings(editingTrip.cleanings.toString());
      setApartment(editingTrip.apartment);
      return;
    }
    if (!isEditing) {
      setCheckIn("");
      setCheckOut("");
      setGuests("");
      setDuvets("0");
      setCleanings("1");
      setApartment(defaultApartment);
    }
  }, [isEditing, editingTrip, defaultApartment]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const dateError = validateTripDates(checkIn, checkOut);
    if (dateError) {
      setError(dateError);
      return;
    }

    const guestsNumber = Number(guests);
    if (!guests || Number.isNaN(guestsNumber) || guestsNumber < 1) {
      setError("Informe pelo menos 1 hóspede");
      return;
    }

    const duvetsNumber = Number(duvets || 0);
    const cleaningsNumber = Number(cleanings || 1);
    if (Number.isNaN(duvetsNumber) || duvetsNumber < 0) {
      setError("O número de mantas não pode ser negativo");
      return;
    }
    if (Number.isNaN(cleaningsNumber) || cleaningsNumber < 0) {
      setError("Informe pelo menos 0 limpezas");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        check_in: checkIn,
        check_out: checkOut,
        guests: guestsNumber,
        duvets: duvetsNumber,
        cleanings: cleaningsNumber,
        apartment,
      });
      resetForm();
    } catch (err) {
      setError("Erro ao salvar a estadia. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const actionLabel = isEditing ? "Atualizar estadia" : "Registrar estadia";
  const submittingLabel = isEditing ? "Atualizando..." : "Salvando...";

  const handleReservationImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsingImage(true);

    try {
      const parsedTrip = await extractTripFromReservationImage(file);
      console.log("Parsed trip from image:", parsedTrip);

      setCheckIn(toInputDate("2024-01-01T00:00:00Z")); // Placeholder until parser returns ISO format
      setCheckOut(parsedTrip.check_out);
      setGuests(String(parsedTrip.guests));
      setApartment(parsedTrip.apartment);
      setDuvets(String(parsedTrip.duvets));
      setCleanings(String(parsedTrip.cleanings));

      await (onImageSubmit ?? onSubmit)({
        ...parsedTrip,
        duvets: 0,
      });
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível ler os dados da imagem";
      setError(message);
    } finally {
      event.target.value = "";
      setParsingImage(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? "Editar estadia" : "Adicionar estadia"}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing
            ? "Atualize os detalhes e confirme para salvar as alterações."
            : "Registre os detalhes da reserva para estimar o consumo de insumos."}
        </p>
      </div>

      {isEditing && editingTrip && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Você está editando a estadia com check-in em{" "}
          {toInputDate(editingTrip.check_in)}. Clique em "Cancelar edição" para
          voltar ao modo de criação.
        </div>
      )}

      {!isEditing && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-medium">Importar reserva por imagem</p>
          <p className="mt-1">
            Envie um print da reserva para extrair check-in, check-out, adultos
            e apartamento (ex.: A7 → A407). Crianças são ignoradas por agora.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-sky-300 bg-white px-4 py-2 font-semibold text-sky-700 hover:bg-sky-100">
            {parsingImage ? "Lendo imagem..." : "Enviar imagem da reserva"}
            <input
              type="file"
              accept="image/*"
              onChange={handleReservationImageUpload}
              className="hidden"
              disabled={parsingImage || submitting}
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Data de check-in
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Data de check-out
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Número de hóspedes
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Ex.: 4"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Número de mantas
          <input
            type="number"
            min={0}
            value={duvets}
            onChange={(e) => setDuvets(e.target.value)}
            placeholder="0"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Número de limpezas
          <input
            type="number"
            min={0}
            value={cleanings}
            onChange={(e) => setCleanings(e.target.value)}
            placeholder="Ex.: 1"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Apartamento
          <select
            value={apartment}
            onChange={(e) => setApartment(e.target.value as ApartmentId)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {APARTMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || parsingImage}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold shadow disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {submitting ? submittingLabel : actionLabel}
      </button>
      {isEditing && onCancelEdit && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="ml-3 inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-2 text-gray-700 font-semibold shadow-sm hover:bg-gray-100"
        >
          Cancelar edição
        </button>
      )}
    </form>
  );
}
