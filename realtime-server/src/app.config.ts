import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import config from "@colyseus/tools";
import { matchMaker } from "colyseus";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
import { MyRoom } from "./rooms/MyRoom";
import { OpenWorldRoom } from "./rooms/OpenWorldRoom";

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define("my_room", MyRoom);
    gameServer
      .define("game_room", GameRoom)
      .filterBy(["mode"])
      .enableRealtimeListing();
    gameServer.define("open_world", OpenWorldRoom).enableRealtimeListing();
  },

  initializeExpress: (app) => {
    // ✅ เพิ่ม endpoint สำหรับดูห้องทั้งหมด
    app.get("/api/rooms/:roomName", async (req, res) => {
      try {
        const { roomName } = req.params;
        const rooms = await matchMaker.query({ name: roomName });
        res.json(rooms);
      } catch (err) {
        console.error("Failed to list rooms:", err);
        res.status(500).json({ error: "Failed to list rooms" });
      }
    });

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/playground", playground());
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/monitor", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
