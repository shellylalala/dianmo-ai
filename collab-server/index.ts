import { Server } from "@hocuspocus/server";

const server = new Server({
  port: 1234,
  onAuthenticate: async () => {
    // 步骤 3 先不做鉴权，步骤 6 再加
  },
});

server.listen();
console.log("[Collab] Hocuspocus ws server running on ws://127.0.0.1:1234");
