const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // CustomerApp & AdminConsole
  content = content.replace(/\? 'bg-\[#FF5E2A\] text-white shadow-md'/g, "? 'bg-[#1D9D41] text-white shadow-md border-transparent'");

  // VendorDashboard
  content = content.replace(/\? 'bg-\[#FF5E2A\] text-white shadow-md font-black'/g, "? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent'");

  // RiderApp (Notice it uses 'bg-[#FF5E2A]/10 text-emerald-500 font-black' for active)
  content = content.replace(/\? 'bg-\[#FF5E2A\]\/10 text-emerald-500 font-black'/g, "? 'bg-[#1D9D41] text-white font-black border-transparent'");
  
  // A second check for AdminConsole - "bg-[#FF5E2A] text-white shadow-md"
  
  // LandingPage
  content = content.replace(/\? 'bg-\[#FF5E2A\] text-white shadow-sm'/g, "? 'bg-[#1D9D41] text-white shadow-sm border-transparent'");

  fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

// Update the files in src/
processDirectory(path.join(__dirname, 'src'));

console.log('Fixed active tab buttons colors successfully!');
