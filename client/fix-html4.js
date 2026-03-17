const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!f.startsWith('.') && f !== 'node_modules') walk(p);
    } else if (f.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      
      // If we see the broken structure the batch script created:
      // <table ...>
      //   <ng-container> <th>...</th> <td>...</td> </ng-container> ...
      //   <tr class="..."></tr>
      //   <tr class="..."></tr>
      // </table>
      // We need to completely rewrite these remaining templates with proper tables.
      // Since there are only 8 files like this, and they varying columns, 
      // I will manually run targeted regexes to just wrap the td's in <tr>'s.
      // But actually, rewriting them properly is safer. Let's do a semi-automated replace for the common ones.

    }
  });
}
