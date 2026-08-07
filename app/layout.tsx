import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartDrawerProvider } from "@/lib/client/cart-drawer-context";
import type { Metadata, Viewport } from "next";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fabsystem.fr"),

  title: {
    default: "FabSystem – Électricité embarquée",
    template: "%s | FabSystem",
  },

  description:
    "Conseil et accompagnement en électricité embarquée pour bateaux, vans et camping-cars.",

  alternates: {
    canonical: "https://www.fabsystem.fr",
  },

  manifest: "/manifest.webmanifest",

  verification: {
    google: "mUAK2ZWHbPW2uWY_sqRnjEE22ai4RwfVR6nk7D1MpXo",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "FabSystem – Électricité embarquée fiable et sécurisée",
    description:
      "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars.",
    url: "https://www.fabsystem.fr",
    siteName: "FabSystem",
    images: [
      {
        url: "/hero-fabsystem.png",
        width: 1200,
        height: 630,
        alt: "FabSystem - Électricité embarquée",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "FabSystem – Électricité embarquée",
    description:
      "Diagnostic et conseil pour installations électriques embarquées",
    images: ["/hero-fabsystem.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={spaceGrotesk.variable}>
      <body className="bg-white font-sans text-neutral-900 antialiased">
        {/* structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "FabSystem",
              url: "https://www.fabsystem.fr",
              email: "contact@fabsystem.fr",
              telephone: "+33698247722",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Neuville-sur-Saône",
                postalCode: "69250",
                addressCountry: "FR",
              },
              description:
                "Conseil, installation et dépannage en électricité embarquée pour bateaux, vans et camping-cars.",
              areaServed: ["Rhône", "Auvergne-Rhône-Alpes", "France"],
              sameAs: [
                "https://www.facebook.com/fabsystem",
                "https://www.instagram.com/fabsystem"
              ]
            }),
          }}
        />
        <CartDrawerProvider>
          <SiteChrome>{children}</SiteChrome>
          <CartDrawer />
        </CartDrawerProvider>
      </body>
    </html>
  );
}
