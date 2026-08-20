import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
});

export const metadata = {
  title: "Cikmaksā.lv",
  description: "Minē sludinājumu cenas ar draugiem",
};

export default function RootLayout({ children }) {
  return (
    <html lang="lv">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}