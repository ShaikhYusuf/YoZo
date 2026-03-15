const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!f.startsWith('.') && f !== 'node_modules') walk(p);
    } else if (f.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      let changed = false;
      
      // Fix: <div <div class="..."> → <div class="...">
      if (c.includes('<div <div')) {
        c = c.replace(/<div\s+<div/g, '<div');
        changed = true;
      }
      
      // Fix: class="..." -title> → proper closing bracket  
      if (c.match(/"\s+-(?:title|content|actions|header)[^>]*>/)) {
        c = c.replace(/"\s+-title[^>]*>/g, '">');
        c = c.replace(/"\s+-content[^>]*>/g, '">');
        c = c.replace(/"\s+-actions[^>]*>/g, '">');  
        c = c.replace(/"\s+-header[^>]*>/g, '">');
        changed = true;
      }
      
      // Fix: <i class="fa-solid fa-{{ ... }}"> → needs interpolated class binding
      // Replace fa-{{ with proper text: {{ }}
      if (c.includes('fa-{{')) {
        c = c.replace(/<i class="fa-solid fa-{{ ([^}]+) }}">/g, 
          '<i class="fa-solid" [class]="$1"></i><i class="fa-solid">');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(p, c, 'utf8');
        console.log('Fixed:', p);
      }
    }
  });
}

walk('d:/Yusuf-Clg/YoZo/client/src/app');
console.log('Done.');
