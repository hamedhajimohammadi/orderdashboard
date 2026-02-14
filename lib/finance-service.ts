import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';

export class FinanceService {
  
  /**
   * Calculate True Net Profit for a specific date
   */
  static async getDailyProfit(date: Date = new Date()) {
    const start = startOfDay(date);
    const end = endOfDay(date);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const daysInMonth = getDaysInMonth(date);

    // 1. Calculate Daily Gross Profit from Orders
    // Formula: Sum of (final_payable - commission_cost - affiliate_amount)
    const orders = await prisma.order.findMany({
      where: {
        status: 'completed',
        updated_at: {
          gte: start,
          lte: end
        }
      },
      select: {
        final_payable: true,
        commission_cost: true,
        affiliate_amount: true
      }
    });

    const dailyGrossProfit = orders.reduce((acc, order) => {
      const revenue = Number(order.final_payable) || 0;
      const cost = Number(order.commission_cost) || 0;
      const affiliate = Number(order.affiliate_amount) || 0;
      return acc + (revenue - cost - affiliate);
    }, 0);

    // 2. Calculate Daily Overhead
    // Sum of all overhead expenses in the current month / Days in Month
    const overheadExpenses = await prisma.expense.aggregate({
      where: {
        is_overhead: true,
        due_date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalMonthlyOverhead = Number(overheadExpenses._sum.amount) || 0;
    const dailyOverhead = totalMonthlyOverhead / daysInMonth;

    // 3. Calculate Direct Daily Expenses
    // Expenses that are NOT overhead and are due/paid today
    // Assuming we use payment_date for paid expenses or due_date for accrued?
    // Prompt says "daily ad spend if logged daily". Usually logged with due_date = today.
    const directExpenses = await prisma.expense.aggregate({
      where: {
        is_overhead: false,
        due_date: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      }
    });

    const dailyDirectCost = Number(directExpenses._sum.amount) || 0;

    // Final Calculation
    const trueNetProfit = dailyGrossProfit - dailyDirectCost - dailyOverhead;

    return {
      date,
      dailyGrossProfit,
      dailyOverhead,
      dailyDirectCost,
      trueNetProfit,
      orderCount: orders.length
    };
  }

  /**
   * Get Financial Summary for a specific range
   */
  static async getRangeSummary(start: Date, end: Date) {
    // Total Revenue
    const orders = await prisma.order.findMany({
      where: {
        status: 'completed',
        updated_at: {
          gte: start,
          lte: end
        }
      },
      select: {
        final_payable: true,
        commission_cost: true,
        affiliate_amount: true
      }
    });

    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.final_payable), 0);
    const totalGrossProfit = orders.reduce((acc, o) => {
        return acc + (Number(o.final_payable) - Number(o.commission_cost) - Number(o.affiliate_amount));
    }, 0);

    // Total Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        due_date: {
          gte: start,
          lte: end
        }
      },
      include: {
        category: true
      }
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // Group by Category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const catName = e.category.name;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(e.amount);
    });

    // True Net Profit
    const netProfit = totalGrossProfit - totalExpenses;

    return {
      totalRevenue,
      totalGrossProfit,
      totalExpenses,
      netProfit,
      expensesByCategory
    };
  }

  /**
   * Get Monthly Financial Summary
   */
  static async getMonthlySummary(date: Date = new Date()) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return this.getRangeSummary(start, end);
  }
}
