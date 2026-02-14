#!/bin/bash

# رنگ‌ها برای نمایش بهتر
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}--- شروع آماده‌سازی سرور ---${NC}"

# 1. آپدیت سیستم
echo -e "${GREEN}1. آپدیت مخازن سیستم...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. نصب ابزارهای ضروری
echo -e "${GREEN}2. نصب curl, git, unzip...${NC}"
sudo apt install -y curl git unzip build-essential

# 3. نصب Node.js 20
echo -e "${GREEN}3. نصب Node.js نسخه 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. نصب PostgreSQL
echo -e "${GREEN}4. نصب PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

# 5. نصب PM2 (برای مدیریت اجرای برنامه)
echo -e "${GREEN}5. نصب PM2...${NC}"
sudo npm install -g pm2

# 6. نصب Nginx
echo -e "${GREEN}6. نصب Nginx...${NC}"
sudo apt install -y nginx

# 7. تنظیم فایروال (UFW)
echo -e "${GREEN}7. تنظیم فایروال...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}--- نصب با موفقیت تمام شد! ---${NC}"
echo -e "${GREEN}نسخه نود: $(node -v)${NC}"
echo -e "${GREEN}نسخه ان‌پی‌ام: $(npm -v)${NC}"
