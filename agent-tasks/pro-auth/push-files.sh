#!/bin/bash
echo "📁 Copying pro authentication files..."

# Backend files
echo "Copying backend models..."
cp -r ./agent-tasks/pro-auth/models/* ../server/models/ 2>/dev/null || echo "Models already exist"

echo "Copying backend routes..."
cp -r ./agent-tasks/pro-auth/routes/* ../server/routes/ 2>/dev/null || echo "Routes already exist"

echo "Copying backend utils..."
cp -r ./agent-tasks/pro-auth/utils/* ../server/utils/ 2>/dev/null || echo "Utils already exist"

echo "Copying backend middleware..."
cp -r ./agent-tasks/pro-auth/middleware/* ../server/middleware/ 2>/dev/null || echo "Middleware already exist"

# Frontend files
echo "Copying frontend components..."
cp -r ./agent-tasks/pro-auth/components/* ../src/components/ 2>/dev/null || echo "Components already exist"

echo "Copying frontend pages..."
cp ./agent-tasks/pro-auth/pages/* ../src/components/ 2>/dev/null || echo "Pages already exist"

echo "✅ Files copied successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Update your backend server index.js to include: app.use('/api/pros', require('./routes/proRoutes'));"
echo "2. Add the pro routes to your frontend App.js:"
echo "   <Route path=\"/pro/signin\" element={<ProSignin />} />"
echo "   <Route path=\"/pro/signup\" element={<ProSignup />} />" 
echo "   <Route path=\"/pro/dashboard\" element={<ProDashboard />} />"
echo "3. Start your backend and frontend servers"
echo "4. Test the new pro authentication system!"