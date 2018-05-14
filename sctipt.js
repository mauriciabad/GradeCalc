var dashboard = document.getElementById('dashboard');
var subjectCookies = [];

loadData();

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