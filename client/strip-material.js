const fs = require('fs');
const path = require('path');

const appDir = 'd:/Yusuf-Clg/YoZo/client/src/app';

// All Material import lines to remove
const matImportPatterns = [
  /import\s*\{[^}]*\}\s*from\s*'@angular\/material\/[^']+';?\s*\r?\n/g,
];

// Material module names to strip from imports arrays
const matModuleNames = [
  'MatCardModule', 'MatIconModule', 'MatTableModule',
  'MatFormFieldModule', 'MatInputModule', 'MatButtonModule',
  'MatTooltipModule', 'MatOptionModule', 'MatSelectModule',
  'MatSliderModule', 'MatProgressBarModule', 'MatTabsModule',
  'MatDialogModule', 'MatSnackBarModule', 'MatCheckboxModule',
  'MatRadioModule', 'MatSidenavModule', 'MatToolbarModule',
  'MatListModule', 'MatMenuModule', 'MatExpansionModule',
  'MatChipsModule', 'MatBadgeModule', 'MatStepperModule',
  'MatDatepickerModule', 'MatNativeDateModule', 'MatAutocompleteModule',
  'MatProgressSpinnerModule', 'MatSlideToggleModule', 'MatSortModule',
  'MatPaginatorModule', 'MatDividerModule', 'MatGridListModule',
  'MatRippleModule',
];

// Already processed:
const skip = ['login', 'login-detail', 'profile', 'school', 'ui'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. Remove entire import lines for @angular/material/*
  for (const pat of matImportPatterns) {
    if (pat.test(content)) {
      content = content.replace(pat, '');
      changed = true;
    }
  }
  
  // 2. Remove Mat* module names from imports arrays
  for (const mod of matModuleNames) {
    // Match "ModuleName," or ", ModuleName" or "ModuleName" (last in list)
    const patterns = [
      new RegExp('\\s*' + mod + '\\s*,\\s*', 'g'),   // "ModuleName, "
      new RegExp(',\\s*' + mod + '\\s*', 'g'),         // ", ModuleName"
      new RegExp('\\s*' + mod + '\\s*', 'g'),          // standalone
    ];
    
    for (const p of patterns) {
      if (p.test(content)) {
        const before = content;
        content = content.replace(p, (match, offset) => {
          // Only replace inside imports arrays
          const context = content.substring(Math.max(0, offset - 100), offset + match.length + 100);
          if (context.includes('imports:') || context.includes('imports :')) {
            return match.includes(',') ? '' : '';
          }
          return match;
        });
        if (content !== before) changed = true;
      }
    }
  }
  
  if (changed) {
    // Clean up empty lines and dangling commas in imports
    content = content.replace(/imports:\s*\[\s*,/g, 'imports: [');
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/,\s*\]/g, ']');
    content = content.replace(/\[\s*,/g, '[');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned:', filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (skip.includes(entry) || entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(fullPath);
    } else if (entry.endsWith('.component.ts') || entry.endsWith('.module.ts')) {
      processFile(fullPath);
    }
  }
}

walk(appDir);
console.log('Done stripping Material imports.');
