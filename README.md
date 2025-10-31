# OrangeHRM Docker – Persian Language Customization

> Bilingual README: فارسی • English

---

## فارسی

### معرفی
این پروژه نسخه Docker از **OrangeHRM** را برای فارسی‌سازی محیط کاربری آماده می‌کند. در این تنظیمات، فایل‌های `custom.css` و `custom.js` به کانتینر متصل (mount) می‌شوند تا:
- از **فونت و راست‌چین‌سازی فارسی** پشتیبانی شود.
- تقویم فارسی در فرم‌ها و ماژول‌ها فعال گردد.
- بسته زبان `i18n-fa_IR.xlf` برای افزودن فارسی (ایران) در بخش مدیریت → بسته‌های زبانی استفاده شود.

---

## نحوه استفاده

### ۱. ساختار فایل‌ها
```
/home/docker/orangehrm/
├── db_data/
├── logs/
├── apache/
│   └── zz-servername.conf
├── css/
│   ├── app.css
│   └── custom.css   # استایل‌های فارسی (فونت، راست‌چین‌سازی، اعداد فارسی)
└── js/
    ├── app.js
    └── custom.js    # تقویم فارسی (تبدیل تاریخ میلادی به شمسی)
```

---

### ۲. افزودن خطوط لازم به فایل‌ها

#### ابتدای `app.css`:
```css
@import url("./custom.css");
```

#### انتهای `app.js`:
```javascript
(function () {
  function inject() {
    var s = document.createElement("script");
    s.src = "/web/dist/js/custom.js?v=1";   // عدد نسخه را برای به‌روزرسانی افزایش دهید
    s.async = true;
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();
```

---

### ۳. docker-compose.yml
فایل Docker Compose به شکل زیر تنظیم شده است:

```yaml
version: "3.9"

services:
  db:
    image: mariadb:10.6
    container_name: orangehrm-db
    command: >
      --transaction-isolation=READ-COMMITTED
      --log-bin=mysqld-bin
      --binlog-format=ROW
    environment:
      MARIADB_ROOT_PASSWORD: "STRONG_PASSWORD"
      MARIADB_DATABASE: "orangehrm_db"
      MARIADB_USER: "orangehrm"
      MARIADB_PASSWORD: "STRONG_PASSWORD"
    volumes:
      - /home/docker/orangehrm/db_data:/var/lib/mysql
    restart: unless-stopped

  orangehrm:
    image: orangehrm/orangehrm:5.7
    container_name: orangehrm
    depends_on:
      - db
    environment:
      ORANGEHRM_DATABASE_HOST: "db"
      ORANGEHRM_DATABASE_NAME: "orangehrm_db"
      ORANGEHRM_DATABASE_USER: "orangehrm"
      ORANGEHRM_DATABASE_PASSWORD: "STRONG_PASSWORD"
    ports:
      - "0.0.0.0:8081:80"
    volumes:
      - /home/docker/orangehrm/logs:/var/log/apache2
      - /home/docker/orangehrm/apache/zz-servername.conf:/etc/apache2/conf-enabled/zz-servername.conf:ro
      - /home/docker/orangehrm/css/app.css:/var/www/html/web/dist/css/app.css:ro
      - /home/docker/orangehrm/css/custom.css:/var/www/html/web/dist/css/custom.css:ro
      - /home/docker/orangehrm/css:/var/www/html/web/dist/css
      - /home/docker/orangehrm/js/custom.js:/var/www/html/web/dist/js/custom.js:ro
      - /home/docker/orangehrm/js/app.js:/var/www/html/web/dist/js/app.js:ro
    restart: unless-stopped

networks:
  orangehrm:
    driver: bridge
```

---

### ۴. فعال‌سازی زبان فارسی
پس از اجرای کانتینر:
1. وارد محیط **مدیریت → بسته‌های زبانی** شوید.
2. فایل `i18n-fa_IR.xlf` را آپلود کنید.
3. زبان **Persian (Iran)** را انتخاب کرده و فعال کنید.

---

### ۵. ویژگی‌های `custom.css`
- استفاده از فونت فارسی (مثل Vazir یا Shabnam).
- تنظیم `direction: rtl;` برای بدنه و فرم‌ها.
- تبدیل اعداد لاتین به فارسی در UI.

---

### ۶. ویژگی‌های `custom.js`
- تبدیل تاریخ میلادی به شمسی در فرم‌ها.
- هماهنگی با فیلدهای تاریخ موجود در OrangeHRM.
- استفاده از PersianDate یا تقویم شمسی بومی‌سازی‌شده.

---

### ۷. آزمایش و رفع اشکال
- با دستور زیر وضعیت کانتینرها را بررسی کنید:
  ```bash
  docker compose ps
  ```
- برای مشاهده لاگ‌ها:
  ```bash
  docker logs -f orangehrm
  ```
- در مرورگر به آدرس `http://localhost:8081` مراجعه کنید.
- مطمئن شوید که فایل‌های `custom.css` و `custom.js` از مسیر `/web/dist/` لود می‌شوند.

---

## English Summary
This setup Persian-localizes **OrangeHRM Docker 5.7** by mounting `custom.css` and `custom.js` into the container. These files:
- Enable **RTL layout**, Persian fonts, and localized digits.
- Add **Persian calendar conversion** via `custom.js`.
- Integrate the Persian language pack `i18n-fa_IR.xlf` in the admin panel.

**Run**:
```bash
docker compose up -d
```
Then go to `http://localhost:8081`, activate the Persian language, and enjoy a fully localized HRM platform.

---

### License / مجوز
MIT

