var dashboard = document.getElementById('dashboard');
var subjectCookies = [];

//loadData();
createSubjectCardCollapsed({
  "id": "H47SF628H",
  "name": "AC",
  "finalMark": 3.92,
  "grades": {
    "Teoria": {
      "C1": 6.3,
      "C2": 5.5,
      "C3": null
    },
    "Laboratorio": {
      "L": 8
    }
  },
  "evaluation": {
    "Teoria": {
      "C1": 0.15,
      "C2": 0.25,
      "C3": 0.4
    },
    "Laboratorio": {
      "L": 0.2
    }
  },
  "color": 4,
  "uni": "UPC",
  "faculty": "FIB"
}
);
createSubjectCardCollapsed({
  "id": "2E4TDt64s",
  "name": "IES",
  "finalMark": 2.93,
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

function loadData(){
  subjectCookies = [];
  getAllCookies();
  for (let i = 0; i < subjectCookies.length; i++) {
    createSubjectCardCollapsed(subjectCookies[i]);    
  }
}

function createSubjectCardCollapsed(subject) {
  var card = document.createElement('div');
  card.id = 'card' + subject.id;
  card.className = 'subject-card collaped-sc';

  card.innerHTML = '<h2>' + subject.name +
  '</h2><p style="color: ' + (subject.finalMark>=5 ? '#5a9764' : '#b9574c') + 
  ';">' + subject.finalMark + '</p><div class="subject-bar"></div><div class="grades-input"></div>';

  var necessaryMark=0;
  if (subject.finalMark < 5) necessaryMark = round(gradeCalcAllEqual(subject.grades, subject.evaluation, subject.finalMark));

  for (const typeExam in subject.grades) {
    card.children[3].innerHTML += '<h3>' + typeExam + '</h3><div></div>';
    
    for (const exam in subject.grades[typeExam]) {
      let mark = subject.grades[typeExam][exam];
      let isNull = mark === null;
      
      if (isNull) {
        mark = necessaryMark;
      }
      
      card.children[2].innerHTML += '<div class="scol' + (isNull ? 'N' : subject.color) + '" style="flex-grow: ' + subject.evaluation[typeExam][exam]*100 + 
      '">' + exam + '<div>' + mark + '</div></div>';
      card.children[3].lastChild.innerHTML += '<div><span>'+ exam +':</span><input type="number" placeholder="'+ necessaryMark +'" value="'+ subject.grades[typeExam][exam] +'" class="scol' + (isNull ? 'N2' : subject.color) + '" autocomplete="off"></div>';
    }
  }

  card.innerHTML += '</div>';

  dashboard.appendChild(card);
}

function gradeCalcAllEqual(grades, evaluation, finalMark) {
    let sumUndoneExams = 0;
    for (const typeExam in grades) {
        for (const exam in grades[typeExam]) {
            if (grades[typeExam][exam] === null) sumUndoneExams += evaluation[typeExam][exam];
        }
    }
    return (5-finalMark)/sumUndoneExams;
}

function round(n) {
    return Math.floor(Math.round(n*100))/100;
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getAllCookies() {
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf('subject-') == 0) {
      while (c.charAt(0) != '=') {
        c = c.substring(1);
      }
      c = c.substring(1);
      subjectCookies.push(JSON.parse(c.substring(name.length, c.length)))
    }
  }
} 