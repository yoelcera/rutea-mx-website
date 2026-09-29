export enum BikeType {
  Mountain = "mountain",
  Street = "street",
  Track = "track",
}

export const BIKE_TYPE_LABEL: Record<BikeType, string> = {
  [BikeType.Mountain]: "Montaña",
  [BikeType.Street]: "Calle",
  [BikeType.Track]: "Pista",
};

export enum TripType {
  Main = "main", // Principal
  Recreational = "recreational", // Recreativo
  Occasional = "occasional", // Ocasional
  Ride = "ride", // Rodada
}

export const TRIP_TYPE_LABEL: Record<TripType, string> = {
  [TripType.Main]: "Principal",
  [TripType.Recreational]: "Recreativo",
  [TripType.Occasional]: "Ocasional",
  [TripType.Ride]: "Rodada",
};
