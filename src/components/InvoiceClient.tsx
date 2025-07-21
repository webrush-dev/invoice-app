"use client";
import Invoice from '@/components/Invoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { GetPageResponse, PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { pdf } from '@react-pdf/renderer';
import { toWords } from 'number-to-words';
import nums2wordsBG from 'nums2words-bg';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import InvoicePDF from './InvoicePDF';
import LanguageSwitcher from './LanguageSwitcher';

interface InvoiceClientProps {
  invoice: GetPageResponse;
  lines: (PageObjectResponse | PartialPageObjectResponse)[];
  client: GetPageResponse | null;
  currency: string;
}

const InvoiceClient: React.FC<InvoiceClientProps> = ({ invoice, lines, client, currency }) => {
  const intl = useIntl();
  const currentLocale = intl.locale;
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Function to handle printing the PDF
  const handlePrintPdf = () => {
    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Extract client logo and name for side panel
  let clientLogoUrl = null;
  let clientName = 'N/A';
  if (client && 'properties' in client) {
    const clientProps = (client as any).properties;
    clientName = clientProps.Name?.title?.[0]?.plain_text || 'N/A';
    if (clientProps['Logo'] && clientProps['Logo'].files && clientProps['Logo'].files[0]) {
      const fileObj = clientProps['Logo'].files[0];
      clientLogoUrl = fileObj.external?.url || fileObj.file?.url || null;
    }
  }

  // Extract invoice properties
  const invoiceProps = (invoice as any).properties;
  const invoiceNumber = invoiceProps.Invoice?.title?.[0]?.plain_text || invoice.id;
  const issueDate = invoiceProps['Issue Date']?.date?.start || '';
  const dueDate = invoiceProps['Due Date']?.date?.start || '';
  // Issuer info (from rollups)
  let issuerName = '';
  let issuerReg = '';
  let issuerVAT = '';
  let issuerAddress = '';
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

  // Extract client info from rollups (like in Invoice.tsx)
  let clientReg = '';
  let clientVAT = '';
  let clientAddress = '';
  if (invoiceProps['Client Reg #']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
    clientReg = invoiceProps['Client Reg #'].rollup.array[0].rich_text[0].plain_text;
  }
  if (invoiceProps['Client VAT']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
    clientVAT = invoiceProps['Client VAT'].rollup.array[0].rich_text[0].plain_text;
  }
  if (invoiceProps['Client Address']?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text) {
    clientAddress = invoiceProps['Client Address'].rollup.array[0].rich_text[0].plain_text;
  }

  // Utility to get text from Notion property (like getText in Invoice.tsx)
  function getText(prop: any): string {
    return prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || '';
  }

  // Calculate totals and line items for PDF
  function getNumber(prop: any): number {
    return typeof prop?.number === 'number' ? prop.number : 0;
  }
  function getFormulaNumber(prop: any): number {
    return typeof prop?.formula?.number === 'number' ? prop.formula.number : 0;
  }
  const pdfLines = lines
    .map((line) => {
      if (!('properties' in line)) return null;
      const props = (line as any).properties;
      return {
        description: getText(props['Item Description']),
        quantity: getNumber(props.Quantity),
        unitPrice: getNumber(props['Unit Price']),
        netAmount: getFormulaNumber(props['Net Amount']),
      };
    })
    .filter((l): l is { description: string; quantity: number; unitPrice: number; netAmount: number } => l !== null);
  const netAmountSum = pdfLines.reduce((sum, l) => sum + (l?.netAmount || 0), 0);
  const amountWithTaxSum = lines.reduce((sum, line) => {
    if ('properties' in line) {
      const props = (line as any).properties;
      return sum + getFormulaNumber(props['Amount With Tax']);
    }
    return sum;
  }, 0);
  const vatAmountSum = lines.reduce((sum, line) => {
    if ('properties' in line) {
      const props = (line as any).properties;
      return sum + getFormulaNumber(props['Net Amount']) * getNumber(props['Tax Rate']);
    }
    return sum;
  }, 0);

  // Localize in words
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
      } catch {
        totalDueInWords = '';
      }
    } else {
      const integerPart = Math.floor(amountWithTaxSum);
      const decimalPart = Math.round((amountWithTaxSum - integerPart) * 100);
      const integerWords = toWords(integerPart);
      const centsWords = decimalPart > 0 ? toWords(decimalPart) + ' stotinki' : '';
      totalDueInWords = centsWords ? `${integerWords} and ${centsWords}` : integerWords;
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
      } catch {
        totalDueInWords = '';
      }
    } else {
      const integerPart = Math.floor(amountWithTaxSum);
      const decimalPart = Math.round((amountWithTaxSum - integerPart) * 100);
      const integerWords = toWords(integerPart);
      const centsWords = decimalPart > 0 ? toWords(decimalPart) + ' cents' : '';
      totalDueInWords = centsWords ? `${integerWords} and ${centsWords}` : integerWords;
    }
  }

  // Localized labels
  const pdfLabels = {
    invoiceTitleLabel: intl.formatMessage({ id: 'invoiceTitle' }),
    originalLabel: intl.formatMessage({ id: 'originalLabel' }),
    issuedToLabel: intl.formatMessage({ id: 'issuedTo' }),
    issuedByLabel: intl.formatMessage({ id: 'issuedBy' }),
    regLabel: intl.formatMessage({ id: 'reg' }),
    vatLabel: intl.formatMessage({ id: 'vat' }),
    addressLabel: intl.formatMessage({ id: 'address' }),
    descriptionLabel: intl.formatMessage({ id: 'description' }),
    qtyLabel: intl.formatMessage({ id: 'qty' }),
    unitPriceLabel: intl.formatMessage({ id: 'unitPrice' }),
    netAmountLabel: intl.formatMessage({ id: 'netAmount' }),
    totalNetLabel: intl.formatMessage({ id: 'totalNet' }),
    vatBaseLabel: intl.formatMessage({ id: 'vatBase' }),
    vatAmountLabel: intl.formatMessage({ id: 'vatAmount' }),
    totalDueLabel: intl.formatMessage({ id: 'totalDue' }),
    inWordsLabel: intl.formatMessage({ id: 'inWords' }),
    issueDateLabel: intl.formatMessage({ id: 'issueDate' }),
    dueDateLabel: intl.formatMessage({ id: 'dueDate' }),
    paymentMethodsLabel: intl.formatMessage({ id: 'paymentMethods' }),
    cardPaymentLabel: intl.formatMessage({ id: 'cardPayment' }),
    onlineViaStripeLabel: intl.formatMessage({ id: 'onlineViaStripe' }),
    bankTransferLabel: intl.formatMessage({ id: 'bankTransfer' }),
    bankDetailsLabel: intl.formatMessage({ id: 'bankDetails' }),
    itemNumberLabel: currentLocale === 'bg' ? '№' : 'No.',
    itemLabel: currentLocale === 'bg' ? 'Стока/услуга' : 'Item',
  };

  // Calculate BGN conversion line for PDF if needed
  let bgnConversionLine: string | undefined = undefined;
  if (currency === 'BGN') {
    const euroPrice = (amountWithTaxSum / 1.95583).toFixed(2);
    bgnConversionLine = intl.formatMessage({ id: 'bgnConversionLine' }, { euroPrice });
  }

  // Memoize the PDF document props
  const pdfDocProps = {
    invoiceNumber,
    issueDate,
    dueDate,
    clientName,
    clientAddress,
    clientReg,
    clientVAT,
    issuerName,
    issuerAddress,
    issuerReg,
    issuerVAT,
    lines: pdfLines,
    netAmountSum,
    vatAmountSum,
    amountWithTaxSum,
    totalDueInWords,
    labels: pdfLabels,
    currency,
    bgnConversionLine,
  };

  // Regenerate PDF only when invoice data or locale changes
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);
    const generate = async () => {
      const doc = <InvoicePDF {...pdfDocProps} />;
      const asPdf = pdf([]);
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      if (isMounted) {
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(URL.createObjectURL(blob));
        setIsGenerating(false);
      }
    };
    generate();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pdfDocProps), currentLocale]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col">
        <Dialog>
          <div className="flex flex-col md:flex-row max-w-5xl mx-auto w-full gap-8 py-8">
            {/* Side Panel */}
            <Card className="w-full md:w-72 bg-[#f5f6fa] rounded-xl shadow-md flex flex-col items-center h-fit sticky top-8">
              <CardHeader className="flex flex-col items-center pb-0">
                {clientLogoUrl && (
                  <img src={clientLogoUrl} alt="Client Logo" className="max-w-[70px] max-h-[40px] mb-2 rounded bg-white object-contain shadow" />
                )}
                <div className="font-semibold text-[#192442] text-lg text-center mb-2">{clientName}</div>
              </CardHeader>
              <CardContent className="w-full pt-0">
                <div className="mb-4 flex justify-center">
                  <LanguageSwitcher />
                </div>
                <DialogTrigger asChild>
                  <Button className="w-full mb-3 bg-[#635bff] hover:bg-[#4f46e5] font-semibold">
                    Pay via Stripe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Stripe Unavailable</DialogTitle>
                    <DialogDescription>
                      Sorry, the Stripe payment service is currently unavailable.<br />
                      We are working to enable this feature soon.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogContent>
                <div className="w-full bg-white rounded p-3 text-[#192442] text-sm shadow mb-2" style={{ textAlign: 'left' }}>
                  <div className="font-semibold mb-1">Bank Transfer</div>
                  <div><b>IBAN:</b> <span className="bank-details-iban">BG84UBBS80021080174450</span></div>
                  <div><b>BIC:</b> UBBSBGSF</div>
                  <div><b>Bank:</b> Обединена Българска Банка</div>
                  <div><b>Recipient:</b> Webrush Studio</div>
                </div>
                {pdfBlobUrl && (
                  <>
                    <Button
                      asChild
                      className="download-btn w-full mt-3"
                      disabled={isGenerating}
                    >
                      <a
                        href={pdfBlobUrl}
                        download={`Invoice-${invoiceNumber}.pdf`}
                        tabIndex={isGenerating ? -1 : 0}
                      >
                        {isGenerating ? 'Generating PDF...' : 'Download as PDF'}
                      </a>
                    </Button>
                    <Button
                      onClick={handlePrintPdf}
                      className="w-full mt-2 bg-[#192442] hover:bg-[#11182b] font-semibold"
                      disabled={isGenerating}
                    >
                      {intl.formatMessage({ id: 'printPdf' })}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            {/* Invoice Content */}
            <div className="flex-1">
              <Invoice invoice={invoice} lines={lines} client={client} currency={currency} />
            </div>
          </div>
        </Dialog>
      </div>
      {/* Footer */}
      <footer className="w-full bg-[#f5f6fa] text-[#192442] text-center py-5 text-base font-medium border-t border-[#e5e5e5] mt-8">
        © 2025 Webrush Studio — webrush.studio
      </footer>
    </div>
  );
};

export default InvoiceClient; 

declare module 'nums2words-bg'; 