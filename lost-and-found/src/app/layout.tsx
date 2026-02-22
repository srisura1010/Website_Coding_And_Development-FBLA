import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { TTSProvider } from "@/context/TTSContext"; // added TTS context
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SettingsProvider>
            <ThemeProvider>
              <ItemsProvider>
                <TTSProvider>
                  {/* Navbar is outside main so it’s not read by default */}
                  <Navbar />
                  
                  {/* Wrap page content in main-content for TTS */}
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