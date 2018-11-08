/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];
var searchResultContainer = document.getElementById('subjects-search-results');

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
db.settings({timestampsInSnapshots: true}); //remove when timestamps are updated
var userDB = null;
var subjectsDB = db.collection('subjects');

loadData();

//also load firebase (at the bottom)

/* ------------------------------ UI CREATION ------------------------------ */

//Generate the cards with the subjects from cookies
function loadData(){
  showLoader('Cargando tus asignaturas','dashboard');
  subjects = getSubjectsCookies();
  console.info('Subjects loaded from cookies');
  
  for (const id in subjects) {
    createSubjectCardCollapsed(id);
  }
  hideLoader('dashboard');
}

//Creates the subject card and appends it to the dashboard
function createSubjectCardCollapsed(id) {
  var card = document.createElement('div');
  card.id = 'card-' + id;
  card.className = 'subject-card';
  card.onclick = function(event){toggleExpandCard(event, this);};
  card.innerHTML = `<button onclick="deleteSubject('${id}')" class="subject-card-remove"><img src="media/trash.svg" alt="x" aria-label="Delete subject"></button><h2>${subjects[id].shortName}</h2><p style="color: ${subjects[id].finalMark[subjects[id].selectedEvaluation]>=5 ? '#5a9764' : '#b9574c'};">${subjects[id].finalMark[subjects[id].selectedEvaluation]}</p><div class="subject-bar"></div><div class="grades-input hidden" style="height: 0px;"></div>`;

  createBarAndInputs(id,card)

  dashboard.appendChild(card);
  updateAndDisplayMarks(id);
  hideTutorial();
}

function createBarAndInputs(id,card) { 
  let weight = 0;
  for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation]) {
    card.children[4].innerHTML += `<h3>${examType}</h3><span></span><div></div>`;   
    weight = 0;
    for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType]) {      
      if (isUndone(id,exam)) {
        card.children[3].innerHTML += `<div onclick="selectInput('in-${id+exam}')" class="scolN" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}" title="${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}%">${exam}<div id="bar-${id+exam}">${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}</div></div>`;
        card.children[4].lastChild.innerHTML += `<div><span>${exam}:</span><input type="number" id="in-${id+exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="" class="scolN2" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      }else{
        card.children[3].innerHTML += `<div onclick="selectInput('in-${id+exam}')" class="scol${subjects[id].color}" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}" title="${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}%">${exam}<div id="bar-${id+exam}">${subjects[id].grades[exam]}</div></div>`;
        card.children[4].lastChild.innerHTML += `<div><span>${exam}:</span><input type="number" id="in-${id+exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="${subjects[id].grades[exam]}" class="scol${subjects[id].color}" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      }
      weight += subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100;
      
    }
    card.children[4].lastChild.previousSibling.textContent = round(weight, 0) + '%';
  }
  card.children[4].innerHTML += `<div class="eval-select"${Object.keys(subjects[id].evaluation).length <= 1 ? ' style="display: none;"':'' }><span>Evaluación:</span><select onchange="changeEvaluation('${id}',this.value);"></select><img src="media/dislike.svg" style="display: none;" title="Hay otra evaluación mejor"></div>`;
  for (const eval2 in subjects[id].evaluation) {    
    card.children[4].lastChild.children[1].innerHTML += `<option value="${eval2}"${eval2 == subjects[id].selectedEvaluation ? 'selected="selected"':''}>${eval2}</option>`;
  }
}

//Adds the subjects selected in the popup
function addSubjects() {
  showLoader('Cargando tus asignaturas','dashboard');
  let checked = document.querySelectorAll("#add-container input:checked");
  
  for (let i = 0; i < checked.length; i++) {
    let id = checked[i].id.slice(9);

    if (subjects[id] == undefined) {      
      subjectsDB.doc(id).get().then(function(doc) {
        if (doc.exists) {
          let subjectInfo = doc.data();
          subjects[id] = {};
          subjects[id].color = subjectInfo.color;
          subjects[id].evaluation = subjectInfo.evaluation;
          subjects[id].selectedEvaluation = Object.keys(subjectInfo.evaluation)[0];
          subjects[id].fullName = subjectInfo.fullName;
          subjects[id].grades = subjectInfo.grades;
          subjects[id].shortName = subjectInfo.shortName;
          subjects[id].id = id;
          subjects[id].necesaryMark = {};
          subjects[id].finalMark = {};
          subjects[id].version = 1;
  
          updateFinalMark(id);
          updateNecesaryMark(id);

          createSubjectCardCollapsed(id);
          saveSubjectsCookies();
          hideLoader('dashboard');
        } else{
          console.error('Subject dosen\'t exists');
        }
      }).catch(function(error) {
        console.error("Error getting subject info:", error);
      }); 
    } else{
      showToast(`Ya tienes ${id.shortName}`);
    }
  }
  popupHide(document.getElementById('add-container'));
}

/* ------------------------------ UI & DATA UPDATE ------------------------------ */

//Updates, saves and shows the finalMark and necesaryMark
function updateAndDisplayMarks(id) {
  updateFinalMark(id);
  updateNecesaryMark(id);

  displayFinalMark(id);
  displayNecesaryMark(id);
  congratulate();
}

function displayNecesaryMark(id) {
  let card = document.getElementById('card-' + id);
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
  let card = document.getElementById('card-' + id);
  card.children[2].textContent = subjects[id].finalMark[subjects[id].selectedEvaluation];
  card.children[2].style.color = (subjects[id].finalMark[subjects[id].selectedEvaluation]>=5 ? '#5a9764' : '#b9574c');
}

//Saves and updates the value of the necesaryMark to pass
function updateNecesaryMark(id) {
  let mark = gradeCalcAllEqual(id,subjects[id].selectedEvaluation);
  var bestOption = true;
  for (const eval in subjects[id].evaluation) {
    subjects[id].necesaryMark[eval] = Math.max(0, round(gradeCalcAllEqual(id,eval)));
    if (bestOption && eval != subjects[id].selectedEvaluation && subjects[id].necesaryMark[eval] < mark) bestOption = false;
  }
  let card = document.getElementById('card-'+id);
  if (card) {
    if (bestOption) card.children[4].lastChild.children[2].style.display = 'none';
    else card.children[4].lastChild.children[2].style.display = 'flex';
  }

  return subjects[id].necesaryMark[subjects[id].selectedEvaluation];
}

//Saves and updates the value of the finalMark
function updateFinalMark(id) {
  for (const eval in subjects[id].evaluation) {
    subjects[id].finalMark[eval] = 0;
    for (const examType in subjects[id].evaluation[eval]) {
      for (const exam in subjects[id].evaluation[eval][examType]) {    
        if (!isUndone(id, exam))  subjects[id].finalMark[eval] += subjects[id].grades[exam] * subjects[id].evaluation[eval][examType][exam];
      }
    }
    subjects[id].finalMark[eval] = round(subjects[id].finalMark[eval]);
  }
  return subjects[id].finalMark[subjects[id].selectedEvaluation];
}

//Saves the changed mark, updates finalMark and necessaryMark, and shows the info in the UI
function updateMarkFromCardInput(id, exam, mark, input) {
  let barElem = document.getElementById('bar-'+id+exam);

  if (!isNaN(mark) && mark != '') {
    subjects[id].grades[exam] = Number(mark);
    uploadGrade(id,exam,subjects[id].grades[exam]);
    
    barElem.parentElement.className = 'scol' + subjects[id].color;
    barElem.textContent = input.value;
    input.className = 'scol' + subjects[id].color;
  } else{
    delete subjects[id].grades[exam];
    uploadGrade(id,exam,undefined);

    barElem.parentElement.className = 'scolN';
    input.className = 'scolN2';
  }
  updateAndDisplayMarks(id);
  saveSubjectsCookies();
}

function updateCardGrades(id) {
  let card = document.getElementById('card-'+id);
  if (card) {
    for (let div in card.children[3] ) {
      div.className = 'scolN';
    }
    for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation] ) {
      for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType] ) {
        let input = document.getElementById('in-'+id+exam);
        input.className = 'scolN2';
        input.value = '';
      }
    }
    for (const exam in subjects[id].grades) {
      let barElem = document.getElementById('bar-'+id+exam);
      barElem.textContent = subjects[id].grades[exam];
      barElem.parentElement.className = 'scol'+subjects[id].color;
      let input = document.getElementById('in-'+id+exam);
      input.value = subjects[id].grades[exam];
      input.className = 'scol'+subjects[id].color;
    }
    updateAndDisplayMarks(id);
  }else{
    createSubjectCardCollapsed(id);
    updateCardGrades(id);
  }

}

function changeEvaluation(id,eval) {
  subjects[id].selectedEvaluation = eval;
  saveSubjectsCookies();
  let card = document.getElementById('card-'+id);
  card.children[3].innerHTML = '';
  card.children[4].innerHTML = '';
  createBarAndInputs(id,card);
  card.lastChild.style.height = (card.lastChild.classList.contains('hidden') ? 0 : card.lastChild.scrollHeight) +'px';
  updateAndDisplayMarks(id);
}

function showSearchResult(result) {
  searchResultContainer.textContent = '';
  console.log(result);
  
}
/* ------------------------------ MATH ------------------------------ */

//Returns the mark you need to get in the remaining exams to pass
function gradeCalcAllEqual(id,eval) {
  let sumUndoneExams = 0;
  for (const examType in subjects[id].evaluation[eval]) {
    for (const exam in subjects[id].evaluation[eval][examType]) {
      if (isUndone(id, exam)) sumUndoneExams += subjects[id].evaluation[eval][examType][exam];
    }
  }
  
  return (5-subjects[id].finalMark[eval])/sumUndoneExams;
}

//returns n rounded to 2 decimals
function round(n,d = 2) {
  return (n==='' || n == undefined) ? undefined : Math.floor(Math.round(n*Math.pow(10,d)))/Math.pow(10,d);
}

function congratulate() {
  if (hasPassedEverything()) {
    document.getElementById('congratulations-img').style.display = 'block';
  }else{
    document.getElementById('congratulations-img').style.display = 'none';
  }
}

function hasPassedEverything() {
  if (isEmpty(subjects)) return false;
  for (const id in subjects) {
    if (subjects[id].finalMark[subjects[id].selectedEvaluation] < 5) return false;
  }
  return true;
}

/* ------------------------------ UI MANIPULATION ------------------------------ */

//Expands or collapses the card
function toggleExpandCard(event, card) {  
  if (event.target.tagName != 'INPUT' && event.target.tagName != 'SELECT' && event.target.tagName != 'OPTION') {
    if (card.children[3].contains(event.target)) {
      card.lastChild.classList.remove('hidden');
    } else{
      card.lastChild.classList.toggle('hidden');
    }
    card.lastChild.style.height = (card.lastChild.classList.contains('hidden') ? 0 : card.lastChild.scrollHeight) +'px';
  }
}

//Puts the cursor and selects the content of the input
function selectInput(idInput) {
  document.getElementById(idInput).select();
}

/* ------------------------------ POPUP ------------------------------ */

//What to do when page changed
window.addEventListener('popstate', function(event) {
  if (event.state == null) {
    popupHideAll();
    return;
  }

  for (const pageType in event.state) {
    if (pageType == 'popup') {
      switch (event.state.popup) {
        case 'user':
          showUserInfo();
          break;
        case 'add':
          popupShow('add-container',false);
          break;
      }
    }
  }
  
})
//window.history.pushState({popup: 'name'}, 'Page name', 'name');

//Shows the popup
function popupShow(id,isSmall) {
  document.getElementById(id).style.display = 'flex';
  if (!isSmall && window.matchMedia("(max-width: 600px)").matches) {
    currentScreen.style.display = 'none';
    topbar.style.display = 'none';
  }
}

//Hides the popup
function popupHide(popup) {  
  currentScreen.style.display = 'block';
  topbar.style.display = 'flex';
  popup.style.display = 'none';
  popup.style.transform = 'auto';
}

//Hides all popups
function popupHideAll() {  
  popupHide(document.getElementById('user-container'));
  popupHide(document.getElementById('add-container'));
}

/* ------------------------------ USEFUL STUF ------------------------------ */

//Returns if the exam is undone
function isUndone(id, exam) {
  return subjects[id].grades[exam] == undefined
}

function isEmpty(obj) {
  for(let key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

function showToast(message,action,code) {
  toast.style.display = 'none';
  toast.offsetHeight;
  toast.style.display = 'flex';
  toast.firstChild.innerHTML = `<p>${message}</p>`;
  if (action && code) toast.firstChild.innerHTML += `<button onclick="${code}">${action}</button>`;
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 8000);
}

function showLoader(message,position) {
  let loader = document.getElementById(position+'-loader');
  loader.lastElementChild.textContent = message;
  loader.style.display = 'block';
}

function hideLoader(position) {
  document.getElementById(position+'-loader').style.display = 'none';
}

function getSubjectsCookies() {
  return JSON.parse(localStorage.getItem("subjects")) || {};
}

function saveSubjectsCookies() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
  return subjects;
}

/* ------------------------------ USER ------------------------------ */

function showUserInfo() {
  popupShow('user-container',true);
}

/* ------------------------------ EDITOR ------------------------------ */

function editSubjects() {
  
}

function deleteSubject(id) {
  removedSubject = subjects[id]
  delete subjects[id];
  saveSubjectsCookies()
  if(!isAnonymous){
    let obj ={};
    obj['subjects.'+id] = firebase.firestore.FieldValue.delete();
    userDB.update(obj);
  }
  document.getElementById('card-'+id).remove();
  showToast(`Has borrado <b>${removedSubject.shortName}</b>`,'Deshacer','undoRemoveSubject();');

  if (isEmpty(subjects)) showTutorial();
  congratulate();
}

function undoRemoveSubject() {
  let id = removedSubject.id;
  subjects[id] = removedSubject;
  createSubjectCardCollapsed(id);
  saveSubjectsCookies()
  if(!isAnonymous){
  let obj ={};
  obj['subjects.'+id+'.grades'] = subjects[id].grades;
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
provider.setCustomParameters({prompt: 'select_account'});
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

firebase.auth().useDeviceLanguage();

firebase.auth().getRedirectResult().catch(function(error) {console.error(error);});

firebase.auth().onAuthStateChanged(function(user) {
  let bntLogin = document.getElementById('loginButton');
  if (user) { // User is signed in.

    displayName = user.displayName;
    photoURL    = user.photoURL;
    isAnonymous = user.isAnonymous;
    uid         = user.uid;
        
    console.info(`Signed in as ${displayName} whith ID: ${uid}`);

    bntLogin.textContent = 'Cerrar sesión';
    bntLogin.className = 'btn-red';
    bntLogin.onclick = function(){logoutGoogle(); popupHide(this.parentNode.parentNode); window.history.back();};

    //showToast(`Bienvenido de nuevo <b>${displayName}</b> 😊`);

    showLoader('Buscando cambios','dashboard');
    userDB = db.collection('users').doc(uid);

    getAndDisplayUserSubjects();
  } else { // User is signed out.
    hideLoader('dashboard');
    displayName = 'Anónimo';
    photoURL    = 'media/profile-pic.jpg';
    isAnonymous = true;
    uid         = 0;
    userDB      = null;

    console.info('Signed out')
    bntLogin.textContent = 'Iniciar sesión';
    bntLogin.className = 'btn-green';
    bntLogin.onclick = function(){loginGoogle(); popupHide(this.parentNode.parentNode); window.history.back();};
    showToast('No has iniciado sesión', 'Iniciar sesión','loginGoogle();');
  }
  document.getElementById('user-container').children[1].children[0].src = photoURL;
  document.getElementById('profile-topbar').src = isAnonymous ? 'media/user-circle.svg' : photoURL;
  document.getElementById('user-container').children[1].children[1].textContent = displayName;

});

//for testing
function createSubjectTesting() {
  let data = document.getElementById('create-subject-text').value;
  if (data != undefined || data != '') {
    console.log('Uploading subject');
    uploadSubject(JSON.parse(data));
  }else{
    console.error('No subject to upload');
  }
}

function uploadSubject(obj) { //not tested
  if (obj != undefined) {
    subjectDB = db.collection('subjects');
    subjectDB.add(obj)
    .then(function(docRef) {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
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

function loginGoogle() {
  showLoader('Redireccionando','login');
  firebase.auth().signInWithRedirect(provider);
  hideLoader('login');
}

function logoutGoogle() {
  firebase.auth().signOut();
}

function uploadGrade(id,exam,mark) {
  if (!isAnonymous) {
    let obj = {};
    if (mark != undefined) {
      obj['subjects.'+id+'.grades.'+exam] = mark;
      userDB.update(obj);
    }else{
      obj['subjects.'+id+'.grades.'+exam] = firebase.firestore.FieldValue.delete();
      userDB.update(obj);
    }
  }
}

function getAndDisplayUserSubjects() {
  if (isAnonymous) {
    console.info('To get user info you need to sign in');
    showToast('No has iniciado sesión', 'Iniciar sesión','loginGoogle();');
    hideLoader('dashboard');
  }else{
    userDB.get().then(function(doc) {
      if (doc.exists) {
        userInfo = doc.data();
        showLoader('Descargando asignaturas','dashboard');
        let count = 0;
        for (const id in userInfo.subjects) {
          subjectsDB.doc(id).get().then(function(doc) {
            if (doc.exists) {
              let subjectInfo = doc.data();
              if (subjects[id] == undefined){
                subjects[id] = {};
              }
              subjects[id].evaluation = subjectInfo.evaluation;
              subjects[id].selectedEvaluation = Object.keys(subjectInfo.evaluation)[0];
              subjects[id].fullName = subjectInfo.fullName;
              
              if (subjects[id] == undefined){
                subjects[id].grades = subjectInfo.grades;
              }else{
                subjects[id].grades = Object.assign({}, subjects[id].grades, userInfo.subjects[id].grades);
              }
              if (userInfo.subjects[id].color) {
                subjects[id].color = userInfo.subjects[id].color;
              }else{
                subjects[id].color = subjectInfo.color;
              }              
              subjects[id].shortName = subjectInfo.shortName;
              subjects[id].id = id;
              subjects[id].necesaryMark = {};
              subjects[id].finalMark = {};
              subjects[id].version = 1;
      
              updateFinalMark(id);
              updateNecesaryMark(id);
      
              updateCardGrades(id);
              saveSubjectsCookies()    
             
              console.info(`Loaded subject: ${subjects[id].shortName} - ${id}`);
            } else{
              console.error(`Subject ${id} dosen\'t exists`);
            }
          }).catch(function(error) {
            console.error("Error getting subject info:", error);
          });
          count++;
        }
        console.info(`User has ${count} saved subjects`);
      } else{
        userDB.set({});
        console.error(`User ${uid} dosen\'t exists`);
      }
      hideLoader('dashboard');
    }).catch(function(error) {
      console.error("Error getting user info:", error);
      hideLoader('dashboard');
    });
  }
}

function searchAll() {
  db.collection("subjects").get().then((doc) => {
      showSearchResult(doc);
    }
  )

}

function searchSubject(query) { //TODO-------------------------------
  db.collection("subjects").get()
}