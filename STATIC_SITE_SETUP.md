แก้ปัญหาหน้าเว็บรอเซิร์ฟเวอร์ Render Free

ไฟล์ในชุดนี้ใช้กับ repository websitesportfolio:
- build-static.js: สร้างโฟลเดอร์ dist จาก portfolio โดยไม่เผยแพร่ data.json, admin.html และรูปที่อัปโหลดผ่านเซิร์ฟเวอร์
- render.yaml: ตัวอย่างการตั้งค่า Static Site และส่งคำขอ /api/* ไปยัง Web Service เดิม

วิธีใช้งาน
1. เพิ่ม build-static.js และ render.yaml ที่รากของ repository แล้ว commit/push
2. ใน Render สร้างบริการใหม่แบบ Static Site จาก repository เดียวกัน
3. ตั้ง Build Command เป็น: node build-static.js
4. ตั้ง Publish Directory เป็น: dist
5. ใน Redirects/Rewrites ของ Static Site เพิ่มกฎ Rewrite:
   /api/* -> https://konkamon-portfolio.onrender.com/api/*
   /images/uploads/* -> https://konkamon-portfolio.onrender.com/images/uploads/*
6. เปิด URL ของ Static Site ใหม่เพื่อทดสอบหน้าแรก หน้าอื่น แบบฟอร์ม และสมุดเยี่ยม
7. หลังตรวจแล้ว ใช้ URL ใหม่เป็นลิงก์หลักของเว็บไซต์

ข้อจำกัดที่ยังต้องแก้
- หน้าเว็บจะเปิดได้โดยไม่ต้องรอ Web Service แต่ฟอร์ม สมุดเยี่ยม และระบบผู้ดูแลยังอาจรอตอน Web Service ถูกปลุก
- Web Service แบบ Free ไม่เก็บข้อมูลที่เขียนลงดิสก์อย่างถาวร ข้อมูลใน data.json และรูปอัปโหลดอาจหายเมื่อบริการพักหรือเริ่มใหม่
- รหัสผ่านและ API key ที่เคยอยู่ใน data.json ใน GitHub ต้องเปลี่ยนค่า และย้ายไปเก็บเป็น environment variables
- URL เดิมของ Web Service ยังเปิดหน้าเว็บแบบเดิมได้จนกว่าจะเปลี่ยนการใช้งานหรือตั้ง redirect แยกต่างหาก

