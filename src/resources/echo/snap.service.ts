export class SnapService {
  async creatSnap() {
    return {
      userName: "Tomas",
      content: "Test 123",
    };
  }

  async getSnaps() {
    return [
      {
        userName: "Tomas",
        content: "Test 123",
      },
      {
        userName: "Bauti",
        content: "Test 1234",
      },
    ];
  }
}
