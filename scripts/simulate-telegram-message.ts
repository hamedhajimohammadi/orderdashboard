
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateMessage() {
  const targetChatId = 90462079; // Your Chat ID
  const messageText = "سلام، سفارش من کی آماده میشه؟";

  console.log(`📨 Simulating incoming Telegram message from ${targetChatId}...`);

  // Construct the payload that Telegram would send
  const payload = {
    update_id: 123456789,
    message: {
      message_id: 1001,
      from: {
        id: targetChatId,
        is_bot: false,
        first_name: "Hamed",
        username: "hamed_test"
      },
      chat: {
        id: targetChatId,
        first_name: "Hamed",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: messageText
    }
  };

  try {
    // Call the local API route
    const response = await fetch('http://localhost:3000/api/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response:', data);

    if (response.ok) {
      console.log('✅ Webhook simulated successfully!');
      console.log('Check the order logs in the dashboard to see the message.');
    } else {
      console.error('❌ Webhook failed:', data);
    }

  } catch (error) {
    console.error('Error calling webhook:', error);
  }
}

simulateMessage();
