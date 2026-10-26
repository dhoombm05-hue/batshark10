export interface InvoiceFinancialInput {
  invoice_type: string;
  total_amount: number;
  purchase_cost: number | null;
  selling_expenses: number;
}

export function isSalesInvoice(type: string) {
  return type === 'customer' || type === 'umbrex_customer';
}

export function invoiceFinancials(invoice: InvoiceFinancialInput) {
  const revenue = isSalesInvoice(invoice.invoice_type) ? Number(invoice.total_amount) : 0;
  const costKnown = !isSalesInvoice(invoice.invoice_type) || invoice.purchase_cost !== null;
  const purchaseCost = isSalesInvoice(invoice.invoice_type) ? invoice.purchase_cost : Number(invoice.total_amount);
  const expenses = purchaseCost === null ? null : Number(purchaseCost) + Number(invoice.selling_expenses || 0);
  const profit = expenses === null ? null : revenue - expenses;
  return { revenue, purchaseCost, expenses, profit, costKnown };
}

export function summarizeInvoices(invoices: (InvoiceFinancialInput & { status: string })[]) {
  const paid = invoices.filter(invoice => invoice.status === 'paid');
  const sales = paid.filter(invoice => isSalesInvoice(invoice.invoice_type));
  const results = paid.map(invoiceFinancials);
  const missingCosts = sales.filter(invoice => invoice.purchase_cost === null).length;
  return {
    revenue: results.reduce((sum, item) => sum + item.revenue, 0),
    expenses: results.reduce((sum, item) => sum + (item.expenses ?? 0), 0),
    profit: missingCosts ? null : results.reduce((sum, item) => sum + (item.profit ?? 0), 0),
    missingCosts,
  };
}