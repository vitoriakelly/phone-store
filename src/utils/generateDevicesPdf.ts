import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import type {
  Device,
  DeviceCondition,
} from '../types/device';
import { formatCurrency } from './currency';

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

function formatGeneratedAt() {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(new Date());
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

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);

  document.text(
    'Dispositivos disponíveis',
    14,
    18,
  );

  document.setFont(
    'helvetica',
    'normal',
  );
  document.setFontSize(10);

  document.text(
    `Gerado em: ${formatGeneratedAt()}`,
    14,
    26,
  );

  document.text(
    `Quantidade: ${availableDevices.length}`,
    14,
    32,
  );

  autoTable(document, {
    startY: 38,

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

    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'middle',
    },

    headStyles: {
      fontStyle: 'bold',
      halign: 'center',
    },

    columnStyles: {
      0: {
        cellWidth: 42,
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
      },

      7: {
        cellWidth: 25,
        halign: 'center',
      },
    },

    margin: {
      top: 38,
      right: 14,
      bottom: 16,
      left: 14,
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

    document.setFont(
      'helvetica',
      'normal',
    );
    document.setFontSize(8);

    document.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 7,
      {
        align: 'right',
      },
    );

    document.text(
      'Relatório de estoque disponível',
      14,
      pageHeight - 7,
    );
  }

  document.save(createFileName());
}