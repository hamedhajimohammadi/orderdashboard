#!/bin/bash

# تنظیمات سرور
SERVER_USER="root"
SERVER_IP="185.110.188.77"
REMOTE_DIR="/var/www/dashboard"
TEMP_DIR="/var/www/dashboard_temp"

echo "📦 Zipping project files..."
# ساخت فایل زیپ از پروژه (بدون پوشه‌های سنگین و فایل‌های محیطی لوکال)
zip -r deploy_package.zip . -x "node_modules/*" ".next/*" ".git/*" ".env" "deploy_package.zip" "upload_changes.sh"

echo "🚀 Uploading to server ($SERVER_IP)..."
scp deploy_package.zip $SERVER_USER@$SERVER_IP:/var/www/

echo "🛠  Building and Deploying on Server..."
ssh $SERVER_USER@$SERVER_IP << EOF
    # 1. آماده‌سازی پوشه موقت
    rm -rf $TEMP_DIR
    mkdir -p $TEMP_DIR
    unzip -q /var/www/deploy_package.zip -d $TEMP_DIR
    rm /var/www/deploy_package.zip

    # 2. کپی کردن فایل .env اصلی از نسخه قبلی (خیلی مهم)
    if [ -f "$REMOTE_DIR/.env" ]; then
        cp "$REMOTE_DIR/.env" "$TEMP_DIR/.env"
        echo "✅ Server .env preserved."
    else
        echo "⚠️ Warning: No .env found on server!"
    fi

    # 3. نصب و بیلد در پوشه جدید
    cd $TEMP_DIR
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    
    echo "🔄 Generating Prisma Client..."
    npx prisma generate

    echo "🗄️  Updating Database Schema..."
    npx prisma db push

    echo "🏗  Building Next.js app..."
    npm run build

    # 4. جایگزینی پوشه قدیمی با جدید (با کمترین زمان قطعی)
    echo "🔄 Swapping directories..."
    rm -rf $REMOTE_DIR.bak
    mv $REMOTE_DIR $REMOTE_DIR.bak
    mv $TEMP_DIR $REMOTE_DIR

    # 5. ریستارت سرویس
    echo "♻️  Restarting PM2..."
    pm2 restart dashboard

    echo "🎉 Deployment Complete!"
EOF

# پاک کردن فایل زیپ لوکال
rm deploy_package.zip
