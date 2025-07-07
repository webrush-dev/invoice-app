import {
    Document,
    Font,
    Image,
    Page,
    StyleSheet,
    Text,
    View
} from '@react-pdf/renderer';
import React from 'react';

Font.register({
  family: 'Inter',
  src: '/assets/Inter-Regular.otf',
  fontWeight: 400,
  fontStyle: 'normal',
});
Font.register({
  family: 'Inter',
  src: '/assets/Inter-Medium.otf',
  fontWeight: 500,
  fontStyle: 'normal',
});
Font.register({
  family: 'Inter',
  src: '/assets/Inter-Bold.otf',
  fontWeight: 700,
  fontStyle: 'normal',
});
Font.register({
  family: 'Inter',
  src: '/assets/Inter-Italic.otf',
  fontWeight: 400,
  fontStyle: 'italic',
});

// Define the props for the PDF invoice
interface InvoicePDFProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientReg: string;
  clientVAT: string;
  issuerName: string;
  issuerAddress: string;
  issuerReg: string;
  issuerVAT: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    netAmount: number;
  }>;
  netAmountSum: number;
  vatAmountSum: number;
  amountWithTaxSum: number;
  totalDueInWords: string;
  labels: {
    invoiceTitleLabel: string;
    originalLabel: string;
    issuedToLabel: string;
    issuedByLabel: string;
    regLabel: string;
    vatLabel: string;
    addressLabel: string;
    descriptionLabel: string;
    qtyLabel: string;
    unitPriceLabel: string;
    netAmountLabel: string;
    totalNetLabel: string;
    vatBaseLabel: string;
    vatAmountLabel: string;
    totalDueLabel: string;
    inWordsLabel: string;
    issueDateLabel: string;
    dueDateLabel: string;
    paymentMethodsLabel: string;
    cardPaymentLabel: string;
    onlineViaStripeLabel: string;
    bankTransferLabel: string;
    bankDetailsLabel: string;
    itemNumberLabel: string;
    itemLabel: string;
    bgnConversionLine?: string;
  };
  currency: string;
  bgnConversionLine?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#192442',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderColor: '#e5e5e5',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 35,
    gap: 8,
    position: 'relative',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
    objectFit: 'contain',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 0,
  },
  invoiceTitle: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: 700,
    color: '#192442',
    marginBottom: 2,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  underline: {
    width: 80,
    height: 3,
    backgroundColor: '#192442',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  originalLabel: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 500,
    marginLeft: 40,
    whiteSpace: 'nowrap',
    color: '#192442',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 32,
    marginBottom: 35,
  },
  detailsBlock: {
    minWidth: 180,
  },
  detailsLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    color: '#192442',
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: 0.01,
  },
  detailsValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#222',
    marginBottom: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 35,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  tableRowEven: {
    backgroundColor: '#f5f6fa',
  },
  tableHeader: {
    fontFamily: 'Inter',
    fontWeight: 600,
    backgroundColor: '#192442',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.02,
  },
  tableCell: {
    fontFamily: 'Inter',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#222',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
  },
  tableCellLeft: {
    textAlign: 'left',
  },
  tableCellDescription: {
    textAlign: 'left',
    flexShrink: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 40,
    marginTop: 35,
    marginBottom: 8,
  },
  summaryLeft: {
    fontFamily: 'Inter',
    flex: 1,
    minWidth: 180,
    maxWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 5,
  },
  summaryRight: {
    fontFamily: 'Inter',
    minWidth: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  summaryLabel: {
    fontFamily: 'Inter',
    color: '#222',
    fontWeight: 500,
    fontSize: 17,
  },
  summaryTotal: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 700,
    color: '#192442',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  paymentInstructionsBubble: {
    marginTop: 40,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    color: '#192442',
    fontSize: 17,
    fontWeight: 500,
    boxShadow: '0 1px 4px rgba(25,36,66,0.04)', // react-pdf does not support boxShadow, but keep for reference
    marginBottom: 0,
  },
  paymentInstructionsTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: 18,
    color: '#192442',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    marginRight: 8,
    color: '#192442',
    fontSize: 16,
    minWidth: 120,
  },
  paymentDetail: {
    fontFamily: 'Inter',
    color: '#222',
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
    marginLeft: 24,
  },
  bankDetailsIban: {
    fontFamily: 'Inter',
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
});

// Utility to format date as dd.mm.yyyy
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const InvoicePDF: React.FC<InvoicePDFProps> = (props) => {
  const {
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
    lines,
    netAmountSum,
    vatAmountSum,
    amountWithTaxSum,
    totalDueInWords,
    labels,
    currency,
    bgnConversionLine,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/assets/Webrush.png" style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.invoiceTitle}>{labels.invoiceTitleLabel} {invoiceNumber}</Text>
            <View style={styles.underline} />
          </View>
          <Text style={styles.originalLabel}>{labels.originalLabel}</Text>
        </View>
        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={[styles.detailsBlock, { alignItems: 'flex-start', flex: 1 }]}>
            <Text style={styles.detailsLabel}>{labels.issuedToLabel}</Text>
            <Text style={styles.detailsValue}>{clientName}</Text>
            <Text style={styles.detailsValue}>{clientAddress}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{labels.regLabel}</Text>
              <Text style={styles.detailsValue}> {clientReg}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{labels.vatLabel}</Text>
              <Text style={styles.detailsValue}> {clientVAT}</Text>
            </View>
          </View>
          <View style={[styles.detailsBlock, { alignItems: 'flex-end', flex: 1 }]}>
            <Text style={[styles.detailsLabel, { textAlign: 'right', width: '100%' }]}>{labels.issuedByLabel}</Text>
            <Text style={[styles.detailsValue, { textAlign: 'right', width: '100%' }]}>{issuerName}</Text>
            <Text style={[styles.detailsValue, { textAlign: 'right', width: '100%' }]}>{issuerAddress}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{labels.regLabel}</Text>
              <Text style={[styles.detailsValue, { textAlign: 'right' }]}> {issuerReg}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{labels.vatLabel}</Text>
              <Text style={[styles.detailsValue, { textAlign: 'right' }]}> {issuerVAT}</Text>
            </View>
          </View>
        </View>
        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { flex: 0.5 }]}> {labels.itemNumberLabel} </Text>
            <Text style={[styles.tableHeader, styles.tableCellDescription, { flex: 2.5 }]}>{labels.itemLabel}</Text>
            <Text style={[styles.tableHeader, { flex: 1 }]}>{labels.qtyLabel === 'Количество' ? 'Коли\u00ADчество' : labels.qtyLabel}</Text>
            <Text style={[styles.tableHeader, { flex: 1.5 }]}>{labels.unitPriceLabel}</Text>
            <Text style={[styles.tableHeader, { flex: 1.5 }]}>{labels.netAmountLabel}</Text>
          </View>
          {lines.map((line, idx) => (
            <View
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowEven] : [styles.tableRow]}
              key={idx}
            >
              <Text style={[styles.tableCell, styles.tableCellLeft, { flex: 0.5 }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.tableCellDescription, { flex: 2.5 }]}>{line.description}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{line.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{line.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{line.netAmount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>{labels.inWordsLabel}: <Text style={{ fontStyle: 'italic' }}>{totalDueInWords.charAt(0).toUpperCase() + totalDueInWords.slice(1)}</Text></Text>
            <Text style={styles.summaryLabel}>{labels.issueDateLabel} <Text style={{ fontWeight: 400 }}>{formatDateDMY(issueDate)}</Text></Text>
            <Text style={styles.summaryLabel}>{labels.dueDateLabel} <Text style={{ fontWeight: 400 }}>{formatDateDMY(dueDate)}</Text></Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryLabel}>{labels.totalNetLabel} <Text style={{ fontWeight: 400 }}>{netAmountSum.toFixed(2)}</Text></Text>
            <Text style={styles.summaryLabel}>{labels.vatBaseLabel} <Text style={{ fontWeight: 400 }}>{netAmountSum.toFixed(2)}</Text></Text>
            <Text style={styles.summaryLabel}>{labels.vatAmountLabel} <Text style={{ fontWeight: 400 }}>{vatAmountSum.toFixed(2)}</Text></Text>
            <Text style={styles.summaryLabel}>{labels.totalDueLabel} <Text style={styles.summaryTotal}>{currency === 'BGN' ? `${amountWithTaxSum.toFixed(2)} ${(labels.dueDateLabel === 'Срок за плащане:' ? 'лв.' : 'BGN')}` : `€${amountWithTaxSum.toFixed(2)}`}</Text></Text>
          </View>
        </View>
        {/* BGN conversion line if present, below the summary row, right aligned */}
        {bgnConversionLine && (
          <View style={{ marginTop: 12, marginBottom: 12, width: '100%', alignItems: 'flex-end', display: 'flex' }}>
            <Text style={{ fontSize: 15, color: '#666', fontStyle: 'italic', textAlign: 'right', padding: 4 }}>
              {bgnConversionLine}
            </Text>
          </View>
        )}
        {/* Payment Instructions Bubble */}
        <View style={styles.paymentInstructionsBubble}>
          <Text style={styles.paymentInstructionsTitle}>{labels.paymentMethodsLabel}</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{labels.cardPaymentLabel}</Text>
            <Text style={styles.paymentDetail}>{labels.onlineViaStripeLabel}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{labels.bankTransferLabel}</Text>
            <Text style={[styles.paymentDetail, styles.bankDetailsIban]}>{labels.bankDetailsLabel}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF; 