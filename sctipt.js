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
    "color": 1,
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


  for (const typeExam in subject.grades) {
    for (const exam in subject.grades[typeExam]) {
      var mark = subject.grades[typeExam][exam];
      var isNull = mark === null;
      
      if (isNull) {
        mark = '?';
      }

      card.children[2].innerHTML += '<div class="scol' + (isNull ? '' : subject.color) + '" style="flex-grow: ' + subject.evaluation[typeExam][exam]*100 + 
      '">' + exam + '<div>' + mark + '</div></div>';

    }
  }

  card.innerHTML += '</div></div>';

  dashboard.appendChild(card);
}