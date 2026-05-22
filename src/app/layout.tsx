import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Arc Commerce",
  description: "E-Commerce stablecoin native menggunakan Arc Network (Layer-1) & Circle SDK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
