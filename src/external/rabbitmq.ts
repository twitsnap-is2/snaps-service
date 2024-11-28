import amqp from "amqplib";
import { env } from "../env.js";

var channel: amqp.Channel, connection: amqp.Connection; //global variables

export type Metrics = {
  providedBy: string;
  body: {
    content: string;
    createdAt: Date;
    hashtags: string[];
  };
};

export async function connectQueue() {
  try {
    connection = await amqp.connect(env.RABBIT_URL);
    channel = await connection.createChannel();

    await channel.assertQueue("MetricsQueue");
  } catch (error) {
    console.log(error);
  }
}

export function sendMetric(data: Metrics) {
  // send data to queue
  channel.sendToQueue(
    "MetricsQueue",
    Buffer.from(JSON.stringify(JSON.stringify(data)))
  );

  // close the channel and connection
  // await channel.close();
  // await connection.close();
}
