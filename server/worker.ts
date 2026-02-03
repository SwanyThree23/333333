import { Worker, Job } from 'bullmq';
import { getNotificationService } from './services/enterprise/notification';
import { getDatabase } from './services/database';

const notifyService = getNotificationService();
const db = getDatabase();

console.log('👷 Enterprise Worker started...');

// Process background email notifications
const emailWorker = new Worker('email-queue', async (job: Job) => {
    console.log(`Processing email job ${job.id} for user ${job.data.userId}`);

    await notifyService.send({
        userId: job.data.userId,
        type: 'system',
        title: job.data.title,
        message: job.data.message
    });
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

// Process stream archived/processing jobs
const streamWorker = new Worker('stream-processing', async (job: Job) => {
    console.log(`Processing stream archive for ${job.data.streamId}`);
    // Implementation for long-running stream archiving
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

emailWorker.on('completed', (job: Job) => {
    console.log(`${job.id} has completed!`);
});

emailWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.log(`${job?.id} has failed with ${err.message}`);
});
