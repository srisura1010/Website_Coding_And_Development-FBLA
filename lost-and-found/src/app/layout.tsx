import { ClerkProvider } from "@clerk/nextjs";
import { ItemsProvider } from "@/context/ItemsContext";
import Navbar from "./components/Navbar"; // Make sure to import Navbar here

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* 1. Open the Provider HERE, before the Navbar */}
          <ItemsProvider>
            
            {/* 2. Navbar is now inside the provider, so it can see the data */}
            <Navbar /> 
            
            {/* 3. The rest of your pages */}
            {children}

          </ItemsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}