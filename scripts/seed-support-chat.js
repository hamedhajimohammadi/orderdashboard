require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding support chat data...');

  // 1. Find some recent orders to attach conversations to
  const orders = await prisma.order.findMany({
    take: 3,
    orderBy: { created_at: 'desc' },
    include: { user: true }
  });

  if (orders.length === 0) {
    console.log('No orders found. Please ensure you have some orders in the database.');
    return;
  }

  // 2. Scenario 1: New Ticket (Waiting for Admin)
  const order1 = orders[0];
  const user1 = order1.user;
  
  if (user1) {
    console.log(`Creating chat for Order #${order1.wp_order_id} (User: ${user1.first_name})`);
    
    const conv1 = await prisma.conversation.create({
      data: {
        user_id: user1.id,
        guest_token: null,
        order_id: order1.id,
        status: 'WAITING_FOR_ADMIN',
        updated_at: new Date(),
        messages: {
          create: [
            {
              sender: 'USER',
              content: 'سلام، سفارش من کی ارسال میشه؟',
              is_read: false,
              created_at: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            },
            {
                sender: 'USER',
                content: 'خیلی عجله دارم لطفا پیگیری کنید.',
                is_read: false,
                created_at: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
            }
          ]
        }
      }
    });
    console.log(`Created Conversation ID: ${conv1.id} (Waiting for Admin)`);
  }

  // 3. Scenario 2: Ongoing Conversation (Open/Answered)
  if (orders.length > 1) {
    const order2 = orders[1];
    const user2 = order2.user;
    
    if (user2) {
        console.log(`Creating chat for Order #${order2.wp_order_id} (User: ${user2.first_name})`);

        const conv2 = await prisma.conversation.create({
        data: {
            user_id: user2.id,
            guest_token: null,
            order_id: order2.id,
            status: 'OPEN',
            updated_at: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
            messages: {
            create: [
                {
                    sender: 'USER',
                    content: 'سلام، محصول خریداری شده مشکل داره.',
                    is_read: true,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
                },
                {
                    sender: 'ADMIN',
                    content: 'سلام، لطفا مشکل رو دقیقا توضیح بدید.',
                    is_read: true, // User read it (mock)
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
                },
                {
                    sender: 'USER',
                    content: 'کد فعال سازی کار نمیکنه.',
                    is_read: true,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
                },
                {
                    sender: 'ADMIN',
                    content: 'بررسی کردم، کد صحیح برای شما ایمیل شد. لطفا چک کنید.',
                    is_read: false,
                    created_at: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
                }
            ]
            }
        }
        });
        console.log(`Created Conversation ID: ${conv2.id} (Ongoing)`);
    }
  }

  // 4. Scenario 3: Closed/Resolved
  if (orders.length > 2) {
    const order3 = orders[2];
    const user3 = order3.user;

    if (user3) {
        console.log(`Creating chat for Order #${order3.wp_order_id} (User: ${user3.first_name})`);

        const conv3 = await prisma.conversation.create({
        data: {
            user_id: user3.id,
            order_id: order3.id,
            status: 'CLOSED',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            messages: {
            create: [
                {
                    sender: 'USER',
                    content: 'تشکر از پشتیبانی خوبتون.',
                    is_read: true,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25)
                },
                {
                    sender: 'ADMIN',
                    content: 'خواهش میکنم، موفق باشید.',
                    is_read: true,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24)
                }
            ]
            }
        }
        });
        console.log(`Created Conversation ID: ${conv3.id} (Closed)`);
    }
  }

  // 5. Scenario 4: Guest User (No Order, just Token)
  console.log('Creating guest chat...');
  const conv4 = await prisma.conversation.create({
    data: {
        guest_token: 'guest-xyz-123',
        status: 'WAITING_FOR_ADMIN',
        updated_at: new Date(),
        messages: {
            create: [
                {
                    sender: 'USER',
                    content: 'سلام، من هنوز ثبت نام نکردم ولی سوال دارم.',
                    is_read: false,
                    created_at: new Date()
                }
            ]
        }
    }
  });
  console.log(`Created Conversation ID: ${conv4.id} (Guest)`);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
