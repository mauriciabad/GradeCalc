var dashboard = document.getElementById('dashboard');
var subjects = {};
var allSubjects = {};
allSubjects['a1'] = {"id": "a1","name": "AC","finalMark": 0,"necesaryMark": 5,"grades": {"Teoria": {"C1": null,"C2": null,"C3": null},"Laboratorio": {"L": null}},"evaluation": {"Teoria": {"C1": 0.15,"C2": 0.25,"C3": 0.4},"Laboratorio": {"L": 0.2}},"color": 4,"uni": "UPC","faculty": "FIB"};
allSubjects['a2'] = {"id": "a2","name": "IES","finalMark": 0,"necesaryMark": 5,"grades": {"Teoria": {"FHC1": null,"FHC2": null,"FHC3": null},"Lab": {"C1": null,"C2": null,"P": null}},"evaluation": {"Teoria": {"FHC1": 0.25,"FHC2": 0.15,"FHC3": 0.25},"Lab": {"C1": 0.1,"C2": 0.15,"P": 0.1}},"color": 3,"uni": "UPC","faculty": "FIB"};
allSubjects['a3'] = {"id": "a3","name": "IDI","fullName": "Interacció i Disseny d'Interfícies","finalMark": 0,"necesaryMark": 5,"grades": {"Teoria": {"T1": null,"T2": null},"Lab": {"L": null},"Extra": {"E": 0}},"evaluation": {"Teoria": {"T1": 0.25,"T2": 0.5},"Lab": {"L": 0.25},"Extra": {"E": 0.025}},"color": 2,"uni": "UPC","faculty": "FIB"};
allSubjects['a4'] = {"id": "a4","name": "XC","fullName": "Xarxes de Computadors","finalMark": 0,"necesaryMark": 5,"grades": {"Teoria": {"T1": null,"T2": null,"T3": null},"Lab": {"L": null,"ExL": null},"Extra": {"E": 0}},"evaluation": {"Teoria": {"T1": 0.3,"T2": 0.3,"T3": 0.15},"Lab": {"L": 0.0625,"ExL": 0.1875},"Extra": {"E": 0.1}},"color": 5,"uni": "UPC","faculty": "FIB"};

loadData();

function loadData(){
  subjects = Cookies.getJSON();
  
  for (const id in subjects) {    
    createSubjectCardCollapsed(id,subjects[id]);    
  }
}

function createSubjectCardCollapsed(id, subject) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card';
  card.addEventListener('keyup', function(){updateCard(this);});
  card.addEventListener('click', function(){toggleExpandCard(event, this)});
  card.innerHTML = '<h2>' + subject.name +
  '</h2><p style="color: ' + (subject.finalMark>=5 ? '#5a9764' : '#b9574c') + 
  ';">' + subject.finalMark + '</p><div class="subject-bar"></div><div class="grades-input hidden" style="height: 0px;" ></div>';

  let necesaryMark=subject.necesaryMark;

  for (const examType in subject.grades) {
    card.children[3].innerHTML += '<h3>' + examType + '</h3><div></div>';
    
    for (const exam in subject.grades[examType]) {
      let mark = subject.grades[examType][exam];
      let isNull = mark == null;     
      
      card.children[2].innerHTML += '<div onclick="selectInput(\'in-' + id + examType + exam + '\')" class="scol' + (isNull ? 'N' : subject.color) + '" style="flex-grow: ' + subject.evaluation[examType][exam]*100 + '">' + exam + '<div id="bar-'+ id + examType + exam +'">' + (isNull ? necesaryMark : mark) + '</div></div>';
      card.children[3].lastChild.innerHTML += '<div><span>'+ exam +':</span><input type="number" id="in-'+ id + examType + exam +'" data-examtype="'+ examType +'" data-exam="'+ exam +'" placeholder="'+ necesaryMark +'" value="'+ subject.grades[examType][exam] +'" class="scol' + (isNull ? 'N2' : subject.color) + '" autocomplete="off" step="0.01" min="0" max="10"></div>';
    }
  }

  card.innerHTML += '</div>';

  dashboard.appendChild(card);
}

function selectInput(idInput) {
  document.getElementById(idInput).select();
}

function updateNecesaryMark(subject) {
  subject.necesaryMark = Math.max(0, round(gradeCalcAllEqual(subject.grades, subject.evaluation,subject.finalMark)));
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
  return subject.finalMark;
}

function round(n) {
  return (n==='' || n== null) ? null : Math.floor(Math.round(n*100))/100;
}

//this function is inefficient, it must be changed 
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
  Cookies.set(id, subjects[id], { expires: 365 });
}

function toggleExpandCard(event, card) {  
  if ( !(event.target.tagName == 'INPUT')) {
    if (card.children[2].contains(event.target)) {
      card.lastChild.classList.remove('hidden');
    } else{
      card.lastChild.classList.toggle('hidden');
    }
    card.lastChild.style.height = (card.lastChild.classList.contains('hidden') ? 0 : card.lastChild.scrollHeight) +'px';
  }
}

function addSubjectPopupShow() {
  document.getElementById('add-container').style.display = 'flex';
}

function addSubjectPopupHide() {
  document.getElementById('add-container').style.display = 'none';
}

function addSubjects() {
  let checked = document.querySelectorAll("#add-container input:checked");
  
  for (let i = 0; i < checked.length; i++) {
    let id = checked[i].id.slice(9);

    if (subjects[id] == undefined) {
      subjects[id] = allSubjects[id];
  
      createSubjectCardCollapsed(id,subjects[id]);
      
    }
  }
  
  addSubjectPopupHide();

}