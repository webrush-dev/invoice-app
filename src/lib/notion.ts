import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const INVOICE_DB_KEY = process.env.INVOICES_DB_KEY;
const INVOICE_LINES_DB_KEY = process.env.INVOICE_LINES_DB_KEY;

if (!INVOICE_DB_KEY || !INVOICE_LINES_DB_KEY) {
  throw new Error('Missing Notion database keys in environment variables');
}

export { INVOICE_DB_KEY, INVOICE_LINES_DB_KEY, notion };

// Example: fetch a single invoice by ID
export async function fetchInvoiceById(invoiceId: string) {
  if (!invoiceId) {
    throw new Error('Invoice ID is required');
  }
  return await notion.pages.retrieve({ page_id: invoiceId });
}

// Example: fetch invoice lines by invoice UUID
export async function fetchInvoiceLinesByInvoiceId(invoiceId: string) {
  if (!invoiceId) {
    throw new Error('Invoice ID is required');
  }
  const response = await notion.databases.query({
    database_id: INVOICE_LINES_DB_KEY,
    filter: {
      property: 'Invoice',
      relation: {
        contains: invoiceId,
      },
    },
  });
  return response.results;
}

export async function fetchClientById(clientId: string) {
  if (!clientId) {
    throw new Error('Client ID is required');
  }
  return await notion.pages.retrieve({ page_id: clientId });
} 