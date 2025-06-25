"use client";
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import InvoiceClient from './InvoiceClient';

interface InvoicePageClientProps {
  invoice: PageObjectResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
}

export default function InvoicePageClient({ invoice, lines, client }: InvoicePageClientProps) {
  return (
    <div>
      <InvoiceClient invoice={invoice} lines={lines} client={client} />
    </div>
  );
} 