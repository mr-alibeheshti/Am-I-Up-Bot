import amqp from 'amqplib';
import Scheduling from '../models/schedulingSchema';

const setupSchedules = async () => {
  try {
    const schedules = await Scheduling.find({});

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'schedule_queue';

    await channel.assertQueue(queue, {
      durable: true
    });

    for (const schedule of schedules) {
      const msg = JSON.stringify(schedule);
      await channel.sendToQueue(queue, Buffer.from(msg), {
        persistent: true
      });
      console.log(" [x] Sent %s", msg);
    }

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error publishing schedules:', error);
  }
};

export default setupSchedules;