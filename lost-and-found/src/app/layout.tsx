import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ItemsProvider>
            <SettingsProvider> {/* <-- wrap everything that needs settings */}
              
              <Navbar /> 
              {children}
              
            </SettingsProvider>
          </ItemsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
