const fs = require('fs');
const path = require('path');
const targetDir = 'd:/Yusuf-Clg/YoZo/client/src/app';

const mapping = {
  '0.login': 'login',
  '0.logindetail': 'login-detail',
  '1.school': 'school',
  '2.schoolstandard': 'school-standard',
  '3.student': 'student',
  '4.progress': 'progress',
  '5.standard': 'standard',
  '6.subject': 'subject',
  '7.lesson': 'lesson',
  '7.lessonsection': 'lesson-section',
  '8.dashboards': 'dashboards',
  '9.evaluation': 'evaluation',
  '10.voice': 'voice',
  '11.gamification': 'gamification',
  '12.profile': 'profile'
};

// 1. Rename directories
for (const [oldName, newName] of Object.entries(mapping)) {
  const oldPath = path.join(targetDir, oldName);
  const newPath = path.join(targetDir, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('Renamed', oldName, 'to', newName);
  }
}

// 2. Replace in files
function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      replaceInFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [oldName, newName] of Object.entries(mapping)) {
        const patterns = [
          `/${oldName}/`,
          `/${oldName}'`,
          `/${oldName}"`,
          `./${oldName}/`,
          `./${oldName}'`,
          `./${oldName}"`,
          `../${oldName}/`,
          `../${oldName}'`,
          `../${oldName}"`,
        ];
        const replacements = [
          `/${newName}/`,
          `/${newName}'`,
          `/${newName}"`,
          `./${newName}/`,
          `./${newName}'`,
          `./${newName}"`,
          `../${newName}/`,
          `../${newName}'`,
          `../${newName}"`,
        ];

        for (let i = 0; i < patterns.length; i++) {
          if (content.includes(patterns[i])) {
            content = content.split(patterns[i]).join(replacements[i]);
            changed = true;
          }
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated imports in', filePath);
      }
    }
  }
}

replaceInFiles(targetDir);
console.log('Done refactoring.');
