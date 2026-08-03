import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import type {
  Device,
  DeviceCondition,
} from '../types/device';
import { formatCurrency } from './currency';
import {
  DOCUMENT_BRAND,
  formatDocumentGeneratedAt,
  pdfColors,
} from './documentTheme';

const conditionLabels: Record<
  DeviceCondition,
  string
> = {
  NOVO: 'Novo',
  SEMINOVO: 'Seminovo',
  USADO: 'Usado',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function createFileName() {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return `dispositivos-disponiveis-${date}.pdf`;
}

export function generateDevicesPdf(
  devices: Device[],
) {
  const availableDevices = devices
    .filter(
      (device) =>
        device.status === 'DISPONIVEL',
    )
    .sort((firstDevice, secondDevice) => {
      const firstName =
        `${firstDevice.brand} ${firstDevice.model}`;

      const secondName =
        `${secondDevice.brand} ${secondDevice.model}`;

      return firstName.localeCompare(
        secondName,
        'pt-BR',
      );
    });

  if (availableDevices.length === 0) {
    throw new Error(
      'Nenhum dispositivo disponível foi selecionado.',
    );
  }

  const document = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth =
    document.internal.pageSize.getWidth();

  const pageHeight =
    document.internal.pageSize.getHeight();

  const generatedAt =
    formatDocumentGeneratedAt();

  const marginX = 14;
  const headerBottom = 36;

  function drawHeader() {
    document.setFillColor(
      ...pdfColors.primary,
    );
    document.rect(
      0,
      0,
      pageWidth,
      3.2,
      'F',
    );

    document.setFont(
      'helvetica',
      'bold',
    );
    document.setFontSize(9);
    document.setTextColor(
      ...pdfColors.primary,
    );
    document.text(
      DOCUMENT_BRAND.toUpperCase(),
      marginX,
      12,
    );

    document.setFontSize(16);
    document.setTextColor(
      ...pdfColors.slate950,
    );
    document.text(
      'Dispositivos disponíveis',
      marginX,
      20,
    );

    document.setFont(
      'helvetica',
      'normal',
    );
    document.setFontSize(9);
    document.setTextColor(
      ...pdfColors.slate600,
    );
    document.text(
      `Gerado em ${generatedAt}`,
      pageWidth - marginX,
      12,
      { align: 'right' },
    );
    document.text(
      `${availableDevices.length} aparelho${availableDevices.length === 1 ? '' : 's'}`,
      pageWidth - marginX,
      18,
      { align: 'right' },
    );

    document.setDrawColor(
      ...pdfColors.slate200,
    );
    document.setLineWidth(0.3);
    document.line(
      marginX,
      headerBottom - 4,
      pageWidth - marginX,
      headerBottom - 4,
    );
  }

  drawHeader();

  autoTable(document, {
    startY: headerBottom,

    head: [
      [
        'Dispositivo',
        'Armazenamento',
        'Cor',
        'Condição',
        'Bateria',
        'IMEI',
        'Preço',
        'Entrada',
      ],
    ],

    body: availableDevices.map(
      (device) => [
        `${device.brand} ${device.model}`,
        device.storage,
        device.color ?? 'Não informada',
        conditionLabels[
          device.condition
        ],
        device.batteryHealth === null
          ? 'Não informada'
          : `${device.batteryHealth}%`,
        device.imei ?? 'Não informado',
        device.salePrice === null
          ? 'Pendente'
          : formatCurrency(
              device.salePrice,
            ),
        formatDate(device.entryDate),
      ],
    ),

    theme: 'plain',

    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
      overflow: 'linebreak',
      valign: 'middle',
      textColor: pdfColors.slate800,
      lineColor: pdfColors.slate200,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor: pdfColors.primary,
      textColor: pdfColors.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: { top: 3.5, right: 2.5, bottom: 3.5, left: 2.5 },
    },

    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },

    columnStyles: {
      0: {
        cellWidth: 42,
        fontStyle: 'bold',
      },
      1: {
        cellWidth: 25,
        halign: 'center',
      },
      2: {
        cellWidth: 27,
      },
      3: {
        cellWidth: 23,
        halign: 'center',
      },
      4: {
        cellWidth: 20,
        halign: 'center',
      },
      5: {
        cellWidth: 38,
      },
      6: {
        cellWidth: 27,
        halign: 'right',
        fontStyle: 'bold',
      },
      7: {
        cellWidth: 25,
        halign: 'center',
      },
    },

    margin: {
      top: headerBottom,
      right: marginX,
      bottom: 18,
      left: marginX,
    },

    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader();
      }
    },
  });

  const totalPages =
    document.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    document.setPage(pageNumber);

    document.setDrawColor(
      ...pdfColors.slate200,
    );
    document.setLineWidth(0.3);
    document.line(
      marginX,
      pageHeight - 12,
      pageWidth - marginX,
      pageHeight - 12,
    );

    document.setFont(
      'helvetica',
      'normal',
    );
    document.setFontSize(8);
    document.setTextColor(
      ...pdfColors.slate400,
    );

    document.text(
      `${DOCUMENT_BRAND} · Relatório de estoque disponível`,
      marginX,
      pageHeight - 7,
    );

    document.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7,
      {
        align: 'right',
      },
    );
  }

  document.save(createFileName());
}
