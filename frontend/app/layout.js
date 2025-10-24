import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

export const metadata = {
  title: "LegalEdge",
  description: "Your Legal Technology Solution",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
