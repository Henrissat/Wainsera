import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { countUnreadAlerts } from "@/lib/sync-alerts";
import { auth } from "@/auth";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wainsera — Cave à vin personnelle",
  description:
    "Gérez votre cave à vin : millésimes, emplacements et fenêtres de garde.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let unreadAlerts = 0;
  if (session?.user?.id) {
    try {
      unreadAlerts = await countUnreadAlerts(session.user.id);
    } catch {
      unreadAlerts = 0;
    }
  }

  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${sourceSans.variable} h-full`}
    >
      <body className="font-sans paper-texture min-h-full flex flex-col">
        {session?.user && (
          <Navbar
            unreadAlerts={unreadAlerts}
            userEmail={session.user.email}
            userName={session.user.name}
          />
        )}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:max-w-4xl">
          {children}
        </main>
      </body>
    </html>
  );
}
