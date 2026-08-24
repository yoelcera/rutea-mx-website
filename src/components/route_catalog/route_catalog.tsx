import Link from "next/link";
import {
  getOperatorsWithRoutes,
  ROUTE_COLOR_HEX,
  ROUTE_COLOR_TEXT,
} from "@/data/routes";
import styles from "./route_catalog.module.css";

function cityLabel(city: string): string {
  return city.charAt(0).toUpperCase() + city.slice(1);
}

export function RouteCatalog() {
  const operatorsWithRoutes = getOperatorsWithRoutes();
  const cities = [...new Set(operatorsWithRoutes.map(({ operator }) => operator.city))];

  return (
    <div className={styles.catalog}>
      {cities.map((city) => (
        <div key={city} className={styles.citySection}>
          <h3 className={styles.cityTitle}>{cityLabel(city)}</h3>

          {operatorsWithRoutes
            .filter(({ operator }) => operator.city === city)
            .map(({ operator, routes }) => (
              <div key={operator.slug} className={styles.operatorSection}>
                <h4 className={styles.operatorTitle}>{operator.name}</h4>

                <div className={styles.routeList}>
                  {routes.map((route) => (
                    <Link
                      key={route.slug}
                      href={`/rutas/${route.slug}`}
                      className={styles.routeButton}
                      style={{
                        backgroundColor: ROUTE_COLOR_HEX[route.color],
                        color: ROUTE_COLOR_TEXT[route.color],
                      }}
                    >
                      {route.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
