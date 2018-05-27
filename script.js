var dashboard = document.getElementById('dashboard');
var subjects = {};
var allSubjects = {};

allSubjects.a1={id:"a1",finalMark:0,necesaryMark:5,grades:{},name:"AC",evaluation:{Teoria:{C1:.15,C2:.25,C3:.4},Laboratorio:{L:.2}},color:4,uni:"UPC",faculty:"FIB"},
allSubjects.a2={id:"a2",finalMark:0,necesaryMark:5,grades:{},name:"IES",evaluation:{Teoria:{FHC1:.25,FHC2:.15,FHC3:.25},Lab:{C1:.1,C2:.15,P:.1}},color:3,uni:"UPC",faculty:"FIB"},
allSubjects.a3={id:"a3",finalMark:0,necesaryMark:5,grades:{},name:"IDI",fullName:"Interacció i Disseny d'Interfícies",evaluation:{Teoria:{T1:.25,T2:.5},Lab:{L:.25},Extra:{E:.025}},color:2,uni:"UPC",faculty:"FIB"},
allSubjects.a4={id:"a4",finalMark:0,necesaryMark:5,grades:{},name:"XC",fullName:"Xarxes de Computadors",evaluation:{Teoria:{T1:.3,T2:.3,T3:.15},Lab:{L:.0625,ExL:.1875},Extra:{E:.1}},color:5,uni:"UPC",faculty:"FIB"};
allSubjects.a5={id:"a5",finalMark:0,necesaryMark:5,grades:{},name:"BD",fullName:"Bases de dades",evaluation:{Teoria:{F:.6},Lab:{L1:.1,L2:.075,L3:.075},Prob:{Pr:.15}},color:1,uni:"UPC",faculty:"FIB"},
allSubjects.a6={id:"a6",finalMark:0,necesaryMark:5,grades:{},name:"CI",fullName:"Interfícies de Computadors",evaluation:{Teoria:{T1:.23333,T2:.23333,T3:.23333},Lab:{L:.3}},color:3,uni:"UPC",faculty:"FIB"},
allSubjects.a7={id:"a7",finalMark:0,necesaryMark:5,grades:{},name:"EDA",fullName:"Estructures de Dades i Algorismes",evaluation:{Examens:{P1:.3,PC:.3,F:.6},Joc:{Joc:.2}},color:2,uni:"UPC",faculty:"FIB"},
allSubjects.a8={id:"a8",finalMark:0,necesaryMark:5,grades:{},name:"PE",fullName:"Probabilitat i Estadística",evaluation:{"Examen 1":{B1:.11764705882,B2:.1294117647,B3:.14117647058},"Examen 2":{B4:.15294117647,B5:.16470588235,B6:.17647058823},Treball:{B7:.11764705882}},color:7,uni:"UPC",faculty:"FIB"},
allSubjects.a9={id:"a9",finalMark:0,necesaryMark:5,grades:{},name:"SO",fullName:"Sistemes Operatius",evaluation:{Teoria:{T1:.2,T2:.3},Lab:{L1:.225,L2:.225,Test:.05}},color:4,uni:"UPC",faculty:"FIB"};


loadData();

function loadData(){
  subjects = Cookies.getJSON();
  
  for (const id in subjects) {    
    createSubjectCardCollapsed(id);    
  }
}

function createSubjectCardCollapsed(id) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card';
  card.onclick = function(event){toggleExpandCard(event, this);};
  card.innerHTML = '<h2>' + subjects[id].name +
  '</h2><p style="color: ' + (subjects[id].finalMark>=5 ? '#5a9764' : '#b9574c') + 
  ';">' + subjects[id].finalMark + '</p><div class="subject-bar"></div><div class="grades-input hidden" style="height: 0px;" ></div>';

  for (const examType in subjects[id].evaluation) {
    card.children[3].innerHTML += '<h3>' + examType + '</h3><div></div>';
    
    for (const exam in subjects[id].evaluation[examType]) {
      if (isUndone(id,examType,exam)) {        
        card.children[2].innerHTML += '<div onclick="selectInput(\'in-' + id + examType + exam + '\')" class="scol' + 'N' + '" style="flex-grow: ' + subjects[id].evaluation[examType][exam]*100 + '">' + exam + '<div id="bar-'+ id + examType + exam +'">' + subjects[id].necesaryMark + '</div></div>';
        card.children[3].lastChild.innerHTML += '<div><span>'+ exam +':</span><input type="number" id="in-'+ id + examType + exam +'" placeholder="'+ subjects[id].necesaryMark +'" value="" class="scol' + 'N2' + '" oninput="updateMark(\''+id+'\', \''+examType+'\', \''+exam+'\', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>';
      }else{
        card.children[2].innerHTML += '<div onclick="selectInput(\'in-' + id + examType + exam + '\')" class="scol' + subjects[id].color + '" style="flex-grow: ' + subjects[id].evaluation[examType][exam]*100 + '">' + exam + '<div id="bar-'+ id + examType + exam +'">' + subjects[id].grades[examType][exam] + '</div></div>';
        card.children[3].lastChild.innerHTML += '<div><span>'+ exam +':</span><input type="number" id="in-'+ id + examType + exam +'" placeholder="'+ subjects[id].necesaryMark +'" value="'+ subjects[id].grades[examType][exam] +'" class="scol' + subjects[id].color + '" oninput="updateMark(\''+id+'\', \''+examType+'\', \''+exam+'\', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>';
      }
    }
  }

  card.innerHTML += '</div>';

  dashboard.appendChild(card);
}

function selectInput(idInput) {
  document.getElementById(idInput).select();
}

function updateNecesaryMark(id) {
  subjects[id].necesaryMark = Math.max(0, round(gradeCalcAllEqual(id)));
  return subjects[id].necesaryMark;
}

function gradeCalcAllEqual(id) {
  let sumUndoneExams = 0;
  for (const examType in subjects[id].evaluation) {
    for (const exam in subjects[id].evaluation[examType]) {
      if (isUndone(id, examType, exam)) sumUndoneExams += subjects[id].evaluation[examType][exam];
    }
  }
  
  return (5-subjects[id].finalMark)/sumUndoneExams;
}

function updateFinalMark(id) {
  subjects[id].finalMark = 0;
  for (const examType in subjects[id].evaluation) {
    for (const exam in subjects[id].evaluation[examType]) {    
      if (!isUndone(id, examType, exam))  subjects[id].finalMark += subjects[id].grades[examType][exam] * subjects[id].evaluation[examType][exam];
    }
  }
  subjects[id].finalMark = round(subjects[id].finalMark);
  return subjects[id].finalMark;
}

function round(n) {
  return (n==='' || n == undefined) ? undefined : Math.floor(Math.round(n*100))/100;
}

//this function is inefficient, it must be changed 
function updateMark(id, examType, exam, mark, input) {
  let barElem = document.getElementById('bar-'+id+examType+exam);

  if (subjects[id].grades[examType] == undefined) {
    subjects[id].grades[examType] = {};
  }
  if (!isNaN(mark) && mark != '') {
    subjects[id].grades[examType][exam] = mark;
    
    updateAndDisplayMarks(id);
    
    barElem.parentElement.className = 'scol' + subjects[id].color;
    barElem.textContent = mark;
    input.className = 'scol' + subjects[id].color;
  } else{
    delete subjects[id].grades[examType][exam];

    updateAndDisplayMarks(id);

    barElem.parentElement.className = 'scolN';
    barElem.textContent = subjects[id].necesaryMark;
    input.className = 'scolN2';
    input.placeholder = subjects[id].necesaryMark;
  }

  let card = document.getElementById('card-' + id);
  let barUndone = card.getElementsByClassName('scolN');
  let inUndone = card.getElementsByClassName('scolN2');
  
  for (let j = 0; j < barUndone.length; j++) {
    barUndone[j].children[0].textContent = subjects[id].necesaryMark;
  }
  for (let j = 0; j < inUndone.length; j++) {
    inUndone[j].placeholder = subjects[id].necesaryMark;
  }
  
  Cookies.set(id, subjects[id], { expires: 365 });
}

function updateAndDisplayMarks(id) {
  let card = document.getElementById('card-' + id);
  updateFinalMark(id);
  updateNecesaryMark(id);
  card.children[1].textContent = subjects[id].finalMark;
  card.children[1].style.color = (subjects[id].finalMark>=5 ? '#5a9764' : '#b9574c');
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
  
      createSubjectCardCollapsed(id);
      Cookies.set(id, subjects[id], { expires: 365 });
      
    }
  }
  
  addSubjectPopupHide();

}

function isUndone(id, examType, exam) {
  return subjects[id].grades[examType] == undefined || subjects[id].grades[examType][exam] == undefined
}
