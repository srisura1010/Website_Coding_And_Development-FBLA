import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import { SettingsProvider } from "@/context/SettingsContext";
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
                <Navbar />
                {children}
              </ItemsProvider>
            </ThemeProvider>
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
