const fs = require('fs');
const data = fs.readFileSync('C:/Users/cesar/AppData/Roaming/Code/User/workspaceStorage/ab842f93cc836969c8b2713a6b553f92/GitHub.copilot-chat/chat-session-resources/8e135480-539a-4adb-b01d-8ac9f1cb7f44/call_MHx6NjRWVllhcUpjZDZaRERIdUo__vscode-1776476832775/content.txt', 'utf8');

const regex = /"name":\s*"([^"]+)"/g;
let match;
const result = [];
while ((match = regex.exec(data)) !== null) {
  result.push(match[1]);
}
console.log(result.filter(n => n.includes('gemini')));
