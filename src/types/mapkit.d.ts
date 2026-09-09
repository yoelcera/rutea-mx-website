export {};

declare global {
  namespace MapKitJS {
    interface Coordinate {
      latitude: number;
      longitude: number;
    }

    interface CoordinateSpan {
      latitudeDelta: number;
      longitudeDelta: number;
    }

    interface CoordinateRegion {
      center: Coordinate;
      span: CoordinateSpan;
    }

    interface StyleOptions {
      lineWidth?: number;
      strokeColor?: string;
      strokeOpacity?: number;
    }

    interface Style extends StyleOptions {}

    interface PolylineOverlay {
      style: Style;
      points: Coordinate[];
    }

    interface AnnotationConstructorOptions {
      title?: string;
      subtitle?: string;
      data?: Record<string, unknown>;
    }

    interface Annotation {
      coordinate: Coordinate;
      title?: string;
      element: HTMLElement;
      animates: boolean;
    }

    interface MapShowItemsOptions {
      padding?: { top: number; right: number; bottom: number; left: number };
      animate?: boolean;
    }

    type ColorSchemeValue = "light" | "dark" | "adaptive";

    interface MapConstructorOptions {
      colorScheme?: ColorSchemeValue;
      region?: CoordinateRegion;
      showsMapTypeControl?: boolean;
      showsZoomControl?: boolean;
      showsUserLocationControl?: boolean;
      isRotationEnabled?: boolean;
    }

    interface Map {
      colorScheme: ColorSchemeValue;
      region: CoordinateRegion;
      element: HTMLElement;
      addAnnotation(annotation: Annotation): Annotation;
      addAnnotations(annotations: Annotation[]): Annotation[];
      removeAnnotation(annotation: Annotation): Annotation;
      removeAnnotations(annotations: Annotation[]): Annotation[];
      addOverlay(overlay: PolylineOverlay): PolylineOverlay;
      removeOverlay(overlay: PolylineOverlay): PolylineOverlay;
      showItems(items: Array<Annotation | PolylineOverlay>, options?: MapShowItemsOptions): void;
      setRegionAnimated(region: CoordinateRegion, animated?: boolean): void;
      destroy(): void;
    }

    interface MapKitNamespace {
      Map: new (element: HTMLElement, options?: MapConstructorOptions) => Map;
      Annotation: new (
        coordinate: Coordinate,
        factory: (coordinate: Coordinate, options: AnnotationConstructorOptions) => HTMLElement,
        options?: AnnotationConstructorOptions
      ) => Annotation;
      PolylineOverlay: new (points: Coordinate[], options?: { style?: Style }) => PolylineOverlay;
      Style: new (options?: StyleOptions) => Style;
      ColorScheme: { Light: "light"; Dark: "dark"; Adaptive: "adaptive" };
    }
  }

  interface Window {
    mapkit?: MapKitJS.MapKitNamespace;
  }
}
