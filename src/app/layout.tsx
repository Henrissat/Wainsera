import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/app-shell";
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

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('wainsera-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

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
      suppressHydrationWarning
      className={`${playfair.variable} ${sourceSans.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans min-h-full">
        <AppShell
          unreadAlerts={unreadAlerts}
          userEmail={session?.user?.email}
          userName={session?.user?.name}
          isLoggedIn={!!session?.user}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
