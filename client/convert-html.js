const fs = require('fs');
const path = require('path');

const appDir = 'd:/Yusuf-Clg/YoZo/client/src/app';

// Already manually converted — skip these
const skip = ['login', 'login-detail', 'profile', 'school', 'ui', 'node_modules'];

function convertHtml(content) {
  let c = content;
  
  // =========== STRUCTURAL REPLACEMENTS ===========
  
  // mat-card → glass card div
  c = c.replace(/<mat-card\s*([^>]*)>/g, '<div class="bg-surface/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden" $1>');
  c = c.replace(/<\/mat-card>/g, '</div>');
  
  // mat-card-title → header div
  c = c.replace(/<mat-card-title\s*([^>]*)>/g, '<div class="px-6 py-4 border-b border-surface-border" $1>');
  c = c.replace(/<\/mat-card-title>/g, '</div>');
  
  // mat-card-subtitle
  c = c.replace(/<mat-card-subtitle\s*([^>]*)>/g, '<p class="text-sm text-muted mt-1" $1>');
  c = c.replace(/<\/mat-card-subtitle>/g, '</p>');
  
  // mat-card-content → content div
  c = c.replace(/<mat-card-content\s*([^>]*)>/g, '<div class="p-6" $1>');
  c = c.replace(/<\/mat-card-content>/g, '</div>');
  
  // mat-card-header
  c = c.replace(/<mat-card-header\s*([^>]*)>/g, '<div class="flex items-center gap-3" $1>');
  c = c.replace(/<\/mat-card-header>/g, '</div>');
  
  // mat-card-actions → flex actions row
  c = c.replace(/<mat-card-actions\s*([^>]*)>/g, '<div class="px-6 py-4 flex items-center gap-3 border-t border-surface-border" $1>');
  c = c.replace(/<\/mat-card-actions>/g, '</div>');
  
  // =========== TABLE REPLACEMENTS ===========
  
  // mat-table → standard table
  c = c.replace(/<table\s+mat-table\s+\[dataSource\]="([^"]+)"\s*([^>]*)>/g, 
    '<table class="w-full text-sm text-left" $2>');
  
  // mat-header-row
  c = c.replace(/<tr\s+mat-header-row[^>]*>/g, '<tr class="text-xs text-muted uppercase bg-surface-hover/50 border-b border-surface-border">');
  // mat-row  
  c = c.replace(/<tr\s+mat-row[^>]*>/g, '<tr class="border-b border-surface-border hover:bg-surface-hover/50 transition-colors duration-150">');
  
  // mat-header-cell
  c = c.replace(/<th\s+mat-header-cell[^>]*>/g, '<th class="px-6 py-3 font-medium">');
  // mat-cell
  c = c.replace(/<td\s+mat-cell[^>]*>/g, '<td class="px-6 py-4">');
  
  // ng-container with matColumnDef — just keep ng-container
  c = c.replace(/matColumnDef="[^"]+"/g, '');
  
  // =========== FORM FIELD REPLACEMENTS ===========
  
  // mat-form-field → flex col div
  c = c.replace(/<mat-form-field\s*([^>]*)>/g, '<div class="flex flex-col" $1>');
  c = c.replace(/<\/mat-form-field>/g, '</div>');
  
  // mat-label → label
  c = c.replace(/<mat-label>/g, '<label class="mb-1.5 text-sm font-medium text-foreground">');
  c = c.replace(/<\/mat-label>/g, '</label>');
  
  // mat-error → error span
  c = c.replace(/<mat-error\s*([^>]*)>/g, '<span class="text-red-500 text-xs mt-1" $1>');
  c = c.replace(/<\/mat-error>/g, '</span>');
  
  // matInput attribute on inputs → add Tailwind classes
  c = c.replace(/\s*matInput\s*/g, ' ');
  c = c.replace(/<input([^>]*?)(?:class="[^"]*")?([^>]*)\/>/g, (match, before, after) => {
    if (match.includes('bg-surface')) return match; // already converted
    return `<input${before} class="bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted"${after} />`;
  });
  
  // =========== BUTTON REPLACEMENTS ===========
  
  // mat-raised-button primary
  c = c.replace(/mat-raised-button\s*\n?\s*color="primary"/g, 
    'class="bg-primary text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary-hover hover:shadow-glow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"');
  
  // mat-raised-button warn
  c = c.replace(/mat-raised-button\s*\n?\s*color="warn"/g, 
    'class="bg-red-500 text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:bg-red-600 active:scale-95"');
  
  // mat-button (secondary flat)
  c = c.replace(/\s*mat-button\s*/g, ' ');
  
  // mat-icon-button 
  c = c.replace(/\s*mat-icon-button\s*/g, ' ');
  c = c.replace(/\s*mat-raised-button\s*/g, ' ');
  
  // mat-icon → FA icon (generic fallback)
  c = c.replace(/<mat-icon>edit<\/mat-icon>/g, '<i class="fa-solid fa-pen-to-square"></i>');
  c = c.replace(/<mat-icon>delete<\/mat-icon>/g, '<i class="fa-solid fa-trash"></i>');
  c = c.replace(/<mat-icon>add<\/mat-icon>/g, '<i class="fa-solid fa-plus"></i>');
  c = c.replace(/<mat-icon>list_alt<\/mat-icon>/g, '<i class="fa-solid fa-list"></i>');
  c = c.replace(/<mat-icon>([^<]+)<\/mat-icon>/g, '<i class="fa-solid fa-$1"></i>');
  
  // mat-select → native select
  c = c.replace(/<mat-select\s*([^>]*)>/g, '<select class="bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer" $1>');
  c = c.replace(/<\/mat-select>/g, '</select>');
  
  // mat-option → option
  c = c.replace(/<mat-option\s*/g, '<option ');
  c = c.replace(/<\/mat-option>/g, '</option>');
  
  // Clean up leftover mat attributes
  c = c.replace(/\s*appearance="[^"]*"/g, '');
  c = c.replace(/\s*matTooltip="[^"]*"/g, '');
  c = c.replace(/\s*matTooltipPosition="[^"]*"/g, '');
  c = c.replace(/\s*class\s*=\s*"mat-elevation-z\d+"/g, '');
  c = c.replace(/\s*color="primary"/g, '');
  c = c.replace(/\s*color="warn"/g, '');
  c = c.replace(/\s*color="accent"/g, '');
  
  return c;
}

function walk(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (skip.includes(entry) || entry.startsWith('.')) continue;
      walk(fullPath);
    } else if (entry.endsWith('.component.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Only process files that contain Material markup
      if (content.includes('mat-card') || content.includes('mat-table') || content.includes('mat-form-field') || content.includes('mat-icon') || content.includes('mat-button')) {
        const converted = convertHtml(content);
        if (converted !== content) {
          fs.writeFileSync(fullPath, converted, 'utf8');
          console.log('Converted:', fullPath);
        }
      }
    }
  }
}

walk(appDir);
console.log('Done converting HTML templates.');
