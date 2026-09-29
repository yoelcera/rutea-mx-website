import { redirect } from "next/navigation";
import { TRANSIT_ROUTES } from "@/data/routes";

// Genera /qr/rta/<uuid> para cada ruta (mayúsculas y minúsculas)
export async function generateStaticParams() {
  return TRANSIT_ROUTES.flatMap((route) => [
    { id: route.id },
    { id: route.id.toLowerCase() },
  ]);
}

export const dynamicParams = false;

export default async function QrRouteRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const route = TRANSIT_ROUTES.find(
    (r) => r.id.toLowerCase() === id.toLowerCase()
  );

  redirect(route ? `/rutas/${route.slug}` : "/#routes");
}
