const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../config/redis.js');
const whatsappService = require('../services/whatsappService.js');

// Create the Queue
const whatsappQueue = new Queue('whatsapp-messages', {
    connection: redisClient
});

// Create the Worker
const whatsappWorker = new Worker('whatsapp-messages', async (job) => {
    const { action, payload } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id} for action ${action}`);

    try {
        switch (action) {
            case 'sendOrderConfirmation':
                await whatsappService.sendOrderConfirmation(payload.phone, payload.orderId, payload.pickupCode);
                break;
            case 'sendOrderReady':
                await whatsappService.sendOrderReady(payload.phone, payload.orderId, payload.pickupCode);
                break;
            case 'sendOrderCompleted':
                await whatsappService.sendOrderCompleted(payload.phone, payload.orderId);
                break;
            case 'sendCustomMessage':
                await whatsappService.sendWhatsAppMessage(payload.phone, payload.message, payload.templateName);
                break;
            default:
                console.warn(`[BullMQ Worker] Unknown action: ${action}`);
        }
        console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    } catch (error) {
        console.error(`[BullMQ Worker] Job ${job.id} failed:`, error.message);
        throw error; // Let BullMQ handle retries
    }
}, {
    connection: redisClient,
    concurrency: 5 // Process up to 5 WhatsApp messages concurrently
});

whatsappWorker.on('completed', job => {
    console.log(`✅ [Job ${job.id}] has completed`);
});

whatsappWorker.on('failed', (job, err) => {
    console.error(`❌ [Job ${job?.id}] has failed with ${err.message}`);
});

module.exports = { whatsappQueue };
