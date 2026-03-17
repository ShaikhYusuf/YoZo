const fs = require('fs');
const path = require('path');
const targetDir = 'd:/Yusuf-Clg/YoZo/client/src/app';

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.match(/\.(ts|html|css)$/)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function processDirectory(dir) {
  let subdirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
  
  for (const subdir of subdirs) {
    const oldPath = path.join(dir, subdir);
    
    // First recursive call to change deep children
    processDirectory(oldPath);
  }

  // Refetch subdirs since they might have been renamed deep down, wait, we are renaming the current dir's direct children
  subdirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
  for (const subdir of subdirs) {
    const match = subdir.match(/^\d+\.(.+)$/);
    if (match) {
      const newName = match[1];
      const oldPath = path.join(dir, subdir);
      const newPath = path.join(dir, newName);
      
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed nested: ${subdir} -> ${newName}`);

      // Now we need to update all files to point to the new name.
      // Since it's nested, we just do a global replace for /subdir/ to /newName/ and /subdir' to /newName'
      const allFiles = getAllFiles(targetDir);
      for (const filePath of allFiles) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        const patterns = [
          `/${subdir}/`,
          `/${subdir}'`,
          `/${subdir}"`,
          `./${subdir}/`,
          `./${subdir}'`,
          `./${subdir}"`,
          `../${subdir}/`,
          `../${subdir}'`,
          `../${subdir}"`
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
          `../${newName}"`
        ];

        for (let i = 0; i < patterns.length; i++) {
          if (content.includes(patterns[i])) {
            content = content.split(patterns[i]).join(replacements[i]);
            changed = true;
          }
        }
        
        if (changed) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated references in ${filePath}`);
        }
      }
    }
  }
}

processDirectory(targetDir);
console.log('Finished deep refactor.');
