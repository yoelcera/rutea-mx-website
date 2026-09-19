import Link from "next/link";
import { notFound } from "next/navigation";
import { RouteInfoGrid } from "@/components/route_info_grid/route_info_grid";
import { RouteMapMapKit } from "@/components/route_map_mapkit/route_map_mapkit";
import { Section } from "@/components/section/section";
import {
  getAllRouteSlugs,
  getOperatorBySlug,
  getRouteBySlug,
  ROUTE_COLOR_HEX,
  ROUTE_COLOR_TEXT,
  ROUTE_STOP_ICON,
} from "@/data/routes";
import styles from "./page.module.css";

export default async function RoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  const operator = getOperatorBySlug(route.operatorSlug);

  return (
    <Section>
      <div className={styles.wrapper}>
        <Link href="/#routes" className={styles.backLink}>
          ← Volver al catálogo
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{route.name}</h1>
          <span
            className={styles.operatorChip}
            style={{
              backgroundColor: ROUTE_COLOR_HEX[route.color],
              color: ROUTE_COLOR_TEXT[route.color],
            }}
          >
            {operator?.name ?? "Operador"}
          </span>
        </header>

        <RouteInfoGrid
          routeId={route.id}
          stopCount={route.stops.length}
          fallback={{
            fare: route.fare,
            firstDeparture: route.firstDeparture,
            lastDeparture: route.lastDeparture,
            initialFrequencyMinutes: route.initialFrequencyMinutes,
            frequencyMinutes: route.frequencyMinutes,
          }}
        />

        <RouteMapMapKit
          path={route.path}
          stops={route.stops}
          color={ROUTE_COLOR_HEX[route.color]}
          stopIconSrc={ROUTE_STOP_ICON[route.color]}
        />

        <p className={styles.subtitle}>
          Para más información acerca de las rutas, descarga nuestra app en tu celular.
        </p>
      </div>
    </Section>
  );
}

export async function generateStaticParams() {
  return getAllRouteSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;
