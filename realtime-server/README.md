# 🎮 Open World Town - Game Server

Multiplayer game server สำหรับ Open World Town โดยใช้ [Colyseus](https://colyseus.io/) framework

[Colyseus Documentation](http://docs.colyseus.io/)

## 🚀 Quick Start

### Development Mode
```bash
npm start
```

Server จะรันที่:
- **WebSocket**: `ws://localhost:2567`
- **Playground**: `http://localhost:2567` (development only)
- **Monitor**: `http://localhost:2567/monitor`

### Production Build
```bash
npm run build
npm run start:prod
```

## 📁 Project Structure

```
my-server/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── app.config.ts               # Server configuration
│   └── rooms/
│       ├── GameRoom.ts             # 🎮 Main game room (60 FPS, max 50 players)
│       ├── MyRoom.ts               # Template room (example)
│       └── schema/
│           ├── GameState.ts        # Game state schema
│           └── MyRoomState.ts      # Template schema
├── loadtest/                       # Load testing scripts
├── test/                           # Unit tests
└── package.json
```

## 🎮 GameRoom Features

### Player Management
- **Max Players**: 50 per room
- **Update Rate**: 60 FPS
- **Auto Spawn**: Random position (-5 to 5 on X and Z)

### Synchronized State
```typescript
{
  players: {
    [sessionId]: {
      id: string;
      username: string;
      x: number;
      y: number;
      z: number;
      rotation: number;
      isMoving: boolean;
      timestamp: number;
    }
  },
  serverTime: number;
}
```

### Message Handlers
- **`move`**: Update player position
- **`chat`**: Send chat messages (broadcast to all)

### Events
- **`player_joined`**: Broadcast when new player joins
- **`player_left`**: Broadcast when player leaves
- **`chat`**: Broadcast chat messages

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm test` | Run mocha test suite |
| `npm run loadtest` | Run load testing |
| `npm run list:endpoints` | Print registered Express routes and Colyseus rooms |

## 🌐 Client Connection

### From Next.js Client

```typescript
import { useMultiplayerStore } from '@/src/presentation/stores/multiplayerStore';

// Connect to room
const { connect, disconnect } = useMultiplayerStore();
await connect('PlayerUsername');

// Send player movement
const { sendMove } = useMultiplayerStore();
sendMove([x, y, z], rotation, isMoving);

// Send chat
const { sendChat } = useMultiplayerStore();
sendChat('Hello World!');
```

## 🔒 Environment Variables

Create `.env.development` and `.env.production`:

```env
PORT=2567
NODE_ENV=development
```

## 📊 Monitoring

Access the Colyseus Monitor at:
```
http://localhost:2567/monitor
```

Features:
- View active rooms
- Monitor player count
- Inspect room state
- Force disconnect players

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Load Testing
```bash
npm run loadtest
```

Configure loadtest in `loadtest/example.ts`:
```typescript
--room game_room
--numClients 50
```

## 🚀 Deployment

### Deploy to Heroku

1. Create Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set NODE_ENV=production
```

3. Deploy:
```bash
git push heroku main
```

### Deploy to Colyseus Cloud

Follow: https://docs.colyseus.io/colyseus-cloud/

## 📚 Resources

- [Colyseus Documentation](https://docs.colyseus.io/)
- [Colyseus GitHub](https://github.com/colyseus/colyseus)
- [State Schema Guide](https://docs.colyseus.io/state/schema/)
- [Room Lifecycle](https://docs.colyseus.io/server/room/)

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change port in .env.development
PORT=3567
```

**Connection refused:**
- Ensure server is running (`npm start`)
- Check firewall settings
- Verify correct port number

**TypeScript errors:**
```bash
npm install
```

## 📝 License

MIT
