/**
 * Tema visual compartilhado para PDFs
 * e documentos de impressão do sistema.
 */

export const DOCUMENT_BRAND = 'Phone Store';

export const pdfColors = {
  primary: [29, 78, 216] as [number, number, number],
  primarySoft: [219, 234, 254] as [number, number, number],
  slate950: [15, 23, 42] as [number, number, number],
  slate800: [30, 41, 59] as [number, number, number],
  slate600: [100, 116, 139] as [number, number, number],
  slate400: [148, 163, 184] as [number, number, number],
  slate200: [226, 232, 240] as [number, number, number],
  slate100: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [241, 245, 249] as [number, number, number],
};

export function formatDocumentGeneratedAt(
  date: Date = new Date(),
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(date);
}

/**
 * CSS usado nos relatórios impressos
 * via janela de impressão do navegador.
 */
export function getPrintDocumentStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 28px;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      background: #ffffff;
    }

    .doc-accent {
      height: 4px;
      margin: -28px -28px 22px;
      background: linear-gradient(90deg, #1d4ed8, #3b82f6);
    }

    header.doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .doc-brand {
      display: block;
      margin-bottom: 6px;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    header.doc-header h1 {
      margin: 0;
      color: #0f172a;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }

    header.doc-header .doc-subtitle {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 11px;
    }

    .doc-meta {
      text-align: right;
    }

    .doc-meta strong {
      display: block;
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
    }

    .doc-meta p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 11px;
    }

    h2 {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .second-title {
      margin-top: 24px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }

    .summary article {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
    }

    .summary span {
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .summary strong {
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    thead {
      display: table-header-group;
    }

    tr {
      break-inside: avoid;
    }

    th,
    td {
      padding: 8px 7px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 8.5px;
      text-align: left;
      vertical-align: middle;
    }

    th {
      border-bottom: 0;
      color: #ffffff;
      background: #1d4ed8;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    th:first-child {
      border-radius: 8px 0 0 0;
    }

    th:last-child {
      border-radius: 0 8px 0 0;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    .doc-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 9px;
      text-align: center;
    }

    @media print {
      body {
        padding: 16px;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .doc-accent {
        margin: -16px -16px 18px;
      }
    }
  `;
}
