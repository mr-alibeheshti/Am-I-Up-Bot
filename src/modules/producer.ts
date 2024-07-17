import amqp from 'amqplib/callback_api';
import Scheduling from '../models/schedulingSchema';

export const setupSchedules = async () => {
  try {
    const schedules = await Scheduling.find({});
    amqp.connect('amqp://localhost', function(error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }
        const queue = 'schedule_queue';

        channel.assertQueue(queue, {
          durable: true
        });

        schedules.forEach(schedule => {
          const msg = JSON.stringify(schedule);
          channel.sendToQueue(queue, Buffer.from(msg), {
            persistent: true
          });
          console.log(" [x] Sent %s", msg);
        });
      });
    });
  } catch (error) {
    console.error('Error publishing schedules:', error);
  }
};

export default setupSchedules;