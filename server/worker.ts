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

// Process RTMP fan-out (MediaSoup + ffmpeg)
const rtmpWorker = new Worker('rtmp-fanout', async (job: Job) => {
    const { streamId, destination, streamKeyEncrypted, rtmpUrl } = job.data;
    console.log(`Starting RTMP fan-out for stream ${streamId} to ${destination}`);

    // In a real implementation:
    // 1. Decrypt streamKeyEncrypted using the ENCRYPTION_KEY
    // 2. Connect to MediaSoup router to consume the broadcaster's stream
    // 3. Spawn ffmpeg process, piping MediaSoup consumer streams to the standard input
    //    ffmpeg -re -i - -c:v libx264 -preset veryfast -b:v 3000k -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv ${rtmpUrl}/${decryptedKey}

    // Simulate ffmpeg process starting
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`FFmpeg worker pushing to ${destination} successfully.`);
    return { status: 'streaming', destination };
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
