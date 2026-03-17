const fs = require('fs');
const path = require('path');

const skip = ['node_modules', '.angular', '.vscode', 'dist', 'ui', 'login', 'login-detail', 'profile', 'school'];

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!f.startsWith('.') && !skip.includes(f)) walk(p);
    } else if (f.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      let changed = false;

      // Fix broken batch conversion artifacts like: 
      // class="bg-surface/80..." -title> or -content> or -actions> or -header>
      const brokenPatterns = [
        { find: /class="bg-surface\/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden"\s*-title[^>]*>/g, replace: '<div class="px-6 py-4 border-b border-surface-border">' },
        { find: /class="bg-surface\/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden"\s*-content[^>]*>/g, replace: '<div class="p-6">' },
        { find: /class="bg-surface\/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden"\s*-actions[^>]*>/g, replace: '<div class="px-6 py-4 flex items-center gap-3 border-t border-surface-border">' },
        { find: /class="bg-surface\/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden"\s*-header[^>]*>/g, replace: '<div class="flex items-center gap-3">' },
      ];

      for (const bp of brokenPatterns) {
        if (bp.find.test(c)) {
          c = c.replace(bp.find, bp.replace);
          changed = true;
        }
      }

      // Fix duplicate class attributes: class="bg-surface..." class="something"
      // Keep the second one (the original)
      const dupeClass = /<div class="bg-surface\/80[^"]*"\s+class="([^"]+)"/g;
      if (dupeClass.test(c)) {
        c = c.replace(dupeClass, '<div class="bg-surface/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden $1"');
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
console.log('Done fixing broken HTML artifacts.');
