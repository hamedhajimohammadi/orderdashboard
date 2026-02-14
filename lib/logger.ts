import { prisma } from '@/lib/prisma';

export async function logOrderAction({
  orderId,
  adminName,
  action,
  oldStatus,
  newStatus,
  description,
}: {
  orderId: number;
  adminName: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  description?: string;
}) {
  try {
    await prisma.orderLog.create({
      data: {
        order_id: orderId,
        admin_name: adminName,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to create order log:', error);
  }
}
