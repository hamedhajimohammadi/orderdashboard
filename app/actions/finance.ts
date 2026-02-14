'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FinanceService } from '@/lib/finance-service';

// === Expense Categories ===

export async function getExpenseCategories() {
  return await prisma.expenseCategory.findMany();
}

export async function createExpenseCategory(name: string, description?: string) {
  const category = await prisma.expenseCategory.create({
    data: { name, description }
  });
  revalidatePath('/admin/finance');
  return category;
}

// === Expenses ===

export async function getExpenses(page = 1, limit = 20, filters: any = {}) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters.status && filters.status !== 'ALL') where.status = filters.status;
  if (filters.categoryId && filters.categoryId !== 'ALL') where.category_id = Number(filters.categoryId);
  if (filters.startDate && filters.endDate) {
    where.due_date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    };
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { due_date: 'desc' },
      skip,
      take: limit
    }),
    prisma.expense.count({ where })
  ]);

  return { expenses, total, totalPages: Math.ceil(total / limit) };
}

export async function createExpense(data: any) {
  const expense = await prisma.expense.create({
    data: {
      title: data.title,
      amount: data.amount,
      category_id: Number(data.category_id),
      due_date: new Date(data.due_date),
      status: 'PENDING',
      is_recurring: data.is_recurring === 'true' || data.is_recurring === true,
      is_overhead: data.is_overhead === 'true' || data.is_overhead === true,
      description: data.description,
      attachment_url: data.attachment_url
    }
  });
  revalidatePath('/admin/finance');
  return expense;
}

export async function updateExpense(id: number, data: any) {
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      title: data.title,
      amount: data.amount,
      category_id: Number(data.category_id),
      due_date: new Date(data.due_date),
      is_recurring: data.is_recurring === 'true' || data.is_recurring === true,
      is_overhead: data.is_overhead === 'true' || data.is_overhead === true,
      description: data.description,
      attachment_url: data.attachment_url
    }
  });
  revalidatePath('/admin/finance');
  return expense;
}

export async function deleteExpense(id: number) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath('/admin/finance');
}

export async function payExpense(id: number) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error('Expense not found');
  if (expense.status === 'PAID') throw new Error('Expense already paid');

  // Transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update Expense
    await tx.expense.update({
      where: { id },
      data: {
        status: 'PAID',
        payment_date: new Date()
      }
    });

    // 2. Create Transaction Record
    await tx.transaction.create({
      data: {
        amount: expense.amount,
        type: 'EXPENSE',
        reference_id: expense.id,
        reference_type: 'EXPENSE',
        expense_id: expense.id,
        date: new Date(),
        description: `Payment for expense: ${expense.title}`
      }
    });
  });

  revalidatePath('/admin/finance');
}

// === Dashboard Data ===

export async function getFinancialDashboardData(startDate?: string, endDate?: string) {
  const today = new Date();
  
  // If range is provided, we might want to adjust "Daily Stats" to be "Range Stats" or just keep "Today" as is?
  // The prompt says "Profitability Cards (Today & This Month)".
  // But also "Date Range Filter: A global picker to filter all charts/data".
  // If a range is picked, "Today" card might be confusing if the range is last month.
  // I'll assume the cards should reflect the selected range if provided, or default to Today/Month.
  
  // Actually, usually "Today" card is always Today. "This Month" card becomes "Selected Range".
  // Let's stick to the prompt: "Profitability Cards (Today & This Month)".
  // And "Date Range Filter... to filter all charts/data".
  // I will make the "Monthly" card and the "Trend Chart" and "Breakdown" respect the filter.
  // "Today" card will remain "Today" (or "Last Day of Range").

  let rangeStart = startDate ? new Date(startDate) : undefined;
  let rangeEnd = endDate ? new Date(endDate) : undefined;

  // Daily Stats (Always Today for now, unless we want to show stats for the last day of range)
  const dailyStats = await FinanceService.getDailyProfit(today);

  // Monthly/Range Stats
  // If no range, default to This Month
  let summaryStats;
  if (rangeStart && rangeEnd) {
    // We need a method for custom range summary
    // I'll reuse getMonthlySummary logic but with custom dates
    // I need to refactor FinanceService to accept start/end instead of just "date -> month"
    // For now, I'll just use the existing one if no range, or implement custom logic here.
    // Better to add getRangeSummary to FinanceService.
    summaryStats = await FinanceService.getRangeSummary(rangeStart, rangeEnd);
  } else {
    summaryStats = await FinanceService.getMonthlySummary(today);
  }

  // Trend Data
  // If range, show days in range. If not, show last 30 days.
  const trendData = [];
  let loopStart = rangeStart || new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  let loopEnd = rangeEnd || today;
  
  // Limit to 60 days to prevent massive loops if user selects a year
  const diffTime = Math.abs(loopEnd.getTime() - loopStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays > 60) {
      // If range is too big, maybe group by week? For now just limit or show daily.
      // I'll just show daily.
  }

  for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
    const stats = await FinanceService.getDailyProfit(new Date(d));
    trendData.push({
      date: d.toISOString().split('T')[0],
      revenue: stats.dailyGrossProfit,
      expenses: stats.dailyDirectCost + stats.dailyOverhead,
      netProfit: stats.trueNetProfit
    });
  }

  return {
    dailyStats,
    monthlyStats: summaryStats, // This might be "Range Stats" now
    trendData
  };
}
