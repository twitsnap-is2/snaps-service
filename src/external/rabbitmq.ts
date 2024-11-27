import amqp from "amqplib";

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
    connection = await amqp.connect("amqp://localhost:5672");
    channel = await connection.createChannel();

    await channel.assertQueue("MetricsQueue");
  } catch (error) {
    console.log(error);
  }
}

export function sendData(data: Metrics) {
  // send data to queue
  channel.sendToQueue(
    "MetricsQueue",
    Buffer.from(JSON.stringify(JSON.stringify(data)))
  );

  // close the channel and connection
  // await channel.close();
  // await connection.close();
}
