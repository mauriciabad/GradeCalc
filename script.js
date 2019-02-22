/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var editSubjectPopup = document.getElementById('edit-popup-content');
var viewSubjectPopup = document.getElementById('view-popup-content');
var newSubjectPopup = document.getElementById('new-popup-content');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];
var searchResultContainer = document.getElementById('subjects-search-results');
var searchResultsSubject = document.getElementById('subjects-search-results');

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
    console.error("Error getting subject info:", error);
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
    autoUpdate(id); // TODO: remove, this is only a fix for DBD
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
}

//updates the subject card information (bar, inputs and names)
function updateSubjectCardInfo(id) {
  getCard(id).innerHTML =
    `<button onclick="deleteSubject('${id}')" class="subject-card-remove">
  <img src="media/trash.svg" alt="x" aria-label="Delete subject">
</button>
<button onclick="showEditSubject('${id}')" class="subject-card-info">
  <img src="media/discount.svg" alt="%" aria-label="Show subject information">
</button>
<h2>${subjects[id].shortName}</h2>
<p class="subject-finalMark" style="color: ${subjects[id].finalMark[subjects[id].selectedEvaluation] >= 5 ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p>
<div class="subject-bar">${generateBar(id)}</div>
<div class="grades-input hidden" style="height: 0px;">${generateInputs(id) + generateEvaluations(id)}</div>`;

  updateAndDisplayMarks(id, false);
}

//Creates the subject card and appends it to the dashboard
function createSubjectCardCollapsed(id) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card';
  card.onclick = function (event) { toggleExpandCard(event, this); };
  card.innerHTML =
    `<button onclick="deleteSubject('${id}')" class="subject-card-remove">
  <img src="media/trash.svg" alt="x" aria-label="Delete subject">
</button>
<button onclick="showEditSubject('${id}')" class="subject-card-info">
  <img src="media/discount.svg" alt="%" aria-label="Show subject information">
</button>
<h2>${subjects[id].shortName}</h2>
<p class="subject-finalMark" style="color: ${subjects[id].finalMark[subjects[id].selectedEvaluation] >= (subjects[id].evaluations[subjects[id].selectedEvaluation].passMark || 5) ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p>
<div class="subject-bar">${generateBar(id)}</div>
<div class="grades-input hidden" style="height: 0px;">${generateInputs(id) + generateEvaluations(id)}</div>`;

  dashboard.appendChild(card);
  updateAndDisplayMarks(id, false);
  hideTutorial();
}

function generateBar(id) {
  let weight = 0;
  let barHTML = "";
  for (const exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    if (isUndone(id, exam)) {
      barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scolN" style="flex-grow: ${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}" title="${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}%">${exam}<div id="bar-${id + exam}">${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}</div></div>`;
    } else {
      barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scol${subjects[id].color}" style="flex-grow: ${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}" title="${subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100}%">${exam}<div id="bar-${id + exam}">${subjects[id].grades[exam]}</div></div>`;
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

    if (isUndone(id, exam)) {
      types[exam.type].inputsHTML += `<div><span>${examName}:</span><input type="number" id="in-${id + examName}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="" class="scolN2" oninput="updateMarkFromCardInput('${id}', '${examName}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
    } else {
      types[exam.type].inputsHTML += `<div><span>${examName}:</span><input type="number" id="in-${id + examName}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="${subjects[id].grades[examName]}" class="scol${subjects[id].color}" oninput="updateMarkFromCardInput('${id}', '${examName}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
    }
  }

  for (const type in types) {
    html += `<h3>${type}</h3><span>${round(types[type].weight * 100, 0)}%</span><div>${types[type].inputsHTML}</div>`;
  }

  return html;
}

function generateEvaluations(id) {
  let evaluationsHTML =
    `<div class="eval-select"${Object.keys(subjects[id].evaluations).length <= 1 ? ' style="display: none;"' : ''}>
  <span>Evaluación:</span>
  <select onchange="setSelectedEvaluation('${id}',this.value);">`;
  for (const eval in subjects[id].evaluations) {
    evaluationsHTML += `<option value="${eval}"${eval == subjects[id].selectedEvaluation ? 'selected="selected"' : ''}>${eval}</option>`;
  }
  evaluationsHTML +=
    `</select>
  <img src="media/dislike.svg" style="display: none;" title="Hay otra evaluación mejor">
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

  updateFinalMark(id);
  updateNecesaryMark(id);

  createSubjectCardCollapsed(id);
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
    console.error("Error getting subject info:", error);
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
      color: 1,

      necesaryMark: {},
      finalMark: {}
    },
    ...subjects
  );
  delete id;
  delete subject.evaluation; // TODO: remove this if all subjects have last evaluation structure
  if (!subject.selectedEvaluation || !Object.keys(subject.evaluations).includes(subject.selectedEvaluation)) subject.selectedEvaluation = Object.keys(subject.evaluations)[0] || '';
  return subject;
}

function clearNewSubjectUI() {
  let html = generateEditSubjectUIHTML('new', completeSubject({creator: displayName, creationDate: new Date()}), 'new');
  
  newSubjectPopup.innerHTML = html;
}

function generateViewSubjectUI(id, subject) {
  let html = generateEditSubjectUIHTML(id, subject, 'view');
  
  viewSubjectPopup.innerHTML = html;

  let evals = Object.keys(subject.evaluations);
  for (const evalCount in evals) {
    updateSumWeight(viewSubjectPopup, evalCount);
  }
}

function generateEditSubjectUI(id, subject = subjects[id]) {
  let html = generateEditSubjectUIHTML(id, subject, 'edit');

  editSubjectPopup.innerHTML = html;

  let evals = Object.keys(subject.evaluations);
  for (const evalCount in evals) {
    updateSumWeight(editSubjectPopup, evalCount);
  }
}

function generateEditSubjectUIHTML(id, subject, popup) {
  let exams = toNewEval(subject.evaluations);
  let evals = Object.keys(subject.evaluations);
  let grid = '';
  let newEvals = '';
  let newExams = '';
  let footer = '';
  let colors = '';
  let conditions = '';

  newEvals += `<input style="grid-row: 1; grid-column: ${(5 + evals.length * 1)};" class=" edit-new-eval" data-eval="${evals.length}" type="text" name="nameEval" value="" placeholder="NEW" autocomplete="off">`;

  let examCount = 0;
  for (const exam in exams) {
    grid += `
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="" type="text"   name="exam"       value="${exam}"                      data-exam="${examCount}" placeholder="NEW"       autocomplete="off" maxlength="5" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="" type="text"   name="examType"   value="${exams[exam].examType}" data-exam="${examCount}" placeholder="Parciales" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="" type="number" name="mark"       value=""                             data-exam="${examCount}" placeholder="-"         autocomplete="off" min="0" max="10" step="0.01">`;
    newEvals += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evals.length * 1)};" class="edit-weight edit-new-eval" data-exam="${examCount}" data-eval="${evals.length}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    for (const evalCount in evals) {
      grid += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-weight" data-exam="${examCount}" data-eval="${evalCount}"><input type="number" name="weight" value="${exams[exam].weight[evals[evalCount]] && exams[exam].weight[evals[evalCount]] != 0 ? round(exams[exam].weight[evals[evalCount]] * 100, 4) : ''}" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    }
    ++examCount;
  }
  for (const evalCount in evals) {
    grid += `<input style="grid-row: 1; grid-column: ${(5 + evalCount * 1)};" class="edit-nameEval" type="text" name="nameEval" value="${evals[evalCount]}" data-eval="${evalCount}" placeholder="NEW" autocomplete="off" required>`;
    newExams += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-weight edit-new-exam" data-exam="${examCount}" data-eval="${evalCount}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    footer += `<span  style="grid-row: ${(3 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-total" data-eval="${evalCount}">0%</span>`;
    conditions += `<label class="edit-conditions-label">${evals[evalCount]}</label><input type="text" placeholder="F >= 3 and Parciales >= 4" name="condition" data-eval="${evalCount}" value="${(subject.evaluations ? subject.evaluations[evals[evalCount]].conditions || '' : '')}">`;
  }
  newExams += `
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${examCount}" placeholder="NEW" autocomplete="off" maxlength="5" required>
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${examCount}" placeholder="Parciales" required>
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${examCount}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">
  `;

  for (const color of [1, 8, 3, 4, 6, 5, 2, 7]) {
    colors += `
    <label class="scol${color}"  for="color-bar-elem${color}">
      <input type="radio" name="color-bar" value="${color}" id="color-bar-elem${color}" ${(color == subject.color) ? 'checked' : ''}>
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
      <span>Fecha de creación: <span id="${popup}-creationDate">${false && subject.creationDate ? subject.creationDate.toLocaleDateString('es-ES') : '--/--/----'}</span></span>
    </div>
    <div>
      <span>Creador: <span id="${popup}-creator">${subject.creator ? subject.creator : 'Anónimo'}</span></span>
    </div>
  </div>

  <h2>Evaluación</h2>
  <div class="scroll">
    <div class="edit-popup-grid" onkeyup="editUIUpdateGrid(this, event);" data-evals="${evals.length}" data-exams="${examCount}">
      <!-- Header -->
      <span  style="grid-row: 1; grid-column: 1;" >Nombre</span>
      <span  style="grid-row: 1; grid-column: 2;" >Categoría</span>
      <span  style="grid-row: 1; grid-column: 3;" >Nota</span>

      <!-- Body -->
      ${grid}
      <!-- Divider -->
      <div style="grid-row: 2 / ${2 + examCount};" class="grid-separator-eval"></div>

      <!-- new -->
      ${newEvals}
      ${newExams}

      <!-- Footer -->
      ${footer}
      
    </div>

    <!-- Conditions -->
    <!-- <h2>Condiciones para aprovar</h2>
    <div class="edit-conditions">
      ${conditions}
    </div> -->
  </div>`;

  return html;
}

/* ------------------------------ UI & DATA UPDATE ------------------------------ */

//Updates, saves and shows the finalMark and necesaryMark
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

  for (let j = 0; j < barUndone.length; j++) {
    barUndone[j].children[0].textContent = subjects[id].necesaryMark[subjects[id].selectedEvaluation];
  }
  for (let j = 0; j < inUndone.length; j++) {
    inUndone[j].placeholder = subjects[id].necesaryMark[subjects[id].selectedEvaluation];
  }
}

function displayFinalMark(id) {
  let cardFinalMark = getCard(id).getElementsByClassName('subject-finalMark')[0];
  cardFinalMark.textContent = subjects[id].finalMark[subjects[id].selectedEvaluation];
  cardFinalMark.style.color = (subjects[id].finalMark[subjects[id].selectedEvaluation] >= 5 ? '#5a9764' : '#b9574c');
}

//Saves and updates the value of the necesaryMark to pass
function updateNecesaryMark(id) {
  let mark = gradeCalcAllEqual(id, subjects[id].selectedEvaluation);
  var bestOption = true;
  for (const eval in subjects[id].evaluations) {
    subjects[id].necesaryMark[eval] = Math.max(0, round(gradeCalcAllEqual(id, eval)));
    if (bestOption && subjects[id].necesaryMark[eval] < mark) bestOption = false;
  }
  let card = getCard(id);
  if (card) card.querySelector('.eval-select > img').style.display = bestOption ? 'none' : 'block';

  return subjects[id].necesaryMark[subjects[id].selectedEvaluation];
}

//Saves and updates the value of the finalMark
function updateFinalMark(id, confetti = true) {
  let oldMark = subjects[id].finalMark[subjects[id].selectedEvaluation];
  for (const eval in subjects[id].evaluations) {
    subjects[id].finalMark[eval] = 0;
    for (const exam in subjects[id].evaluations[eval].exams) {
      if (!isUndone(id, exam)) subjects[id].finalMark[eval] += subjects[id].grades[exam] * subjects[id].evaluations[eval].exams[exam].weight;
    }
    subjects[id].finalMark[eval] = round(subjects[id].finalMark[eval]);
  }
  let newMark = subjects[id].finalMark[subjects[id].selectedEvaluation];
  let passMark = subjects[id].evaluations[subjects[id].selectedEvaluation].passMark || 5;
  if (confetti && oldMark < passMark && newMark >= passMark) showConfetti(getCard(id));
  return subjects[id].finalMark[subjects[id].selectedEvaluation];
}

//Saves the changed mark, updates finalMark and necessaryMark, and shows the info in the UI
function updateMarkFromCardInput(id, exam, mark, input) {
  let barElem = getBarElem(id, exam);

  if (!isNaN(mark) && mark != '') {
    subjects[id].grades[exam] = Number(mark);
    uploadGrade(id, exam, subjects[id].grades[exam]);

    barElem.parentElement.className = 'scol' + subjects[id].color;
    barElem.textContent = input.value;
    input.className = 'scol' + subjects[id].color;
  } else {
    delete subjects[id].grades[exam];
    uploadGrade(id, exam, undefined);

    barElem.parentElement.className = 'scolN';
    input.className = 'scolN2';
  }
  updateAndDisplayMarks(id);
  saveSubjectsLocalStorage();
}

function updateCardGrades(id) {
  let card = getCard(id);
  if (card) {
    for (let div in card.getElementsByClassName('subject-bar')[0]) {
      div.className = 'scolN';
    }
    for (const exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
      let input = getInput(id, exam);
      input.className = 'scolN2';
      input.value = '';
    }
    for (const exam in subjects[id].grades) {
      let barElem = getBarElem(id, exam);
      let input = getInput(id, exam);
      if (barElem && input) {
        barElem.textContent = subjects[id].grades[exam];
        barElem.parentElement.className = 'scol' + subjects[id].color;
        input.value = subjects[id].grades[exam];
        input.className = 'scol' + subjects[id].color;
      } else {
        console.log(`Exam ${exam} of ${subjects[id].shortName} (${id}) is not in the card`);
      }
    }
    updateAndDisplayMarks(id);
  } else {
    createSubjectCardCollapsed(id);
    updateCardGrades(id);
  }
}

// updates the selectedEvaluation, saves the subjects and displays the new selectedEvaluation
function setSelectedEvaluation(id, eval = subjects[id].selectedEvaluation) {
  subjects[id].selectedEvaluation = eval;
  saveSubjectsLocalStorage();
  let card = getCard(id);
  card.getElementsByClassName('subject-bar')[0].innerHTML = generateBar(id);
  card.getElementsByClassName('grades-input')[0].innerHTML = generateInputs(id) + generateEvaluations(id, eval);
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
      colors: ['#E68F17', '#FAB005', '#FA5252', '#E64980', '#BE4BDB', '#0B7285', '#15AABF', '#EE1233', '#40C057']
    };
  }
  window.confetti(elem, conf);
}

// returns the card DOM element with that id
function getCard(id) {
  return document.getElementById('card-' + id);
}
// returns the input DOM element of the card from the subject id and exam exam
function getInput(id, exam) {
  return document.getElementById('in-' + id + exam);
}
// returns the card bar DOM element of the card from the subject id and exam exam
function getBarElem(id, exam) {
  return document.getElementById('bar-' + id + exam);
}

/* ------------------------------ MATH ------------------------------ */

//Returns the mark you need to get in the remaining exams to pass
function gradeCalcAllEqual(id, eval) {

  let sumUndoneExams = 0;
  for (const exam in subjects[id].evaluations[eval].exams) {
    if (isUndone(id, exam)) sumUndoneExams += subjects[id].evaluations[eval].exams[exam].weight;
  }

  let passMark = subjects[id].evaluations[eval].passMark || 5;
  return (passMark - subjects[id].finalMark[eval]) / sumUndoneExams;
}

//returns n rounded to d decimals (2)
function round(n, d = 2) {
  return (n == '' || n == undefined) ? undefined : Math.floor(Math.round(n * Math.pow(10, d))) / Math.pow(10, d);
}

// returns a random number from smallest to biggest
function random(smallest, biggest) {
  return Math.floor(Math.random() * (biggest - smallest)) + smallest;
}

function congratulate() {
  if (hasPassedEverything()) {
    document.getElementById('congratulations-img').style.display = 'block';
  } else {
    document.getElementById('congratulations-img').style.display = 'none';
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

// returns true if the subject with that id has a finalMark greater than mark (5) in the eval (selectedEvaluation)
function isPassed(id, mark = 5, eval = subjects[id].selectedEvaluation) {
  return subjects[id].finalMark[eval] >= mark;
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
  return subjects[id].grades[exam] == undefined
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

function toNewEvalNeeeeeeeeew(evaluation) {
  var evaluationNew = {};
  for (let eval in evaluation) {
    if(evaluation[eval].exams) return evaluation;
    evaluationNew[eval] = {};
    // evaluationNew[eval].condition = '';
    evaluationNew[eval].passMark = 5;
    evaluationNew[eval].exams = {};
    for (let examType in evaluation[eval]) {
      for (let exam in evaluation[eval][examType]) {
        evaluationNew[eval].exams[exam] = {};
        evaluationNew[eval].exams[exam].weight = evaluation[eval][examType][exam];
        evaluationNew[eval].exams[exam].type = examType;
      }
    }
  }
  return evaluationNew;
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
  for (const eval in evaluations) {
    for (const exam in evaluations[eval].exams) {
      if (!newEval[exam]) newEval[exam] = {};
      if (!newEval[exam].weight) newEval[exam].weight = {};
      newEval[exam].weight[eval] = evaluations[eval].exams[exam].weight;
      newEval[exam].mark = evaluations[eval].exams[exam].mark;
      newEval[exam].examType = evaluations[eval].exams[exam].type;
    }
  }
  return newEval;
}

function updateSumWeight(grid, n) {
  let total = 0;
  for (let element of grid.querySelectorAll(`.edit-weight[data-eval='${n}'] > input`)) {
    total += element.value * 1;
  }
  grid.querySelector(`.edit-total[data-eval='${n}']`).textContent = round(total, 4) + '%';
  return total;
}

// Adds or removes exams or evaluation input elements
function editUIUpdateGrid(grid, e) {
  const input = e.target;
  const elem = input.parentNode == grid ? input : input.parentNode;

  // if input is filled
  if (input.value) {
    // if is last eval --> add another column
    if (parseInt(elem.dataset.eval) == parseInt(grid.dataset.evals)) {
      ++grid.dataset.evals;

      appendElement(grid, `<input style="grid-row: 1; grid-column: ${(5 + parseInt(grid.dataset.evals))};" class="edit-new-eval" data-eval="${grid.dataset.evals}" type="text" name="nameEval" value="" placeholder="NEW" autocomplete="off">`);
      for (let i = 0; i < parseInt(grid.dataset.exams); i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, `<div style="grid-row: ${(2 + i * 1)}; grid-column: ${(5 + parseInt(grid.dataset.evals))};" class="edit-weight edit-new-eval" data-exam="${i}" data-eval="${grid.dataset.evals}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`), ['exam']);
      }
      appendElement(grid, `<div style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: ${(4 + parseInt(grid.dataset.evals))};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-eval="${grid.dataset.evals - 1}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);
      appendElement(grid, `<span style="grid-row: ${(3 + parseInt(grid.dataset.exams))}; grid-column: ${(4 + parseInt(grid.dataset.evals))};" class="edit-total" data-eval="${-1 + parseInt(grid.dataset.evals)}">0%</span>`);
      
      //if is last exam --> add another row
    } else if (parseInt(elem.dataset.exam) == parseInt(grid.dataset.exams)) {
      ++grid.dataset.exams;

      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${grid.dataset.exams}" placeholder="NEW" autocomplete="off" maxlength="5" required>`);
      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${grid.dataset.exams}" placeholder="Parciales" required>`);
      appendElement(grid, `<input style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${grid.dataset.exams}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">`);
      for (let i = 0; i < grid.dataset.evals; i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, `<div style="grid-row: ${(2 + parseInt(grid.dataset.exams))}; grid-column: ${(5 + i * 1)};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-eval="${i}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`), ['exam']);
      }
      appendElement(grid, `<div style="grid-row: ${(1 + parseInt(grid.dataset.exams))}; grid-column: ${(5 + parseInt(grid.dataset.evals))};" class="edit-weight edit-new-eval" data-exam="${-1 + parseInt(grid.dataset.exams)}" data-eval="${grid.dataset.evals}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);

      for (let element of grid.querySelectorAll('.edit-total')) {
        element.style.gridRow = 3 + parseInt(grid.dataset.exams);
      }
    }
  // if input is empty
  } else {
    // add on blur event to delete
  }

  editGridFadeOrUnfade(grid, elem);

  if (elem.classList.contains('edit-weight') && !elem.classList.contains('edit-new-eval') && !elem.classList.contains('edit-new-exam') && elem.value != '') {
    updateSumWeight(grid, elem.dataset.eval);
  }

}

function editGridFadeOrUnfade(grid, element, check=['exam','eval']) {
  for (const type of check) {
    if (element.dataset[type] != undefined && parseInt(element.dataset[type]) < parseInt(grid.dataset[type+'s'])) {
      if (editGridIsEmpty(grid, type, parseInt(element.dataset[type]))) {
        editGridFade(grid, type, parseInt(element.dataset[type]));
      } else {
        editGridUnfade(grid, type, parseInt(element.dataset.exam));
      }
    }
  }
  grid.querySelector('.grid-separator-eval').style.gridRow = `2 / ${2 + parseInt(grid.dataset.exams)}`;
}

function editGridUnfade(grid, type, n) {
  for (let element of grid.querySelectorAll(`*[data-${type}='${n}'`)) {
    if ((element.dataset.eval == undefined || parseInt(element.dataset.eval) < parseInt(grid.dataset.evals)) && (element.dataset.exam == undefined || parseInt(element.dataset.exam) < parseInt(grid.dataset.exams))) {
      element.classList.remove(`edit-new-exam`);
      element.classList.remove(`edit-new-eval`);
    }
  }
}
function editGridFade(grid, type, n) {
  let removed = false;
  for (let element of grid.querySelectorAll(`*[data-${type}]`)) {
    if (parseInt(element.dataset[type]) == n) {
      element.classList.add(`edit-new-${type}`);
      element.parentNode.removeChild(element);
      removed = true;
  }else if (parseInt(element.dataset[type]) > n) {
    element.dataset[type] = parseInt(element.dataset[type]) - 1;
    switch (type) {
      case 'eval':
        element.style.gridColumn = `${parseInt(element.dataset[type]) + 5} / auto`;
        break;
      case 'exam':
        element.style.gridRow = `${parseInt(element.dataset[type]) + 2} / auto`;
        break;
      }
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

  subjects[id] = completeSubject(
    subjects[id],
    newSubject
  );

  uploadEvaluation(id, newSubject.evaluations);

  updateSubjectCardInfo(id);

  saveSubjectsLocalStorage();
  hideLoader('dashboard');
}

function readSubjectFromPopup(popup) {
  let id = popup.querySelector('input[name="id"]').value;

  let newEval = {};
  let grid = popup.querySelector('.edit-popup-grid');

  for (let evalN = 0; evalN < parseInt(grid.dataset['evals']); evalN++) {
    let evalNameElem = grid.querySelector(`input[name='nameEval'][data-eval='${evalN}']`);
    if (evalNameElem) {
      let eval = evalNameElem.value;
      if (eval) {
        for (let examN = 0; examN < parseInt(grid.dataset['exams']); examN++) {
          let exam = grid.querySelector(`input[name='exam'][data-exam='${examN}']`).value;
          let examType = grid.querySelector(`input[name='examType'][data-exam='${examN}']`).value;
          let weight = grid.querySelector(`div[data-exam='${examN}'][data-eval='${evalN}'] > input[name='weight']`).value / 100;
          if (exam && examType && weight) {
            if (!newEval[eval]) newEval[eval] = {};
            if (!newEval[eval].exams) newEval[eval].exams = {};
            if (!newEval[eval].exams[exam]) newEval[eval].exams[exam] = {};
            newEval[eval].exams[exam].weight = weight;
            newEval[eval].exams[exam].type = examType;
          }
        }
      // let condition = grid.querySelector(`input[name='condition'][data-eval='${evalN}']`).value;
      // if (condition) {
        //   newEval[eval].condition = condition;
        // }
      }
    }
  }

  return {
    id: id,
    shortName: popup.querySelector('input[name="shortName"]').value,
    fullName: popup.querySelector('input[name="fullName"]').value,
    course: popup.querySelector('input[name="course"]').value,
    faculty: popup.querySelector('input[name="faculty"]').value,
    uni: popup.querySelector('input[name="uni"]').value,
    color: popup.querySelector('input[name="color-bar"]:checked').value,
    evaluations: newEval,
  };
}

function saveViewSubject() {
  let newSubject = readSubjectFromPopup(viewSubjectPopup);
  let id = newSubject.id;
  
  subjectsToAdd[id] = newSubject;
}

function saveNewSubject() {
  let newSubject = readSubjectFromPopup(newSubjectPopup);
  delete newSubject.id;

  let id = uploadSubject(newSubject);

  addSubject(id, newSubject);
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
    showToast('Guarda tus notas en la nube', 'Iniciar sesión', 'loginGoogle();');
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
    subjectsDB.add({creator: displayName, creatorId: uid, creationDate: new Date(), ...subject})
      .then((doc) => {
        console.log(`Created ${subject.shortName} with id ${doc.id}`);
        return doc.id;
      })
      .catch((error) => {
        console.error("Error creating subject ", error);
      });
  }
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
  uploadToUserDB(`subjects.${id}.grades.${exam}`, mark);
}

function uploadEvaluation(id, evaluation) {
  uploadToUserDB(`subjects.${id}.evaluations`, evaluation);
}

function uploadColor(id, color) {
  uploadToUserDB(`subjects.${id}.color`, color);
}

function uploadVersion(id, version) {
  uploadToUserDB(`subjects.${id}.version`, version);
}

function uploadToUserDB(ref, value) {
  uploadToDB(userDB, ref, value);
}

function uploadToSubjectsDB(id, ref, value) {
  uploadToDB(subjectsDB.doc(id), ref, value);
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
    db.update(obj);
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
    showToast('Guarda tus notas en la nube', 'Iniciar sesión', 'loginGoogle();');
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
              console.error(`Subject ${id} dosen\'t exists`);
            }
          }).catch((error) => {
            console.error("Error getting subject info:", error);
          });
        }
        console.info(`User has ${userInfo.subjects.length} saved subjects`);
      } else {
        userDB.set({});
        console.error(`User ${uid} dosen\'t exists`);
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
  if(query){
    index.search(query)
    .then((responses) => {
      console.log(`Results for ${query}:`, responses.hits);
      searchResultsSubject.innerHTML = responses.hits.reduce((total, elem) => total + generateSearchResultSubject(elem._highlightResult, elem.objectID), '');
    });
  }else{
    searchResultsSubject.innerHTML = '';
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
            ${(subjects[id]) ? '<!-- ' : ''}<div class="searchResultAction" onclick="this.parentElement.querySelector('input[name=\\'id\\']').checked = true; showViewSubject('${id}');"><img src="media/discount.svg"></div>${(subjects[id]) ? ' --> ' : ''}
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
