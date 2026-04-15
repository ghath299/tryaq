#!/bin/bash
# سكريبت تشغيل Expo بدون tunnel (يعمل على Replit)

echo ""
echo "══════════════════════════════════════════════"
echo "🚀 هلا بيك يا غيث — تشغيل مشروعك..."
echo "══════════════════════════════════════════════"
echo ""

pkill -f "expo start" 2>/dev/null || true
pkill -f "metro"      2>/dev/null || true
sleep 1

cd "$(dirname "$0")" || exit 1

DOMAIN="${REPLIT_DEV_DOMAIN:-localhost}"
EXPO_URL="exp://${DOMAIN}:8081"

echo "📱 في Expo Go → 'Enter URL manually' → اكتب:"
echo "   ${EXPO_URL}"
echo ""
echo "🚀 جاري تشغيل Metro Bundler..."
echo ""

REACT_NATIVE_PACKAGER_HOSTNAME="${DOMAIN}" npx expo start -c --port 8081
