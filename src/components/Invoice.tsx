"use client";
// @ts-expect-error: No types for html2pdf.js
// If you want to add types, create a declaration file with: declare module 'html2pdf.js';

import { GetPageResponse, PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { toWords } from 'number-to-words';
import nums2wordsBG from 'nums2words-bg';
import { forwardRef } from 'react';
import { useIntl } from 'react-intl';
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

function formatDateDMY(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

interface InvoiceProps {
  invoice: GetPageResponse;
  lines: (PageObjectResponse | PartialPageObjectResponse)[];
  client: GetPageResponse | null;
  invoiceRef?: React.RefObject<HTMLDivElement>;
  currency: string;
}

const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ invoice, lines, client, invoiceRef, currency }, ref) => {
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
    let issuerReg = '';
    let issuerVAT = '';
    let issuerAddress = '';
    let clientReg = '';
    let clientVAT = '';
    let clientAddress = '';
    if (invoiceProps['Issuer Name']?.rollup?.array?.[0]?.title?.[0]?.plain_text) {
      issuerName = invoiceProps['Issuer Name'].rollup.array[0].title[0].plain_text;
    }
    if (invoiceProps['Issuer Reg #']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      issuerReg = invoiceProps['Issuer Reg #'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Issuer VAT']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      issuerVAT = invoiceProps['Issuer VAT'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Issuer Address']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      issuerAddress = invoiceProps['Issuer Address'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Client Reg #']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      clientReg = invoiceProps['Client Reg #'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Client VAT']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      clientVAT = invoiceProps['Client VAT'].rollup.array[0].rich_text[0].plain_text;
    }
    if (invoiceProps['Client Address']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
      clientAddress = invoiceProps['Client Address'].rollup.array[0].rich_text[0].plain_text;
    }

    // For localization, wrap the label and conversion in variables
    const intl = useIntl();
    const currentLocale = intl.locale;
    let totalDueInWords = '';
    if (currency === 'BGN') {
      if (currentLocale === 'bg') {
        try {
          totalDueInWords = String(
            nums2wordsBG.currency(amountWithTaxSum.toFixed(2), {
              labelBig: 'лева',
              labelSmall: 'стотинки',
            })
          );
        } catch (e) {
          totalDueInWords = '';
        }
      } else {
        const integerPart = Math.floor(amountWithTaxSum);
        const decimalPart = Math.round((amountWithTaxSum - integerPart) * 100);
        let integerWords = toWords(integerPart);
        let centsWords = decimalPart > 0 ? toWords(decimalPart) + ' stotinki' : '';
        totalDueInWords = centsWords
          ? `${integerWords} and ${centsWords}`
          : integerWords;
      }
    } else {
      if (currentLocale === 'bg') {
        try {
          totalDueInWords = String(
            nums2wordsBG.currency(amountWithTaxSum.toFixed(2), {
              labelBig: 'евро',
              labelSmall: 'евро цента',
            })
          );
        } catch (e) {
          totalDueInWords = '';
        }
      } else {
        const integerPart = Math.floor(amountWithTaxSum);
        const decimalPart = Math.round((amountWithTaxSum - integerPart) * 100);
        let integerWords = toWords(integerPart);
        let centsWords = decimalPart > 0 ? toWords(decimalPart) + ' cents' : '';
        totalDueInWords = centsWords
          ? `${integerWords} and ${centsWords}`
          : integerWords;
      }
    }

    const itemNumberLabel = currentLocale === 'bg' ? '№' : 'No.';
    const itemLabel = currentLocale === 'bg' ? 'Стока/услуга' : intl.formatMessage({ id: 'description' });

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
            <img src="/assets/Webrush.png" alt={intl.formatMessage({ id: 'webrushStudio' })} className="invoice-logo" width={48} height={48} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            <div className="invoice-title-row">
              <div className="invoice-title">
                {intl.formatMessage({ id: 'invoiceTitle' })} {invoiceNumber}
                <span className="invoice-title-underline" />
              </div>
              {/* <div className="invoice-agency">{intl.formatMessage({ id: 'webrushStudio' })}</div> */}
            </div>
            <div className="invoice-original-label">{intl.formatMessage({ id: 'originalLabel', defaultMessage: 'Original' })}</div>
          </div>
          <div className="invoice-details-row">
            {/* Issued To (Client) */}
            <div className="invoice-details-block" style={{ minWidth: 200 }}>
              <div className="invoice-details-label">{intl.formatMessage({ id: 'issuedTo' })}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}></span> {clientName}</div>
              <div className="invoice-details-value">{clientAddress}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>{intl.formatMessage({ id: 'reg' })}</span> {clientReg}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>{intl.formatMessage({ id: 'vat' })}</span> {clientVAT}</div>
            </div>
            {/* Issued By (Agency) */}
            <div className="invoice-details-block" style={{ textAlign: 'right' }}>
              <div className="invoice-details-label">{intl.formatMessage({ id: 'issuedBy' })}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}></span>{issuerName}</div>
              <div className="invoice-details-value">{issuerAddress}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>{intl.formatMessage({ id: 'reg' })}</span> {issuerReg}</div>
              <div className="invoice-details-value"><span style={{ fontWeight: 600 }}>{intl.formatMessage({ id: 'vat' })}</span> {issuerVAT}</div>
            </div>
          </div>
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>{itemNumberLabel}</th>
                <th style={{ width: '25%', wordBreak: 'break-word', whiteSpace: 'normal', textAlign: 'left' }}>{itemLabel}</th>
                <th style={{ width: '15%', wordBreak: 'break-word', whiteSpace: 'normal', textAlign: 'center' }}>{intl.formatMessage({ id: 'qty' })}</th>
                <th style={{ width: '10%', textAlign: 'center' }}>{intl.formatMessage({ id: 'unitPrice' })}</th>
                <th style={{ width: '10%', textAlign: 'center' }}>{intl.formatMessage({ id: 'netAmount' })}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                if (!('properties' in line)) return null;
                const props = (line as any).properties;
                return (
                  <tr key={line.id}>
                    <td style={{ width: '5%' }}>{idx + 1}</td>
                    <td style={{ width: '25%', wordBreak: 'break-word', whiteSpace: 'normal', textAlign: 'left' }}>{getText(props['Item Description'])}</td>
                    <td style={{ width: '15%', wordBreak: 'break-word', whiteSpace: 'normal', textAlign: 'center' }}>{getNumber(props.Quantity)}</td>
                    <td style={{ width: '10%', textAlign: 'center' }}>{getNumber(props['Unit Price']).toFixed(2)}</td>
                    <td style={{ width: '10%', textAlign: 'center' }}>{getFormulaNumber(props['Net Amount']).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Invoice Summary Row: Two Columns */}
          <div className="invoice-summary-row">
            {/* Left: In Words, Issue Date, Due Date */}
            <div className="invoice-summary-left">
              <div style={{ fontWeight: 500, textAlign: 'left', marginBottom: 8 }}>
                {intl.formatMessage({ id: 'inWords' })}: <span style={{ fontStyle: 'italic', marginLeft: 8 }}>{totalDueInWords.charAt(0).toUpperCase() + totalDueInWords.slice(1)}</span>
              </div>
              <div style={{ fontWeight: 500, textAlign: 'left', marginBottom: 4 }}>
                {intl.formatMessage({ id: 'issueDate' })} <span style={{ marginLeft: 8 }}>{formatDateDMY(issueDate)}</span>
              </div>
              <div style={{ fontWeight: 500, textAlign: 'left' }}>
                {intl.formatMessage({ id: 'dueDate' })} <span style={{ marginLeft: 8 }}>{formatDateDMY(dueDate)}</span>
              </div>
            </div>
            {/* Right: Totals */}
            <div className="invoice-summary-totals">
              <div><span>{intl.formatMessage({ id: 'totalNet' })}</span> <span>{netAmountSum.toFixed(2)}</span></div>
              <div><span>{intl.formatMessage({ id: 'vatBase' })}</span> <span>{netAmountSum.toFixed(2)}</span></div>
              <div><span>{intl.formatMessage({ id: 'vatAmount' })}</span> <span>{vatAmountSum.toFixed(2)}</span></div>
              <div><span>{intl.formatMessage({ id: 'totalDue' })}</span> <span className="total" style={{ fontSize: '1.35rem', fontWeight: 700, marginLeft: 8 }}>{currency === 'BGN' ? `${amountWithTaxSum.toFixed(2)} ${currentLocale === 'bg' ? 'лв.' : 'BGN'}` : `€${amountWithTaxSum.toFixed(2)}`}</span></div>
            </div>
          </div>
          {/* BGN conversion line if currency is BGN, below the summary row, right aligned */}
          {currency === 'BGN' && (
            <div style={{ marginTop: 0, marginBottom: 8, fontSize: '1rem', color: '#666', fontStyle: 'italic', textAlign: 'right', width: '100%' }}>
              {intl.formatMessage({ id: 'bgnConversionLine' }, { euroPrice: (amountWithTaxSum / 1.95583).toFixed(2) })}
            </div>
          )}
          <div className="payment-instructions">
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '1.08rem', color: '#192442' }}>{intl.formatMessage({ id: 'paymentMethods' })}</div>
            <div className="payment-row">
              <span className="payment-label">{intl.formatMessage({ id: 'cardPayment' })}</span>
              <span className="payment-detail">{intl.formatMessage({ id: 'onlineViaStripe' })}</span>
            </div>
            <div className="payment-row" style={{ textAlign: 'left' }}>
              <span className="payment-label">{intl.formatMessage({ id: 'bankTransfer' })}</span>
              <span className="payment-detail"><span className="bank-details-iban">{intl.formatMessage({ id: 'bankDetails' })}</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Invoice; 

export const revalidate = 86400; // 24 hours 
