import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./ThemeProvider"; // adjust path if needed


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeProvider>
            <ItemsProvider>
              <Navbar />
              {children}
            </ItemsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
