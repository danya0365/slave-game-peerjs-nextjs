# Slave Game - TODO List

## Phase 1: PeerJS (P2P) - ไม่เน้น Security

### ✅ Sprint 1: Foundation & Layout

- [x] สร้าง TODO.md
- [x] สร้าง MainLayout พร้อม Header, Footer
- [x] ใส่ Theme Toggle สำหรับ Dark Mode
- [x] สร้าง ThemeProvider component
- [x] สร้าง User Store (Zustand + localforage persistence)
- [x] สร้างหน้า Landing Page (basic)

### ✅ Sprint 2: Landing & Core Pages

- [x] สร้างหน้า Landing Page (/)
  - [x] Hero section แนะนำเกม
  - [x] Features section
  - [x] How to play section
  - [x] CTA เข้าเล่นเกม
- [x] สร้างหน้า Profile (/profile)
  - [x] แสดงข้อมูล user
  - [x] แก้ไขชื่อ/avatar
  - [x] สถิติการเล่น
- [x] สร้างหน้า How to Play (/how-to-play)
  - [x] กฎการเล่น Slave
  - [x] อธิบายลำดับไพ่
  - [x] Tips & Tricks

### ✅ Sprint 3: Lobby System (UI)

- [x] สร้างหน้า Lobby (/lobby)
  - [x] สร้างห้อง (Create Room)
  - [x] เข้าร่วมห้อง (Join Room via Room Code)
  - [x] แสดงรายชื่อผู้เล่นในห้อง (UI)
  - [x] ระบบ Ready/Not Ready
  - [x] Chat ในห้อง (ChatPanel component)
- [x] สร้างหน้า Game (/game/[roomCode]) - UI Preview
- [x] PeerJS Integration
  - [x] สร้าง peerStore (Zustand) สำหรับจัดการ connection
  - [x] Host mode (สร้างห้อง)
  - [x] Client mode (เข้าร่วมห้อง)
  - [x] Connection state management
  - [x] Player sync via P2P messages
  - [x] Ready/Unready system
  - [x] Reconnection handling (resume_game)

### ✅ Sprint 4: Game Engine

- [x] สร้าง Card Types & Utilities
  - [x] Card interface (suit, rank, value)
  - [x] Deck generator
  - [x] Card comparison logic
  - [x] Valid move checker
  - [x] Straight/Pair/Triple detection
- [x] สร้าง Game State Management
  - [x] GameStore (Zustand)
  - [x] Turn management
  - [x] Win condition check
  - [x] Player ranking (King, Noble, Commoner, Slave)

### ✅ Sprint 5: Game UI

- [x] สร้าง Game Components
  - [x] CardComponent (แสดงไพ่แต่ละใบ)
  - [x] PlayerHand (แสดงไพ่ในมือ)
  - [x] OpponentHand (แสดงไพ่ของคู่ต่อสู้)
  - [x] PlayArea (พื้นที่ลงไพ่ตรงกลาง)
  - [x] GameControls (ปุ่มลงไพ่/ผ่าน)
- [x] Card Selection System
  - [x] Single card selection
  - [x] Multiple card selection (pairs, triples)
  - [ ] Drag & drop (optional)
- [ ] Game Animations
  - [ ] Card dealing animation
  - [ ] Card play animation
  - [ ] Win celebration

### ✅ Sprint 6: P2P Game Sync

- [x] Game synchronization via PeerJS
  - [x] Game message types (deal_cards, play_cards, pass_turn, etc.)
  - [x] Broadcast game state from host
  - [x] Handle player actions
  - [x] useGameSync hook
- [x] Full GamePlayView
  - [x] Waiting room + Gameplay in one component
  - [x] Card selection & play
  - [x] Turn-based controls
  - [x] Game end screen with rankings
- [x] Error handling
  - [x] useConnectionManager hook (reconnection logic)
  - [x] useHostMigration hook (host migration)
  - [x] ConnectionStatusIndicator component
  - [x] ConnectionLostModal component
  - [x] ConnectionQualityBadge component

### ✅ Sprint 7: Polish & Testing

- [x] Responsive design
  - [x] useResponsive hook (breakpoint detection)
  - [x] MobileGameBoard component
- [x] Common UI Components
  - [x] LoadingSpinner (multiple variants)
  - [x] ErrorDisplay (full page, inline)
  - [x] EmptyState
  - [x] Toast notifications
- [x] Game Features
  - [x] Skip passed players in nextTurn()
  - [x] Resume game after refresh (resume_game message)
  - [x] Sync discardPile on reconnect
  - [x] Chat system (ChatPanel, ChatContainer)
- [ ] Sound effects (optional)
- [ ] Manual testing
- [ ] Bug fixes

---

## Phase 2: Colyseus Server (Future - Optional)

### 🔲 Server Implementation

- [ ] ติดตั้ง Colyseus server
- [ ] สร้าง Game Room schema
- [ ] Server-side game logic
- [ ] Authentication integration

### 🔲 Supabase Integration

- [ ] Database setup
- [ ] User profiles
- [ ] Game history
- [ ] Leaderboard

### 🔲 Authentication

- [ ] Supabase Auth setup
- [ ] Login/Register pages
- [ ] Protected routes
- [ ] Session management

---

## Pages Overview

| Route            | Description          | Priority |
| ---------------- | -------------------- | -------- |
| `/`              | Landing page         | High     |
| `/profile`       | User profile & stats | High     |
| `/lobby`         | Create/Join room     | High     |
| `/game/[roomId]` | Game play area       | High     |
| `/how-to-play`   | Game rules           | Medium   |
| `/leaderboard`   | Rankings (Phase 2)   | Low      |

---

## Tech Stack (Phase 1)

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + localforage
- **P2P Communication**: PeerJS
- **Icons**: Lucide React
- **Theme**: next-themes
- **Forms**: react-hook-form + zod

---

## Notes

- ทุก page.tsx ต้องทำตาม CREATE_PAGE_PATTERN.md
- ใช้ Clean Architecture + SOLID principles
- Server Components สำหรับ SEO
- Client Components สำหรับ interactivity
- ไม่มี login ในระยะแรก - ใช้ local user เก็บใน localforage
