"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var editSubjectPopup = document.getElementById('edit-popup-content');
var viewSubjectPopup = document.getElementById('view-popup-content');
var newSubjectPopup = document.getElementById('new-popup-content');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];
var searchResultContainer = document.getElementById('subjects-search-results');
var searchResultsSubject = document.getElementById('subjects-search-results');
var allPopups = ['user-container', 'add-container', 'edit-container', 'view-container', 'new-container'];
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
db.settings({
  timestampsInSnapshots: true
}); //remove when timestamps are updated

var userDB = null;
var subjectsDB = db.collection('subjects');
var client = algoliasearch('2R59JNYNOA', 'b8fd696952b9984035a380a3837662e0');
var index = client.initIndex('subjects_search');
var subjectsToAdd = {};
loadData(); // if (!isSubscribed) {
//   setTimeout(() => {
//     showToast('Quieres que te avisemos cuando salgan notas?', 'Avísame', 'subscribe();', 20000);
//   }, 8000);
// }
// also load firebase (at the bottom)
// also load navigo (at the next section)

/* -------------------- HISTORY && POPUPs ------------------------------ */

var setPageDashboard = function setPageDashboard(params) {
  popupHideAll();
};

var setPageUser = function setPageUser(params) {};

var setPageMe = function setPageMe(params) {
  popupShow('user-container', true);
};

var setPageMeEdit = function setPageMeEdit(params) {};

var setPageMeSubjectEdit = function setPageMeSubjectEdit(params) {
  if (subjects[params.id]) {
    popupShow('edit-container', false);
    generateEditSubjectUI(params.id); // showSubjectInfo(params.id);
    // window.history.back();
  } else {
    showToast("You don't have the subject ".concat(params.id));
    window.history.back();
  }
};

var setPageMeSubjectAdd = function setPageMeSubjectAdd(params) {
  popupShow('add-container', false);
  document.getElementById('search-subject-input').focus();
};

var setPageSubjectNew = function setPageSubjectNew(params) {
  popupShow('new-container', false);
  clearNewSubjectUI();
};

var setPageSubjectView = function setPageSubjectView(params) {
  subjectsDB.doc(params.id).get().then(function (doc) {
    if (doc.exists) {
      popupShow('view-container', false);
      generateViewSubjectUI(params.id, doc.data());
    } else {
      window.history.back();
      console.error("Subject width id ".concat(params.id, " doesn't exist"));
    }
  }).catch(function (error) {
    window.history.back();
    console.error("Error getting subject info:", error);
  });
};

var setPageSubjectEdit = function setPageSubjectEdit(params) {};

var router = new Navigo(null, true);
router.on({
  '/user/:id': {
    as: 'user.view',
    uses: setPageUser
  },
  '/me': {
    as: 'me',
    uses: setPageMe
  },
  '/me/edit': {
    as: 'me.edit',
    uses: setPageMeEdit
  },
  '/me/subjects/:id/edit': {
    as: 'me.subject.edit',
    uses: setPageMeSubjectEdit
  },
  '/me/subjects/add': {
    as: 'me.subject.add',
    uses: setPageMeSubjectAdd
  },
  '/subjects/new': {
    as: 'subject.new',
    uses: setPageSubjectNew
  },
  //asks basic info and finds duplicates, then goes to subject.edit
  '/subjects/:id': {
    as: 'subject.view',
    uses: setPageSubjectView
  },
  '/subjects/:id/edit': {
    as: 'subject.edit',
    uses: setPageSubjectEdit
  },
  '*': {
    as: 'dashboard',
    uses: setPageDashboard
  }
}).resolve();

function showUserInfo() {
  router.navigate("/me");
}

function showAddSubject() {
  router.navigate("/me/subjects/add");
}

function showEditSubject(id) {
  router.navigate("/me/subjects/".concat(id, "/edit"));
}

function showViewSubject(id) {
  router.navigate("/subjects/".concat(id));
}

function showNewSubject() {
  router.navigate("/subjects/new");
} //Shows the popup


function popupShow(id, isSmall) {
  popupHideAll(id);
  var elem = document.getElementById(id);
  elem.style.display = 'flex';

  elem.animate({
    opacity: [0, 1],
    easing: ["ease-in"]
  }, 125).onfinish = function () {
    if (!isSmall && window.matchMedia("(max-width: 600px)").matches) {
      currentScreen.style.display = 'none';
      topbar.style.display = 'none';
    }
  };
} //Hides the popup


function popupHide(popup) {
  currentScreen.style.display = 'block';
  topbar.style.display = 'flex';

  popup.animate({
    opacity: [1, 0],
    easing: ["ease-in"]
  }, 125).onfinish = function () {
    popup.style.display = 'none';
  };
} //Hides all popups


function popupHideAll(exeption) {
  for (var _i = 0; _i < allPopups.length; _i++) {
    var popup = allPopups[_i];

    if (popup != exeption) {
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

  for (var id in subjects) {
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

  if (Object.keys(subjects[id].evaluations).length == 0) {
    delete subjects[id];
    saveSubjectsLocalStorage();
  }

  if (subjects[id].necesaryMark != undefined || subjects[id].necesaryMarks == undefined) {
    delete subjects[id].necesaryMark;
    subjects[id].necesaryMarks = {};

    for (var evaluation in subjects[id].evaluations) {
      subjects[id].necesaryMarks[evaluation] = {};

      for (var examName in subjects[id].evaluations[evaluation].exams) {
        subjects[id].necesaryMarks[evaluation][examName] = subjects[id].evaluations[evaluation].passMark;
      }
    }

    updateNecesaryMark(id);
    saveSubjectsLocalStorage();
  }
} //updates the subject card information (bar, inputs and names)


function updateSubjectCardInfo(id) {
  getCard(id).innerHTML = "<button onclick=\"deleteSubject('".concat(id, "')\" class=\"subject-card-remove\">\n  <img src=\"media/trash.svg\" alt=\"x\" aria-label=\"Delete subject\">\n</button>\n<button onclick=\"showEditSubject('").concat(id, "')\" class=\"subject-card-info\">\n  <img src=\"media/discount.svg\" alt=\"%\" aria-label=\"Show subject information\">\n</button>\n<h2>").concat(subjects[id].shortName, "</h2>\n<p class=\"subject-finalMark\" style=\"color: ").concat(isPassed(id, subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c', ";\">").concat(subjects[id].finalMark[subjects[id].selectedEvaluation], "</p>\n<div class=\"subject-bar\">").concat(generateBar(id), "</div>\n<div class=\"grades-input hidden\" style=\"height: 0px;\">").concat(generateInputs(id) + generateEvaluations(id), "</div>");
  updateAndDisplayMarks(id, false);
} //Creates the subject card and appends it to the dashboard


function createSubjectCardCollapsed(id) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card';

  card.onclick = function (event) {
    toggleExpandCard(event, this);
  };

  card.innerHTML = "<button onclick=\"deleteSubject('".concat(id, "')\" class=\"subject-card-remove\">\n  <img src=\"media/trash.svg\" alt=\"x\" aria-label=\"Delete subject\">\n</button>\n<button onclick=\"showEditSubject('").concat(id, "')\" class=\"subject-card-info\">\n  <img src=\"media/discount.svg\" alt=\"%\" aria-label=\"Show subject information\">\n</button>\n<h2>").concat(subjects[id].shortName, "</h2>\n<p class=\"subject-finalMark\" style=\"color: ").concat(isPassed(id, subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c', ";\">").concat(subjects[id].finalMark[subjects[id].selectedEvaluation], "</p>\n<div class=\"subject-bar\">").concat(generateBar(id), "</div>\n<div class=\"grades-input hidden\" style=\"height: 0px;\">").concat(generateInputs(id) + generateEvaluations(id), "</div>");
  dashboard.appendChild(card);
  updateAndDisplayMarks(id, false);
  hideTutorial();
}

function generateBar(id) {
  var weight = 0;
  var barHTML = "";

  for (var exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    if (isUndone(id, exam)) {
      var mark = '';

      if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][exam] == null) {
        mark = 'ಥ_ಥ';
      } else {
        mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][exam];
      }

      barHTML += "<div onclick=\"selectInput('in-".concat(id + exam, "')\" class=\"scolN\" style=\"flex-grow: ").concat(subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100, "\" title=\"").concat(subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100, "%\" data-exam=\"").concat(exam, "\">").concat(exam, "<div id=\"bar-").concat(id + exam, "\" data-exam=\"").concat(exam, "\">").concat(mark, "</div></div>");
    } else {
      barHTML += "<div onclick=\"selectInput('in-".concat(id + exam, "')\" class=\"scol").concat(subjects[id].color, "\" style=\"flex-grow: ").concat(subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100, "\" title=\"").concat(subjects[id].evaluations[subjects[id].selectedEvaluation].exams[exam].weight * 100, "%\" data-exam=\"").concat(exam, "\">").concat(exam, "<div id=\"bar-").concat(id + exam, "\" data-exam=\"").concat(exam, "\">").concat(subjects[id].grades[exam], "</div></div>");
    }
  }

  return barHTML;
}

function generateInputs(id) {
  var html = '';
  var types = {};

  for (var examName in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
    var exam = subjects[id].evaluations[subjects[id].selectedEvaluation].exams[examName];
    if (!types[exam.type]) types[exam.type] = {};
    if (!types[exam.type].weight) types[exam.type].weight = 0;
    if (!types[exam.type].inputsHTML) types[exam.type].inputsHTML = '';
    types[exam.type].weight += exam.weight;
    var mark = '';

    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][examName] == null) {
      mark = 'ಥ_ಥ';
    } else {
      mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][examName];
    }

    if (isUndone(id, examName)) {
      types[exam.type].inputsHTML += "<div><span>".concat(examName, ":</span><input type=\"number\" id=\"in-").concat(id + examName, "\" data-exam=\"").concat(examName, "\" placeholder=\"").concat(mark, "\" value=\"\" class=\"scolN2\" oninput=\"updateMarkFromCardInput('").concat(id, "', '").concat(examName, "', this.value, this);\" autocomplete=\"off\" step=\"0.01\" min=\"0\" max=\"10\"></div>");
    } else {
      types[exam.type].inputsHTML += "<div><span>".concat(examName, ":</span><input type=\"number\" id=\"in-").concat(id + examName, "\" data-exam=\"").concat(examName, "\" placeholder=\"").concat(mark, "\" value=\"").concat(subjects[id].grades[examName], "\" class=\"scol").concat(subjects[id].color, "\" oninput=\"updateMarkFromCardInput('").concat(id, "', '").concat(examName, "', this.value, this);\" autocomplete=\"off\" step=\"0.01\" min=\"0\" max=\"10\"></div>");
    }
  }

  for (var type in types) {
    html += "<h3>".concat(type, "</h3><span>").concat(round(types[type].weight * 100, 0), "%</span><div>").concat(types[type].inputsHTML, "</div>");
  }

  return html;
}

function generateEvaluations(id) {
  var evaluationsHTML = "<div class=\"evaluation-select\"".concat(Object.keys(subjects[id].evaluations).length <= 1 ? ' style="display: none;"' : '', ">\n  <span>Evaluaci\xF3n:</span>\n  <select onchange=\"setSelectedEvaluation('").concat(id, "',this.value);\">");

  for (var evaluation in subjects[id].evaluations) {
    evaluationsHTML += "<option value=\"".concat(evaluation, "\"").concat(evaluation == subjects[id].selectedEvaluation ? 'selected="selected"' : '', ">").concat(evaluation, "</option>");
  }

  evaluationsHTML += "</select>\n  <img src=\"media/dislike.svg\" style=\"display: none;\" title=\"Hay otra evaluaci\xF3n mejor\">\n</div>";
  return evaluationsHTML;
}

function addToSubjectsToAdd(id, checked) {
  if (checked) {
    subjectsToAdd[id] = null;
  } else {
    delete subjectsToAdd[id];
  }
} //Adds the subjects selected in the popup


function addSubjects() {
  showLoader('Cargando tus asignaturas', 'dashboard');
  document.getElementById('search-subject-input').value = '';

  for (var id in subjectsToAdd) {
    if (subjects[id] == undefined) {
      if (subjectsToAdd[id] == null) {
        addSubjectFromDB(id);
      } else {
        addSubject(id, subjectsToAdd[id]);
      }
    } else {// showToast(`Ya tienes ${subjects[id].shortName}`);
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
  subjectsDB.doc(id).get().then(function (doc) {
    if (doc.exists) {
      addSubject(id, doc.data());
    } else {
      console.error('Subject dosen\'t exists');
    }
  }).catch(function (error) {
    console.error("Error getting subject info:", error);
  });
}

function completeSubject() {
  for (var _len = arguments.length, subjects = new Array(_len), _key = 0; _key < _len; _key++) {
    subjects[_key] = arguments[_key];
  }

  var subject = Object.assign.apply(Object, [{
    evaluations: {},
    grades: {},
    fullName: '',
    shortName: '',
    faculty: '',
    uni: '',
    course: '',
    color: 1,
    necesaryMarks: {},
    finalMark: {}
  }].concat(subjects));
  delete subject.id;
  delete subject.evaluation; // TODO: remove this if all subjects have last evaluation structure

  if (!subject.selectedEvaluation || !Object.keys(subject.evaluations).includes(subject.selectedEvaluation)) subject.selectedEvaluation = Object.keys(subject.evaluations)[0] || '';

  for (var evaluation in subject.evaluations) {
    if (!subject.necesaryMarks[evaluation]) {
      subject.necesaryMarks[evaluation] = {};

      for (var examName in subject.evaluations[evaluation].exams) {
        subject.necesaryMarks[evaluation][examName] = subject.evaluations[evaluation].passMark;
      }

      subject.finalMark[evaluation] = 0;
    }
  }

  return subject;
}

function clearNewSubjectUI() {
  var html = generateEditSubjectUIHTML('new', completeSubject({
    creator: displayName,
    creationDate: {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    }
  }), 'new');
  newSubjectPopup.innerHTML = html;
}

function generateViewSubjectUI(id, subject) {
  var html = generateEditSubjectUIHTML(id, subject, 'view');
  viewSubjectPopup.innerHTML = html;
  var evaluations = Object.keys(subject.evaluations);

  for (var evaluationCount in evaluations) {
    updateSumWeight(viewSubjectPopup, evaluationCount);
  }
}

function generateEditSubjectUI(id) {
  var subject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : subjects[id];
  var html = generateEditSubjectUIHTML(id, subject, 'edit');
  editSubjectPopup.innerHTML = html;
  var evaluations = Object.keys(subject.evaluations);

  for (var evaluationCount in evaluations) {
    updateSumWeight(editSubjectPopup, evaluationCount);
  }
}

function generateEditSubjectUIHTML(id, subject, popup) {
  var exams = toNewEval(subject.evaluations);
  var evaluations = Object.keys(subject.evaluations);
  var grid = '';
  var newEvals = '';
  var newExams = '';
  var footer = '';
  var colors = '';
  var conditions = '';
  newEvals += "<input style=\"grid-row: 1; grid-column: ".concat(5 + evaluations.length * 1, ";\" class=\" edit-new-evaluation\" data-evaluation=\"").concat(evaluations.length, "\" type=\"text\" name=\"evaluationName\" value=\"\" placeholder=\"NEW\" autocomplete=\"off\" oninput=\"updateEvalName(this.dataset.evaluation, this.value, '").concat(popup, "');\">");
  var examCount = 0;

  for (var exam in exams) {
    grid += "\n    <input style=\"grid-row: ".concat(2 + examCount * 1, "; grid-column: 1;\" class=\"\" type=\"text\"   name=\"exam\"       value=\"").concat(exam, "\"                 data-exam=\"").concat(examCount, "\" placeholder=\"NEW\" autocomplete=\"off\" maxlength=\"5\" required>\n    <input style=\"grid-row: ").concat(2 + examCount * 1, "; grid-column: 2;\" class=\"\" type=\"text\"   name=\"examType\"   value=\"").concat(exams[exam].examType, "\" data-exam=\"").concat(examCount, "\" placeholder=\"Parciales\" required>\n    <input style=\"grid-row: ").concat(2 + examCount * 1, "; grid-column: 3;\" class=\"\" type=\"number\" name=\"mark\"       value=\"\"                        data-exam=\"").concat(examCount, "\" placeholder=\"-\" autocomplete=\"off\" min=\"0\" max=\"10\" step=\"0.01\">");
    newEvals += "<div style=\"grid-row: ".concat(2 + examCount * 1, "; grid-column: ").concat(5 + evaluations.length * 1, ";\" class=\"edit-weight edit-new-evaluation\" data-exam=\"").concat(examCount, "\" data-evaluation=\"").concat(evaluations.length, "\"><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>");

    for (var evaluationCount in evaluations) {
      grid += "<div style=\"grid-row: ".concat(2 + examCount * 1, "; grid-column: ").concat(5 + evaluationCount * 1, ";\" class=\"edit-weight\" data-exam=\"").concat(examCount, "\" data-evaluation=\"").concat(evaluationCount, "\"><input type=\"number\" name=\"weight\" value=\"").concat(exams[exam].weight[evaluations[evaluationCount]] && exams[exam].weight[evaluations[evaluationCount]] != 0 ? round(exams[exam].weight[evaluations[evaluationCount]] * 100, 4) : '', "\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>");
    }

    ++examCount;
  }

  for (var _evaluationCount in evaluations) {
    grid += "<input style=\"grid-row: 1; grid-column: ".concat(5 + _evaluationCount * 1, ";\" class=\"edit-evaluationName\" type=\"text\" name=\"evaluationName\" value=\"").concat(evaluations[_evaluationCount], "\" data-evaluation=\"").concat(_evaluationCount, "\" placeholder=\"NEW\" autocomplete=\"off\" required oninput=\"updateEvalName(this.dataset.evaluation, this.value, '").concat(popup, "');\">");
    newExams += "<div style=\"grid-row: ".concat(2 + examCount * 1, "; grid-column: ").concat(5 + _evaluationCount * 1, ";\" class=\"edit-weight edit-new-exam\" data-exam=\"").concat(examCount, "\" data-evaluation=\"").concat(_evaluationCount, "\"><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>");
    footer += "<span  style=\"grid-row: ".concat(3 + examCount * 1, "; grid-column: ").concat(5 + _evaluationCount * 1, ";\" class=\"edit-total\" data-evaluation=\"").concat(_evaluationCount, "\">0%</span>");
    conditions += "<label class=\"edit-conditions-label\">".concat(evaluations[_evaluationCount], "</label><input class=\"edit-conditions-input\" type=\"text\" placeholder=\"nombreExamen >= 2\" name=\"condition\" data-evaluation=\"").concat(_evaluationCount, "\" value=\"").concat(subject.evaluations[evaluations[_evaluationCount]].condition || '', "\">");
  }

  newExams += "\n  <input style=\"grid-row: ".concat(2 + examCount * 1, "; grid-column: 1;\" class=\"edit-new-exam\" type=\"text\"   name=\"exam\"       value=\"\" data-exam=\"").concat(examCount, "\" placeholder=\"NEW\" autocomplete=\"off\" maxlength=\"5\">\n  <input style=\"grid-row: ").concat(2 + examCount * 1, "; grid-column: 2;\" class=\"edit-new-exam\" type=\"text\"   name=\"examType\"   value=\"\" data-exam=\"").concat(examCount, "\" placeholder=\"Parciales\">\n  <input style=\"grid-row: ").concat(2 + examCount * 1, "; grid-column: 3;\" class=\"edit-new-exam\" type=\"number\" name=\"mark\"       value=\"\" data-exam=\"").concat(examCount, "\" placeholder=\"-\" autocomplete=\"off\" min=\"0\" max=\"10\" step=\"0.01\">\n  ");
  var _arr = [1, 8, 3, 4, 6, 5, 2, 7];

  for (var _i2 = 0; _i2 < _arr.length; _i2++) {
    var color = _arr[_i2];
    colors += "\n    <label class=\"scol".concat(color, "\"  for=\"color-bar-").concat(popup, "-elem").concat(color, "\">\n      <input type=\"radio\" name=\"color-bar\" value=\"").concat(color, "\" id=\"color-bar-").concat(popup, "-elem").concat(color, "\" ").concat(color == subject.color ? 'checked' : '', ">\n      <span class=\"edit-color-checkmark\"></span>\n    </label>");
  }

  var html = "\n  <h2>Informaci\xF3n</h2>\n  <input type=\"hidden\" name=\"id\" id=\"".concat(popup, "-id\" value=\"").concat(id, "\" style=\"display: none;\" hidden>\n  <div class=\"edit-popup-info\">\n    <div>\n      <label for=\"").concat(popup, "-shortName\">Nombre</label>\n      <input type=\"text\" name=\"shortName\" id=\"").concat(popup, "-shortName\" value=\"").concat(subject.shortName, "\" placeholder=\"M2\" required>\n    </div>\n    <div class=\"edit-fullName\">\n      <label for=\"").concat(popup, "-fullName\">Nombre Largo</label>\n      <input type=\"text\" name=\"fullName\" id=\"").concat(popup, "-fullName\" value=\"").concat(subject.fullName ? subject.fullName : '', "\" placeholder=\"Matem\xE1ticas 2\" required>\n    </div>\n  </div>\n  <div class=\"edit-popup-info\">\n    <div>\n      <label for=\"").concat(popup, "-course\">Curso</label>\n      <input type=\"text\" name=\"course\" id=\"").concat(popup, "-course\" value=\"").concat(subject.course ? subject.course : '', "\" placeholder=\"Q1 2019-2020\" required>\n    </div>\n    <div>\n      <label for=\"").concat(popup, "-faculty\">Facultad</label>\n      <input type=\"text\" name=\"faculty\" id=\"").concat(popup, "-faculty\" value=\"").concat(subject.faculty ? subject.faculty : '', "\" placeholder=\"FIB\" required>\n    </div>\n    <div>\n      <label for=\"").concat(popup, "-uni\">Universidad</label>\n      <input type=\"text\" name=\"uni\" id=\"").concat(popup, "-uni\" value=\"").concat(subject.uni ? subject.uni : '', "\" placeholder=\"UPC\" required>\n    </div>\n  </div>\n  <div class=\"color-bar\">\n    ").concat(colors, "\n    <!-- <label class=\"scol0\"  for=\"color-bar-elem0\">\n      <input type=\"radio\" name=\"color-bar\" value=\"0\" id=\"color-bar-elem0\">\n      <span class=\"edit-color-checkmark edit-color-checkmark-random\"></span>\n    </label> -->\n  </div>\n\n  <div class=\"edit-popup-info\">\n    <div>\n      <span>Fecha de creaci\xF3n: <span id=\"").concat(popup, "-creationDate\">").concat(subject.creationDate ? new Date(subject.creationDate.seconds * 1000).toLocaleDateString('es-ES') : '--/--/----', "</span></span>\n    </div>\n    <div>\n      <span>Creador: <span id=\"").concat(popup, "-creator\">").concat(subject.creator ? subject.creator : 'Anónimo', "</span></span>\n    </div>\n  </div>\n\n  <h2>Evaluaci\xF3n</h2>\n  <div class=\"scroll\">\n    <div class=\"edit-popup-grid\" onkeyup=\"editUIUpdateGrid(this, event, '").concat(popup, "');\" data-evaluations=\"").concat(evaluations.length, "\" data-exams=\"").concat(examCount, "\">\n      <!-- Header -->\n      <span  style=\"grid-row: 1; grid-column: 1;\" >Nombre</span>\n      <span  style=\"grid-row: 1; grid-column: 2;\" >Categor\xEDa</span>\n      <span  style=\"grid-row: 1; grid-column: 3;\" >Nota</span>\n\n      <!-- Body -->\n      ").concat(grid, "\n      <!-- Divider -->\n      <div style=\"grid-row: 2 / ").concat(2 + examCount, ";\" class=\"grid-separator-evaluation\"></div>\n\n      <!-- new -->\n      ").concat(newEvals, "\n      ").concat(newExams, "\n\n      <!-- Footer -->\n      ").concat(footer, "\n      \n    </div>\n\n    <!-- Conditions -->\n    <h2>Condiciones para aprovar</h2>\n    <div class=\"edit-conditions\">\n      ").concat(conditions, "\n    </div>\n  </div>");
  return html;
}
/* ------------------------------ UI & DATA UPDATE ------------------------------ */


function updateEvalName(evaluationN, value, popup) {
  var label = document.querySelector("#".concat(popup, "-popup-content .edit-conditions-label[data-evaluation='").concat(evaluationN, "']"));
  if (label) label.textContent = value || '';
} //Updates, saves and shows the finalMark and necesaryMarks


function updateAndDisplayMarks(id) {
  var confetti = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  updateFinalMark(id, confetti);
  updateNecesaryMark(id);
  displayFinalMark(id);
  displayNecesaryMark(id);
  congratulate();
}

function displayNecesaryMark(id) {
  var card = getCard(id);
  var barUndone = card.getElementsByClassName('scolN');
  var inUndone = card.getElementsByClassName('scolN2');

  for (var j = 0; j < barUndone.length; j++) {
    var mark = '';

    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][barUndone[j].dataset.exam] == null) {
      mark = 'ಥ_ಥ';
    } else {
      mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][barUndone[j].dataset.exam];
    }

    barUndone[j].children[0].textContent = mark;
  }

  for (var _j = 0; _j < inUndone.length; _j++) {
    var _mark = '';

    if (subjects[id].necesaryMarks[subjects[id].selectedEvaluation][inUndone[_j].dataset.exam] == null) {
      _mark = 'ಥ_ಥ';
    } else {
      _mark = subjects[id].necesaryMarks[subjects[id].selectedEvaluation][inUndone[_j].dataset.exam];
    }

    inUndone[_j].placeholder = _mark;
  }
}

function displayFinalMark(id) {
  var cardFinalMark = getCard(id).getElementsByClassName('subject-finalMark')[0];
  cardFinalMark.textContent = subjects[id].finalMark[subjects[id].selectedEvaluation];
  cardFinalMark.style.color = isPassed(id, subjects[id].selectedEvaluation) ? '#5a9764' : '#b9574c';
}

function updateNecesaryMark(id) {
  var evaluation = subjects[id].selectedEvaluation;
  var identifiers = getConditionIdentifiers(id, evaluation);

  for (var exam in subjects[id].necesaryMarks[evaluation]) {
    subjects[id].necesaryMarks[evaluation][exam] = undefined;
  }

  for (var _exam in identifiers.exams) {
    switch (identifiers.exams[_exam].operator) {
      case '>=':
        subjects[id].necesaryMarks[evaluation][_exam] = identifiers.exams[_exam].value;
        break;
    }
  }

  for (var type in identifiers.types) {
    switch (identifiers.types[type].operator) {
      case '>=':
        for (var _exam2 in subjects[id].necesaryMarks[evaluation]) {
          if (subjects[id].evaluations[evaluation].exams[_exam2].type == type) {
            if (subjects[id].necesaryMarks[evaluation][_exam2] !== undefined && subjects[id].necesaryMarks[evaluation][_exam2] < identifiers.types[type].value) {
              subjects[id].necesaryMarks[evaluation][_exam2] = identifiers.types[type].value;
            }
          }
        }

        break;
    }
  }

  gradeCalcAllEqual(id, subjects[id].selectedEvaluation);
  var selectedEvaluationIsBestOption = getBestEval(id) === subjects[id].selectedEvaluation;
  var card = getCard(id);
  if (card) card.querySelector('.evaluation-select > img').style.display = selectedEvaluationIsBestOption ? 'none' : 'block';
}

function getBestEval(id) {
  var smallestNecesaryMarkEvaluation;
  var smallestNecesaryMark;

  for (var evaluation in subjects[id].evaluations) {
    var greatestNecesaryMark = undefined;

    for (var examName in subjects[id].evaluations[evaluation].exams) {
      if (greatestNecesaryMark == undefined || greatestNecesaryMark < subjects[id].necesaryMarks[evaluation][examName]) {
        greatestNecesaryMark = subjects[id].necesaryMarks[evaluation][examName];
      }

      if (smallestNecesaryMark == undefined || smallestNecesaryMark > greatestNecesaryMark) {
        smallestNecesaryMark = subjects[id].necesaryMarks[evaluation][examName];
        smallestNecesaryMarkEvaluation = evaluation;
      }
    }
  }

  return smallestNecesaryMarkEvaluation;
}

function smallestNecessaryMark(id, evaluation) {
  var result = {};

  for (var exam in subjects[id].necesaryMarks[evaluation]) {
    if (result.mark === undefined || result.mark < subjects[id].necesaryMarks[evaluation][exam]) {
      result.exam = exam;
      result.mark = subjects[id].necesaryMarks[evaluation][exam];
    }
  }

  return result;
} //Saves and updates the value of the finalMark


function updateFinalMark(id) {
  var confetti = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  for (var evaluation in subjects[id].evaluations) {
    subjects[id].finalMark[evaluation] = 0;

    for (var exam in subjects[id].evaluations[evaluation].exams) {
      if (!isUndone(id, exam)) subjects[id].finalMark[evaluation] += subjects[id].grades[exam] * subjects[id].evaluations[evaluation].exams[exam].weight;
    }

    subjects[id].finalMark[evaluation] = round(subjects[id].finalMark[evaluation]);
  }

  var nowPassed = isPassed(id);
  if (confetti && !subjects[id].passed && nowPassed) showConfetti(getCard(id));
  subjects[id].passed = nowPassed;
  return subjects[id].finalMark[subjects[id].selectedEvaluation];
} //Saves the changed mark, updates finalMark and necesaryMarks, and shows the info in the UI


function updateMarkFromCardInput(id, exam, mark, input) {
  var barElem = getBarElem(id, exam);

  if (!isNaN(mark) && mark != '') {
    subjects[id].passed = isPassed(id);
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
  var card = getCard(id);

  if (card) {
    for (var div in card.getElementsByClassName('subject-bar')[0]) {
      div.className = 'scolN';
    }

    for (var exam in subjects[id].evaluations[subjects[id].selectedEvaluation].exams) {
      var input = getInput(id, exam);
      input.className = 'scolN2';
      input.value = '';
    }

    for (var _exam3 in subjects[id].grades) {
      var barElem = getBarElem(id, _exam3);

      var _input = getInput(id, _exam3);

      if (barElem && _input) {
        barElem.textContent = subjects[id].grades[_exam3];
        barElem.parentElement.className = 'scol' + subjects[id].color;
        _input.value = subjects[id].grades[_exam3];
        _input.className = 'scol' + subjects[id].color;
      } else {
        console.log("Exam ".concat(_exam3, " of ").concat(subjects[id].shortName, " (").concat(id, ") is not in the card"));
      }
    }

    updateAndDisplayMarks(id);
  } else {
    createSubjectCardCollapsed(id);
    updateCardGrades(id);
  }
} // updates the selectedEvaluation, saves the subjects and displays the new selectedEvaluation


function setSelectedEvaluation(id) {
  var evaluation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : subjects[id].selectedEvaluation;
  subjects[id].selectedEvaluation = evaluation;
  saveSubjectsLocalStorage();
  var card = getCard(id);
  card.getElementsByClassName('subject-bar')[0].innerHTML = generateBar(id);
  card.getElementsByClassName('grades-input')[0].innerHTML = generateInputs(id) + generateEvaluations(id, evaluation);
  updateHeigth(card.getElementsByClassName('grades-input')[0]);
  updateAndDisplayMarks(id);
} // shoot confeti in that element's left down corner


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
} // returns the card DOM element with that id


function getCard(id) {
  return document.getElementById('card-' + id);
} // returns the input DOM element of the card from the subject id and exam exam


function getInput(id, exam) {
  return document.getElementById('in-' + id + exam);
} // returns the card bar DOM element of the card from the subject id and exam exam


function getBarElem(id, exam) {
  return document.getElementById('bar-' + id + exam);
}
/* ------------------------------ MATH ------------------------------ */


function gradeCalcAllEqual(id, evaluation) {
  var sumUndoneExams = 0;
  var exams = [];
  var expectedMark = 0;

  for (var exam in subjects[id].evaluations[evaluation].exams) {
    if (isUndone(id, exam)) {
      if (subjects[id].necesaryMarks[evaluation][exam] == undefined) {
        sumUndoneExams += subjects[id].evaluations[evaluation].exams[exam].weight;
        exams.push(exam);
      } else {
        expectedMark += subjects[id].evaluations[evaluation].exams[exam].weight * subjects[id].necesaryMarks[evaluation][exam];
      }
    } else {
      expectedMark += subjects[id].evaluations[evaluation].exams[exam].weight * subjects[id].grades[exam];
    }
  }

  var passMark = subjects[id].evaluations[evaluation].passMark || 5;
  var necesaryMark = (passMark - expectedMark) / sumUndoneExams;
  var smallestNecesaryMark = smallestNecessaryMark(id, evaluation);

  if (smallestNecesaryMark.mark != undefined && smallestNecesaryMark.mark < necesaryMark) {
    subjects[id].necesaryMarks[evaluation][smallestNecesaryMark.exam] = undefined;
    gradeCalcAllEqual(id, evaluation);
  } else {
    var canPass = calcCondition(id, evaluation, false);

    for (var _exam4 in subjects[id].evaluations[evaluation].exams) {
      if (!subjects[id].necesaryMarks[evaluation][_exam4]) {
        if (isUndone(id, _exam4)) {
          if (canPass === false) {
            subjects[id].necesaryMarks[evaluation][_exam4] = null;
          } else {
            subjects[id].necesaryMarks[evaluation][_exam4] = Math.max(0, round(necesaryMark));
          }
        } else {
          subjects[id].necesaryMarks[evaluation][_exam4] = subjects[id].grades[_exam4];
        }
      }
    }
  }
} //returns n rounded to d decimals (2)


function round(n) {
  var d = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  return isNaN(n) || n === '' || n == undefined ? undefined : Math.floor(Math.round(n * Math.pow(10, d))) / Math.pow(10, d);
} // returns a random number from smallest to biggest


function random(smallest, biggest) {
  return Math.floor(Math.random() * (biggest - smallest)) + smallest;
}

function congratulate() {
  if (hasPassedEverything()) {
    document.getElementById('congratulations-img').style.display = 'block';
  } else {
    document.getElementById('congratulations-img').style.display = 'none';
  }
} // returns true if all subjects are passed in each selectedEvaluation


function hasPassedEverything() {
  if (isEmpty(subjects)) return false;

  for (var id in subjects) {
    if (!isPassed(id)) return false;
  }

  return true;
} // returns true if the subject with that id has a finalMark greater than mark (5) in the evaluation (selectedEvaluation)


function isPassed(id) {
  var evaluation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : subjects[id].selectedEvaluation;
  return subjects[id].finalMark[evaluation] >= (subjects[id].evaluations[evaluation].passMark || 5) && calcCondition(id, evaluation);
}

function getExamTypesGrades(id, evaluation) {
  var types = {};

  for (var examName in subjects[id].evaluations[evaluation].exams) {
    var exam = subjects[id].evaluations[evaluation].exams[examName];
    if (!types[exam.type]) types[exam.type] = 0;
    types[exam.type] += exam.weight * (subjects[id].grades[examName] || 0);
  }

  return types;
}

function getConditionIdentifiers(id, evaluation) {
  if (!subjects[id].evaluations[evaluation].condition) return true;
  var tree = jsep(subjects[id].evaluations[evaluation].condition);
  var identifiers = {
    exams: {},
    evaluations: {},
    types: {}
  };
  var types = Object.keys(getExamTypesGrades(id, evaluation));
  findIdentifiersTree(tree, identifiers, types, id, evaluation);
  return identifiers;
}

function findIdentifiersTree(tree, identifiers, types, id, evaluation) {
  switch (tree.type) {
    case 'LogicalExpression':
    case 'BinaryExpression':
      if (tree["left"].type == 'Identifier' && tree["right"].type == 'Literal') {
        identifiers[identifierCategory(tree["left"].name, id, evaluation, types)][tree["left"].name] = {
          value: tree["right"].value,
          operator: tree.operator
        };
      } else {
        findIdentifiersTree(tree["left"], identifiers, types, id, evaluation);
        findIdentifiersTree(tree["right"], identifiers, types, id, evaluation);
      }

      break;
  }
}

function identifierCategory(identifier, id, evaluation) {
  var types = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
  if (Object.keys(subjects[id].evaluations[evaluation].exams).includes(identifier)) return 'exams';
  if (Object.keys(subjects[id].evaluations).includes(identifier)) return 'evaluations';
  if (types == undefined) types = Object.keys(getExamTypesGrades(id, evaluation));
  if (types.includes(identifier)) return 'types';
}

function calcCondition(id, evaluation) {
  var now = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  if (!subjects[id].evaluations[evaluation].condition) return true;
  var tree = jsep(subjects[id].evaluations[evaluation].condition);

  var values = _objectSpread({}, subjects[id].grades, subjects[id].finalMark, getExamTypesGrades(id, evaluation));

  return evaluationTree(tree, values, now);
}

function evaluationTree(tree, values, now) {
  switch (tree.type) {
    case 'LogicalExpression':
      switch (tree.operator) {
        case '&&':
          return evaluationTree(tree["left"], values, now) && evaluationTree(tree["right"], values, now);
          break;

        default:
          return null;
          break;
      }

      break;

    case 'BinaryExpression':
      switch (tree.operator) {
        case '>=':
          if (tree["left"].type != 'Identifier' || tree["right"].type != 'Literal') {
            return null;
          } else {
            if (!now && values[tree["left"].name] == undefined) return true;else return (values[tree["left"].name] || 0) >= tree["right"].value;
          }

          break;

        case '<':
          if (tree["left"].type != 'Identifier' || tree["right"].type != 'Literal' || identifierCategory(tree["left"].name) != 'evaluations') {
            return null;
          } else {
            if (!now && values[tree["left"].name] == undefined) return true;else return (values[tree["left"].name] || 0) < tree["lerightft"].value;
          }

          break;

        default:
          return null;
          break;
      }

      break;

    case 'Literal':
      return tree.value;
      break;

    case 'Identifier':
      return values[tree.name] || 0;
      break;

    default:
      return null;
      break;
  }
}
/* ------------------------------ UI MANIPULATION ------------------------------ */
//Expands or collapses the card


function toggleExpandCard(event, card) {
  var inputs = card.getElementsByClassName('grades-input')[0];
  var bar = card.getElementsByClassName('subject-bar')[0];

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
} //Puts the cursor and selects the content of the input


function selectInput(idInput) {
  document.getElementById(idInput).select();
}

function appendElement(parent, str) {
  var div = document.createElement('div');
  div.innerHTML = str.trim();
  var element = div.firstChild;
  parent.appendChild(element);
  return element;
}
/* ------------------------------ Cards Remove animation ------------------------------ */


var cards;
updateCards();
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
  var cardsInfo = {};
  cards.forEach(function (card) {
    var rect = card.getBoundingClientRect();
    cardsInfo[card.id] = {
      "x": rect.left,
      "y": rect.top,
      "width": rect.right - rect.left
    };
  });
  return cardsInfo;
}

function moveCards() {
  updateCards();
  cards.forEach(function (card) {
    // console.log(card.id);
    // console.log(cardsOldInfo[card.id]);
    // console.log(cardsNewInfo[card.id]);
    card.animate([{
      transform: "translate(".concat(cardsOldInfo[card.id].x - cardsNewInfo[card.id].x, "px, ").concat(cardsOldInfo[card.id].y - cardsNewInfo[card.id].y, "px) scaleX(").concat(cardsOldInfo[card.id].width / cardsNewInfo[card.id].width, ")")
    }, {
      transform: 'none'
    }], {
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
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }

  return true;
}

function showToast(message, action, code) {
  var time = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 8000;
  toast.style.display = 'none'; // setCSSvar('toastTime', Math.max(0, (time-3000) +'ms'));

  toast.style.animation = "goUp 500ms cubic-bezier(0.215, 0.61, 0.355, 1), fadeOut ".concat(Math.max(0, time - 3000), "ms 2.5s cubic-bezier(1, 0, 1, 1), opaque 2.5s");
  toast.offsetHeight;
  toast.style.display = 'flex';
  toast.firstChild.innerHTML = "<p>".concat(message, "</p>");
  if (action && code) toast.firstChild.innerHTML += "<button onclick=\"".concat(code, "\">").concat(action, "</button>");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.style.display = 'none';
  }, time);
} // function setCSSvar(variable, value) {
//   let root = document.documentElement;
//   root.style.setProperty('--'+variable, value);
// }


function showLoader(message, position) {
  var loader = document.getElementById(position + '-loader');
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
} // function isValidJSON(str) {
//   let  json = undefined;
//   try {json = JSON.parse(str);} catch (e){console.error(e);}
//   return json;
// }


function toNewEvalNeeeeeeeeew(evaluations) {
  var evaluationNew = {};

  for (var evaluation in evaluations) {
    if (evaluations[evaluation].exams) return evaluations;
    evaluationNew[evaluation] = {};
    evaluationNew[evaluation].condition = '';
    evaluationNew[evaluation].passMark = 5;
    evaluationNew[evaluation].exams = {};

    for (var examType in evaluations[evaluation]) {
      for (var exam in evaluations[evaluation][examType]) {
        evaluationNew[evaluation].exams[exam] = {};
        evaluationNew[evaluation].exams[exam].weight = evaluations[evaluation][examType][exam];
        evaluationNew[evaluation].exams[exam].type = examType;
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
  var newEval = {};

  for (var evaluation in evaluations) {
    for (var exam in evaluations[evaluation].exams) {
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
  var total = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = grid.querySelectorAll(".edit-weight[data-evaluation='".concat(n, "'] > input"))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var element = _step.value;
      total += element.value * 1;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  grid.querySelector(".edit-total[data-evaluation='".concat(n, "']")).textContent = round(total, 4) + '%';
  return total;
} // Adds or removes exams or evaluation input elements


function editUIUpdateGrid(grid, e, popup) {
  var input = e.target;
  var elem = input.parentNode == grid ? input : input.parentNode;
  var conditionsElem = grid.parentNode.lastElementChild;
  var conditions = ''; // if input is filled

  if (input.value) {
    // if is last evaluation --> add another column
    if (parseInt(elem.dataset.evaluation) == parseInt(grid.dataset.evaluations)) {
      ++grid.dataset.evaluations;
      appendElement(grid, "<input style=\"grid-row: 1; grid-column: ".concat(5 + parseInt(grid.dataset.evaluations), ";\" class=\"edit-new-evaluation\" data-evaluation=\"").concat(grid.dataset.evaluations, "\" type=\"text\" name=\"evaluationName\" value=\"\" placeholder=\"NEW\" autocomplete=\"off\" oninput=\"updateEvalName(this.dataset.evaluation, this.value, '").concat(popup, "');\">"));

      for (var i = 0; i < parseInt(grid.dataset.exams); i++) {
        editGridFadeOrUnfade(grid, appendElement(grid, "<div style=\"grid-row: ".concat(2 + i * 1, "; grid-column: ").concat(5 + parseInt(grid.dataset.evaluations), ";\" class=\"edit-weight edit-new-evaluation\" data-exam=\"").concat(i, "\" data-evaluation=\"").concat(grid.dataset.evaluations, "\" ><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>")), ['exam']);
      }

      appendElement(grid, "<div style=\"grid-row: ".concat(2 + parseInt(grid.dataset.exams), "; grid-column: ").concat(4 + parseInt(grid.dataset.evaluations), ";\" class=\"edit-weight edit-new-exam\" data-exam=\"").concat(grid.dataset.exams, "\" data-evaluation=\"").concat(grid.dataset.evaluations - 1, "\" ><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>"));
      appendElement(grid, "<span style=\"grid-row: ".concat(3 + parseInt(grid.dataset.exams), "; grid-column: ").concat(4 + parseInt(grid.dataset.evaluations), ";\" class=\"edit-total\" data-evaluation=\"").concat(-1 + parseInt(grid.dataset.evaluations), "\">0%</span>"));
      appendElement(conditionsElem, "<label class=\"edit-conditions-label\" data-evaluation=\"".concat(parseInt(grid.dataset.evaluations) - 1, "\"></label>"));
      appendElement(conditionsElem, "<input class=\"edit-conditions-input\" type=\"text\" placeholder=\"nombreExamen >= 2\" name=\"condition\" data-evaluation=\"".concat(parseInt(grid.dataset.evaluations) - 1, "\">"));
      if (input.name = 'evaluationName') updateEvalName(parseInt(grid.dataset.evaluations) - 1, input.value, popup); //if is last exam --> add another row
    } else if (parseInt(elem.dataset.exam) == parseInt(grid.dataset.exams)) {
      ++grid.dataset.exams;
      appendElement(grid, "<input style=\"grid-row: ".concat(2 + parseInt(grid.dataset.exams), "; grid-column: 1;\" class=\"edit-new-exam\" type=\"text\"   name=\"exam\"       value=\"\" data-exam=\"").concat(grid.dataset.exams, "\" placeholder=\"NEW\" autocomplete=\"off\" maxlength=\"5\">"));
      appendElement(grid, "<input style=\"grid-row: ".concat(2 + parseInt(grid.dataset.exams), "; grid-column: 2;\" class=\"edit-new-exam\" type=\"text\"   name=\"examType\"   value=\"\" data-exam=\"").concat(grid.dataset.exams, "\" placeholder=\"Parciales\">"));
      appendElement(grid, "<input style=\"grid-row: ".concat(2 + parseInt(grid.dataset.exams), "; grid-column: 3;\" class=\"edit-new-exam\" type=\"number\" name=\"mark\"       value=\"\" data-exam=\"").concat(grid.dataset.exams, "\" placeholder=\"-\" autocomplete=\"off\" min=\"0\" max=\"10\" step=\"0.01\">"));

      for (var _i3 = 0; _i3 < grid.dataset.evaluations; _i3++) {
        editGridFadeOrUnfade(grid, appendElement(grid, "<div style=\"grid-row: ".concat(2 + parseInt(grid.dataset.exams), "; grid-column: ").concat(5 + _i3 * 1, ";\" class=\"edit-weight edit-new-exam\" data-exam=\"").concat(grid.dataset.exams, "\" data-evaluation=\"").concat(_i3, "\"><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>")), ['exam']);
      }

      appendElement(grid, "<div style=\"grid-row: ".concat(1 + parseInt(grid.dataset.exams), "; grid-column: ").concat(5 + parseInt(grid.dataset.evaluations), ";\" class=\"edit-weight edit-new-evaluation\" data-exam=\"").concat(-1 + parseInt(grid.dataset.exams), "\" data-evaluation=\"").concat(grid.dataset.evaluations, "\" ><input type=\"number\" name=\"weight\" value=\"\" placeholder=\"0\" autocomplete=\"off\" min=\"0\" max=\"100\" step=\"0.0001\"></div>"));
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = grid.querySelectorAll('.edit-total')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var element = _step2.value;
          element.style.gridRow = 3 + parseInt(grid.dataset.exams);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    } // if input is empty

  } else {// add on blur event to delete
    }

  editGridFadeOrUnfade(grid, elem);

  if (elem.classList.contains('edit-weight') && !elem.classList.contains('edit-new-evaluation') && !elem.classList.contains('edit-new-exam') && elem.value != '') {
    updateSumWeight(grid, elem.dataset.evaluation);
  }
}

function editGridFadeOrUnfade(grid, element) {
  var check = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['exam', 'evaluation'];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = check[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var type = _step3.value;

      if (element.dataset[type] != undefined && parseInt(element.dataset[type]) < parseInt(grid.dataset[type + 's'])) {
        if (editGridIsEmpty(grid, type, parseInt(element.dataset[type]))) {
          editGridFade(grid, type, parseInt(element.dataset[type]));
        } else {
          editGridUnfade(grid, type, parseInt(element.dataset[type]));
        }
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  grid.querySelector('.grid-separator-evaluation').style.gridRow = "2 / ".concat(2 + parseInt(grid.dataset.exams));
}

function editGridUnfade(grid, type, n) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = grid.querySelectorAll("*[data-".concat(type, "='").concat(n, "'"))[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var element = _step4.value;

      if ((element.dataset.evaluation == undefined || parseInt(element.dataset.evaluation) < parseInt(grid.dataset.evaluations)) && (element.dataset.exam == undefined || parseInt(element.dataset.exam) < parseInt(grid.dataset.exams))) {
        element.classList.remove("edit-new-exam");
        element.classList.remove("edit-new-evaluation");
        if (['exam', 'examType', 'evaluationName'].includes(element.name)) element.required = true;
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }
}

function editGridFade(grid, type, n) {
  var removed = false;
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = grid.querySelectorAll("*[data-".concat(type, "]"))[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var element = _step5.value;

      if (parseInt(element.dataset[type]) == n) {
        element.classList.add("edit-new-".concat(type));
        element.required = false;
        element.parentNode.removeChild(element);
        removed = true;
      } else if (parseInt(element.dataset[type]) > n) {
        element.dataset[type] = parseInt(element.dataset[type]) - 1;

        switch (type) {
          case 'evaluation':
            element.style.gridColumn = "".concat(parseInt(element.dataset[type]) + 5, " / auto");
            break;

          case 'exam':
            element.style.gridRow = "".concat(parseInt(element.dataset[type]) + 2, " / auto");
            break;
        }
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  var conditionsElem = grid.parentNode.lastElementChild;
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = conditionsElem.querySelectorAll("*[data-".concat(type, "]"))[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var _element = _step6.value;

      if (parseInt(_element.dataset[type]) == n) {
        _element.classList.add("edit-new-".concat(type));

        _element.parentNode.removeChild(_element);
      } else if (parseInt(_element.dataset[type]) > n) {
        _element.dataset[type] = parseInt(_element.dataset[type]) - 1;
      }
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
        _iterator6.return();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  if (removed) grid.dataset[type + 's'] = parseInt(grid.dataset[type + 's']) - 1;
}

function editGridIsEmpty(grid, type, n) {
  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = grid.querySelectorAll("input[data-".concat(type, "='").concat(n, "'], div[data-").concat(type, "='").concat(n, "'] > input"))[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var element = _step7.value;
      if (element.value) return false;
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7.return != null) {
        _iterator7.return();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }

  return true;
}

function saveEditSubject() {
  var newSubject = readSubjectFromPopup(editSubjectPopup);
  var id = newSubject.id;
  subjects[id] = completeSubject(subjects[id], newSubject);
  uploadEvaluation(id, newSubject.evaluations);
  updateSubjectCardInfo(id);
  saveSubjectsLocalStorage();
  hideLoader('dashboard');
}

function readSubjectFromPopup(popup) {
  var id = popup.querySelector('input[name="id"]').value;
  var newEval = {};
  var grid = popup.querySelector('.edit-popup-grid');

  for (var evaluationN = 0; evaluationN < parseInt(grid.dataset['evaluations']); evaluationN++) {
    var evaluationNameElem = grid.querySelector("input[name='evaluationName'][data-evaluation='".concat(evaluationN, "']"));

    if (evaluationNameElem) {
      var evaluation = evaluationNameElem.value;

      if (evaluation) {
        for (var examN = 0; examN < parseInt(grid.dataset['exams']); examN++) {
          var exam = grid.querySelector("input[name='exam'][data-exam='".concat(examN, "']")).value;
          var examType = grid.querySelector("input[name='examType'][data-exam='".concat(examN, "']")).value;
          var weight = grid.querySelector("div[data-exam='".concat(examN, "'][data-evaluation='").concat(evaluationN, "'] > input[name='weight']")).value / 100;

          if (exam && examType && weight) {
            if (!newEval[evaluation]) newEval[evaluation] = {};
            if (!newEval[evaluation].exams) newEval[evaluation].exams = {};
            if (!newEval[evaluation].exams[exam]) newEval[evaluation].exams[exam] = {};
            newEval[evaluation].exams[exam].weight = weight;
            newEval[evaluation].exams[exam].type = examType;
          }
        }

        var condition = popup.querySelector("input[name='condition'][data-evaluation='".concat(evaluationN, "']")).value;

        if (condition) {
          // if(!calcCondition(...)) {stop edition} // TODO: check if condition is valid
          newEval[evaluation].condition = condition;
        }
      }
    }
  }

  console.log(newEval);
  return {
    id: id,
    shortName: popup.querySelector('input[name="shortName"]').value,
    fullName: popup.querySelector('input[name="fullName"]').value,
    course: popup.querySelector('input[name="course"]').value,
    faculty: popup.querySelector('input[name="faculty"]').value,
    uni: popup.querySelector('input[name="uni"]').value,
    color: popup.querySelector('input[name="color-bar"]:checked').value,
    evaluations: newEval
  };
}

function saveViewSubject() {
  var newSubject = readSubjectFromPopup(viewSubjectPopup);
  var id = newSubject.id;
  subjectsToAdd[id] = newSubject;
}

function saveNewSubject() {
  return _saveNewSubject.apply(this, arguments);
}

function _saveNewSubject() {
  _saveNewSubject = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var newSubject, id;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            newSubject = readSubjectFromPopup(newSubjectPopup);
            delete newSubject.id;
            _context.next = 4;
            return uploadSubject(newSubject);

          case 4:
            id = _context.sent;
            addSubject(id, newSubject);
            router.navigate("/");

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _saveNewSubject.apply(this, arguments);
}

function deleteSubject(id) {
  removedSubject = subjects[id];
  removedSubjectId = id;
  delete subjects[id];
  saveSubjectsLocalStorage();

  if (!isAnonymous) {
    var obj = {};
    obj['subjects.' + id] = firebase.firestore.FieldValue.delete();
    userDB.update(obj);
  }

  removeCard(getCard(id));
  showToast("Has borrado <b>".concat(removedSubject.shortName, "</b>"), 'Deshacer', 'undoRemoveSubject();');
  if (isEmpty(subjects)) showTutorial();
  congratulate();
}

function undoRemoveSubject() {
  var id = removedSubjectId;
  subjects[id] = removedSubject;
  createSubjectCardCollapsed(id);
  saveSubjectsLocalStorage();

  if (!isAnonymous) {
    var obj = {};
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
provider.setCustomParameters({
  prompt: 'select_account'
});
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
firebase.auth().useDeviceLanguage();
firebase.auth().getRedirectResult().catch(function (error) {
  console.error(error);
});
firebase.auth().onAuthStateChanged(function (user) {
  var bntLogin = document.getElementById('loginButton');

  if (user) {
    // User is signed in.
    displayName = user.displayName;
    photoURL = user.photoURL;
    isAnonymous = user.isAnonymous;
    uid = user.uid;
    console.info("Signed in as ".concat(displayName, " whith ID: ").concat(uid));
    bntLogin.textContent = 'Cerrar sesión';
    bntLogin.classList.add('btn-red');
    bntLogin.classList.remove('btn-green');

    bntLogin.onclick = function () {
      logoutGoogle();
      window.history.back();
    }; //showToast(`Bienvenido de nuevo <b>${displayName}</b> 😊`);


    showLoader('Buscando cambios', 'dashboard');
    userDB = db.collection('users').doc(uid);
    getAndDisplayUserSubjects();
  } else {
    // User is signed out.
    hideLoader('dashboard');
    displayName = 'Anónimo';
    photoURL = 'media/profile-pic.jpg';
    isAnonymous = true;
    uid = 0;
    userDB = null;
    console.info('Signed out');
    bntLogin.textContent = 'Iniciar sesión';
    bntLogin.classList.remove('btn-red');
    bntLogin.classList.add('btn-green');

    bntLogin.onclick = function () {
      loginGoogle();
      window.history.back();
    };

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
} // //for testing
// function createSubjectTesting() {
//   let data = document.getElementById('create-subject-text').value;
//   if (data != undefined || data != '') {
//     console.log('Uploading subject');
//     uploadSubject(JSON.parse(data));
//   }else{
//     console.error('No subject to upload');
//   }
// }


function uploadSubject(subject) {
  // TODO: add sanitise as cloud function
  if (subject != undefined && subject != null && subject != '' && subject != {} && subject != []) {
    return subjectsDB.add(_objectSpread({
      creator: displayName,
      creatorId: uid,
      creationDate: new Date()
    }, subject)).then(function (doc) {
      console.log("Created ".concat(subject.shortName, " with id ").concat(doc.id));
      return doc.id;
    }).catch(function (error) {
      console.error("Error creating subject ", error);
    });
  }
} // EXAMPLE
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
  uploadToUserDB("subjects.".concat(id, ".grades.").concat(exam), mark);
}

function uploadEvaluation(id, evaluation) {
  uploadToUserDB("subjects.".concat(id, ".evaluations"), evaluation);
}

function uploadColor(id, color) {
  uploadToUserDB("subjects.".concat(id, ".color"), color);
}

function uploadVersion(id, version) {
  uploadToUserDB("subjects.".concat(id, ".version"), version);
}

function uploadToUserDB(ref, value) {
  uploadToDB(userDB, ref, value);
}

function uploadToSubjectsDB(id, ref, value) {
  uploadToDB(subjectsDB.doc(id), ref, value);
}

function uploadToDB(db, ref, value) {
  if (!isAnonymous) {
    var obj = {};

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
} // async function getSubjectFromDB(id) {
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
    userDB.get().then(function (doc) {
      if (doc.exists) {
        (function () {
          var userInfo = doc.data();

          var _loop = function _loop(id) {
            subjectsDB.doc(id).get().then(function (doc) {
              if (doc.exists) {
                var subjectInfo = doc.data();
                if (!subjects[id]) subjects[id] = {};
                if (!userInfo.subjects[id]) userInfo.subjects[id] = {};
                subjects[id] = completeSubject(subjectInfo, subjects[id], userInfo.subjects[id], {
                  grades: !subjects[id].grades && !userInfo.subjects[id].grades ? subjectInfo.grades : Object.assign({}, subjects[id].grades, userInfo.subjects[id].grades)
                });
                updateFinalMark(id);
                updateNecesaryMark(id);
                updateCardGrades(id);
                saveSubjectsLocalStorage();
                console.info("Loaded subject: ".concat(subjects[id].shortName, " - ").concat(id));
              } else {
                console.error("Subject ".concat(id, " dosen't exists"));
              }
            }).catch(function (error) {
              console.error("Error getting subject info:", error);
            });
          };

          for (var id in userInfo.subjects) {
            _loop(id);
          }

          console.info("User has ".concat(userInfo.subjects.length, " saved subjects"));
        })();
      } else {
        userDB.set({});
        console.error("User ".concat(uid, " dosen't exists"));
      }

      hideLoader('dashboard');
    }).catch(function (error) {
      console.error("Error getting user info:", error);
      hideLoader('dashboard');
    });
  }
}

function getSubjectsAllDB() {
  return subjectsDB.get();
}

function searchSubjects() {
  var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  query = query.trim();

  if (query) {
    index.search(query).then(function (responses) {
      console.log("Results for ".concat(query, ":"), responses.hits);
      searchResultsSubject.innerHTML = responses.hits.reduce(function (total, elem) {
        return total + generateSearchResultSubject(elem._highlightResult, elem.objectID);
      }, '');
    });
  } else {
    searchResultsSubject.innerHTML = '';
  }
}

function generateSearchResultSubject(match, id) {
  return "<li onclick=\"addToSubjectsToAdd('".concat(id, "', this.querySelector('input[name=\\'id\\']').checked);\" class=\"searchResult\">\n            <label for=\"checkbox-").concat(id, "\">\n              <input style=\"display: none;\" type=\"checkbox\" value=\"").concat(id, "\" name=\"id\" id=\"checkbox-").concat(id, "\" ").concat(subjects[id] || subjectsToAdd[id] ? 'checked' : '', " ").concat(subjects[id] ? 'disabled' : '', ">\n              <div class=\"searchResultCheck\" for=\"checkbox-").concat(id, "\"></div>\n            </label>\n            <label class=\"searchResultTitle\" for=\"checkbox-").concat(id, "\">\n              <span class=\"searchResultRow1\">").concat(match.shortName.value, " - ").concat(match.fullName.value, "</span><br>\n              <span class=\"searchResultRow2\">").concat(match.faculty.value, " ").concat(match.uni.value, " - ").concat(match.course.value, "</span>\n            </label>\n            ").concat(subjects[id] ? '<!-- ' : '', "<div class=\"searchResultAction\" onclick=\"this.parentElement.querySelector('input[name=\\'id\\']').checked = true; showViewSubject('").concat(id, "');\"><img src=\"media/discount.svg\"></div>").concat(subjects[id] ? ' --> ' : '', "\n          </li>");
}
/* ------------------------------ PWA install ------------------------------ */


var deferredPrompt;
window.addEventListener('beforeinstallprompt', function (e) {
  console.log('App can be installed'); // e.preventDefault();

  deferredPrompt = e;
  setTimeout(function () {
    showToast('Usa GradeCalc offline', 'Instalar', 'install();');
  }, 10000);
  return false;
});

function install() {
  if (deferredPrompt !== undefined) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choiceResult) {
      if (choiceResult.outcome == 'dismissed') {// console.log('User cancelled home screen install');
      } else {// console.log('User added to home screen');
        }

      deferredPrompt = null;
    });
  }
}