import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import Link from "next/link";
import { Box, Paper } from "@mui/material";
import { Header } from "./header";
import { Footer } from "./footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CoPower",
  description: "Raw gluten-free sunfed NZ content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          {children}
        </Box>
        <Footer />
      </body>
    </html>
  );
}
