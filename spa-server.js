#!/usr/bin/env node

/**
 * Simple SPA (Single Page Application) Server
 * 
 * This server handles client-side routing by serving index.html
 * for all routes that don't correspond to actual files.
 * This fixes the "blank page" issue when accessing routes directly.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types for common file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function serveSPA(req, res) {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Remove trailing slash unless it's root
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  
  const filePath = path.join(__dirname, pathname);
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      // File exists, serve it
      const ext = path.extname(filePath);
      const mimeType = mimeTypes[ext] || 'text/plain';
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Internal Server Error');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
      });
    } else {
      // File doesn't exist, check if there's index.html in the directory
      const dirIndexPath = path.join(filePath, 'index.html');
      
      fs.stat(dirIndexPath, (err, stats) => {
        if (!err && stats.isFile()) {
          // Directory has index.html, serve it
          fs.readFile(dirIndexPath, (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Internal Server Error');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        } else {
          // No file found, serve root index.html for SPA routing
          const rootIndexPath = path.join(__dirname, 'index.html');
          
          fs.readFile(rootIndexPath, (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end('Not Found');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        }
      });
    }
  });
}

const server = http.createServer(serveSPA);

server.listen(PORT, () => {
  console.log('🚀 SPA Server running at http://localhost:' + PORT);
  console.log('📁 Serving files from: ' + __dirname);
  console.log('🔄 SPA routing enabled - all routes fallback to index.html');
  console.log('');
  console.log('✅ This fixes the blank page issue by properly handling client-side routing');
});