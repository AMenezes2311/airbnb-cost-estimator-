import { ApartmentId, CreateTripInput } from "@/lib/types";

interface ParseResult {
  checkIn: string;
  checkOut: string;
  guests: number;
  apartment: ApartmentId;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

const APARTMENT_ALIAS_MAP: Record<string, ApartmentId> = {
  A7: "A407",
  B3: "B403",
  B4: "B404",
  B5: "B405",
  C4: "C204",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeCompact(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function toIsoDate(day: number, month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resolveYear(
  explicitYear: number | null,
  referenceYear: number,
): number {
  if (explicitYear === null) return referenceYear;
  return explicitYear < 100 ? explicitYear + 2000 : explicitYear;
}

function parseDateToken(token: string, fallbackYear: number): string | null {
  const normalized = token.trim().toLowerCase();

  const textMonthMatch = normalized.match(
    /(?:^|\s)(\d{1,2})\s*(?:de)?\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?\s*(?:de\s*)?(\d{2,4})?/i,
  );

  if (textMonthMatch) {
    const day = Number(textMonthMatch[1]);
    const month = MONTHS[textMonthMatch[2].toLowerCase()];
    const year = resolveYear(
      textMonthMatch[3] ? Number(textMonthMatch[3]) : null,
      fallbackYear,
    );

    if (!Number.isNaN(day) && month !== undefined) {
      return toIsoDate(day, month, year);
    }
  }

  const numericMatch = normalized.match(
    /(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/,
  );
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]) - 1;
    const year = resolveYear(
      numericMatch[3] ? Number(numericMatch[3]) : null,
      fallbackYear,
    );

    if (
      !Number.isNaN(day) &&
      !Number.isNaN(month) &&
      month >= 0 &&
      month <= 11
    ) {
      return toIsoDate(day, month, year);
    }
  }

  return null;
}

function parseCheckDatesByLabels(
  normalizedText: string,
): { checkIn: string; checkOut: string } | null {
  const lines = normalizedText.split("\n");
  const now = new Date();
  const currentYear = now.getFullYear();

  const checkInLabel = /check\s*[-_]?\s*i[nm]|entrada/i;
  const checkOutLabel = /check\s*[-_]?\s*out|saida/i;

  let checkIn: string | null = null;
  let checkOut: string | null = null;

  // Pattern to match: digit(s) + de + month abbreviation
  const datePattern =
    /(\d{1,2})\s+de\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!checkIn && checkInLabel.test(line)) {
      const match = line.match(datePattern);
      if (match) {
        const day = Number(match[1]);
        const month = MONTHS[match[2].toLowerCase()];
        if (!Number.isNaN(day) && month !== undefined) {
          checkIn = toIsoDate(day, month, currentYear);
        }
      }
    }

    if (!checkOut && checkOutLabel.test(line)) {
      const match = line.match(datePattern);
      if (match) {
        const day = Number(match[1]);
        const month = MONTHS[match[2].toLowerCase()];
        if (!Number.isNaN(day) && month !== undefined) {
          checkOut = toIsoDate(day, month, currentYear);
        }
      }
    }

    if (checkIn && checkOut) break;
  }

  if (!checkIn || !checkOut) return null;

  // If checkout is before or equal to checkin, assume next year for checkout
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) {
    const nextYearCheckOut = new Date(checkOut);
    nextYearCheckOut.setUTCFullYear(nextYearCheckOut.getUTCFullYear() + 1);
    checkOut = nextYearCheckOut.toISOString().slice(0, 10);
  }

  return { checkIn, checkOut };
}

interface GuestCounts {
  adults: number;
  children: number;
  babies: number;
}

function parseGuests(normalizedText: string): GuestCounts | null {
  let adults = 0;
  let children = 0;
  let babies = 0;

  // Patterns for each type
  const adultPatterns = [
    /(\d{1,2})\s*adult(?:o|os|a|as)?\b/i,
    /adult(?:o|os|a|as)?\s*[:\-]?\s*(\d{1,2})\b/i,
    /(\d{1,2})\s*ad\w{2,8}\b/i,
    /(\d{1,2})\s*hosped(?:e|es)?\b/i,
  ];
  const childPatterns = [
    /(\d{1,2})\s*crianc(?:a|as)?\b/i,
    /crianc(?:a|as)?\s*[:\-]?\s*(\d{1,2})\b/i,
  ];
  const babyPatterns = [
    /(\d{1,2})\s*beb(?:e|es)?\b/i,
    /beb(?:e|es)?\s*[:\-]?\s*(\d{1,2})\b/i,
  ];

  for (const pattern of adultPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const n = Number(match[1]);
      if (!Number.isNaN(n) && n >= 1) {
        adults = n;
        break;
      }
    }
  }
  for (const pattern of childPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const n = Number(match[1]);
      if (!Number.isNaN(n) && n >= 1) {
        children = n;
        break;
      }
    }
  }
  for (const pattern of babyPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const n = Number(match[1]);
      if (!Number.isNaN(n) && n >= 1) {
        babies = n;
        break;
      }
    }
  }

  // Fallback for adults if not found
  if (adults === 0) {
    const lines = normalizedText.split("\n");
    const hostLineIndex = lines.findIndex((line) => /hosped/.test(line));
    if (hostLineIndex >= 0) {
      const fallbackLines = [
        lines[hostLineIndex],
        lines[hostLineIndex + 1],
        lines[hostLineIndex + 2],
      ].filter(Boolean);

      for (const line of fallbackLines) {
        if (/crianc/.test(line) && !/adult|hosped/.test(line)) continue;
        const numberMatch = line.match(/(\d{1,2})/);
        if (!numberMatch) continue;
        const n = Number(numberMatch[1]);
        if (!Number.isNaN(n) && n >= 1) {
          adults = n;
          break;
        }
      }
    }
  }

  if (adults === 0 && children === 0 && babies === 0) {
    return null;
  }
  return { adults, children, babies };
}

function parseApartment(normalizedText: string): ApartmentId | null {
  const textUpper = normalizedText.toUpperCase();
  const compact = normalizeCompact(normalizedText);

  const directAliases = Object.keys(APARTMENT_ALIAS_MAP);
  for (const alias of directAliases) {
    if (textUpper.includes(alias) || compact.includes(alias)) {
      return APARTMENT_ALIAS_MAP[alias];
    }
  }

  const patterns = [
    /(?:flat|apto|apartamento)?\s*([ABC])\s*-?\s*(\d{1,3})\b/g,
    /\b([ABC])(\d{1,3})\b/g,
  ];

  for (const pattern of patterns) {
    const matches = textUpper.matchAll(pattern);
    for (const match of matches) {
      const letter = match[1];
      const numberRaw = match[2];
      if (!letter || !numberRaw) continue;

      const normalizedNumber = String(Number(numberRaw));
      const candidateAliases = [
        `${letter}${numberRaw}`,
        `${letter}${normalizedNumber}`,
      ];

      for (const alias of candidateAliases) {
        const mapped = APARTMENT_ALIAS_MAP[alias];
        if (mapped) return mapped;
      }
    }
  }

  return null;
}

function parseCheckDates(
  normalizedText: string,
): { checkIn: string; checkOut: string } | null {
  const labeledDates = parseCheckDatesByLabels(normalizedText);
  if (labeledDates) return labeledDates;

  // Only match dates with explicit "de" between number and month
  const dateMatches = [
    ...normalizedText.matchAll(
      /\b(\d{1,2})\s+de\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi,
    ),
  ];

  const uniqueMatches = Array.from(new Set(dateMatches.map((m) => m[0])));

  const now = new Date();
  const currentYear = now.getFullYear();

  const first = uniqueMatches[0];
  const second = uniqueMatches[1];

  // Re-apply regex to extract capture groups from the matched strings
  const datePattern =
    /(\d{1,2})\s+de\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i;

  const firstMatch = first.match(datePattern);
  const secondMatch = second.match(datePattern);

  if (!firstMatch || !secondMatch) return null;

  const firstDay = Number(firstMatch[1]);
  const secondDay = Number(secondMatch[1]);
  const firstMonth = MONTHS[firstMatch[2].toLowerCase()];
  const secondMonth = MONTHS[secondMatch[2].toLowerCase()];

  if (
    Number.isNaN(firstDay) ||
    Number.isNaN(secondDay) ||
    firstMonth === undefined ||
    secondMonth === undefined
  ) {
    return null;
  }

  let checkInYear = currentYear;
  let checkOutYear = currentYear;

  if (
    secondMonth < firstMonth ||
    (secondMonth === firstMonth && secondDay <= firstDay)
  ) {
    checkOutYear = currentYear + 1;
  }

  const checkIn = toIsoDate(firstDay, firstMonth, checkInYear);
  const checkOut = toIsoDate(secondDay, secondMonth, checkOutYear);

  if (new Date(checkOut) <= new Date(checkIn)) {
    const numericFallback = parseCheckDatesFromNumeric(normalizedText);
    return numericFallback;
  }

  return { checkIn, checkOut };
}

function parseCheckDatesFromNumeric(
  normalizedText: string,
): { checkIn: string; checkOut: string } | null {
  const matches = [
    ...normalizedText.matchAll(
      /(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/g,
    ),
  ];

  if (matches.length < 2) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  const [first, second] = matches;
  const firstDay = Number(first[1]);
  const firstMonth = Number(first[2]) - 1;
  const secondDay = Number(second[1]);
  const secondMonth = Number(second[2]) - 1;

  if (
    Number.isNaN(firstDay) ||
    Number.isNaN(firstMonth) ||
    Number.isNaN(secondDay) ||
    Number.isNaN(secondMonth)
  ) {
    return null;
  }

  // Always use current year as base (email never shows year)
  let firstYear = currentYear;
  let secondYear = currentYear;

  // If checkout month is before checkin month, or same month but earlier day, use next year for checkout
  if (
    secondMonth < firstMonth ||
    (secondMonth === firstMonth && secondDay <= firstDay)
  ) {
    secondYear = currentYear + 1;
  }

  const checkIn = toIsoDate(firstDay, firstMonth, firstYear);
  const checkOut = toIsoDate(secondDay, secondMonth, secondYear);

  if (new Date(checkOut) <= new Date(checkIn)) {
    return null;
  }

  return { checkIn, checkOut };
}

export async function extractTripFromReservationImage(
  file: File,
): Promise<CreateTripInput> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por+eng");

  try {
    const {
      data: { text },
    } = await worker.recognize(file);

    const normalizedText = normalizeText(text);
    const dates =
      parseCheckDates(normalizedText) ??
      parseCheckDatesFromNumeric(normalizedText);
    const guestCounts = parseGuests(normalizedText);
    const guests = guestCounts
      ? guestCounts.adults + guestCounts.children + guestCounts.babies
      : NaN;
    const apartment = parseApartment(normalizedText);

    if (!dates) {
      throw new Error(
        "Não foi possível identificar check-in e check-out na imagem.",
      );
    }

    if (!guestCounts) {
      throw new Error(
        "Não foi possível identificar o número de hóspedes na imagem.",
      );
    }

    if (!apartment) {
      throw new Error("Não foi possível identificar o apartamento na imagem.");
    }

    return {
      check_in: dates.checkIn,
      check_out: dates.checkOut,
      guests,
      apartment,
      duvets: 0,
      cleanings: 1,
    };
  } finally {
    await worker.terminate();
  }
}
