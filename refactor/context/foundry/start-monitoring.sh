#!/bin/bash
# Quick start script for foundry monitoring

echo "🚀 Starting Foundry Monitoring Systems..."
echo ""

# Open dashboard in browser
echo "📊 Opening visual dashboard..."
open dashboard.html

echo ""
echo "📋 Current Review Queue:"
./workflow-enhanced.sh review-queue

echo ""
echo "🎯 Quick Commands:"
echo "  - Check orchestrator: ./workflow-enhanced.sh orch"
echo "  - Start notifications: ./review-notifier.sh monitor"
echo "  - Team 1 status: ./workflow-enhanced.sh team-status 1"
echo "  - Auto-advance: ./workflow-enhanced.sh auto-advance"
echo ""
echo "✅ Monitoring systems ready!"