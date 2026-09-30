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

export enum BikeStatus {
  Available = "available",
  Linked = "linked",
  Maintenance = "maintenance",
  Lost = "lost",
  Retired = "retired",
  Unknown = "unknown",
}

export const BIKE_STATUS_LABEL: Record<BikeStatus, string> = {
  [BikeStatus.Available]: "Disponible",
  [BikeStatus.Linked]: "Vinculada",
  [BikeStatus.Maintenance]: "Mantenimiento",
  [BikeStatus.Lost]: "Extraviada",
  [BikeStatus.Retired]: "Dada de baja",
  [BikeStatus.Unknown]: "Desconocido",
};
