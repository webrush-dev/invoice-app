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
import React, { useRef } from 'react';

interface InvoiceClientProps {
  invoice: GetPageResponse;
  lines: (PageObjectResponse | PartialPageObjectResponse)[];
  client: GetPageResponse | null;
}

const InvoiceClient: React.FC<InvoiceClientProps> = ({ invoice, lines, client }) => {
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

  // Ref for the invoice container
  const invoiceRef = useRef<HTMLDivElement>(null);

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined') return;
    // @ts-expect-error: No types for html2pdf.js
    const html2pdf = (await import('html2pdf.js')).default;
    if (invoiceRef.current) {
      // Add A4 sizing class
      invoiceRef.current.classList.add('pdf-a4');
      await html2pdf(invoiceRef.current, {
        margin: 0, // mm, set to 0 for minimal whitespace
        filename: `Invoice-${(invoice as any).properties.Invoice?.title?.[0]?.plain_text || invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      });
      // Remove A4 sizing class
      invoiceRef.current.classList.remove('pdf-a4');
      setTimeout(() => {
        document.querySelectorAll('canvas, .html2pdf__overlay').forEach(el => el.remove());
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
              <div className="w-full bg-white rounded p-3 text-[#192442] text-sm shadow mb-2">
                <div className="font-semibold mb-1">Bank Transfer</div>
                <div><b>IBAN:</b> BG00XXXX00000000000000</div>
                <div><b>BIC:</b> FINVXXXX</div>
                <div><b>Bank:</b> Example Bank</div>
                <div><b>Recipient:</b> Webrush Studio</div>
              </div>
              <Button className="download-btn w-full mt-3" onClick={handleDownloadPDF}>
                Download as PDF
              </Button>
            </CardContent>
          </Card>
          {/* Invoice Content */}
          <div className="flex-1">
            <Invoice invoice={invoice} lines={lines} client={client} invoiceRef={invoiceRef} />
          </div>
        </div>
      </Dialog>
      {/* Footer */}
      <footer className="w-full bg-[#f5f6fa] text-[#192442] text-center py-5 text-base font-medium border-t border-[#e5e5e5] mt-8">
        © 2024 Webrush Studio — webrush.studio
      </footer>
    </div>
  );
};

export default InvoiceClient; 