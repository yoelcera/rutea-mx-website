/** Categorías SUIM (extensible). */
export enum ImiCategory {
  Transport = "TRN", // Transporte
  Infrastructure = "INF", // Infraestructura
  Operation = "OPS", // Operación
  Organization = "ORG", // Organización
}

/** Tipos SUIM (extensible). */
export enum ImiType {
  // TRN
  Bus = "BUS", // Autobús
  Van = "VAN", // Van
  Taxi = "TAX", // Taxi
  Bike = "BIC", // Bicicleta
  // INF
  Stop = "STP", // Parada
  Station = "STA", // Estación
  Terminal = "TRM", // Terminal
  // OPS
  Route = "RTA", // Ruta
  Trip = "TRP", // Viaje
  Service = "SRV", // Servicio
  // ORG
  Operator = "OPR", // Operador
}

/** A qué categoría pertenece cada tipo. */
export const IMI_TYPE_CATEGORY: Record<ImiType, ImiCategory> = {
  [ImiType.Bus]: ImiCategory.Transport,
  [ImiType.Van]: ImiCategory.Transport,
  [ImiType.Taxi]: ImiCategory.Transport,
  [ImiType.Bike]: ImiCategory.Transport,
  [ImiType.Stop]: ImiCategory.Infrastructure,
  [ImiType.Station]: ImiCategory.Infrastructure,
  [ImiType.Terminal]: ImiCategory.Infrastructure,
  [ImiType.Route]: ImiCategory.Operation,
  [ImiType.Trip]: ImiCategory.Operation,
  [ImiType.Service]: ImiCategory.Operation,
  [ImiType.Operator]: ImiCategory.Organization,
};
