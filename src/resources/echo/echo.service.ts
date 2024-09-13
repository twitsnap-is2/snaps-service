export class EchoService {
  async ping() {
    return "pong";
  }

  async echo(body: string) {
    return body;
  }
}
