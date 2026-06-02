import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return String(d);
  }
}

// ─── Orders Export ────────────────────────────────────────────────────────────

type OrderRow = {
  orderNumber: string;
  type: string;
  status: string;
  title: string;
  licensePlate?: string | null;
  creatorName?: string | null;
  createdAt: Date | string;
  description?: string | null;
};

function ordersToRows(orders: OrderRow[]) {
  return orders.map(o => ({
    Número: o.orderNumber,
    Tipo: o.type,
    Status: o.status,
    Título: o.title,
    Placa: o.licensePlate ?? "",
    Criador: o.creatorName ?? "",
    "Data de Criação": formatDate(o.createdAt),
    Descrição: o.description ?? "",
  }));
}

export function exportToCSV(
  orders: OrderRow[],
  filename: string,
  filtersMeta?: string
) {
  const rows = ordersToRows(orders);
  const headers = Object.keys(rows[0] ?? {});
  const exportedAt = `Exportado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`;
  const filterLine = filtersMeta ? `Filtros aplicados: ${filtersMeta}` : "";
  const csvContent = [
    exportedAt,
    filterLine,
    "",
    headers.join(","),
    ...rows.map(row =>
      headers
        .map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(
  orders: OrderRow[],
  filename: string,
  filtersMeta?: string
) {
  const rows = ordersToRows(orders);
  const exportedAt = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
  // Add metadata rows before data
  const metaRows: any[] = [
    { Número: `Exportado em: ${exportedAt}` },
    ...(filtersMeta ? [{ Número: `Filtros: ${filtersMeta}` }] : []),
    {},
  ];
  const ws = XLSX.utils.json_to_sheet([...metaRows, ...rows], {
    skipHeader: false,
  });
  styleWorksheet(
    ws,
    rows.length + metaRows.length,
    Object.keys(rows[0] ?? {}).length
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ordens");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Inventory Export ─────────────────────────────────────────────────────────

type InventoryRow = {
  name: string;
  barcode?: string | null;
  unit: string;
  unitCost: string | number;
  currentQuantity: string | number;
};

function inventoryToRows(items: InventoryRow[]) {
  return items.map(i => {
    const qty = parseFloat(String(i.currentQuantity));
    const cost = parseFloat(String(i.unitCost));
    return {
      Nome: i.name,
      "Código de Barras": i.barcode ?? "",
      Unidade: i.unit,
      "Custo Unitário (R$)": isNaN(cost) ? 0 : cost,
      "Quantidade em Estoque": isNaN(qty) ? 0 : qty,
      "Custo Total (R$)":
        isNaN(cost) || isNaN(qty) ? 0 : parseFloat((cost * qty).toFixed(2)),
    };
  });
}

export function exportInventoryToCSV(items: InventoryRow[], filename: string) {
  const rows = inventoryToRows(items);
  const headers = Object.keys(rows[0] ?? {});
  const exportedAt = `Exportado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`;
  const csvContent = [
    exportedAt,
    "",
    headers.join(","),
    ...rows.map(row =>
      headers
        .map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportInventoryToExcel(
  items: InventoryRow[],
  filename: string
) {
  const rows = inventoryToRows(items);
  const ws = XLSX.utils.json_to_sheet(rows);
  styleWorksheet(ws, rows.length, Object.keys(rows[0] ?? {}).length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function styleWorksheet(ws: XLSX.WorkSheet, rows: number, cols: number) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  // Set column widths
  ws["!cols"] = Array.from({ length: cols }, () => ({ wch: 20 }));
  // Bold header row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A5F" } },
        alignment: { horizontal: "center" },
      };
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EMPRESAS = {
  GP: {
    nome: "G.P. PORTILHO SERVICOS E LOCACOES LTDA",
    endereco: "RUA EDGARD BARBOSA, 2.418 - JARDIM GUAPIMIRIM",
    cidade: "GUAPIMIRIM - RJ - BRASIL - 25.943-395",
    contato: "Tel(s) 21 2010-7897",
    fiscal: "09.423.342/0001-99 InscE ISENTO InscM 608267",
    cor: [30, 58, 95] as [number, number, number],
  },
  NP: {
    nome: "NOVA PINHO REBOQUE E LOCACOES LTDA",
    endereco: "GUAPIMIRIM - RJ",
    cidade: "GUAPIMIRIM - RJ - BRASIL",
    contato: "",
    fiscal: "",
    cor: [120, 80, 150] as [number, number, number],
  },
};

function getEmpresaInfo(order: any) {
  const empresaKey = order.contract?.empresa || order.vehicle?.empresa || "GP";
  return EMPRESAS[empresaKey as keyof typeof EMPRESAS] || EMPRESAS.GP;
}

function safeText(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPlate(order: any) {
  return (
    order.licensePlate || order.placaMatricula || order.vehicle?.plate || "—"
  );
}

function getMatricula(order: any) {
  return order.vehicle?.matricula || order.placaMatricula || "—";
}

function getModelo(order: any) {
  return (
    order.vehicle?.modelo ||
    order.vehicle?.name ||
    order.title ||
    "Veículo / Equipamento"
  );
}

function getKm(order: any) {
  return order.kmHorimetro || "0";
}

function getServicoTexto(order: any) {
  return (
    order.informeTecnico ||
    order.description ||
    order.title ||
    "Serviço não informado."
  );
}

function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(180, 180, 180);
  doc.line(15, pageHeight - 16, pageWidth - 15, pageHeight - 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);

  doc.text("Sistema de Gestão de Frota", pageWidth / 2, pageHeight - 9, {
    align: "center",
  });
}

function drawOrderInfoBox(doc: jsPDF, order: any, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxX = 10;
  const boxW = pageWidth - 20;
  const boxH = 50;

  const plate = getPlate(order);
  const matricula = getMatricula(order);
  const modelo = getModelo(order);
  const km = getKm(order);
  const tipoServico = safeText(order.tipoServico, "CORRETIVA").toUpperCase();

  const abertura = formatDate(order.createdAt);
  const fechamento = order.completedAt
    ? formatDate(order.completedAt)
    : format(new Date(), "dd/MM/yyyy HH:mm:ss");

  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.35);
  doc.rect(boxX, y, boxW, boxH);

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.15);

  doc.line(boxX, y + 16, boxX + boxW, y + 16);
  doc.line(boxX, y + 32, boxX + boxW, y + 32);

  doc.line(boxX + 42, y, boxX + 42, y + 16);
  doc.line(boxX + 92, y, boxX + 92, y + 16);
  doc.line(boxX + 142, y, boxX + 142, y + 16);

  doc.line(boxX + 42, y + 16, boxX + 42, y + 32);
  doc.line(boxX + 82, y + 16, boxX + 82, y + 32);
  doc.line(boxX + 122, y + 16, boxX + 122, y + 32);
  doc.line(boxX + 152, y + 16, boxX + 152, y + 32);

  doc.line(boxX + 42, y + 32, boxX + 42, y + boxH);

  function label(text: string, x: number, yy: number) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(text, x, yy);
  }

  function value(text: string, x: number, yy: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(text, x, yy);
  }

  label("O. S. nº", boxX + 3, y + 6);
  value(safeText(order.orderNumber), boxX + 3, y + 12);

  label("Abertura", boxX + 45, y + 6);
  value(abertura, boxX + 45, y + 12);

  label("Fechamento", boxX + 95, y + 6);
  value(fechamento, boxX + 95, y + 12);

  label("Placa", boxX + 145, y + 6);
  value(plate, boxX + 145, y + 12);

  label("Tipo", boxX + 3, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(200, 0, 0);
  doc.text(tipoServico, boxX + 3, y + 28);
  doc.setTextColor(0, 0, 0);

  label("Horímetro", boxX + 45, y + 22);
  value("0", boxX + 45, y + 28);

  label("Hodômetro", boxX + 85, y + 22);
  value(km, boxX + 85, y + 28);

  label("Matrícula", boxX + 125, y + 22);
  value(matricula, boxX + 125, y + 28);

  label("Contrato", boxX + 155, y + 22);
  value(safeText(order.contrato || order.contract?.name), boxX + 155, y + 28);

  label("Modelo/Côr/Ano", boxX + 3, y + 39);

  const modeloLines = doc.splitTextToSize(modelo, boxW - 48);
  value(modeloLines.join(" "), boxX + 45, y + 39);
}

function drawOfficeAxleDiagram(doc: jsPDF, startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ESQUEMA DE EIXOS / PNEUS - PREENCHIMENTO MANUAL", 12, startY);

  doc.setDrawColor(150, 150, 150);
  doc.rect(12, startY + 4, pageWidth - 24, 52);

  const labels = [
    ["P1", 24, startY + 18],
    ["P2", 24, startY + 40],
    ["P3", 62, startY + 14],
    ["P4", 62, startY + 28],
    ["P5", 62, startY + 42],
    ["P6", 62, startY + 50],
    ["P7", 100, startY + 14],
    ["P8", 100, startY + 28],
    ["P9", 100, startY + 42],
    ["P10", 100, startY + 50],
    ["ESTEPE", 150, startY + 28],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  labels.forEach(([label, x, y]) => {
    doc.roundedRect(Number(x), Number(y) - 5, 18, 8, 1, 1);
    doc.text(String(label), Number(x) + 3, Number(y));
  });

  doc.line(20, startY + 29, 128, startY + 29);
  doc.text("FRENTE", 18, startY + 10);
  doc.text("TRASEIRA", 100, startY + 10);

  doc.text("Marca de fogo / Observações:", 135, startY + 12);
  doc.line(135, startY + 18, pageWidth - 16, startY + 18);
  doc.line(135, startY + 26, pageWidth - 16, startY + 26);
  doc.line(135, startY + 34, pageWidth - 16, startY + 34);
  doc.line(135, startY + 42, pageWidth - 16, startY + 42);
}

export function exportOrderToPdf(order: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const info = getEmpresaInfo(order);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(info.nome, 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(info.endereco, 15, 18);
  doc.text(info.cidade, 15, 23);
  doc.text(info.contato, 15, 28);
  doc.text(info.fiscal, 15, 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm:ss"), pageWidth - 15, 12, {
    align: "right",
  });
  doc.text("Página 1 de 1", pageWidth - 15, 18, { align: "right" });

  doc.line(15, 38, pageWidth - 15, 38);

  doc.setFontSize(10);
  doc.text("ORDEM DE SERVIÇO - OFICINA", pageWidth / 2, 44, {
    align: "center",
  });

  drawOrderInfoBox(doc, order, 50);

  let y = 108;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Serviço(s) a executar", 12, y);

  doc.setDrawColor(150, 150, 150);
  doc.line(12, y + 2, pageWidth - 12, y + 2);

  doc.setFont("helvetica", "normal");
  const serviceLines = doc.splitTextToSize(
    getServicoTexto(order),
    pageWidth - 24
  );
  doc.text(serviceLines, 12, y + 8);

  y += 12 + serviceLines.length * 5;
  if (y < 135) y = 135;

  autoTable(doc, {
    startY: y,
    head: [["Código", "Descrição do Item", "Qtd", "Unidade", "Observação"]],
    body:
      order.items?.length > 0
        ? order.items.map((item: any) => [
            item.inventoryItemId || "",
            item.itemName,
            item.quantity,
            item.unit || "UN",
            item.notes || "",
          ])
        : [["", "", "", "", ""]],
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: "right" },
      3: { cellWidth: 22 },
      4: { cellWidth: 55 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;
  if (y < 190) y = 190;

  drawOfficeAxleDiagram(doc, y);

  y += 68;

  if (y < 260) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.line(20, y, 85, y);
    doc.line(120, y, 190, y);
    doc.text("Responsável pela OS", 52, y + 5, { align: "center" });
    doc.text("Oficina / Executante", 155, y + 5, { align: "center" });
  }

  drawFooter(doc);

  doc.save(`OS_OFICINA_${order.orderNumber}.pdf`);
}

export function exportOrderToContractPdf(order: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const info = getEmpresaInfo(order);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(info.nome, 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(info.endereco, 15, 18);
  doc.text(info.cidade, 15, 23);
  doc.text(info.contato, 15, 28);
  doc.text(info.fiscal, 15, 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(format(new Date(), "dd/MM/yyyy HH:mm:ss"), pageWidth - 15, 12, {
    align: "right",
  });
  doc.text("Página 1 de 1", pageWidth - 15, 18, { align: "right" });

  doc.line(15, 38, pageWidth - 15, 38);

  doc.setFontSize(10);
  doc.text("O.S. ENCERRADA", pageWidth / 2, 44, { align: "center" });

  drawOrderInfoBox(doc, order, 50);

  let currentY = 108;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Serviço(s) executado(s)", 12, currentY);

  doc.setDrawColor(150, 150, 150);
  doc.line(12, currentY + 2, pageWidth - 12, currentY + 2);

  doc.setFont("helvetica", "normal");
  const serviceLines = doc.splitTextToSize(
    getServicoTexto(order),
    pageWidth - 24
  );
  doc.text(serviceLines, 12, currentY + 8);

  currentY += 12 + serviceLines.length * 5;
  if (currentY < 130) currentY = 130;

  const items = order.items ?? [];
  let totalGeral = 0;

  const body =
    items.length > 0
      ? items.map((item: any) => {
          const qty = Number(item.quantity || 0);
          const unitCost = Number(item.unitCost || 0);
          const total = qty * unitCost;
          totalGeral += total;

          return [
            safeText(item.inventoryItemId, ""),
            safeText(item.notes, "DIVERSOS"),
            safeText(item.itemName, ""),
            money(unitCost),
            money(total),
            money(qty),
            safeText(item.unit, "UN"),
            safeText(item.notes, "SERVIÇO EXTERNO"),
          ];
        })
      : [["", "", "Sem itens cadastrados", "", "", "", "", ""]];

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Código",
        "Nome do grupo",
        "Descrição",
        "Preço unitário",
        "Valor",
        "Qtd",
        "Unidade",
        "Grupo",
      ],
    ],
    body,
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 26 },
      2: { cellWidth: 65 },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 14, halign: "right" },
      6: { cellWidth: 14 },
      7: { cellWidth: 25 },
    },
  });
  currentY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 15
    : currentY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DIVERSOS", 122, currentY);
  doc.text("Sub total", 150, currentY);
  doc.text(money(totalGeral), pageWidth - 14, currentY, { align: "right" });

  currentY += 8;

  doc.setFontSize(9);
  doc.text("Total geral", 145, currentY);
  doc.text(money(totalGeral), pageWidth - 14, currentY, { align: "right" });

  currentY += 25;

  if (currentY > 260) {
    doc.addPage();
    currentY = 50;
  }

  const responsavelOS =
    order.creatorName || order.createdByName || "Responsável pela OS";

  const responsavelAutorizacao =
    order.authorizedByName ||
    order.approvedByName ||
    order.updatedByName ||
    "Responsável pela autorização";

  doc.setDrawColor(150, 150, 150);
  doc.line(20, currentY, 90, currentY);
  doc.line(pageWidth - 90, currentY, pageWidth - 20, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(responsavelOS, 55, currentY + 5, { align: "center" });
  doc.text(responsavelAutorizacao, pageWidth - 55, currentY + 5, {
    align: "center",
  });

  doc.setFontSize(7);
  doc.text("Responsável pela OS", 55, currentY + 10, { align: "center" });
  doc.text("Responsável pela autorização", pageWidth - 55, currentY + 10, {
    align: "center",
  });

  drawFooter(doc);

  doc.save(`OS_FECHAMENTO_${order.orderNumber}.pdf`);
}
// Alias para manter compatibilidade com nome antigo
// Alias para manter compatibilidade com nome antigo
export const exportOrderToContract = exportOrderToContractPdf;

// ─── Movements Export ─────────────────────────────────────────────────────────

type MovementRow = {
  inventoryItemId?: number;
  movementType: string;
  direction: string;
  quantity: string | number;
  reason: string;
  description?: string | null;
  orderNumber?: string | null;
  performedByName?: string | null;
  performedAt: Date | string;
  veiculo?: string | null;
};

export function exportMovementsToExcel(
  movements: MovementRow[],
  itemNamesOrFilename?: Record<number, string> | string,
  filenameArg?: string
) {
  const itemNames =
    typeof itemNamesOrFilename === "object" && itemNamesOrFilename !== null
      ? itemNamesOrFilename
      : {};

  const filename =
    typeof itemNamesOrFilename === "string"
      ? itemNamesOrFilename
      : filenameArg || "movimentacoes";

  const rows = movements.map(m => ({
    Item:
      m.inventoryItemId && itemNames[m.inventoryItemId]
        ? itemNames[m.inventoryItemId]
        : m.inventoryItemId
          ? String(m.inventoryItemId)
          : "",
    "Tipo de Movimento": m.movementType,
    Direção: m.direction,
    Quantidade: parseFloat(String(m.quantity)),
    Motivo: m.reason,
    Descrição: m.description ?? "",
    "Ordem Vinculada": m.orderNumber ?? "",
    "Realizado por": m.performedByName ?? "",
    Veículo: m.veiculo ?? "",
    Data: formatDate(m.performedAt),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  styleWorksheet(ws, rows.length, Object.keys(rows[0] ?? {}).length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
