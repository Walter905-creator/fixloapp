#!/bin/bash

# Fixlo Development Startup Script
# This script ensures both frontend and backend are running to prevent network errors

echo "🚀 Starting Fixlo Development Environment..."

# Function to check if a port is in use
check_port() {
    netstat -tuln | grep ":$1 " > /dev/null 2>&1
}

# Function to start the backend server
start_backend() {
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    
    echo "🟢 Starting backend server on port 3001..."
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    sleep 5
    
    if check_port 3001; then
        echo "✅ Backend server is running on http://localhost:3001"
    else
        echo "❌ Backend server failed to start"
        exit 1
    fi
}

# Function to start the frontend
start_frontend() {
    echo "📦 Installing frontend dependencies..."
    cd client
    npm install
    
    echo "🔨 Building frontend..."
    npm run build
    cd ..
    
    echo "🟦 Starting frontend server on port 3000..."
    cd client/build
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ../..
    
    # Wait for frontend to start
    echo "⏳ Waiting for frontend to start..."
    sleep 3
    
    if check_port 3000; then
        echo "✅ Frontend server is running on http://localhost:3000"
    else
        echo "❌ Frontend server failed to start"
        exit 1
    fi
}

# Check if ports are already in use
if check_port 3001; then
    echo "⚠️  Port 3001 is already in use. Backend may already be running."
else
    start_backend
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Frontend may already be running."
else
    start_frontend
fi

echo ""
echo "🎉 Fixlo Development Environment Started Successfully!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo "🤖 AI Assistant: http://localhost:3000/#/ai-assistant"
echo ""
echo "💡 To test the AI Assistant:"
echo "   1. Open http://localhost:3000/#/ai-assistant"
echo "   2. Type a home improvement question"
echo "   3. Click send or press Enter"
echo ""
echo "🛑 To stop servers:"
echo "   - Kill backend: kill $BACKEND_PID (if started)"
echo "   - Kill frontend: kill $FRONTEND_PID (if started)"
echo "   - Or use Ctrl+C and then kill remaining processes"

# Keep script running
echo "✋ Press Ctrl+C to stop all servers..."
wait