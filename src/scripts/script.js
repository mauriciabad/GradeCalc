"use strict";
/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var editSubjectPopup = document.getElementById('edit-popup-content');
var viewSubjectPopup = document.getElementById('view-popup-content');
var newSubjectPopup = document.getElementById('new-popup-content');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];
var searchCreateDiv = document.getElementById('subjects-search-create-div');
var searchResultsSubject = document.getElementById('subjects-search-results');
var searchResultsNone = document.getElementById('subjects-search-none');
var frozenLayer = document.getElementById('frozen-layer');
var frozenLayerMessage = document.getElementById('frozen-layer-message');
var frozenLayerWarning = document.getElementById('frozen-layer-warning');
var frozenWarningTimeout;

var allPopups = [
  'user-container',
  'add-container',
  'edit-container',
  'view-container',
  'new-container',
]
var userInfo;
var subjects = {};
var removedSubject = {};
var removedSubjectId = 'defaultID';

var toastTimer = 0;
var toast = document.getElementById('toast');

var displayName = 'Anónimo';
var photoURL = 'media/profile-pic.jpg';
var isAnonymous = true;
var uid = 0;

var db = firebase.firestore();
db.settings({ timestampsInSnapshots: true }); //remove when timestamps are updated
var userDB = null;
var subjectsDB = db.collection('subjects');

var client = algoliasearch('2R59JNYNOA', 'b8fd696952b9984035a380a3837662e0');
var index = client.initIndex('subjects_search');

var subjectsToAdd = {};

loadData();

// if (!isSubscribed) {
//   setTimeout(() => {
//     showToast('Quieres que te avisemos cuando salgan notas?', 'Avísame', 'subscribe();', 20000);
//   }, 8000);
// }

// also load firebase (at the bottom)
// also load navigo (at the next section)


/* -------------------- HISTORY && POPUPs ------------------------------ */

var setPageDashboard = (params) => {
  popupHideAll();
}

var setPageUser = (params) => {

}

var setPageMe = (params) => {
  popupShow('user-container', true);
}

var setPageMeEdit = (params) => {

}

var setPageMeSubjectEdit = (params) => {
  if (subjects[params.id]) {
    popupShow('edit-container', false);
    generateEditSubjectUI(params.id);
    // showSubjectInfo(params.id);
    // window.history.back();
  } else {
    showToast(`You don't have the subject ${params.id}`);
    window.history.back();
  }
}

var setPageMeSubjectAdd = (params) => {
  popupShow('add-container', false);
  document.getElementById('search-subject-input').focus();
}

var setPageSubjectNew = (params) => {
  popupShow('new-container', false);
  clearNewSubjectUI();
}

var setPageSubjectView = (params) => {
  subjectsDB.doc(params.id).get().then((doc) => {
    if (doc.exists) {
      popupShow('view-container', false);
      generateViewSubjectUI(params.id, doc.data());
    } else {
      window.history.back();
      console.error(`Subject width id ${params.id} doesn't exist`);
    }
  }).catch((error) => {
    window.history.back();
    console.error(`Error getting subject (${id}) info:`, error);
  });
}

var setPageSubjectEdit = (params) => {

}

var router = new Navigo(null, true);
router.on({
  '/user/:id': { as: 'user.view', uses: setPageUser },
  '/me': { as: 'me', uses: setPageMe },
  '/me/edit': { as: 'me.edit', uses: setPageMeEdit },
  '/me/subjects/:id/edit': { as: 'me.subject.edit', uses: setPageMeSubjectEdit },
  '/me/subjects/add': { as: 'me.subject.add', uses: setPageMeSubjectAdd },
  '/subjects/new': { as: 'subject.new', uses: setPageSubjectNew }, //asks basic info and finds duplicates, then goes to subject.edit
  '/subjects/:id': { as: 'subject.view', uses: setPageSubjectView },
  '/subjects/:id/edit': { as: 'subject.edit', uses: setPageSubjectEdit },
  '*': { as: 'dashboard', uses: setPageDashboard }
}).resolve();

function showUserInfo() {
  router.navigate(`/me`);
}

function showAddSubject() {
  router.navigate(`/me/subjects/add`);
}

function showEditSubject(id) {
  router.navigate(`/me/subjects/${id}/edit`);
}

function showViewSubject(id) {
  router.navigate(`/subjects/${id}`);
}

function showNewSubject() {
  router.navigate(`/subjects/new`);
}

//Shows the popup
function popupShow(id, isSmall) {
  popupHideAll(id);
  let elem = document.getElementById(id);
  elem.style.display = 'flex';
  elem.animate({
    opacity: [0, 1],
    easing: ["ease-in"]
  }, 125).onfinish = function () {
    if (!isSmall && window.matchMedia("(max-width: 600px)").matches) {
      currentScreen.style.display = 'none';
      topbar.style.display = 'none';
    }
  }
}

//Hides the popup
function popupHide(popup) {
  currentScreen.style.display = 'block';
  topbar.style.display = 'flex';
  popup.animate({
    opacity: [1, 0],
    easing: ["ease-in"]
  }, 125).onfinish = function () {
    popup.style.display = 'none';
  };
}

//Hides all popups
function popupHideAll(exeption) {
  for (const popup of allPopups) {
    if(popup != exeption){
      popupHide(document.getElementById(popup));
    }
  }
}

/* ------------------------------ UI CREATION ------------------------------ */

//Generate the cards with the subjects from localStorage
function loadData() {
  showLoader('Cargando tus asignaturas', 'dashboard');
  subjects = getSubjectsLocalStorage();
  console.info('Subjects loaded from localStorage');

  for (const id in subjects) {
    autoUpdate(id); 
    createSubjectCardCollapsed(id);
  }
  hideLoader('dashboard');
}

function autoUpdate(id) {
  if (subjects[id].evaluation != undefined || subjects[id].evaluations == undefined) {
    subjects[id].evaluations = toNewEvalNeeeeeeeeew(subjects[id].evaluation);
    delete subjects[id].evaluation;
    uploadEvaluation(id, subjects[id].evaluations);
    saveSubjectsLocalStorage();
  }
  if(Object.keys(subjects[id].evaluations).length == 0){
    delete subjects[id];
    saveSubjectsLocalStorage();
  }
  if (subjects[id].necesaryMark != undefined || subjects[id].necesaryMarks == undefined) {
    delete subjects[id].necesaryMark;
    subjects[id].necesaryMarks = {};
    for (const evaluation in subjects[id].evaluations) {
      subjects[id].necesaryMarks[evaluation] = {};
      for (const examName in subjects[id].evaluations[evaluation].exams) { 
        subjects[id].necesaryMarks[evaluation][examName] = subjects[id].evaluations[evaluation].passMark;
      }
    }
    updateNecesaryMark(id);
    saveSubjectsLocalStorage();
  }
}

//updates the subject card information (bar, inputs and names)
function updateSubjectCardInfo(id) {
  getCard(id).innerHTML =
    `<button onclick="deleteSubject('${id}')" class="subject-card-remove">
  <img src="media/trash.svg" alt="x" aria-label="Delete subject">
</button>
<button onclick="showEditSubject('${id}')" class="subject-card-info">
  <img src="media/edit.svg" alt="%" aria-label="Show subject information">
</button>
<h2>${subjects[id].shortName}</h2>
<p class="subject-finalMark" style="color: ${isPassed(id,subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p>
<div class="subject-bar">${generateBar(id)}</div>
<div class="grades-input hidden" style="height: 0px;">${generateInputs(id) + generateEvaluations(id)}</div>`;

  updateAndDisplayMarks(id, false);
}

//Creates the subject card and appends it to the dashboard
function createSubjectCardCollapsed(id) {
  if(!document.getElementById('card-' + id)){
    var card = document.createElement('div');
    card.id = 'card-' + id;
    card.classList.add('subject-card');
    card.onclick = function (event) { toggleExpandCard(event, this); };
    card.innerHTML =
      ` <button onclick="deleteSubject('${id}')" class="subject-card-remove">
          <img src="media/trash.svg" alt="x" aria-label="Delete subject">
        </button>
        <button onclick="showEditSubject('${id}')" class="subject-card-info">
          <img src="media/edit.svg" alt="%" aria-label="Show subject information">
        </button>
        <h2>${subjects[id].shortName}</h2>
        <p class="subject-finalMark" style="color: ${isPassed(id,subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p>
        <div class="subject-bar">${generateBar(id)}</div>
        <div class="grades-input hidden" style="height: 0px;">${generateInputs(id) + generateEvaluations(id)}</div>`;

    dashboard.appendChild(card);
    updateAndDisplayMarks(id, false);
    hideTutorial();
  }
}

function generateBar(id) {
  let weight = 0;
  let barHTML = "";
  for (const exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    if (isUndone(id, exam)) {
      let mark = '';
      if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][exam] == null) {
        mark = 'ಥ_ಥ';
      }else{
        mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][exam];
      }
      barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scol${subjects[id].color} scolN" style="flex-grow: ${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}" title="${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}%" data-exam="${exam}">${exam}<div id="bar-${id + exam}" data-exam="${exam}">${mark}</div></div>`;
    } else {
      barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scol${subjects[id].color}" style="flex-grow: ${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}" title="${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}%" data-exam="${exam}">${exam}<div id="bar-${id + exam}" data-exam="${exam}">${subjects[id].grades[exam]}</div></div>`;
    }
  }
  return barHTML;
}
function generateInputs(id) {
  let html = '';
  let types = {};

  for (const examName in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    let exam = subjects[id].evaluations[subjects[id].selectedEvaluation].exams[examName];
    
    if(!types[exam.type]) types[exam.type] = {};
    if(!types[exam.type].weight) types[exam.type].weight = 0;
    if(!types[exam.type].inputsHTML) types[exam.type].inputsHTML = '';

    types[exam.type].weight += exam.weight;

    let mark = '';
    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][examName] == null) {
      mark = 'ಥ_ಥ';
    }else{
      mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][examName];
    }

    if (isUndone(id, examName)) {
      types[exam.type].inputsHTML += `<div><span>${examName}:</span><input type="number" id="in-${id + examName}" data-exam="${examName}" placeholder="${mark}" value="" class="scol${subjects[id].color} scolN2" oninput="updateMarkFromCardInput('${id}', '${examName}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
    } else {
      types[exam.type].inputsHTML += `<div><span>${examName}:</span><input type="number" id="in-${id + examName}" data-exam="${examName}" placeholder="${mark}" value="${subjects[id].grades[examName]}" class="scol${subjects[id].color}" oninput="updateMarkFromCardInput('${id}', '${examName}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
    }
  }

  for (const type in types) {
    html += `<h3>${type}</h3><span>${round(types[type].weight * 100, 0)}%</span><div>${types[type].inputsHTML}</div>`;
  }

  return html;
}

function generateEvaluations(id) {
  let evaluationsHTML =
    `<div class="evaluation-select"${Object.keys(subjects[id].evaluations).length <= 1 ? ' style="display: none;"' : ''}>
  <span>Evaluación:</span>
  <select onchange="setSelectedEvaluation('${id}',this.value);">`;
  for (const evaluation in subjects[id].evaluations) {
    evaluationsHTML += `<option value="${evaluation}"${evaluation == subjects[id].selectedEvaluation ? 'selected="selected"' : ''}>${evaluation}</option>`;
  }
  evaluationsHTML +=
    `</select>
</div>`;
  return evaluationsHTML;
}

function addToSubjectsToAdd(id, checked) {
  if(checked){
    subjectsToAdd[id] = null;
  } else {
    delete subjectsToAdd[id];
  }
}

//Adds the subjects selected in the popup
function addSubjects() {
  showLoader('Cargando tus asignaturas', 'dashboard');
  document.getElementById('search-subject-input').value = '';

  for (let id in subjectsToAdd) {
    if (subjects[id] == undefined) {
      if(subjectsToAdd[id] == null){
        addSubjectFromDB(id);
      } else {
        addSubject(id, subjectsToAdd[id])
      }
    } else {
      // showToast(`Ya tienes ${subjects[id].shortName}`);
    }
  }
  window.history.back();
  searchSubjects();
}

function addSubject(id, subject) {
  subjects[id] = completeSubject(subject);
  createSubjectCardCollapsed(id);

  updateFinalMark(id);
  updateNecesaryMark(id);

  saveSubjectsLocalStorage();
  hideLoader('dashboard');
}
function addSubjectFromDB(id) {
  subjectsDB.doc(id).get().then((doc) => {
    if (doc.exists) {
      addSubject(id, doc.data());
    } else {
      console.error('Subject dosen\'t exists');
    }
  }).catch(function (error) {
    console.error(`Error getting subject (${id}) info:`, error);
  });
}

function completeSubject(...subjects) {
  let subject = Object.assign(
    {
      evaluations: {},
      grades: {},
      fullName: '',
      shortName: '',
      faculty: '',
      uni: '',
      course: '',
      color: random(1,8),

      necesaryMarks: {},
      finalMark: {}
    },
    ...subjects
  );
  delete subject.id;
  delete subject.evaluation; // TODO: remove this if all subjects have last evaluation structure
  if (!subject.selectedEvaluation || !Object.keys(subject.evaluations).includes(subject.selectedEvaluation)) subject.selectedEvaluation = Object.keys(subject.evaluations)[0] || '';
    for (const evaluation in subject.evaluations) {
      if(!subject.necesaryMarks[evaluation]) {
        subject.necesaryMarks[evaluation] = {};
        for (const examName in subject.evaluations[evaluation].exams) { 
          subject.necesaryMarks[evaluation][examName] = subject.evaluations[evaluation].passMark;
        }
        subject.finalMark[evaluation] = 0;
      }
    }
  return subject;
}

function clearNewSubjectUI() {
  let html = generateEditSubjectUIHTML('new', completeSubject({creator: displayName, creationDate: {seconds: Math.floor(Date.now()/1000), nanoseconds: 0}}), 'new');
  
  newSubjectPopup.innerHTML = html;
}

function generateViewSubjectUI(id, subject) {
  let html = generateEditSubjectUIHTML(id, subject, 'view');
  
  viewSubjectPopup.innerHTML = html;

  let evaluations = Object.keys(subject.evaluations);
  for (const evaluationCount in evaluations) {
    updateSumWeight(viewSubjectPopup, evaluationCount);
  }
}

function generateEditSubjectUI(id, subject = subjects[id]) {
  let html = generateEditSubjectUIHTML(id, subject, 'edit');

  editSubjectPopup.innerHTML = html;

  let evaluations = Object.keys(subject.evaluations);
  for (const evaluationCount in evaluations) {
    updateSumWeight(editSubjectPopup, evaluationCount);
  }
}

function generateEditSubjectUIHTML(id, subject, popup) {
  let exams = toNewEval(subject.evaluations);
  let evaluations = Object.keys(subject.evaluations);
  let grid = '';
  let newEvals = '';
  let newExams = '';
  let footer = '';
  let colors = '';
  let conditions = '';

  newEvals += `<input style="grid-row: 1; grid-column: ${(5 + evaluations.length * 1)};" class=" edit-new-evaluation" data-evaluation="${evaluations.length}" type="text" name="evaluationName" value="" placeholder="NEW" autocomplete="off" oninput="updateEvalName(this.dataset.evaluation, this.value, '${popup}');">`;

  let examCount = 0;
  for (const exam in exams) {
    grid += `
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="" type="text"   name="exam"       value="${exam}"                 data-exam="${examCount}" placeholder="NEW" autocomplete="off" maxlength="5" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="" type="text"   name="examType"   value="${exams[exam].examType}" data-exam="${examCount}" placeholder="Parciales" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="" type="number" name="mark"       value=""                        data-exam="${examCount}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">`;
    newEvals += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evaluations.length * 1)};" class="edit-weight edit-new-evaluation" data-exam="${examCount}" data-evaluation="${evaluations.length}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    for (const evaluationCount in evaluations) {
      grid += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evaluationCount * 1)};" class="edit-weight" data-exam="${examCount}" data-evaluation="${evaluationCount}"><input type="number" name="weight" value="${exams[exam].weight[evaluations[evaluationCount]] && exams[exam].weight[evaluations[evaluationCount]] != 0 ? round(exams[exam].weight[evaluations[evaluationCount]] * 100, 4) : ''}" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    }
    ++examCount;
  }
  for (const evaluationCount in evaluations) {
    grid += `<input style="grid-row: 1; grid-column: ${(5 + evaluationCount * 1)};" class="edit-evaluationName" type="text" name="evaluationName" value="${evaluations[evaluationCount]}" data-evaluation="${evaluationCount}" placeholder="NEW" autocomplete="off" required oninput="updateEvalName(this.dataset.evaluation, this.value, '${popup}');">`;
    newExams += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evaluationCount * 1)};" class="edit-weight edit-new-exam" data-exam="${examCount}" data-evaluation="${evaluationCount}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    footer += `<span  style="grid-row: ${(3 + examCount * 1)}; grid-column: ${(5 + evaluationCount * 1)};" class="edit-total" data-evaluation="${evaluationCount}">0%</span>`;
    conditions += `<label class="edit-conditions-label">${evaluations[evaluationCount]}</label><input class="edit-conditions-input" type="text" placeholder="nombreExamen >= 2" name="condition" data-evaluation="${evaluationCount}" value="${subject.evaluations[evaluations[evaluationCount]].condition || ''}">`;
  }
  newExams += `
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${examCount}" placeholder="NEW" autocomplete="off" maxlength="5">
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${examCount}" placeholder="Parciales">
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${examCount}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">
  `;

  for (const color of [1, 8, 3, 4, 6, 5, 2, 7]) {
    colors += `
    <label class="scol${color}"  for="color-bar-${popup}-elem${color}">
      <input type="radio" name="color-bar" value="${color}" id="color-bar-${popup}-elem${color}" ${(color == subject.color) ? 'checked' : ''}>
      <span class="edit-color-checkmark"></span>
    </label>`;
  }

  let html = `
  <h2>Información</h2>
  <input type="hidden" name="id" id="${popup}-id" value="${id}" style="display: none;" hidden>
  <div class="edit-popup-info">
    <div>
      <label for="${popup}-shortName">Nombre</label>
      <input type="text" name="shortName" id="${popup}-shortName" value="${subject.shortName}" placeholder="M2" required>
    </div>
    <div class="edit-fullName">
      <label for="${popup}-fullName">Nombre Largo</label>
      <input type="text" name="fullName" id="${popup}-fullName" value="${subject.fullName ? subject.fullName : ''}" placeholder="Matemáticas 2" required>
    </div>
  </div>
  <div class="edit-popup-info">
    <div>
      <label for="${popup}-course">Curso</label>
      <input type="text" name="course" id="${popup}-course" value="${subject.course ? subject.course : ''}" placeholder="Q1 2019-2020" required>
    </div>
    <div>
      <label for="${popup}-faculty">Facultad</label>
      <input type="text" name="faculty" id="${popup}-faculty" value="${subject.faculty ? subject.faculty : ''}" placeholder="FIB" required>
    </div>
    <div>
      <label for="${popup}-uni">Universidad</label>
      <input type="text" name="uni" id="${popup}-uni" value="${subject.uni ? subject.uni : ''}" placeholder="UPC" required>
    </div>
  </div>
  <div class="color-bar">
    ${colors}
    <!-- <label class="scol0"  for="color-bar-elem0">
      <input type="radio" name="color-bar" value="0" id="color-bar-elem0">
      <span class="edit-color-checkmark edit-color-checkmark-random"></span>
    </label> -->
  </div>

  <div class="edit-popup-info">
    <div>
      <span>Fecha de creación: <span id="${popup}-creationDate">${subject.creationDate ? new Date(subject.creationDate.seconds * 1000).toLocaleDateString('es-ES') : '--/--/----'}</span></span>
    </div>
    <div>
      <span>Creador: <span id="${popup}-creator">${subject.creator ? subject.creator : 'Anónimo'}</span></span>
    </div>
  </div>

  <h2>Evaluación</h2>
  <div class="edit-popup-grid" onkeyup="editUIUpdateGrid(this, event, '${popup}');" data-evaluations="${evaluations.length}" data-exams="${examCount}">
    <!-- Header -->
    <span  style="grid-row: 1; grid-column: 1;" >Nombre</span>
    <span  style="grid-row: 1; grid-column: 2;" >Categoría</span>
    <span  style="grid-row: 1; grid-column: 3;" >Nota</span>

    <!-- Body -->
    ${grid}
    <!-- Divider -->
    <div style="grid-row: 2 / ${2 + examCount};" class="grid-separator-evaluation"></div>

    <!-- new -->
    ${newEvals}
    ${newExams}

    <!-- Footer -->
    ${footer}
    
  </div>

  <h2 style="display: none;" >Condiciones extra para aprovar</h2>
  <div style="display: none;" class="edit-conditions">
    ${conditions}
  </div>`;

  return html;
}

/* ------------------------------ UI & DATA UPDATE ------------------------------ */
function updateEvalName(evaluationN, value, popup) {
  let label = document.querySelector(`#${popup}-popup-content .edit-conditions-label[data-evaluation='${evaluationN}']`);
  if(label) label.textContent = value || '';
}

//Updates, saves and shows the finalMark and necesaryMarks
function updateAndDisplayMarks(id, confetti = true) {
  updateFinalMark(id, confetti);
  updateNecesaryMark(id);

  displayFinalMark(id);
  displayNecesaryMark(id);
  congratulate();
}

function displayNecesaryMark(id) {
  let card = getCard(id);
  let barUndone = card.getElementsByClassName('scolN');
  let inUndone = card.getElementsByClassName('scolN2');

  for (const barElem of barUndone) {
    let mark = '';
    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][barElem.dataset.exam] == null) {
      mark = 'ಥ_ಥ';
    }else{
      mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][barElem.dataset.exam];
    }    
    barElem.children[0].textContent = mark;
  }
  for (let j = 0; j < inUndone.length; j++) {
    let mark = '';
    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][inUndone[j].dataset.exam] == null) {
      mark = 'ಥ_ಥ';
    }else{
      mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][inUndone[j].dataset.exam];
    }
    inUndone[j].placeholder = mark;
  }
}

function displayFinalMark(id) {
  let cardFinalMark = getCard(id).getElementsByClassName('subject-finalMark')[0];
  cardFinalMark.textContent = subjects[id].finalMark[subjects[id].selectedEvaluation];
  cardFinalMark.style.color = (isPassed(id,subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c');
}

function updateNecesaryMark(id) {
  let evaluation = subjects[id].selectedEvaluation;
  let identifiers = getConditionIdentifiers(id,evaluation);
  for (const exam in subjects[id].necesaryMarks[evaluation]) { 
    subjects[id].necesaryMarks[evaluation][exam] = undefined;
  }

  for (const exam in identifiers.exams) {
    switch(identifiers.exams[exam].operator){
      case '>=': subjects[id].necesaryMarks[evaluation][exam] = identifiers.exams[exam].value; break;
    }
  }
  
  for (const type in identifiers.types) {
    switch(identifiers.types[type].operator){
      case '>=': 
        for (const exam in subjects[id].necesaryMarks[evaluation]) { 
          if (subjects[id].evaluations[evaluation].exams[exam].type == type) {
            if (subjects[id].necesaryMarks[evaluation][exam] !== undefined && subjects[id].necesaryMarks[evaluation][exam] < identifiers.types[type].value) {
              subjects[id].necesaryMarks[evaluation][exam] = identifiers.types[type].value;
            }
          }
        }
        break;
    }
  }

  gradeCalcAllEqual(id, subjects[id].selectedEvaluation);
}

function smallestNecessaryMark(id, evaluation) {
  let result = {};
  for (const exam in subjects[id].necesaryMarks[evaluation]) {
    if(result.mark === undefined || result.mark < subjects[id].necesaryMarks[evaluation][exam]){
      result.exam = exam;
      result.mark = subjects[id].necesaryMarks[evaluation][exam];
    }
  }
  return result;
}

//Saves and updates the value of the finalMark
function updateFinalMark(id, confetti = true) {
  for (const evaluation in subjects[id].evaluations) {
    subjects[id].finalMark[evaluation] = 0;
    for (const exam in subjects[id].evaluations[evaluation].exams) {
      if (!isUndone(id, exam)) subjects[id].finalMark[evaluation] += subjects[id].grades[exam] * subjects[id].evaluations[evaluation].exams[exam].weight;
    }
    subjects[id].finalMark[evaluation] = round(subjects[id].finalMark[evaluation]);
  }
  let nowPassed = isPassed(id);
  if (confetti && !subjects[id].passed && nowPassed) showConfetti(getCard(id));
  subjects[id].passed = nowPassed;
  return subjects[id].finalMark[subjects[id].selectedEvaluation];
}

//Saves the changed mark, updates finalMark and necesaryMarks, and shows the info in the UI
function updateMarkFromCardInput(id, exam, mark, input) {
  let barElem = getBarElem(id, exam);

  if (!isNaN(mark) && mark != '') {
    subjects[id].passed = isPassed(id)
    subjects[id].grades[exam] = Number(mark);
    uploadGrade(id, exam, subjects[id].grades[exam]);

    barElem.parentElement.classList.remove('scolN');
    barElem.textContent = mark;
    input.classList.remove('scolN2');
  } else {
    delete subjects[id].grades[exam];
    uploadGrade(id, exam, undefined);

    barElem.parentElement.classList.add('scolN');
    input.classList.add('scolN2');
  }
  updateAndDisplayMarks(id);
  saveSubjectsLocalStorage();
}

function updateCardGrades(id) {
  let card = getCard(id);
  for (let div of card.getElementsByClassName('subject-bar')[0].children) {
    div.classList.add('scolN');
  }
  for (const exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    let input = getInput(id, exam);
    input.classList.add('scolN2');
    input.value = '';
  }
  for (const exam in subjects[id].grades) {
    let barElem = getBarElem(id, exam);
    let input = getInput(id, exam);
    if (barElem && input) {
      barElem.textContent = subjects[id].grades[exam];
      barElem.parentElement.classList.remove('scolN');
      input.value = subjects[id].grades[exam];
      input.classList.remove('scolN2');
    } else {
      console.log(`Exam ${exam} of ${subjects[id].shortName} (${id}) is not in the card`);
    }
  }
  updateAndDisplayMarks(id);
}

// updates the selectedEvaluation, saves the subjects and displays the new selectedEvaluation
function setSelectedEvaluation(id, evaluation = subjects[id].selectedEvaluation) {
  subjects[id].selectedEvaluation = evaluation;
  saveSubjectsLocalStorage();
  let card = getCard(id);
  card.getElementsByClassName('subject-bar')[0].innerHTML = generateBar(id);
  card.getElementsByClassName('grades-input')[0].innerHTML = generateInputs(id) + generateEvaluations(id, evaluation);
  updateHeigth(card.getElementsByClassName('grades-input')[0]);
  updateAndDisplayMarks(id);
}

// shoot confeti in that element's left down corner
function showConfetti(elem, conf) {
  if (conf == undefined) {
    conf = {
      angle: random(60, 70),
      spread: random(40, 50),
      startVelocity: random(60, 90),
      elementCount: random(30, 60),
      decay: 0.8,
      colors: [
        '#E68F17',
        '#FAB005',
        '#FA5252',
        '#E64980',
        '#BE4BDB',
        '#0B7285',
        '#15AABF',
        '#EE1233',
        '#40C057'
      ]
    };
  }
  window.confetti(elem, conf);
}

// returns the card DOM element with that id
function getCard(id) {
  let elem = document.getElementById('card-' + id);
  if(!elem) {
    createSubjectCardCollapsed(id);
    elem = document.getElementById('card-' + id);
  }
  return elem;
}
// returns the input DOM element of the card from the subject id and exam exam
function getInput(id, exam) {
  let elem = document.getElementById('in-' + id + exam);
  if(!elem) {
    createSubjectCardCollapsed(id);
    elem = document.getElementById('in-' + id + exam);
  }
  return elem;
}
// returns the card bar DOM element of the card from the subject id and exam exam
function getBarElem(id, exam) {
  let elem = document.getElementById('bar-' + id + exam);
  if(!elem) {
    createSubjectCardCollapsed(id);
    elem = document.getElementById('bar-' + id + exam);
  }
  return elem;
}

/* ------------------------------ MATH ------------------------------ */

function gradeCalcAllEqual(id, evaluation) {
  let sumUndoneExams = 0;
  let exams = [];
  let expectedMark = 0;
  for (const exam in subjects[id].evaluations[evaluation].exams) {
    if (isUndone(id, exam)){
      if(subjects[id].necesaryMarks[evaluation][exam] == undefined) {
        sumUndoneExams += subjects[id].evaluations[evaluation].exams[exam].weight;
        exams.push(exam);
      }else{
        expectedMark += subjects[id].evaluations[evaluation].exams[exam].weight * subjects[id].necesaryMarks[evaluation][exam];
      }
    }else{      
      expectedMark += subjects[id].evaluations[evaluation].exams[exam].weight * subjects[id].grades[exam];
    }
  }
  let passMark = subjects[id].evaluations[evaluation].passMark || 5;
  let necesaryMark = (passMark - expectedMark) / sumUndoneExams;
  let smallestNecesaryMark = smallestNecessaryMark(id, evaluation);
  if (smallestNecesaryMark.mark != undefined && smallestNecesaryMark.mark < necesaryMark){
    subjects[id].necesaryMarks[evaluation][smallestNecesaryMark.exam] = undefined;
    gradeCalcAllEqual(id, evaluation);
  }else{
    let canPass = calcCondition(id, evaluation, false);
    for (const exam in subjects[id].evaluations[evaluation].exams) {
      if(!subjects[id].necesaryMarks[evaluation][exam]) {
        if (isUndone(id, exam)){
          if(canPass === false){
            subjects[id].necesaryMarks[evaluation][exam] = null;
          }else{
            subjects[id].necesaryMarks[evaluation][exam] = Math.max(0, round(necesaryMark));
          }
        }
        else {
          subjects[id].necesaryMarks[evaluation][exam] = subjects[id].grades[exam];
        }
      }
    }
  }
}

//returns n rounded to d decimals (2)
function round(n, d = 2) {
  return (isNaN(n) || n === '' || n == undefined) ? undefined : Math.floor(Math.round(n * (10 ** d))) / (10 ** d);
}

// returns a random number from min to max
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Congratulations
function ShowEasterEgg() {
  document.getElementById('congratulations-button').style.display = 'none';
  document.getElementById('congratulations').style.display = 'block';
  document.body.style.setProperty('--background-color', '#000');
  // document.body.classList.add('rainbow-bg');
  let videoAspectRatio = 16/9;
  if(document.documentElement.clientWidth*100/videoAspectRatio < document.documentElement.clientHeight*50){
    document.body.style.paddingBottom = `${100/videoAspectRatio}vw`;
  }else{
    document.getElementsByTagName('body')[0].style.paddingBottom = '50vh';
  }
  if(congratulationsVideo != undefined){
    congratulationsVideo.setVolume(100);
    congratulationsVideo.playVideo();
  }
}

function HideEasterEgg() {
  document.getElementById('congratulations').style.display = 'none';
  document.body.style.setProperty('--background-color', 'inherit');
  // document.body.classList.remove('rainbow-bg');
  document.body.style.paddingBottom = '0';
  if(congratulationsVideo != undefined){
    congratulationsVideo.pauseVideo();
  }
  congratulate();
}

var congratulationsVideo;
function onYouTubeIframeAPIReady() {congratulationsVideo = new YT.Player('congratulations');}
function congratulate() {
  if (hasPassedEverything()) {
    document.getElementById('congratulations-gift').src = `media/gift_jump_once.gif?n=${Math.random()}`;
    document.getElementById('congratulations-button').style.display = 'block';
  } else {
    document.getElementById('congratulations-button').style.display = 'none';
  }
}

// returns true if all subjects are passed in each selectedEvaluation
function hasPassedEverything() {
  if (isEmpty(subjects)) return false;
  for (const id in subjects) {
    if (!isPassed(id)) return false;
  }
  return true;
}

// returns true if the subject with that id has a finalMark greater than mark (5) in the evaluation (selectedEvaluation)
function isPassed(id, evaluation = subjects[id].selectedEvaluation) {
  return subjects[id].evaluations[evaluation] != undefined && subjects[id].finalMark[evaluation] >= (subjects[id].evaluations[evaluation].passMark || 5) && calcCondition(id, evaluation) ;
}

function getExamTypesGrades(id, evaluation) {
  let types = {};
  for (const examName in subjects[id].evaluations[evaluation].exams) {
    let exam = subjects[id].evaluations[evaluation].exams[examName];
    if(!types[exam.type]) types[exam.type] = 0;
    types[exam.type] += exam.weight * (subjects[id].grades[examName] || 0);
  }
  return types;
}

function getConditionIdentifiers(id, evaluation) {
  if(!subjects[id].evaluations[evaluation].condition) return true;
  let tree = jsep(subjects[id].evaluations[evaluation].condition);
  let identifiers = {
    exams: {},
    evaluations: {},
    types: {}
  };
  let types = Object.keys(getExamTypesGrades(id, evaluation));
  findIdentifiersTree(tree, identifiers, types, id, evaluation);
  return identifiers;
}

function findIdentifiersTree(tree, identifiers, types, id, evaluation) {
  switch(tree.type){
    case 'LogicalExpression':
    case 'BinaryExpression':
      if(tree["left"].type == 'Identifier' && tree["right"].type == 'Literal'){
        identifiers[identifierCategory(tree["left"].name, id, evaluation,types)][tree["left"].name] = {
          value: tree["right"].value,
          operator: tree.operator
        };
      }else{
        findIdentifiersTree(tree["left"], identifiers, types, id, evaluation);
        findIdentifiersTree(tree["right"], identifiers, types, id, evaluation);
      }
      break;
  }
}

function identifierCategory(identifier, id, evaluation, types = undefined) {
  if(Object.keys(subjects[id].evaluations[evaluation].exams).includes(identifier)) return 'exams';
  if(Object.keys(subjects[id].evaluations).includes(identifier)) return 'evaluations';
  if(types == undefined) types = Object.keys(getExamTypesGrades(id, evaluation));
  if(types.includes(identifier)) return 'types';
}

function calcCondition(id, evaluation, now = true) {
  if(!subjects[id].evaluations[evaluation].condition) return true;
  let tree = jsep(subjects[id].evaluations[evaluation].condition);
  let values = {
    ...subjects[id].grades,
    ...subjects[id].finalMark,
    ...getExamTypesGrades(id, evaluation)
  };
  return evaluationTree(tree, values, now);
}

function evaluationTree(tree, values, now) {
  switch(tree.type){
    case 'LogicalExpression':
      switch (tree.operator) {
        case '&&': return evaluationTree(tree["left"], values, now) && evaluationTree(tree["right"], values, now); break;
        default:   return null; break;
      }
      break;
    case 'BinaryExpression':
      switch(tree.operator){
        case '>=': 
          if(tree["left"].type != 'Identifier' || tree["right"].type != 'Literal'){
            return null;
          }else{
            if(!now && values[tree["left"].name] == undefined) return true;
            else return (values[tree["left"].name] || 0) >= tree["right"].value;
          }
          break;
        case '<': 
          if(tree["left"].type != 'Identifier' || tree["right"].type != 'Literal' || identifierCategory(tree["left"].name) != 'evaluations'){
            return null;
          }else{
            if(!now && values[tree["left"].name] == undefined) return true;
            else return (values[tree["left"].name] || 0) < tree["lerightft"].value;
          }
          break;
        default: return null; break;
      }
      break;
    case 'Literal':
      return tree.value; break;
    case 'Identifier':
      return values[tree.name] || 0; break;
    default:
      return null; break;
  }
}

/* ------------------------------ UI MANIPULATION ------------------------------ */

//Expands or collapses the card
function toggleExpandCard(event, card) {
  let inputs = card.getElementsByClassName('grades-input')[0];
  let bar = card.getElementsByClassName('subject-bar')[0];
  if (!['INPUT', 'SELECT', 'OPTION', 'BUTTON', 'IMG'].includes(event.target.tagName)) {
    if (bar.contains(event.target)) {
      inputs.classList.remove('hidden');
    } else {
      inputs.classList.toggle('hidden');
    }
    updateHeigth(inputs);
  }
}

function updateHeigth(elem) {
  elem.style.height = (elem.classList.contains('hidden') ? 0 : elem.scrollHeight) + 'px';
}

//Puts the cursor and selects the content of the input
function selectInput(idInput) {
  document.getElementById(idInput).select();
}

function appendElement(parent, str) {
  let div = document.createElement('div');
  div.innerHTML = str.trim();
  let element = div.firstChild;
  parent.appendChild(element);
  return element;
}


/* ------------------------------ Cards Remove animation ------------------------------ */
var cards; updateCards();
var cardsOldInfo = {};
var cardsNewInfo = cardsOldInfo;

function removeCard(card) {
  cardsOldInfo = getCardsInfo();
  card.parentNode.removeChild(card);
  cardsNewInfo = getCardsInfo();
  moveCards();
}

function getCardsInfo() {
  updateCards();
  let cardsInfo = {};
  cards.forEach((card) => {
    var rect = card.getBoundingClientRect();
    cardsInfo[card.id] = {
      "x": rect.left,
      "y": rect.top,
      "width": (rect.right - rect.left)
    };
  });
  return cardsInfo;
}

function moveCards() {
  updateCards();

  cards.forEach((card) => {
    // console.log(card.id);
    // console.log(cardsOldInfo[card.id]);
    // console.log(cardsNewInfo[card.id]);
    card.animate([
      { transform: `translate(${cardsOldInfo[card.id].x - cardsNewInfo[card.id].x}px, ${cardsOldInfo[card.id].y - cardsNewInfo[card.id].y}px) scaleX(${cardsOldInfo[card.id].width / cardsNewInfo[card.id].width})` },
      { transform: 'none' }
    ], {
        duration: 250,
        easing: 'ease-out'
      });
  });
}

function updateCards() {
  cards = document.querySelectorAll('.subject-card');
}

/* ------------------------------ USEFUL STUF ------------------------------ */

//Returns if the exam is undone
function isUndone(id, exam) {
  return subjects[id].grades[exam] === undefined;
}

function isEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

function showToast(message, action, code, time = 8000) {
  toast.style.display = 'none';
  // setCSSvar('toastTime', Math.max(0, (time-3000) +'ms'));
  toast.style.animation = `goUp 500ms cubic-bezier(0.215, 0.61, 0.355, 1), fadeOut ${Math.max(0, (time - 3000))}ms 2.5s cubic-bezier(1, 0, 1, 1), opaque 2.5s`;
  toast.offsetHeight;
  toast.style.display = 'flex';
  toast.firstChild.innerHTML = `<p>${message}</p>`;
  if (action && code) toast.firstChild.innerHTML += `<button onclick="${code}">${action}</button>`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, time);
}

// function setCSSvar(variable, value) {
//   let root = document.documentElement;
//   root.style.setProperty('--'+variable, value);
// }

function showLoader(message, position) {
  let loader = document.getElementById(position + '-loader');
  loader.lastElementChild.textContent = message;
  loader.style.display = 'block';
}

function hideLoader(position) {
  document.getElementById(position + '-loader').style.display = 'none';
}

function getSubjectsLocalStorage() {
  return JSON.parse(localStorage.getItem("subjects")) || {};
}

function saveSubjectsLocalStorage() {
  localStorage.setItem("subjects", JSON.stringify(subjects || {}));
  return subjects;
}

// function isValidJSON(str) {
//   let  json = undefined;
//   try {json = JSON.parse(str);} catch (e){console.error(e);}
//   return json;
// }

function toNewEvalNeeeeeeeeew(evaluations) {
  var evaluationNew = {};
  for (let evaluation in evaluations) {
    if(evaluations[evaluation].exams) return evaluations;
    evaluationNew[evaluation] = {};
    evaluationNew[evaluation].condition = '';
    evaluationNew[evaluation].passMark = 5;
    evaluationNew[evaluation].exams = {};
    for (let examType in evaluations[evaluation]) {
      for (let exam in evaluations[evaluation][examType]) {
        evaluationNew[evaluation].exams[exam] = {};
        evaluationNew[evaluation].exams[exam].weight = evaluations[evaluation][examType][exam];
        evaluationNew[evaluation].exams[exam].type = examType;
      }
    }
  }
  return evaluationNew;
}

function getRandomID() {
  return Math.random().toString(36).substr(2);
}

/* ------------------------------ EDITOR ------------------------------ */

// function showSubjectInfo(id,placeholder=JSON.stringify(subjects[id].evaluation)) {
//   let json = prompt(`Editar evaluación de ${subjects[id].shortName}: \n${JSON.stringify(subjects[id].evaluation,null, '    ')}`,placeholder);
//   if (json != placeholder) {
//     let newEval = isValidJSON(json);
//     if (newEval) {
//       subjects[id].evaluation = newEval;
//       setSelectedEvaluation(id);
//       uploadEvaluation(id,newEval);
//       updateCardGrades(id);
//     }else{
//       if(json) showToast('JSON Incorrecto','Reintentar',`showSubjectInfo('${id}','${json}');`)
//     }
//   }
// }


function toNewEval(evaluations) {
  let newEval = {};
  for (const evaluation in evaluations) {
    for (const exam in evaluations[evaluation].exams) {
      if (!newEval[exam]) newEval[exam] = {};
      if (!newEval[exam].weight) newEval[exam].weight = {};
      newEval[exam].weight[evaluation] = evaluations[evaluation].exams[exam].weight;
      newEval[exam].mark = evaluations[evaluation].exams[exam].mark;
      newEval[exam].examType = evaluations[evaluation].exams[exam].type;
    }
  }
  return newEval;
}

function updateSumWeight(grid, n) {
  let total = 0;
  for (let element of grid.querySelectorAll(`.edit-weight[data-evaluation='${n}'] > input`)) {
    total += element.value * 1;
  }
  grid.querySelector(`.edit-total[data-evaluation='${n}']`).textContent = round(total, 4) + '%';
  return total;
}

function freeze(message="", maxTime=10) {
  frozenLayerMessage = message;
  frozenLayer.style.display = "flex";
  frozenLayer.style.opacity = 1;

  frozenLayerWarning.style.display = "none";
  frozenWarningTimeout = setTimeout(() => {
    frozenLayerWarning.style.display = "inline-block";
  }, maxTime*1000);
}

function unfreeze(){
  frozenLayerMessage = "Cargando...";
  frozenLayer.style.display = "none";
  frozenLayer.style.opacity = 0;

  clearTimeout(frozenWarningTimeout);
  frozenLayerWarning.style.display = "none";
}

// Adds or removes exams or evaluation input elements
function editUIUpdateGrid(grid, e, popup) {
  const input = e.target;
  const elem = input.parentNode == grid ? input : input.parentNode;
  const conditionsElem = grid.parentNode.lastElementChild;
  let conditions = '';

  // if input is filled
  if (input.value) {
    // if is last evaluation --> add another column
    if (parseInt(elem.dataset.evaluation) == parseInt(grid.dataset.evaluations)) {
      ++grid.dataset.evaluations;

      appendElement(grid, `<input style="grid-row: 1; grid-column: ${(5 + parseInt(grid.dataset.evaluations))};" class="edit-new-evaluation" data-evaluation="${grid.dataset.evaluations}" type="text" name="evaluationName" value="" placeholder="NEW" autocomplete="off" oninput="updateEvalName(this.dataset.evaluation, this.value, '${popup}');">`);
      for (let i = 0; i < parseInt(grid.dataset.exams); i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, `<div style="grid-row: ${(2 + i * 1)}; grid-column: ${(5 + parseInt(grid.dataset.evaluations))};" class="edit-weight edit-new-evaluation" data-exam="${i}" data-evaluation="${grid.dataset.evaluations}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`), ['exam']);
      }
      appendElement(grid, `<div style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: ${(4 + parseInt(grid.dataset.evaluations))};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-evaluation="${grid.dataset.evaluations - 1}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);
      appendElement(grid, `<span style="grid-row: ${(3 + parseInt(grid.dataset.exams))}; grid-column: ${(4 + parseInt(grid.dataset.evaluations))};" class="edit-total" data-evaluation="${-1 + parseInt(grid.dataset.evaluations)}">0%</span>`);

      appendElement(conditionsElem, `<label class="edit-conditions-label" data-evaluation="${parseInt(grid.dataset.evaluations) - 1}"></label>`);
      appendElement(conditionsElem, `<input class="edit-conditions-input" type="text" placeholder="nombreExamen >= 2" name="condition" data-evaluation="${parseInt(grid.dataset.evaluations) - 1}">`);
      if(input.name = 'evaluationName') updateEvalName(parseInt(grid.dataset.evaluations) - 1, input.value, popup);

      //if is last exam --> add another row
    } else if (parseInt(elem.dataset.exam) == parseInt(grid.dataset.exams)) {
      ++grid.dataset.exams;

      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${grid.dataset.exams}" placeholder="NEW" autocomplete="off" maxlength="5">`);
      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${grid.dataset.exams}" placeholder="Parciales">`);
      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${grid.dataset.exams}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">`);
      for (let i = 0; i < grid.dataset.evaluations; i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, `<div style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: ${(5 + i * 1)};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-evaluation="${i}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`), ['exam']);
      }
      appendElement(grid, `<div style="grid-row: ${(1 + parseInt(grid.dataset.exams))}; grid-column: ${(5 + parseInt(grid.dataset.evaluations))};" class="edit-weight edit-new-evaluation" data-exam="${-1 + parseInt(grid.dataset.exams)}" data-evaluation="${grid.dataset.evaluations}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);

      for (let element of grid.querySelectorAll('.edit-total')) {
        element.style.gridRow = 3 + parseInt(grid.dataset.exams);
      }
    }
  // if input is empty
  } else {
    // add on blur event to delete
  }

  editGridFadeOrUnfade(grid, elem);

  if (elem.classList.contains('edit-weight') && !elem.classList.contains('edit-new-evaluation') && !elem.classList.contains('edit-new-exam') && elem.value != '') {
    updateSumWeight(grid, elem.dataset.evaluation);
  }

}

function editGridFadeOrUnfade(grid, element, check=['exam','evaluation']) {
  for (const type of check) {
    if (element.dataset[type] != undefined && parseInt(element.dataset[type]) < parseInt(grid.dataset[type+'s'])) {
      if (editGridIsEmpty(grid, type, parseInt(element.dataset[type]))) {
        editGridFade(grid, type, parseInt(element.dataset[type]));
      } else {
        editGridUnfade(grid, type, parseInt(element.dataset[type]));
      }
    }
  }
  grid.querySelector('.grid-separator-evaluation').style.gridRow = `2 / ${2 + parseInt(grid.dataset.exams)}`;
}

function editGridUnfade(grid, type, n) {
  for (let element of grid.querySelectorAll(`*[data-${type}='${n}'`)) {
    if ((element.dataset.evaluation == undefined || parseInt(element.dataset.evaluation) < parseInt(grid.dataset.evaluations)) && (element.dataset.exam == undefined || parseInt(element.dataset.exam) < parseInt(grid.dataset.exams))) {
      element.classList.remove(`edit-new-exam`);
      element.classList.remove(`edit-new-evaluation`);
      if(['exam', 'examType', 'evaluationName'].includes(element.name)) element.required = true;
    }
  }
}

function editGridFade(grid, type, n) {
  let removed = false;
  for (let element of grid.querySelectorAll(`*[data-${type}]`)) {
    if (parseInt(element.dataset[type]) == n) {
      element.classList.add(`edit-new-${type}`);
      element.required = false;
      element.parentNode.removeChild(element);
      removed = true;
    }else if (parseInt(element.dataset[type]) > n) {
      element.dataset[type] = parseInt(element.dataset[type]) - 1;
      switch (type) {
        case 'evaluation':
          element.style.gridColumn = `${parseInt(element.dataset[type]) + 5} / auto`;
          break;
        case 'exam':
          element.style.gridRow = `${parseInt(element.dataset[type]) + 2} / auto`;
          break;
      }
    }
  }
  const conditionsElem = grid.parentNode.lastElementChild;
  for (let element of conditionsElem.querySelectorAll(`*[data-${type}]`)) {
    if (parseInt(element.dataset[type]) == n) {
      element.classList.add(`edit-new-${type}`);
      element.parentNode.removeChild(element);
    }else if (parseInt(element.dataset[type]) > n) {
      element.dataset[type] = parseInt(element.dataset[type]) - 1;
    }
  }
  if(removed) grid.dataset[type+'s'] = parseInt(grid.dataset[type+'s']) - 1;
}

function editGridIsEmpty(grid, type, n) {
  for (let element of grid.querySelectorAll(`input[data-${type}='${n}'], div[data-${type}='${n}'] > input`)) {
    if (element.value) return false;
  }
  return true;
}

function saveEditSubject() {
  let newSubject = readSubjectFromPopup(editSubjectPopup);
  let id = newSubject.id;

  if(newSubject.shortName != subjects[id].shortName) uploadShortName(id, newSubject.shortName);
  if(newSubject.fullName != subjects[id].fullName)   uploadFullName(id, newSubject.fullName);
  if(newSubject.course != subjects[id].course)       uploadCourse(id, newSubject.course);
  if(newSubject.faculty != subjects[id].faculty)     uploadFaculty(id, newSubject.faculty);
  if(newSubject.uni != subjects[id].uni)             uploadUni(id, newSubject.uni);
  if(newSubject.color != subjects[id].color)         uploadColor(id, newSubject.color);
  if(JSON.stringify(newSubject.evaluations) === 
     JSON.stringify(subjects[id].evaluations))       uploadEvaluation(id, newSubject.evaluations);

  subjects[id] = completeSubject(
    subjects[id],
    newSubject
  );

  updateSubjectCardInfo(id);

  saveSubjectsLocalStorage();
  hideLoader('dashboard');
}

function readSubjectFromPopup(popup) {
  let id = popup.querySelector('input[name="id"]').value;

  let newEval = {};
  let grid = popup.querySelector('.edit-popup-grid');

  for (let evaluationN = 0; evaluationN < parseInt(grid.dataset['evaluations']); evaluationN++) {
    let evaluationNameElem = grid.querySelector(`input[name='evaluationName'][data-evaluation='${evaluationN}']`);
    if (evaluationNameElem) {
      let evaluation = evaluationNameElem.value;
      if (evaluation) {
        for (let examN = 0; examN < parseInt(grid.dataset['exams']); examN++) {
          let exam = grid.querySelector(`input[name='exam'][data-exam='${examN}']`).value;
          let examType = grid.querySelector(`input[name='examType'][data-exam='${examN}']`).value;
          let weight = grid.querySelector(`div[data-exam='${examN}'][data-evaluation='${evaluationN}'] > input[name='weight']`).value / 100;
          if (exam && examType && weight) {
            if (!newEval[evaluation]) newEval[evaluation] = {};
            if (!newEval[evaluation].exams) newEval[evaluation].exams = {};
            if (!newEval[evaluation].exams[exam]) newEval[evaluation].exams[exam] = {};
            newEval[evaluation].exams[exam].weight = weight;
            newEval[evaluation].exams[exam].type = examType;
          }
        }
      let condition = popup.querySelector(`input[name='condition'][data-evaluation='${evaluationN}']`).value;
      if (condition) {
          // if(!calcCondition(...)) {stop edition} // TODO: check if condition is valid
          newEval[evaluation].condition = condition;
        }
      }
    }
  }
  // console.log(newEval);

  return {
    id,
    shortName: popup.querySelector('input[name="shortName"]').value,
    fullName:  popup.querySelector('input[name="fullName"]').value,
    course:    popup.querySelector('input[name="course"]').value,
    faculty:   popup.querySelector('input[name="faculty"]').value,
    uni:       popup.querySelector('input[name="uni"]').value,
    color:     popup.querySelector('input[name="color-bar"]:checked').value,
    evaluations: newEval,
  };
}

function saveViewSubject() {
  let newSubject = readSubjectFromPopup(viewSubjectPopup);
  let id = newSubject.id;
  
  if(isValidSubjectFromPopup(newSubject)){
    subjectsToAdd[id] = newSubject;
  }
}

async function saveNewSubject() {
  let newSubject = readSubjectFromPopup(newSubjectPopup);
  delete newSubject.id;

  if(isValidSubjectFromPopup(newSubject)){
    freeze(`Creando asignatura`, 10);
    let id = await uploadSubject(newSubject);
    unfreeze();
    
    if(!id) showToast('Error al subir')
    if(!uid) showToast('Inicia sesión para compartir assignaturas')
    addSubject(id, newSubject);
    router.navigate(`/`);
  }
}

function deleteSubject(id) {
  removedSubject = subjects[id];
  removedSubjectId = id;
  delete subjects[id];
  saveSubjectsLocalStorage();
  if (!isAnonymous) {
    let obj = {};
    obj['subjects.' + id] = firebase.firestore.FieldValue.delete();
    userDB.update(obj);
  }
  removeCard(getCard(id));
  showToast(`Has borrado <b>${removedSubject.shortName}</b>`, 'Deshacer', 'undoRemoveSubject();');

  if (isEmpty(subjects)) showTutorial();
  congratulate();
}

function undoRemoveSubject() {
  let id = removedSubjectId;
  subjects[id] = removedSubject;
  createSubjectCardCollapsed(id);
  saveSubjectsLocalStorage()
  if (!isAnonymous) {
    let obj = {};
    obj['subjects.' + id + '.grades'] = subjects[id].grades;
    userDB.update(obj);
  }

  clearTimeout(toastTimer);
  document.getElementById('toast').style.display = 'none';
}

/* ------------------------------ TUTORIAL ------------------------------ */

function hideTutorial() {
  document.getElementById('tutorial').style.display = 'none';
  document.getElementById('add-button-topbar').classList.remove('focus-animation-loop');
}

function showTutorial() {
  document.getElementById('tutorial').style.display = 'block';
}

/* ------------------------------ FIREBASE ------------------------------ */

var provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

firebase.auth().useDeviceLanguage();

firebase.auth().getRedirectResult().catch(function (error) { console.error(error); });

firebase.auth().onAuthStateChanged(function (user) {
  let bntLogin = document.getElementById('loginButton');
  if (user) { // User is signed in.

    displayName = user.displayName;
    photoURL = user.photoURL;
    isAnonymous = user.isAnonymous;
    uid = user.uid;

    console.info(`Signed in as ${displayName} whith ID: ${uid}`);

    bntLogin.textContent = 'Cerrar sesión';
    bntLogin.classList.add('btn-red');
    bntLogin.classList.remove('btn-green');
    bntLogin.onclick = function () { logoutGoogle(); window.history.back(); };

    //showToast(`Bienvenido de nuevo <b>${displayName}</b> 😊`);

    showLoader('Buscando cambios', 'dashboard');
    userDB = db.collection('users').doc(uid);

    getAndDisplayUserSubjects();
  } else { // User is signed out.
    hideLoader('dashboard');
    displayName = 'Anónimo';
    photoURL = 'media/profile-pic.jpg';
    isAnonymous = true;
    uid = 0;
    userDB = null;

    console.info('Signed out')
    bntLogin.textContent = 'Iniciar sesión';
    bntLogin.classList.remove('btn-red');
    bntLogin.classList.add('btn-green');
    bntLogin.onclick = function () { loginGoogle(); window.history.back(); };
    showToast('Para guardar tus notas en la nube', 'Inicia sesión', 'loginGoogle();');
  }
  document.getElementById('user-container').children[1].children[0].src = photoURL;
  document.getElementById('profile-topbar').src = isAnonymous ? 'media/user-circle.svg' : photoURL;
  document.getElementById('user-container').children[1].children[1].textContent = displayName;

});

function loginGoogle() {
  showLoader('Redireccionando', 'login');
  firebase.auth().signInWithRedirect(provider);
  hideLoader('login');
}

function logoutGoogle() {
  firebase.auth().signOut();
}

// //for testing
// function createSubjectTesting() {
//   let data = document.getElementById('create-subject-text').value;
//   if (data != undefined || data != '') {
//     console.log('Uploading subject');
//     uploadSubject(JSON.parse(data));
//   }else{
//     console.error('No subject to upload');
//   }
// }

function uploadSubject(subject) { // TODO: add sanitise as cloud function
  if (subject != undefined && subject != null && subject != '' && subject != {} && subject != []) {
    if(uid){
      return subjectsDB.add({creator: displayName, creatorId: uid, creationDate: new Date(), ...subject})
        .then((doc) => {
          console.log(`Created ${subject.shortName} with id ${doc.id}`);
          return doc.id;
        })
        .catch((error) => {
          console.error("Error creating subject ", error);
          return false;
        });
    } else return 'local-id-' + getRandomID();
  } else return false;
}

function isValidSubjectFromPopup(subject) {
  // console.log(subject);
  // console.log(isEmpty(subject));
  
  let wrongValue = '';

  if(!subject.shortName){ showToast(`Rellena el Nombre`);       return false; }
  if(!subject.fullName){  showToast(`Rellena el Nombre Largo`); return false; }
  if(!subject.course){    showToast(`Rellena el Curso`);        return false; }
  if(!subject.faculty){   showToast(`Rellena la Facultad`);     return false; }
  if(!subject.uni){       showToast(`Rellena la Universidad`);  return false; }
  if(!subject.color){     showToast(`Escoje un Color`);         return false; }
  if(isEmpty(subject.evaluations)){ showToast(`Rellena la Evaluación`); return false; }
  
  // TODO: To implement this functions we need to check them before the subject is read
  
  for (const evaluation in subject.evaluations) {
    if(isEmpty(subject.evaluations[evaluation].exams)) { wrongValue = evaluation; break; }
  }
  if(wrongValue){ showToast(`Pon almenos un examen en ${wrongValue}`); return false; }
  
  // if(wrongValue){ showToast(`Pon nombres distintos a los exámenes llamados ${wrongValue}`); return false; }
  
  // if(wrongValue){ showToast(`Pon nombres distintos a las evaluaciones llamadas ${wrongValue}`); return false; }
  
  for (const evaluation in subject.evaluations) {
    for (const exam in subject.evaluations[evaluation].exams) {
      if(!subject.evaluations[evaluation].exams[exam].type) { wrongValue = exam; break; }
    }
  }
  if(wrongValue){ showToast(`Pon categoria al examen ${wrongValue}`); return false; }

  return true;
}

// EXAMPLE
// userDB.where("state", "==", "CA")
//     .onSnapshot(function(snapshot) {
//         snapshot.docChanges.forEach(function(change) {
//             if (change.type === "added") {
//                 console.log("New city: ", change.doc.data());
//             }
//             if (change.type === "modified") {
//                 console.log("Modified city: ", change.doc.data());
//             }
//             if (change.type === "removed") {
//                 console.log("Removed city: ", change.doc.data());
//             }
//         });
//     });

function uploadGrade(id, exam, mark) {
  return uploadToUserDB(`subjects.${id}.grades.${exam}`, mark);
}

function uploadEvaluation(id, evaluation) {
  return uploadToUserDB(`subjects.${id}.evaluations`, evaluation);
}

function uploadColor(id, color) {
  return uploadToUserDB(`subjects.${id}.color`, parseInt(color));
}

function uploadShortName(id, shortName) {
  return uploadToUserDB(`subjects.${id}.shortName`, shortName);
}

function uploadFullName(id, fullName) {
  return uploadToUserDB(`subjects.${id}.fullName`, fullName);
}

function uploadCourse(id, course) {
  return uploadToUserDB(`subjects.${id}.course`, course);
}

function uploadFaculty(id, faculty) {
  return uploadToUserDB(`subjects.${id}.faculty`, faculty);
}

function uploadUni(id, uni) {
  return uploadToUserDB(`subjects.${id}.uni`, uni);
}

function uploadVersion(id, version) {
  return uploadToUserDB(`subjects.${id}.version`, version);
}

function uploadToUserDB(ref, value) {
  return uploadToDB(userDB, ref, value);
}

function uploadToSubjectsDB(id, ref, value) {
  return uploadToDB(subjectsDB.doc(id), ref, value);
}

function uploadToDB(db, ref, value) {
  if (!isAnonymous) {
    let obj = {};
    if (ref) {
      if (value != undefined && value != null && value != '' && value != {} && value != []) {
        obj[ref] = value;
      } else {
        obj[ref] = firebase.firestore.FieldValue.delete();
      }
    } else {
      obj = value;
    }
    return db.update(obj);
  }
}

// async function getSubjectFromDB(id) {
//   return await subjectsDB.doc(id).get().then((doc) => {
//     if (doc.exists) return doc.data();
//   });
// }

function getAndDisplayUserSubjects() {
  if (isAnonymous) {
    console.warn('To get user info you need to sign in');
    showToast('Para guardar tus notas en la nube', 'Inicia sesión', 'loginGoogle();');
    hideLoader('dashboard');
  } else {
    showLoader('Descargando asignaturas', 'dashboard');
    userDB.get().then((doc) => {
      if (doc.exists) {
        let userInfo = doc.data();
        for (const id in userInfo.subjects) {

          subjectsDB.doc(id).get().then((doc) => {
            if (doc.exists) {
              var subjectInfo = doc.data();
              if (!subjects[id]) subjects[id] = {};
              if (!userInfo.subjects[id]) userInfo.subjects[id] = {};

              subjects[id] = completeSubject(
                subjectInfo,
                subjects[id],
                userInfo.subjects[id],
                { grades: (!subjects[id].grades && !userInfo.subjects[id].grades) ? subjectInfo.grades : Object.assign({}, subjects[id].grades, userInfo.subjects[id].grades) }
              );

              updateFinalMark(id);
              updateNecesaryMark(id);

              updateCardGrades(id);
              saveSubjectsLocalStorage();

              console.info(`Loaded subject: ${subjects[id].shortName} - ${id}`);
            } else {
              console.error(`Subject ${id} dosen\'t exist`, userInfo.subjects[id]);
            }
          }).catch((error) => {
            console.error(`Error getting subject (${id}) info:`, error);
          });
        }
        console.info(`User has ${userInfo.subjects.length} saved subjects`);
      } else {
        userDB.set({});
        console.error(`User ${uid} dosen\'t exist`, userInfo.subjects[id]);
      }
      hideLoader('dashboard');
    }).catch((error) => {
      console.error("Error getting user info:", error);
      hideLoader('dashboard');
    });
  }
}

function getSubjectsAllDB() {
  return subjectsDB.get();
}

function searchSubjects(query = '') {
  query = query.trim()
  if(query != ''){
    index.search(query)
      .then((responses) => {
        console.log(`Results for ${query}:`, responses.hits);
        searchResultsSubject.innerHTML = responses.hits.reduce((total, elem) => total + generateSearchResultSubject(elem._highlightResult, elem.objectID), '');
        
        if(responses.nbHits == 0) {
          searchCreateDiv.style.display = 'block';
          searchResultsNone.style.display = 'block';
        }else{
          searchCreateDiv.style.display = 'none';
          searchResultsNone.style.display = 'none';
        }
      });
  }else{
    searchResultsSubject.innerHTML = '';
    searchCreateDiv.style.display = 'block';
  }
}

function generateSearchResultSubject(match, id) {
  return `<li onclick="addToSubjectsToAdd('${id}', this.querySelector('input[name=\\'id\\']').checked);" class="searchResult">
            <label for="checkbox-${id}">
              <input style="display: none;" type="checkbox" value="${id}" name="id" id="checkbox-${id}" ${(subjects[id] || subjectsToAdd[id]) ? 'checked' : ''} ${(subjects[id]) ? 'disabled' : ''}>
              <div class="searchResultCheck" for="checkbox-${id}"></div>
            </label>
            <label class="searchResultTitle" for="checkbox-${id}">
              <span class="searchResultRow1">${match.shortName.value} - ${match.fullName.value}</span><br>
              <span class="searchResultRow2">${match.faculty.value} ${match.uni.value} - ${match.course.value}</span>
            </label>
            ${(subjects[id]) ? '<!-- ' : ''}<div class="searchResultAction" onclick="this.parentElement.querySelector('input[name=\\'id\\']').checked = true; showViewSubject('${id}');"><img src="media/edit.svg"></div>${(subjects[id]) ? ' --> ' : ''}
          </li>`;
}

/* ------------------------------ PWA install ------------------------------ */

var deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('App can be installed');
  // e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => { showToast('Usa GradeCalc offline', 'Instalar', 'install();'); }, 10000);
  return false;
});

function install() {
  if (deferredPrompt !== undefined) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome == 'dismissed') {
        // console.log('User cancelled home screen install');
      } else {
        // console.log('User added to home screen');
      }
      deferredPrompt = null;
    });
  }
}


/* ------------------------------ PWA redirect ------------------------------ */

let redirectTimer, newUrl;
if (window.location.hostname === 'gradecalc.net') {
  document.body.innerHTML += `
  <div id="redirect-container" class="popup popup-small" style="display: flex;">
    <div class="top-bar-popup"></div>
    <div class="popup-content redirect-popup">
      <h2>Redireccionando en <span id="redirectTimerSpan">30</span>s...</h2>
      <div>
        <p>GradeCalc tiene un <b>nuevo dominio</b> .app (antes era .net)</p>
        <p style="text-align: center; font-size: 2em;"><a href="https://gradecalc.app" id="redirect-a" onclick="event.preventDefault(); transferData()" style="color: blue;">gradecalc<b>.app</b></a></p>
        <ul>
          <li>Actualiza tus marcadores.</li>
          <li>Si has instalado la app, desinstálala y vuélvela a instalar.</li>
          <li>Haz click en el enlace de arriba o espera.</li>
        </ul>
        <p>Tus datos se transferirán</p>
      </div>
    </div>
  </div>`;
  let redirectTimerSpan = document.getElementById('redirectTimerSpan');
  newUrl = 'https://gradecalc.app?replaceSubjects='+encodeURI(JSON.stringify(getSubjectsLocalStorage()));
  document.getElementById('redirect-a').href = newUrl;
  setInterval(() => {redirectTimerSpan.textContent -= 1;}, 1000);
  redirectTimer = setTimeout(transferData, 30000);
} else if (window.location.hostname === 'gradecalc.app') {
  let replaceSubjectsStr = findGetParameter('replaceSubjects');
  let replaceSubjects = JSON.parse(replaceSubjectsStr);
  let replacedSubjects = localStorage.getItem('replacedSubjectsFromNetDomain');
  history.replaceState({}, '', '/');
  if(replaceSubjectsStr && replaceSubjects && replacedSubjects !== 'true' ){
    subjects = replaceSubjects;
    saveSubjectsLocalStorage();
    localStorage.setItem('replacedSubjectsFromNetDomain', 'true');
    showToast('Asignaturas transferidas 👍🏼');
    console.log('Subjects transfered', subjects);
  }
}

function transferData(){
  subjects = {};
  saveSubjectsLocalStorage();
  window.location = newUrl;
}

function findGetParameter(parameterName) {
  var result = null,
      tmp = [];
  var items = location.search.substr(1).split("&");
  for (var index = 0; index < items.length; index++) {
      tmp = items[index].split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
  }
  return result;
}