var dashboard = document.getElementById('dashboard');
var subjectCookies = [];
var subjects = {};
subjects['a1'] = {"name": "AC","finalMark": 3.92,"necesaryMark": 2.7,"grades": {"Teoria": {"C1": 6.3,"C2": 5.5,"C3": null},"Laboratorio": {"L": 8}},"evaluation": {"Teoria": {"C1": 0.15,"C2": 0.25,"C3": 0.4},"Laboratorio": {"L": 0.2}},"color": 4,"uni": "UPC","faculty": "FIB"};
subjects['a2'] = {"name": "IES","finalMark": 2.93,"necesaryMark": 3.76,"grades": {"Teoria": {"T1": 5.5,"T2": null,"T3": null},"Lab": {"C1": 5.5,"C2": null,"P": 10}},"evaluation": {"Teoria": {"T1": 0.25,"T2": 0.15,"T3": 0.25},"Lab": {"C1": 0.1,"C2": 0.15,"P": 0.1}},"color": 3,"uni": "UPC","faculty": "FIB"};

//loadData();
for (const id in subjects) {
  createSubjectCardCollapsed(id, subjects[id]);
}

function loadData(){
  subjectCookies = [];
  getAllCookies();
  for (let i = 0; i < subjectCookies.length; i++) {
    createSubjectCardCollapsed(subjectCookies[i]);    
  }
}

function createSubjectCardCollapsed(id, subject) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card collaped-sc';
  card.addEventListener('keyup', function(){updateCard(this);});

  card.innerHTML = '<h2>' + subject.name +
  '</h2><p style="color: ' + (subject.finalMark>=5 ? '#5a9764' : '#b9574c') + 
  ';">' + subject.finalMark + '</p><div class="subject-bar"></div><div class="grades-input"></div>';

  let necesaryMark=subject.necesaryMark;

  for (const examType in subject.grades) {
    card.children[3].innerHTML += '<h3>' + examType + '</h3><div></div>';
    
    for (const exam in subject.grades[examType]) {
      let mark = subject.grades[examType][exam];
      let isNull = mark == null;     
      
      card.children[2].innerHTML += '<div onclick="selecciona(id, examType, exam)" class="scol' + (isNull ? 'N' : subject.color) + '" style="flex-grow: ' + subject.evaluation[examType][exam]*100 + '">' + exam + '<div id="bar-'+ id + examType + exam +'">' + (isNull ? necesaryMark : mark) + '</div></div>';
      card.children[3].lastChild.innerHTML += '<div><span>'+ exam +':</span><input type="number" id="in-'+ id + examType + exam +'" data-examtype="'+ examType +'" data-exam="'+ exam +'" placeholder="'+ necesaryMark +'" value="'+ subject.grades[examType][exam] +'" class="scol' + (isNull ? 'N2' : subject.color) + '" autocomplete="off" step="0.01" min="0" max="10"></div>';
    }
  }

  card.innerHTML += '</div>';

  dashboard.appendChild(card);
}

function selecciona(id, examType, exam) {
  document.getElementById(`in-${id}${examType}${exam}`).select();
  //focus(); el problema es que lo selecciona al principio -.-
}

function updateNecesaryMark(subject) {
  subject.necesaryMark = round(gradeCalcAllEqual(subject.grades, subject.evaluation,subject.finalMark));
  return subject.necesaryMark;
}

function gradeCalcAllEqual(grades, evaluation, finalMark) {
    let sumUndoneExams = 0;
    for (const examType in grades) {
      for (const exam in grades[examType]) {
        if (grades[examType][exam] == null) sumUndoneExams += evaluation[examType][exam];
      }
    }
    
    return (5-finalMark)/sumUndoneExams;
  }
  
  function updateFinalMark(subject) {
    subject.finalMark = 0;
    for (const examType in subject.grades) {
      for (const exam in subject.grades[examType]) {    
        if (subject.grades[examType][exam] != null)  subject.finalMark += subject.grades[examType][exam] * subject.evaluation[examType][exam];
      }
    }
    subject.finalMark = round(subject.finalMark);
    console.log(subject.finalMark);
  return subject.finalMark;

}

function round(n) {
  return (n==='' || n== null) ? null : Math.floor(Math.round(n*100))/100;
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

function updateCard(card) {
  let inputs = card.getElementsByTagName('input');
  let id =  card.id.slice(5);

  for (let i = 0; i < inputs.length; ++i) {
    let exam = inputs[i].dataset.exam;
    let examType = inputs[i].dataset.examtype;
    let mark = round(inputs[i].value);
    
    
    if (!isNaN(inputs[i].value) && subjects[id].grades[examType][exam] != mark) {
      let barElem = document.getElementById('bar-'+id+examType+exam);
      let inElem = inputs[i];
            
      subjects[id].grades[examType][exam] = mark;
      
      updateFinalMark(subjects[id]);
      updateNecesaryMark(subjects[id]);
      card.children[1].textContent = subjects[id].finalMark;
      card.children[1].style.color = (subjects[id].finalMark>=5 ? '#5a9764' : '#b9574c');

      if(mark == null) {
        barElem.textContent = subjects[id].necesaryMark;
        barElem.parentElement.className = 'scolN';
        inElem.className = 'scolN2';
        inElem.placeholder = subjects[id].necesaryMark;
      } else{
        barElem.textContent = mark;
        barElem.parentElement.className = 'scol' + subjects[id].color;
        inElem.className = 'scol' + subjects[id].color;
      }
      
      let barUndone = card.getElementsByClassName('scolN');
      let inUndone = card.getElementsByClassName('scolN2');
      
      for (let j = 0; j < barUndone.length; j++) {
        barUndone[j].children[0].textContent = subjects[id].necesaryMark;
      }
      for (let j = 0; j < inUndone.length; j++) {
        inUndone[j].placeholder = subjects[id].necesaryMark;
      }
    }
  }
}