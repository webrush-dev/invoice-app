"use client";
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { useTranslations } from 'next-intl';
import InvoiceClient from './InvoiceClient';

interface InvoicePageClientProps {
  invoice: PageObjectResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
}

export default function InvoicePageClient({ invoice, lines, client }: InvoicePageClientProps) {
  const t = useTranslations();
  return (
    <div>
      <InvoiceClient invoice={invoice} lines={lines} client={client} />
    </div>
  );
} 