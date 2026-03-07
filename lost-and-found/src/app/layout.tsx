import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { TTSProvider } from "@/context/TTSContext";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./ThemeProvider";
import "./global.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/*
            STEP 1 — runs synchronously before any paint.
            Stamps the theme on <html data-theme>, <html class>, AND <body class>
            so CSS variables resolve correctly from the very first frame.
          */}
          <script dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.add(t);document.body.className=t;}catch(e){}})();`,
          }} />

          {/*
            STEP 2 — uses html[data-theme] (set above) so the correct
            background is painted on the very first frame. No flash.
          */}
          <style dangerouslySetInnerHTML={{ __html: `
            html, body { margin: 0; padding: 0; }
            body                                    { background-color: #f0f2f8; }
            html[data-theme="light"]   body         { background-color: #f0f2f8; }
            html[data-theme="dark"]    body         { background-color: #0b1120; }
            html[data-theme="high-contrast"] body   { background-color: #000000; }
            html[data-theme="colorblind"]    body   { background-color: #e6f0ff; }
          `}} />
        </head>

        {/* suppressHydrationWarning — body class is set by JS before React hydrates */}
        <body suppressHydrationWarning>
          <SettingsProvider>
            <ThemeProvider>
              <ItemsProvider>
                <TTSProvider>
                  <Navbar />
                  <main id="main-content">
                    {children}
                  </main>
                </TTSProvider>
              </ItemsProvider>
            </ThemeProvider>
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}