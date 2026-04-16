# 🏢 نظام الموارد البشرية — شركة غرغور التجارية
# HR Management System — Gharghor Trading Company

---

## 🚀 تشغيل البرنامج / Quick Start

### المتطلبات / Requirements
- **Node.js** (v18 أو أحدث / v18 or newer) → https://nodejs.org
- **npm** (يأتي مع Node.js تلقائياً / comes with Node.js)

---

### خطوات التشغيل / Installation Steps

```bash
# 1. افتح المجلد / Open the project folder
cd gharghor-hr-system

# 2. تثبيت المكتبات / Install dependencies
npm install

# 3. تشغيل البرنامج / Start the app
npm run dev
```

بعد التشغيل سيفتح المتصفح تلقائياً على:
After running, browser opens automatically at:

👉 **http://localhost:3000**

---

## 📋 الميزات / Features

| الميزة | Feature |
|--------|---------|
| 🏠 لوحة التحكم | Dashboard |
| 👥 إدارة الموظفين | Employee Management |
| 🌴 إدارة الإجازات (7 أنواع) | Leave Management (7 types) |
| 🚪 إدارة المغادرات (6 ساعات شهرياً) | Departure Tracking (6h/month) |
| 💰 كشوف الرواتب | Payroll |
| 📅 العطل الرسمية | Official Holidays |
| 🔒 تسكير الشهر | Month Closing |
| 📄 الكتب الإدارية (3 نماذج) | Admin Letters (3 templates) |
| 📊 التقارير + تصدير CSV | Reports + CSV Export |
| 🌐 عربي / إنجليزي | Arabic / English |

---

## 💾 البيانات / Data Storage

البيانات محفوظة في **localStorage** في المتصفح.
Data is saved in the browser's **localStorage**.

لا تحتاج إلى قاعدة بيانات خارجية.
No external database required.

---

## 🔨 بناء النسخة النهائية / Build for Production

```bash
npm run build
```

سيتم إنشاء مجلد `dist` يحتوي على الملفات الجاهزة للنشر.
This creates a `dist` folder ready for deployment.

---

## 📱 الوصول من أجهزة أخرى في الشبكة / Network Access

```bash
# في vite.config.js، البرنامج يعمل على port 3000
# To access from other devices on same network:
npm run dev -- --host
```

ثم ادخل عنوان IP الجهاز على الأجهزة الأخرى مثل:
Then access from other devices via:
`http://192.168.x.x:3000`

---

## 🔗 ربط البصمة / Fingerprint Integration

لربط جهاز البصمة، تحتاج إلى:
To integrate fingerprint devices, you need:
1. API أو SDK من صانع الجهاز / Device manufacturer API/SDK
2. إضافة endpoint استقبال البيانات / Add data reception endpoint
3. تحديث قسم الحضور في البرنامج / Update attendance section

---

## 📂 هيكل المشروع / Project Structure

```
gharghor-hr-system/
├── index.html          ← صفحة HTML الرئيسية
├── vite.config.js      ← إعدادات Vite
├── package.json        ← المكتبات والأوامر
└── src/
    ├── main.jsx        ← نقطة دخول React
    └── App.jsx         ← كود البرنامج الكامل
```

---

## 🛠 تعديل البرنامج / Customization

كل الكود في ملف واحد: `src/App.jsx`
All code is in one file: `src/App.jsx`

- لتغيير اسم الشركة: ابحث عن "غرغور" في الكود
- To change company name: search for "gharghor" in the code
- لإضافة موظفين افتراضيين: عدّل `INIT_EMP` في بداية الملف
- To add default employees: edit `INIT_EMP` at the top of the file

---

**v1.0 | 2025 | شركة غرغور التجارية**
