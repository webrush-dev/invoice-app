"use client";
// @ts-expect-error: No types for html2pdf.js
// If you want to add types, create a declaration file with: declare module 'html2pdf.js';

import { GetPageResponse, PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { toWords } from 'number-to-words';
import { forwardRef } from 'react';
import "./Invoice.css";

// Utility functions for Notion property extraction
// Notion SDK does not provide granular types for properties, so 'as any' is used for property access.
function getText(prop: any): string {
  return prop?.title?.[0]?.plain_text || '';
}
function getNumber(prop: any): number {
  return typeof prop?.number === 'number' ? prop.number : 0;
}
function getRollupNumber(prop: any): number {
  return typeof prop?.rollup?.number === 'number' ? prop.rollup.number : 0;
}
function getFormulaNumber(prop: any): number {
  return typeof prop?.formula?.number === 'number' ? prop.formula.number : 0;
}
function getStatus(prop: any): string {
  return prop?.status?.name || '';
}
function getDate(prop: any): string {
  return prop?.date?.start || '';
}

interface InvoiceProps {
  invoice: GetPageResponse;
  lines: (PageObjectResponse | PartialPageObjectResponse)[];
  client: GetPageResponse | null;
  invoiceRef: React.RefObject<HTMLDivElement>;
}

const Invoice = forwardRef<HTMLDivElement, Omit<InvoiceProps, 'invoiceRef'> & { invoiceRef: React.RefObject<HTMLDivElement> }>(
  ({ invoice, lines, client, invoiceRef }, ref) => {
    // Notion SDK does not expose 'properties' in a type-safe way, so we use 'as any'.
    const invoiceProps = invoice.properties as any;
    const clientProps = client ? (client.properties as any) : null;

    const invoiceNumber = getText(invoiceProps.Invoice);
    const issueDate = getDate(invoiceProps['Issue Date']);
    const dueDate = getDate(invoiceProps['Due Date']);
    const status = getStatus(invoiceProps.Status);
    const netAmount = getRollupNumber(invoiceProps['Net Amount']);
    const taxRate = getNumber(invoiceProps['Tax Rate']);
    const discount = getNumber(invoiceProps.Discount);
    const totalAmount = getRollupNumber(invoiceProps['Total Amount']);
    const amountWithTax = getRollupNumber(invoiceProps['Amount with tax']);
    const clientName = clientProps ? getText(clientProps.Name) : 'N/A';

    // Fetch client logo from 'Logo' property if available
    let clientLogoUrl = null;
    if (clientProps && clientProps['Logo'] && clientProps['Logo'].files && clientProps['Logo'].files[0]) {
      const fileObj = clientProps['Logo'].files[0];
      clientLogoUrl = fileObj.external?.url || fileObj.file?.url || null;
    }

    // Calculate totals from line items
    const netAmountSum = lines.reduce((sum, line) => {
      if ('properties' in line) {
        const props = (line as any).properties;
        return sum + getFormulaNumber(props['Net Amount']);
      }
      return sum;
    }, 0);
    const totalAmountSum = lines.reduce((sum, line) => {
      if ('properties' in line) {
        const props = (line as any).properties;
        return sum + getFormulaNumber(props['Net Amount']); // If you have a separate Total, use that property
      }
      return sum;
    }, 0);
    const amountWithTaxSum = lines.reduce((sum, line) => {
      if ('properties' in line) {
        const props = (line as any).properties;
        return sum + getFormulaNumber(props['Amount With Tax']);
      }
      return sum;
    }, 0);

    // Calculate VAT Amount
    const vatAmountSum = lines.reduce((sum, line) => {
      if ('properties' in line) {
        const props = (line as any).properties;
        return sum + getFormulaNumber(props['Net Amount']) * getNumber(props['Tax Rate']);
      }
      return sum;
    }, 0);

    // Extract new issuer and client info from rollup fields
    let issuerName = '';
    let issuerVAT = '';
    let issuerAddress = '';
    let clientVAT = '';
    let clientAddress = '';
    if (invoiceProps['Issuer Name']?.rollup?.array?.[0]?.title?.[0]?.plain_text) {
      issuerName = invoiceProps['Issuer Name'].rollup.array[0].title[0].plain_text;
    }
    if (invoiceProps['Issuer VAT']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      issuerVAT = invoiceProps['Issuer VAT'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Issuer Address']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      issuerAddress = invoiceProps['Issuer Address'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Client VAT']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      clientVAT = invoiceProps['Client VAT'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Client Address']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      clientAddress = invoiceProps['Client Address'].rollup.array[0].rich_text[0].plain_text;
    }

    // For localization, wrap the label and conversion in variables
    const inWordsLabel = 'In Words'; // For future translation
    const integerPart = Math.floor(amountWithTaxSum);
    const decimalPart = Math.round((amountWithTaxSum - integerPart) * 100);
    const integerWords = toWords(integerPart);
    const centsWords = decimalPart > 0 ? toWords(decimalPart) + ' cents' : '';
    const totalDueInWords = centsWords
      ? `${integerWords} and ${centsWords}`
      : integerWords;

    return (
      <div className="invoice-container" ref={invoiceRef}>
        {/* Wavy top divider */}
        <svg
          className="invoice-topbar"
          viewBox="0 0 700 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 18, zIndex: 2 }}
        >
          <path
            d="M0 12 Q 175 0 350 12 T 700 12 V18 H0Z"
            fill="#192442"
            opacity="0.85"
          />
        </svg>
        <div className="pdf-a4-content">
          <div className="invoice-header">
            <img src="/assets/Webrush.png" alt="Webrush Studio Logo" className="invoice-logo" width={48} height={48} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            <div>
              <div className="invoice-title">
                Invoice {invoiceNumber}
                <span className="invoice-title-underline" />
              </div>
              {/* <div className="invoice-status">Status: {status}</div> */}
              <div className="invoice-agency">Webrush Studio</div>
            </div>
          </div>
          <div className="invoice-details-row">
            {/* Issued To (Client) */}
            <div className="invoice-details-block" style={{ minWidth: 200 }}>
              <div className="invoice-details-label">Issued to</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}></span> {clientName}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>VAT:</span> {clientVAT}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>Address:</span> {clientAddress}</div>
            </div>
            {/* Issued By (Agency) */}
            <div className="invoice-details-block" style={{ textAlign: 'right' }}>
              <div className="invoice-details-label">Issued by</div>
              <div className="invoice-details-value">{issuerName}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>VAT:</span> {issuerVAT}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>Address:</span> {issuerAddress}</div>
              <div className="invoice-details-value" style={{ fontSize: '0.95rem', color: 'var(--webrush-blue)' }}>webrush.studio</div>
            </div>
          </div>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                if (!('properties' in line)) return null;
                const props = (line as any).properties;
                return (
                  <tr key={line.id}>
                    <td>{getText(props['Item Description'])}</td>
                    <td>{getNumber(props.Quantity)}</td>
                    <td>{getRollupNumber(props['Unit Price']).toFixed(2)}</td>
                    <td>{getFormulaNumber(props['Net Amount']).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="invoice-summary">
            <div><span>Total Net:</span> <span>{netAmountSum.toFixed(2)}</span></div>
            <div><span>VAT Base:</span> <span>{netAmountSum.toFixed(2)}</span></div>
            <div><span>VAT Amount:</span> <span>{vatAmountSum.toFixed(2)}</span></div>
            <div><span>Total Due:</span> <span className="total" style={{ fontSize: '1.35rem', fontWeight: 700, marginLeft: 8 }}>€{amountWithTaxSum.toFixed(2)}</span></div>
            <div style={{ marginTop: 0, fontWeight: 500, textAlign: 'left', width: '100%', display: 'block' }}>
              {inWordsLabel}: <span style={{ fontStyle: 'italic', marginLeft: 8 }}>{totalDueInWords.charAt(0).toUpperCase() + totalDueInWords.slice(1)}</span>
            </div>
            <div style={{ marginTop: 0, textAlign: 'left', width: '100%', display: 'block' }}>
              <span style={{ fontWeight: 500 }}>Issue Date:</span> <span style={{ marginLeft: 8 }}>{issueDate}</span>
            </div>
            <div style={{ marginTop: 0, textAlign: 'left', width: '100%', display: 'block' }}>
              <span style={{ fontWeight: 500 }}>Due Date:</span> <span style={{ marginLeft: 8 }}>{dueDate}</span>
            </div>
          </div>
          <div className="payment-instructions">
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '1.08rem', color: '#192442' }}>Payment Methods</div>
            <div className="payment-row">
              <span className="payment-label">Card Payment</span>
              <span className="payment-detail">Online via Stripe portal</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Bank Transfer</span>
              <span className="payment-detail">OBB: IBAN12344</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Invoice; 

export const revalidate = 86400; // 24 hours 
