export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { fetchClientById, fetchInvoiceById, fetchInvoiceLinesByInvoiceId } from '@/lib/notion';
import { notFound } from 'next/navigation';
import InvoicePageClient from '../../components/InvoicePageClient';

interface InvoicePageProps {
  params: { invoiceId?: string };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId } = params;

  if (!invoiceId) {
    notFound();
  }

  const invoice = await fetchInvoiceById(invoiceId);
  const lines = await fetchInvoiceLinesByInvoiceId(invoiceId);
  const clientRelation = (invoice as any).properties.Client.relation?.[0]?.id;
  const client = await fetchClientById(clientRelation);

  if (!invoice || !client) {
    notFound();
  }

  return (
    <InvoicePageClient invoice={invoice} lines={lines} client={client} />
  );
}

declare module 'nums2words-bg';


