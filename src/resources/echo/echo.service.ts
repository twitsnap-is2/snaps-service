export class EchoService {
  async ping() {
    return "pong" as const;
  }

  async echo(body: string) {
    return body;
  }
}
