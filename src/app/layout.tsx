import type { Metadata } from 'next';
import '@/styles/globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Polychrome Mosaic - Life Risk Dashboard',
  description: 'Visualize and understand your life risk patterns across domains',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}