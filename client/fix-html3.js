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
      
      // Fix: <i class="fa-solid" [class]="isFormVisible ? "edit" : "add""></i><i class="fa-solid"></i>
      // Turn into: <i class="fa-solid" [class]="isFormVisible ? 'fa-pen' : 'fa-plus'"></i>
      const badClass1 = /<i class="fa-solid" \[class\]="(is\w+) \? ""?(edit|add|fa-pen|fa-plus)""? : ""?(edit|add|fa-pen|fa-plus)""?"><\/i>/g;
      if (c.match(badClass1)) {
        c = c.replace(badClass1, '<i class="fa-solid" [class]="$1 ? \'fa-pen\' : \'fa-plus\'"></i>');
        changed = true;
      }

      // Also handle <i class="fa-solid" [class]="isFormVisible ? "edit" : "add""></i><i class="fa-solid"></i>
      const badExtraI = /<i class="fa-solid" \[class\]="([^"]+)"?><\/i><i class="fa-solid"><\/i>/g;
      if (c.match(badExtraI)) {
        c = c.replace(badExtraI, '<i class="fa-solid" [ngClass]="$1"></i>');
        changed = true;
      }
      
      // Fix: <i class="fa-solid" [class]=""edit""></i><i class="fa-solid"></i> -> <i class="fa-solid fa-pen"></i>
      const badStaticForm = /<i class="fa-solid" \[class\]="""?(edit|add)"""?><\/i><i class="fa-solid"><\/i>/g;
      if (c.match(badStaticForm)) {
         c = c.replace(badStaticForm, (match, p1) => {
           return `<i class="fa-solid ${p1 === 'edit' ? 'fa-pen' : 'fa-plus'}"></i>`;
         });
         changed = true;
      }
      
      // Fix `element.Id` typing issue to `element.Id!` in templates for delete/edit actions
      if (c.includes('deleteLesson(element.Id)') || c.includes('onLessonSections(element.Id)') || c.includes('editLesson(element)')) {
          c = c.replace(/deleteLesson\(element\.Id\)/g, 'deleteLesson(element.Id!)');
          c = c.replace(/onLessonSections\(element\.Id\)/g, 'onLessonSections(element.Id!)');
          changed = true;
      }

      if (c.includes('deleteSchool(element.Id)') || c.includes('onSchoolStandards(element.Id)')) {
          c = c.replace(/deleteSchool\(element\.Id\)/g, 'deleteSchool(element.Id!)');
          c = c.replace(/onSchoolStandards\(element\.Id\)/g, 'onSchoolStandards(element.Id!)');
          changed = true;
      }

      if (c.includes('deleteLoginDetail(element.Id)')) {
          c = c.replace(/deleteLoginDetail\(element\.Id\)/g, 'deleteLoginDetail(element.Id!)');
          changed = true;
      }
      
      if (c.includes('deleteLessonSection(element.Id)')) {
          c = c.replace(/deleteLessonSection\(element\.Id\)/g, 'deleteLessonSection(element.Id!)');
          changed = true;
      }
      
      if (c.includes('deleteProgress(element.Id)')) {
          c = c.replace(/deleteProgress\(element\.Id\)/g, 'deleteProgress(element.Id!)');
          changed = true;
      }
      
      if (c.includes('deleteSchoolStandard(element.Id)') || c.includes('onStudents(element.Id, element.standard)')) {
          c = c.replace(/deleteSchoolStandard\(element\.Id\)/g, 'deleteSchoolStandard(element.Id!)');
          c = c.replace(/onStudents\(element\.Id, element\.standard\)/g, 'onStudents(element.Id!, element.standard!)');
          changed = true;
      }

      if (c.includes('element.Id')) {
         // Generic replace for other components (Subject, Standard, Student)
         c = c.replace(/delete(Subject|Standard|Student|Progress|SchoolStandard|LessonSection|Lesson|School|LoginDetail)\(element\.Id\)/g, 'delete$1(element.Id!)');
         c = c.replace(/on(Lessons|Progresss|Subjects)\(element\.Id\)/g, 'on$1(element.Id!)');
         changed = true;
      }

      // Just brutally fixing the fa-solid conditional issue everywhere it exists with simple replacements:
      if (c.includes('? "edit" : "add""></i><i')) {
          c = c.replace(/<i class="fa-solid" \[class\]="([a-zA-Z]+) \? "edit" : "add""><\/i><i class="fa-solid"><\/i>/g, '<i class="fa-solid" [class]="$1 ? \'fa-pen\' : \'fa-plus\'"></i>');
          changed = true;
      }
      
      if (c.includes(']=""add""></i>')) {
          c = c.replace(/<i class="fa-solid" \[class\]="""?add"""?><\/i><i class="fa-solid"><\/i>/g, '<i class="fa-solid fa-plus"></i>');
          changed = true;
      }
      if (c.includes(']=""edit""></i>')) {
          c = c.replace(/<i class="fa-solid" \[class\]="""?edit"""?><\/i><i class="fa-solid"><\/i>/g, '<i class="fa-solid fa-pen"></i>');
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
console.log('HTML fix 3 done.');
