const comparisonFn = (lessonSection) => lessonSection.score < 100;

const subjectData = [
  {
    "Id": 1,
    "name": "Mathematics",
    "score": 0,
    "expanded": false,
    "childList": [
      {
        "Id": 1,
        "name": "Algebra",
        "score": 0,
        "expanded": false,
        "childList": [
          {
            "Id": 1,
            "name": "Introduction to Variables",
            "score": 0,
            "expanded": false
          }
        ]
      }
    ]
  },
  {
    "Id": 2,
    "name": "Operating Systems",
    "score": 0,
    "expanded": false,
    "childList": []
  }
];

function filterSubjectData(subjectData, comparisonFn) {
  let copiedSubjectData = JSON.parse(JSON.stringify(subjectData));

  let filteredSubjectData = copiedSubjectData
    .filter((subject) =>
      subject.childList?.some((lesson) =>
        lesson.childList?.some((lessonSection) => comparisonFn(lessonSection))
      )
    )
    .map((subject) => {
      const filteredLessons = subject.childList
        ?.filter((lesson) =>
          lesson.childList?.some((lessonSection) => comparisonFn(lessonSection))
        )
        .map((lesson) => {
          return {
            ...lesson,
            childList: lesson.childList?.filter((lessonSection) => comparisonFn(lessonSection))
          };
        });
        
      return {
        ...subject,
        childList: filteredLessons
      };
    });

  return filteredSubjectData;
}

console.log(JSON.stringify(filterSubjectData(subjectData, comparisonFn), null, 2));
