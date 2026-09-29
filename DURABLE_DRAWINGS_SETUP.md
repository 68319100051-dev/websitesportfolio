# ภาพวาดที่อยู่ถาวร

ภาพวาดใหม่เก็บเป็นไฟล์บน Cloudinary พร้อมแท็ก `portfolio_drawings` หน้า `/drawings.html` อ่านรายการรูปจาก Cloudinary โดยตรง จึงไม่ต้องใช้ `portfolio/data.json` หรือโฟลเดอร์อัปโหลดชั่วคราวของ Render สำหรับภาพวาดใหม่

## ตั้งค่าครั้งเดียว

1. ที่ Render Dashboard เปิด Web Service `konkamon-portfolio` → **Environment** แล้วเพิ่มตัวแปรต่อไปนี้ ห้ามใส่ค่า API Secret ลง GitHub หรือหน้าแอดมิน:

   - `ADMIN_PASSWORD`: รหัสผ่านแอดมินใหม่ที่คาดเดายาก (จะใช้แทนรหัสผ่านที่เก็บใน `data.json`)
   - `CLOUDINARY_CLOUD_NAME`: `mo8znakk` (ต้องตรงกับชื่อที่ใช้ใน `portfolio/script.js`)
   - `CLOUDINARY_API_KEY`: จาก Cloudinary Dashboard
   - `CLOUDINARY_API_SECRET`: จาก Cloudinary Dashboard

2. รอ Web Service ดีพลอยสำเร็จ แล้วใช้ `ADMIN_PASSWORD` ใหม่ล็อกอินที่ `https://konkamon-portfolio.onrender.com/admin.html`
3. ใน Cloudinary Console เปิด **Settings → Security → Restricted image types** แล้วเอาเครื่องหมายออกจาก **Resource list** เพื่อให้หน้าเว็บอ่านรายการภาพวาดจากแท็กได้ เฉพาะรายการภาพสาธารณะเท่านั้นที่ควรใช้วิธีนี้
4. ใน Cloudinary Console ปิดหรือเปลี่ยนชื่อ unsigned upload preset เดิม `portfolio` หลังยืนยันว่าการอัปโหลดแบบใหม่ทำงาน เพราะชื่อ preset เดิมเคยอยู่ใน JavaScript สาธารณะ

## ทดสอบ

1. ที่หน้าแอดมิน เลือกรูปแล้วกด **เพิ่มภาพวาด** ไม่ต้องกดปุ่มบันทึกการเปลี่ยนแปลง
2. รอประมาณ 1 นาที แล้วเปิด `https://konkamon-portfolio-static.onrender.com/drawings.html` ในหน้าต่างไม่ระบุตัวตน
3. ปล่อย Web Service ให้หยุดทำงาน แล้วเปิดหน้าภาพวาดใหม่ ภาพควรยังอยู่ เพราะไฟล์และรายการรูปอยู่บน Cloudinary

รูปที่อัปโหลดก่อนการเปลี่ยนแปลงนี้อาจไม่มีแท็ก ให้เพิ่มแท็ก `portfolio_drawings` ใน Cloudinary Media Library หากไฟล์ยังอยู่ หรืออัปโหลดใหม่ผ่านหน้าแอดมิน ถ้ารูปเก่าเก็บไว้เฉพาะบน Render และหายไปแล้ว ต้องใช้ไฟล์ต้นฉบับอัปโหลดใหม่

Cloudinary เก็บแคชรายการรูปประมาณ 60 วินาที และรายการแบบนี้รองรับได้สูงสุด 1,000 รูป หากต้องการมากกว่านั้นต้องเปลี่ยนไปใช้ฐานข้อมูลหรือ Admin API

เอกสารอ้างอิง: [Cloudinary client-side asset lists](https://cloudinary.com/documentation/list_assets), [Cloudinary signed uploads](https://cloudinary.com/documentation/authentication_signatures), [Render ephemeral filesystem](https://render.com/docs/disks)

หมายเหตุ: การเปลี่ยนแปลงนี้ทำให้ **ภาพวาดใหม่** คงอยู่เท่านั้น ข้อมูลอื่นที่หน้าแอดมินยังบันทึกใน `data.json` บน Render ยังคงต้องย้ายไปที่เก็บถาวรแยกต่างหาก
