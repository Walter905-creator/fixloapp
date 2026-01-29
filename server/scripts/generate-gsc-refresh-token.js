import { google } from 'googleapis';
import readline from 'readline';

const CLIENT_ID = process.env.GSC_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;

const REDIRECT_URI = 'http://localhost';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\nAuthorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\nAfter approving, paste the code here:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n✅ REFRESH TOKEN (save this in .env):\n');
    console.log(tokens.refresh_token);
  } catch (err) {
    console.error('❌ Error retrieving token', err);
  } finally {
    rl.close();
  }
});
