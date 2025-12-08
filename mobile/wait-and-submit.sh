#!/bin/bash

BUILD_ID="2df5905f-243c-40dc-989a-8325d2863eb5"
LOG_FILE="build-25-full.log"
MAX_WAIT=900  # 15 minutes max wait

echo "════════════════════════════════════════════════════════════════"
echo "         WAITING FOR BUILD #25 COMPLETION"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Build ID: $BUILD_ID"
echo "Started: $(date)"
echo ""

# Wait for build to complete
wait_time=0
while [ $wait_time -lt $MAX_WAIT ]; do
    # Check if build completed in log
    if grep -q "Build finished" "$LOG_FILE" 2>/dev/null; then
        echo "✅ Build #25 completed successfully!"
        echo ""
        
        # Submit to App Store
        echo "════════════════════════════════════════════════════════════════"
        echo "         SUBMITTING BUILD #25 TO APP STORE CONNECT"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        npx eas-cli submit --platform ios --id "$BUILD_ID" --non-interactive
        
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "         CHECKING SUBMISSION STATUS"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        sleep 5
        npx eas-cli build:view "$BUILD_ID"
        
        exit 0
    elif grep -q "Build failed" "$LOG_FILE" 2>/dev/null; then
        echo "❌ Build #25 failed!"
        tail -30 "$LOG_FILE"
        exit 1
    elif grep -q "Error" "$LOG_FILE" 2>/dev/null && grep -q "Build canceled" "$LOG_FILE" 2>/dev/null; then
        echo "❌ Build #25 was canceled!"
        exit 1
    fi
    
    # Show progress
    if [ $((wait_time % 60)) -eq 0 ]; then
        echo "⏳ Waiting... ($((wait_time / 60)) minutes elapsed)"
        tail -3 "$LOG_FILE" 2>/dev/null || echo "   Still queued..."
    fi
    
    sleep 10
    wait_time=$((wait_time + 10))
done

echo "⚠️ Timeout waiting for build completion"
echo "Check build status manually:"
echo "https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/$BUILD_ID"
exit 1

