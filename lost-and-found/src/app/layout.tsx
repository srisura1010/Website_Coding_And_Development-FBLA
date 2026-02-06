import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import Navbar from "./components/Navbar"; // Make sure to import Navbar here

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ItemsProvider>
            
            <Navbar /> 
            
            {children}

          </ItemsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}