ช่วย TODO สำหรับโปรเจค /Users/marosdeeuma/slave-peerjs-nextjs

เขียนเกม slave แบบมืออาชีพที่เว็บใหญ่ๆ เขาทำกัน

โดยทุกครั้งที่สร้าง page.tsx ต้องทำตาม rule ที่เขียนไว้ที่ /Users/marosdeeuma/slave-peerjs-nextjs/prompt/CREATE_PAGE_PATTERN.md

โดยเราจะทำ phase 1 ด้วย peerjs (p2p ไม่เน้น security)

ต้องมีหน้า landing และหน้าอื่นๆ ที่คิดว่าต้องมี

ไม่ต้องมี login แต่ให้ทำระบบ สร้าง user เพื่อข้อมูลลง local ด้วย zustand persist ด้วย localforage

ไม่ต้องมี database ให้สามารถเล่นได้เลย ทุกอย่างผ่าน peerjs (peer 2 peer)

เริ่มพัฒนาโปรเจคอันดับแรกเลย ต้องสร้างหน้า MainLayout พร้อม Header Footer และใส่ Theme Toggle เพื่อทำ dark mode

เราจะต่อ phase 2 มาใช้ game server โดย colyseus และค่อยเก็บข้อมูลง db ด้วย supabase และมีระบบ login ด้วย supabase auth (ยังไม่รุ้ว่าจะทำตอนไหน อาจจะไม่ทำก็ได้)
