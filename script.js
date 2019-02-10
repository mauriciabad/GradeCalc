/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var editSubject = document.getElementById('edit-popup-content');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];
var searchResultContainer = document.getElementById('subjects-search-results');
var searchResultsSubject = document.getElementById('subjects-search-results');

var userInfo;
var subjects = {};
var removedSubject = {};

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

}

var setPageSubjectView = (params) => {

}

var setPageSubjectEdit = (params) => {

}

var router = new Navigo(null, true);
router.on({
  '/user/:id': { as: 'user.view', uses: setPageUser },
  '/me': { as: 'me', uses: setPageMe },
  '/me/edit': { as: 'me.edit', uses: setPageMeEdit },
  '/me/subject/:id/edit': { as: 'me.subject.edit', uses: setPageMeSubjectEdit },
  '/me/subject/add': { as: 'me.subject.add', uses: setPageMeSubjectAdd },
  '/subject/new': { as: 'subject.new', uses: setPageSubjectNew }, //asks basic info and finds duplicates, then goes to subject.edit
  '/subject/:id': { as: 'subject.view', uses: setPageSubjectView },
  '/subject/:id/edit': { as: 'subject.edit', uses: setPageSubjectEdit },
  '*': { as: 'dashboard', uses: setPageDashboard }
}).resolve();

function showUserInfo() {
  router.navigate(`/me`);
}

function showAddSubject() {
  router.navigate(`/me/subject/add`);
}

function showEditSubject(id) {
  router.navigate(`/me/subject/${id}/edit`);
}

//Shows the popup
function popupShow(id, isSmall) {
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
function popupHideAll() {
  popupHide(document.getElementById('user-container'));
  popupHide(document.getElementById('add-container'));
  popupHide(document.getElementById('edit-container'));
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
  if (id == '3beCxEXHGIhPMouUkFCs' && (subjects[id].version == undefined || subjects[id].version < 2)) {
    subjects[id].evaluation = JSON.parse('{"Continua":{"Compañerismo":{"C":0.1},"Final":{"F":0.2},"Teoria":{"noSQL":0.041176000000000004},"Lab":{"S1":0.08235300000000001,"S2":0.16470500000000002,"S3":0.08235300000000001,"S4":0.08235300000000001,"S5":0.08235300000000001,"S6":0.16470500000000002},"Auto estudio":{"Gen":0.020588000000000002,"Opt":0.020588000000000002,"OLAP":0.020588000000000002,"Group":0.020588000000000002}}}');
    subjects[id].version = 2;
    uploadEvaluation(id, subjects[id].evaluation);
    uploadVersion(id, subjects[id].version);
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
<p class="subject-finalMark" style="color: ${subjects[id].finalMark[subjects[id].selectedEvaluation] >= 5 ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p>
<div class="subject-bar">${generateBar(id)}</div>
<div class="grades-input hidden" style="height: 0px;">${generateInputs(id) + generateEvaluations(id)}</div>`;

  dashboard.appendChild(card);
  updateAndDisplayMarks(id, false);
  hideTutorial();
}

function generateBar(id) {
  let weight = 0;
  let barHTML = "";
  for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation]) {
    for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType]) {
      if (isUndone(id, exam)) {
        barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scolN" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam] * 100}" title="${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam] * 100}%">${exam}<div id="bar-${id + exam}">${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}</div></div>`;
      } else {
        barHTML += `<div onclick="selectInput('in-${id + exam}')" class="scol${subjects[id].color}" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam] * 100}" title="${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam] * 100}%">${exam}<div id="bar-${id + exam}">${subjects[id].grades[exam]}</div></div>`;
      }
    }
  }
  return barHTML;
}
function generateInputs(id) {
  let weight = 0;
  let inputsHTML = "";
  for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation]) {
    let aux = '';
    weight = 0;
    for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType]) {
      if (isUndone(id, exam)) {
        aux += `<div><span>${exam}:</span><input type="number" id="in-${id + exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="" class="scolN2" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      } else {
        aux += `<div><span>${exam}:</span><input type="number" id="in-${id + exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="${subjects[id].grades[exam]}" class="scol${subjects[id].color}" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      }
      weight += subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam] * 100;
    }
    inputsHTML += `<h3>${examType}</h3><span>${round(weight, 0)}%</span><div>${aux}</div>`;
  }
  return inputsHTML;
}

function generateEvaluations(id) {
  let evaluationsHTML =
    `<div class="eval-select"${Object.keys(subjects[id].evaluation).length <= 1 ? ' style="display: none;"' : ''}>
  <span>Evaluación:</span>
  <select onchange="setSelectedEvaluation('${id}',this.value);">`;
  for (const eval in subjects[id].evaluation) {
    evaluationsHTML += `<option value="${eval}"${eval == subjects[id].selectedEvaluation ? 'selected="selected"' : ''}>${eval}</option>`;
  }
  evaluationsHTML +=
    `</select>
  <img src="media/dislike.svg" style="display: none;" title="Hay otra evaluación mejor">
</div>`;
  return evaluationsHTML;
}

//Adds the subjects selected in the popup
function addSubjects() {
  showLoader('Cargando tus asignaturas', 'dashboard');
  let checkeds = document.querySelectorAll("#add-container input:checked");
  document.getElementById('search-subject-input').value = '';

  for (const checked of checkeds) {
    let id = checked.value;    

    if (subjects[id] == undefined) {
      addSubjectFromDB(id);
    } else {
      // showToast(`Ya tienes ${subjects[id].shortName}`);
    }
  }
  window.history.back();
  searchSubjects();
}

function addSubjectFromDB(id) {
  subjectsDB.doc(id).get().then((doc) => {
    if (doc.exists) {
      subjects[id] = completeSubject(doc.data());

      updateFinalMark(id);
      updateNecesaryMark(id);

      createSubjectCardCollapsed(id);
      saveSubjectsLocalStorage();
      hideLoader('dashboard');
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
      evaluation: [],
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
  if (!subject.selectedEvaluation || !Object.keys(subject.evaluation).includes(subject.selectedEvaluation)) subject.selectedEvaluation = Object.keys(subject.evaluation)[0] || '';
  return subject;
}

function generateEditSubjectUI(id) {
  let evaluation = toNewEval(subjects[id].evaluation);
  let evals = Object.keys(subjects[id].evaluation);
  let grid = '';
  let newEvals = '';
  let newExams = '';
  let footer = '';
  let colors = '';

  newEvals += `<input style="grid-row: 1; grid-column: ${(5 + evals.length * 1)};" class=" edit-new-eval" data-eval="${evals.length}" type="text" name="nameEval" value="" placeholder="NEW" autocomplete="off" required>`;

  let examCount = 0;
  for (const exam in evaluation) {
    grid += `
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="" type="text"   name="exam"       value="${exam}"                      data-exam="${examCount}" placeholder="NEW"       autocomplete="off" maxlength="5" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="" type="text"   name="examType"   value="${evaluation[exam].examType}" data-exam="${examCount}" placeholder="Parciales" required>
    <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="" type="number" name="mark"       value=""                             data-exam="${examCount}" placeholder="-"         autocomplete="off" min="0" max="10" step="0.01">`;
    newEvals += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evals.length * 1)};" class="edit-weight edit-new-eval" data-exam="${examCount}" data-eval="${evals.length}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    for (const evalCount in evals) {
      grid += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-weight" data-exam="${examCount}" data-eval="${evalCount}"><input type="number" name="weight" value="${evaluation[exam].weight[evals[evalCount]] && evaluation[exam].weight[evals[evalCount]] != 0 ? round(evaluation[exam].weight[evals[evalCount]] * 100, 4) : ''}" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    }
    ++examCount;
  }
  for (const evalCount in evals) {
    grid += `<input style="grid-row: 1; grid-column: ${(5 + evalCount * 1)};" class="edit-nameEval" type="text" name="nameEval" value="${evals[evalCount]}" data-eval="${evalCount}"placeholder="NEW" autocomplete="off" required>`;
    newExams += `<div style="grid-row: ${(2 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-weight edit-new-exam" data-exam="${examCount}" data-eval="${evalCount}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`;
    footer += `<span  style="grid-row: ${(3 + examCount * 1)}; grid-column: ${(5 + evalCount * 1)};" class="edit-total" data-eval="${evalCount}">0%</span>`;
  }
  newExams += `
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${examCount}" placeholder="NEW" autocomplete="off" maxlength="5" required>
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${examCount}" placeholder="Parciales" required>
  <input style="grid-row: ${(2 + examCount * 1)}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${examCount}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">
  `;

  for (const color of [1, 8, 3, 4, 6, 5, 2, 7]) {
    colors += `
    <label class="scol${color}"  for="color-bar-elem${color}">
      <input type="radio" name="color-bar" value="${color}" id="color-bar-elem${color}" ${(color == subjects[id].color) ? 'checked' : ''}>
      <span class="edit-color-checkmark"></span>
    </label>`;
  }

  let html = `
  <input type="hidden" name="id" id="edit-id" value="${id}" style="display: none;" hidden>
  <h2>Información</h2>
  <div class="edit-popup-info">
    <div>
      <label for="subjectName">Nombre</label>
      <input type="text" name="subjectName" id="edit-shortName" value="${subjects[id].shortName}">
    </div>
    <div class="edit-fullName" >
      <label for="subjectfullName">Nombre Largo</label>
      <input type="text" name="subjectfullName" id="edit-fullName" value="${subjects[id].fullName ? subjects[id].fullName : ''}">
    </div>
  </div>
  <div class="edit-popup-info">
    <div>
      <label for="faculty">Curso</label>
      <input type="text" name="course" id="edit-course" value="${subjects[id].course ? subjects[id].course : ''}">
    </div>
    <div>
      <label for="faculty">Facultad</label>
      <input type="text" name="faculty" id="edit-faculty" value="${subjects[id].faculty ? subjects[id].faculty : ''}">
    </div>
    <div>
      <label for="uni">Universidad</label>
      <input type="text" name="uni" id="edit-uni" value="${subjects[id].uni ? subjects[id].uni : ''}">
    </div>
  </div>
  <div class="edit-popup-info">
    <div>
      <span>Fecha de creación: <span>${subjects[id].creationDate ? subjects[id].creationDate : '--/--/----'}</span></span>
    </div>
    <div>
      <span>Creador: <span>${subjects[id].creator ? subjects[id].creator : 'Anónimo'}</span></span>
    </div>
  </div>

  <h2>Color</h2>
  <div class="color-bar">
    ${colors}
    <!-- <label class="scol0"  for="color-bar-elem0">
      <input type="radio" name="color-bar" value="0" id="color-bar-elem0">
      <span class="edit-color-checkmark edit-color-checkmark-random"></span>
    </label> -->
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
      <div   style="grid-row: 2 / ${2 + examCount};" class="grid-separator-eval"></div>

      <!-- new -->
      ${newEvals}
      ${newExams}

      <!-- Footer -->
      ${footer}
    </div>
  </div>`;
  editSubject.innerHTML = html;

  for (const evalCount in evals) {
    updateSumWeight(editSubject, evalCount);
  }
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
  for (const eval in subjects[id].evaluation) {
    subjects[id].necesaryMark[eval] = Math.max(0, round(gradeCalcAllEqual(id, eval)));
    if (bestOption && subjects[id].necesaryMark[eval] < mark) bestOption = false;
  }
  let card = getCard(id);
  if (card) card.querySelector('.eval-select > img').style.display = bestOption ? 'none' : 'block';

  return subjects[id].necesaryMark[subjects[id].selectedEvaluation];
}

//Saves and updates the value of the finalMark
function updateFinalMark(id, confetti = true) {
  var oldMark = subjects[id].finalMark[subjects[id].selectedEvaluation];
  for (const eval in subjects[id].evaluation) {
    subjects[id].finalMark[eval] = 0;
    for (const examType in subjects[id].evaluation[eval]) {
      for (const exam in subjects[id].evaluation[eval][examType]) {
        if (!isUndone(id, exam)) subjects[id].finalMark[eval] += subjects[id].grades[exam] * subjects[id].evaluation[eval][examType][exam];
      }
    }
    subjects[id].finalMark[eval] = round(subjects[id].finalMark[eval]);
  }
  var newMark = subjects[id].finalMark[subjects[id].selectedEvaluation];
  if (confetti && oldMark < 5 && newMark >= 5) showConfetti(getCard(id));
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
    for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation]) {
      for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType]) {
        let input = getInput(id, exam);
        input.className = 'scolN2';
        input.value = '';
      }
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

//Returns the mark you need to get in the remaining exams to pass with mark (5)
function gradeCalcAllEqual(id, eval, mark = 5) {
  let sumUndoneExams = 0;
  for (const examType in subjects[id].evaluation[eval]) {
    for (const exam in subjects[id].evaluation[eval][examType]) {
      if (isUndone(id, exam)) sumUndoneExams += subjects[id].evaluation[eval][examType][exam];
    }
  }

  return (mark - subjects[id].finalMark[eval]) / sumUndoneExams;
}

//returns n rounded to d decimals (2)
function round(n, d = 2) {
  return (n === '' || n == undefined) ? undefined : Math.floor(Math.round(n * Math.pow(10, d))) / Math.pow(10, d);
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

function appendElement(parent, type, str) {
  let element = document.createElement(type);
  parent.appendChild(element);
  element.outerHTML = str;
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


function toNewEval(evaluation) {
  let newEval = {};
  for (const eval in evaluation) {
    for (const examType in evaluation[eval]) {
      for (const exam in evaluation[eval][examType]) {
        if (!newEval[exam]) newEval[exam] = {};
        if (!newEval[exam].weight) newEval[exam].weight = {};
        newEval[exam].weight[eval] = evaluation[eval][examType][exam];
        newEval[exam].mark = undefined;
        newEval[exam].examType = examType;
      }
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
  input.value = input.value;

  if (input.value) {
    if (elem.dataset.eval == grid.dataset.evals) {
      ++grid.dataset.evals;

      appendElement(grid, 'input', `<input style="grid-row: 1; grid-column: ${(5 + grid.dataset.evals * 1)};" class="edit-new-eval" data-eval="${grid.dataset.evals}" type="text" name="nameEval" value="" placeholder="NEW" autocomplete="off" required>`);
      for (let i = 0; i < grid.dataset.exams; i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, 'div', `<div style="grid-row: ${(2 + i * 1)}; grid-column: ${(5 + grid.dataset.evals * 1)};" class="edit-weight edit-new-eval" data-exam="${i}" data-eval="${grid.dataset.evals}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`));
      }
      appendElement(grid, 'div', `<div style="grid-row: ${(2 + grid.dataset.exams * 1)}; grid-column: ${(4 + grid.dataset.evals * 1)};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-eval="${grid.dataset.evals - 1}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);
      appendElement(grid, 'span', `<span style="grid-row: ${(3 + grid.dataset.exams * 1)}; grid-column: ${(4 + grid.dataset.evals * 1)};" class="edit-total" data-eval="${-1 + grid.dataset.evals * 1}">0%</span>`);
    } else if (elem.dataset.exam == grid.dataset.exams) {
      ++grid.dataset.exams;

      appendElement(grid, 'input', `<input style="grid-row: ${(2 + grid.dataset.exams * 1)}; grid-column: 1;" class="edit-new-exam" type="text"   name="exam"       value="" data-exam="${grid.dataset.exams}" placeholder="NEW" autocomplete="off" maxlength="5" required>`);
      appendElement(grid, 'input', `<input style="grid-row: ${(2 + grid.dataset.exams * 1)}; grid-column: 2;" class="edit-new-exam" type="text"   name="examType"   value="" data-exam="${grid.dataset.exams}" placeholder="Parciales" required>`);
      appendElement(grid, 'input', `<input style="grid-row: ${(2 + grid.dataset.exams * 1)}; grid-column: 3;" class="edit-new-exam" type="number" name="mark"       value="" data-exam="${grid.dataset.exams}" placeholder="-" autocomplete="off" min="0" max="10" step="0.01">`);
      for (let i = 0; i < grid.dataset.evals; i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, 'div', `<div style="grid-row: ${(2 + grid.dataset.exams * 1)}; grid-column: ${(5 + i * 1)};" class="edit-weight edit-new-exam" data-exam="${grid.dataset.exams}" data-eval="${i}"><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`));
      }
      appendElement(grid, 'div', `<div style="grid-row: ${(1 + grid.dataset.exams * 1)}; grid-column: ${(5 + grid.dataset.evals * 1)};" class="edit-weight edit-new-eval" data-exam="${-1 + grid.dataset.exams * 1}" data-eval="${grid.dataset.evals}" ><input type="number" name="weight" value="" placeholder="0" autocomplete="off" min="0" max="100" step="0.0001"></div>`);

      grid.querySelector('.grid-separator-eval').style.gridRow = `2 / ${2 + grid.dataset.exams * 1}`;
      for (let element of grid.querySelectorAll('.edit-total')) {
        element.style.gridRow = 3 + grid.dataset.exams * 1;
      }
    }
  } else {
    // add on blur event to delete
  }
  editGridFadeOrUnfade(grid, elem);

  if (elem.classList.contains('edit-weight') && !elem.classList.contains('edit-new-eval') && !elem.classList.contains('edit-new-exam')) {
    updateSumWeight(grid, elem.dataset.eval);
  }

}

function editGridFadeOrUnfade(grid, element) {
  if (editGridIsEmpty(grid, 'exam', element.dataset.exam)) {
    editGridFade(grid, 'exam', element.dataset.exam);
  } else {
    editGridUnfade(grid, 'exam', element.dataset.exam);
  }
  if (editGridIsEmpty(grid, 'eval', element.dataset.eval)) {
    editGridFade(grid, 'eval', element.dataset.eval);
  } else {
    editGridUnfade(grid, 'eval', element.dataset.eval);
  }
}

function editGridUnfade(grid, type, n) {
  for (let element of grid.querySelectorAll(`*[data-${type}='${n}'`)) {
    element.classList.remove(`edit-new-${type}`);
  }
}
function editGridFade(grid, type, n) {
  for (let element of grid.querySelectorAll(`*[data-${type}='${n}']`)) {
    element.classList.add(`edit-new-${type}`);
  }
}

function editGridIsEmpty(grid, type, n) {
  for (let element of grid.querySelectorAll(`input[data-${type}='${n}'], div[data-${type}='${n}'] > input`)) {
    if (element.value) return false;
  }
  return true;
}

function saveEditSubject() {
  let id = document.getElementById('edit-id').value;

  let newEval = {};
  let grid = editSubject.querySelector('.edit-popup-grid');

  for (let evalN = 0; evalN < grid.dataset['evals']; evalN++) {
    let eval = grid.querySelector(`input[name='nameEval'][data-eval='${evalN}']`).value;
    if (eval) {
      for (let examN = 0; examN < grid.dataset['exams']; examN++) {
        let exam = grid.querySelector(`input[name='exam'][data-exam='${examN}']`).value;
        let examType = grid.querySelector(`input[name='examType'][data-exam='${examN}']`).value;
        let weight = grid.querySelector(`div[data-exam='${examN}'][data-eval='${evalN}'] > input[name='weight']`).value / 100;
        if (exam && examType && weight) {
          if (!newEval[eval]) newEval[eval] = {};
          if (!newEval[eval][examType]) newEval[eval][examType] = {};
          newEval[eval][examType][exam] = weight;
        }
      }
    }
  }

  subjects[id] = completeSubject(
    subjects[id],
    {
      id: id,
      shortName: editSubject.querySelector('#edit-shortName').value,
      fullName: editSubject.querySelector('#edit-fullName').value,
      course: editSubject.querySelector('#edit-course').value,
      faculty: editSubject.querySelector('#edit-faculty').value,
      uni: editSubject.querySelector('#edit-uni').value,
      color: editSubject.querySelector('input[name="color-bar"]:checked').value,
      evaluation: newEval
    });

  uploadEvaluation(id, newEval);

  updateSubjectCardInfo(id);

  saveSubjectsLocalStorage();
  hideLoader('dashboard');
}

function deleteSubject(id) {
  removedSubject = subjects[id]
  delete subjects[id];
  saveSubjectsLocalStorage()
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
  let id = removedSubject.id;
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
    subjectsDB.add(subject)
      .then((doc) => {
        console.log(`Created ${subject.shortName} with id ${doc.id}`);
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
  uploadToUserDB(`subjects.${id}.evaluation`, evaluation);
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
  return `<li>
            <input style="display: none;" type="checkbox" value="${id}" name="subject" id="checkbox-${id}" ${(subjects[id]) ? 'checked disabled' : ''}>
            <label class="searchResultCheck" for="checkbox-${id}"></label>
            <label class="searchResultTitle" for="checkbox-${id}">
              <span class="searchResultRow1">${match.shortName.value} - ${match.fullName.value}</span><br>
              <span class="searchResultRow2">${match.faculty.value} ${match.uni.value} - ${match.course.value}</span>
            </label>
            <div class="searchResultAction"><img src="media/discount.svg"></div>
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