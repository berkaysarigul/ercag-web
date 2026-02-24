const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../config/redis.js');
const { recordStockMovement } = require('../services/stockService.js');

const stockQueue = new Queue('stock-updates', {
    connection: redisClient
});

const stockWorker = new Worker('stock-updates', async (job) => {
    const { action, payload } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id} for action ${action}`);

    try {
        if (action === 'reduceStockOnOrder') {
            const { items, orderId, adminId } = payload;

            // Loop through each item in the order and reduce stock
            for (const item of items) {
                await recordStockMovement(
                    item.productId,
                    'ORDER',
                    -item.quantity,
                    `Sipariş #${orderId}`,
                    adminId
                );
            }
        } else {
            console.warn(`[BullMQ Worker] Unknown action: ${action}`);
        }
        console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    } catch (error) {
        console.error(`[BullMQ Worker] Job ${job.id} failed:`, error.message);
        throw error;
    }
}, {
    connection: redisClient,
    concurrency: 5
});

stockWorker.on('completed', job => {
    console.log(`✅ [Job ${job.id}] (Stock Update) has completed`);
});

stockWorker.on('failed', (job, err) => {
    console.error(`❌ [Job ${job?.id}] (Stock Update) has failed with ${err.message}`);
});

module.exports = { stockQueue };
