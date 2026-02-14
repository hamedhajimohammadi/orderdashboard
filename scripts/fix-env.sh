#!/bin/bash
SERVER_IP="185.110.188.77"
SERVER_USER="root"
REMOTE_DIR="/var/www/dashboard"

echo "🔧 Updating .env on server..."

ssh $SERVER_USER@$SERVER_IP << EOF
  if ! grep -q "WC_SITE_URL" $REMOTE_DIR/.env; then
    echo "" >> $REMOTE_DIR/.env
    echo 'WC_SITE_URL="https://pgemshop.com"' >> $REMOTE_DIR/.env
    echo "✅ Added WC_SITE_URL to .env"
    
    # Restart to apply changes
    pm2 restart dashboard
    echo "♻️ Service restarted."
  else
    echo "ℹ️ WC_SITE_URL already exists in .env"
  fi
EOF
