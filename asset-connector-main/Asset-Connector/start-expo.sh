#!/bin/bash
# تشغيل Metro Bundler على Replit
# السيرفر (port 5000) يعيد كتابة الـ manifest لكي كل الطلبات تمر عبر port 80

echo ""
echo "══════════════════════════════════════════════"
echo "🚀 جاري تشغيل Metro Bundler..."
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
echo "   افتح Expo Go  ←  Enter URL manually  ←  اكتب:"
echo ""
echo "      exp://${DOMAIN}"
echo ""
echo "   (بدون :8081 — كل شيء يمر عبر port 80)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ انتظر حتى يظهر 'Metro waiting on' ثم افتح Expo Go..."
echo ""

REACT_NATIVE_PACKAGER_HOSTNAME="${DOMAIN}" npx expo start -c --port 8081 --host lan
