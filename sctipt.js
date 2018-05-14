var dashboard = document.getElementById('dashboard');

createSubjectCardCollapsed(
  {
    "id": "2E4TDt64s",
    "name": "IES",
    "finalMark": 2.925,
    "grades": {
      "Teoria": {
        "T1": 5.5,
        "T2": null,
        "T3": null
      },
      "Lab": {
        "C1": 5.5,
        "C2": null,
        "P": 10
      }
    },
    "evaluation": {
      "Teoria": {
        "T1": 0.25,
        "T2": 0.15,
        "T3": 0.25
      },
      "Lab": {
        "C1": 0.1,
        "C2": 0.15,
        "P": 0.1
      }
    },
    "color": 3,
    "uni": "UPC",
    "faculty": "FIB"
  }
);

function createSubjectCardCollapsed(subject) {
  var card = document.createElement('div');
  card.id = 'card' + subject.id;
  card.className = 'subject-card collaped-sc';

  card.innerHTML = '<h2>' + subject.name +
  '</h2><p style="color: ' + (subject.finalMark>=5 ? '#008000' : '#C0392B') + 
  ';">' + subject.finalMark + '</p><div class="subject-bar small-sb">';

  var necessaryMark;
  if (subject.finalMark < 5) necessaryMark = round(gradeCalcAllEqual(subject.grades, subject.evaluation, subject.finalMark));
  else necessaryMark = 0;

  for (const typeExam in subject.grades) {
    for (const exam in subject.grades[typeExam]) {
      var mark = subject.grades[typeExam][exam];
      var isNull = mark === null;
      
      if (isNull) {
        mark = necessaryMark;
      }

      card.children[2].innerHTML += '<div class="scol' + (isNull ? 'N' : subject.color) + '" style="flex-grow: ' + subject.evaluation[typeExam][exam]*100 + 
      '">' + exam + '<div>' + mark + '</div></div>';

    }
  }

  card.innerHTML += '</div></div>';

  dashboard.appendChild(card);
}

function gradeCalcAllEqual(grades, evaluation, finalMark) {
    var sumNull = 0;
    for (const typeExam in grades) {
        for (const exam in grades[typeExam]) {
            if (grades[typeExam][exam] === null) sumNull += evaluation[typeExam][exam];
        }
    }
    return (5-finalMark)/sumNull;
}

function round(n) {
    return Math.floor(Math.round(n*100))/100;
}