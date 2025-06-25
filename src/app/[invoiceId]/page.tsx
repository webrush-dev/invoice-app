export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import InvoiceClient from '@/components/InvoiceClient';
import { fetchClientById, fetchInvoiceById, fetchInvoiceLinesByInvoiceId } from '@/lib/notion';
import { notFound } from 'next/navigation';

interface InvoicePageProps {
  params: { invoiceId?: string };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId } = params;

  if (!invoiceId) {
    throw new Error('Invoice ID is required');
  }

  // Fetch invoice data from Notion
  const invoice = await fetchInvoiceById(invoiceId);
  if (!('properties' in invoice)) {
    notFound();
  }
  console.log('INVOICE:', JSON.stringify(invoice, null, 2));

  // Fetch invoice lines
  const lines = await fetchInvoiceLinesByInvoiceId(invoiceId);
  console.log('LINES:', JSON.stringify(lines, null, 2));

  // Fetch client details (first relation in Client property)
  let client = null;
  const clientRelation = (invoice as any).properties.Client.relation?.[0]?.id;
  if (clientRelation) {
    client = await fetchClientById(clientRelation);
  }

  return (
    <InvoiceClient invoice={invoice} lines={lines} client={client} />
  );
}


