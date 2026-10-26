import { describe, expect, it } from 'vitest';
import { invoiceFinancials, summarizeInvoices } from './invoice-financials';
describe('actual invoice profitability', () => {
  it('distinguishes 10000 revenue from 5000 profit when purchase cost is 5000', () => {
    expect(invoiceFinancials({ invoice_type: 'customer', total_amount: 10000, purchase_cost: 5000, selling_expenses: 0 })).toMatchObject({ revenue: 10000, expenses: 5000, profit: 5000 });
  });
  it('subtracts selling expenses in addition to the purchase cost', () => {
    expect(invoiceFinancials({ invoice_type: 'customer', total_amount: 10000, purchase_cost: 5000, selling_expenses: 200 }).profit).toBe(4800);
  });
  it('never equates an unknown purchase cost with a zero cost', () => {
    expect(invoiceFinancials({ invoice_type: 'customer', total_amount: 10000, purchase_cost: null, selling_expenses: 0 }).profit).toBeNull();
  });
  it('counts completed sales only, not drafts or cancelled sales', () => {
    const invoice = { invoice_type: 'customer', total_amount: 10000, purchase_cost: 5000, selling_expenses: 0 };
    expect(summarizeInvoices([{ ...invoice, status: 'paid' }, { ...invoice, status: 'draft' }, { ...invoice, status: 'cancelled' }])).toMatchObject({ revenue: 10000, expenses: 5000, profit: 5000 });
  });
});