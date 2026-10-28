import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Everafter — Your wedding, beautifully invited",
  description: "Create a personal wedding invitation with beautiful designs, your story, and every celebration in one place.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
