"use client";
import ClientIntlProvider from '../components/ClientIntlProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientIntlProvider>{children}</ClientIntlProvider>;
} 