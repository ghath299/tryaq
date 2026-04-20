#!/bin/bash
# تشغيل Metro Bundler على Replit (بدون tunnel)
# العرض: السيرفر (port 5000) يعمل كـ proxy لـ Metro (port 8081)

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

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 لتشغيل التطبيق على جوالك:"
echo ""
echo "   1. افتح Expo Go"
echo "   2. اضغط 'Enter URL manually'"
echo "   3. اكتب هذا الرابط:"
echo ""
echo "      exp://${DOMAIN}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ جاري تشغيل Metro Bundler على port 8081..."
echo "   (انتظر دقيقة حتى يجهز ثم اكتب الرابط في Expo Go)"
echo ""

REACT_NATIVE_PACKAGER_HOSTNAME="${DOMAIN}" npx expo start -c --port 8081 --host lan
