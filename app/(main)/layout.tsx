import { APP_ID, IS_WAITLIST_ENABLED, THEME } from "@/constants";
import type { Metadata, Viewport } from "next";

import { AppIcon } from "@/components/app_icon/app_icon";
import { CompactFooter } from "@/components/compact_footer/compact_footer";
import { DownloadActionButton } from "@/components/download_action_button/download_action_button";
import { MaterialSymbolsLink } from "@/components/material_symbols_link/material_symbols_link";
import { Navbar } from "@/components/navbar/navbar";
import { ThemeStyle } from "@/components/theme_style/theme_style";
import "@/global.css";
import { ThemeProvider } from "@/providers/theme_provider";

export const metadata: Metadata = {
  /**
   * `title` and `description` are visible in search results.
   * Recommended length for title is max 60 characters.
   * Recommended length for description is max 160 characters.
   */
  title: "Rutea MX - Transporte público de México",
  description: "Información oficial y diseño de calidad para tu movilidad urbana.",

  /**
   * Your website URL.
   */
  metadataBase: new URL("https://ruteamx.app"),

  /**
   * Info inside `openGraph` and `twitter` is used to show rich previews
   * on social media when someone shares a link to your website.
   *
   * AppView comes with a tool to help you generate an Open Graph image,
   * run the dev server and go to `http://localhost:3000/open-graph-builder`.
   */
  openGraph: {
    title: "Rutea MX - Transporte público de México",
    description: "Información oficial y diseño de calidad para tu movilidad urbana.",
    url: "https://ruteamx.app",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 720,
        alt: "",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "App title",
    description: "App description",
    images: ["/og-preview.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme={THEME}>
      <head>
        {/* This makes Safari on iOS show the App Store download banner */}
        {!IS_WAITLIST_ENABLED && (
          <meta name="apple-itunes-app" content={`app-id=${APP_ID}`} />
        )}

        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />

        <ThemeStyle />
        <MaterialSymbolsLink />
      </head>
      <body>
        <ThemeProvider>
          {!IS_WAITLIST_ENABLED && (
            <Navbar
              icon={<AppIcon src="/app_view/icon_placeholder.png" />}
              appName="Rutea MX"
              links={[
                { label: "Funcionalidades", href: "#features" },
                // Uncomment the line below once you're ready to start using Release Notes
                // { label: "Release Notes", href: "/release-notes" },
                // { label: "Contáctanos", href: "mailto:xera00@icloud.com" },
                { label: "Contáctanos", href: "#contact" },
              ]}
              action={<DownloadActionButton />}
            />
          )}

          {children}

          {/*
            There is also a <MultiColumnFooter> component available
            in case you need more space for links.
          */}
          <CompactFooter
            appIcon={
              <AppIcon
                src="/app_view/icon_placeholder.png"
                filter="grayscale"
              />
            }
            links={[
              { label: "Privacidad", href: "/privacy" },
              {
                label: "Términos de uso",
                href: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
                external: true,
              },
              // {
              //   label: "Follow Updates",
              //   href: "https://your-social-media.com",
              // },
            ]}
            footnoteLeading={`© ${new Date().getFullYear()}. Todos los derechos reservados.`}
            footnoteTrailing={
              // I'd appreciate if you leave this link here, but feel free to remove it, no hard feelings :)
              <>
                Página web construido con{" "}
                <a target="_blank" href="https://appview.dev">
                  AppView
                </a>
              </>
            }
          />
        </ThemeProvider>

        {/* <PlausibleAnalytics domain="your-app-domain.com" /> */}
        {/* <TelemetryDeckAnalytics appID="your-telemetrydeck-app-id" clientUser="anonymous" /> */}
        {/* <VercelAnalytics /> */}
      </body>
    </html>
  );
}
