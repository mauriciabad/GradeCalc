/* ------------------------------ START UP ------------------------------ */
var dashboard = document.getElementById('dashboard');
var topbar = document.getElementById('top-bar');
var currentScreen = document.getElementsByClassName('screen')[0];

var userInfo;
var subjects = {};
const allSubjects = {};
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

//Hardcoded subject templates, will be replaced
allSubjects.a1={id:"a1",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"AC",fullName:"Arquitectura de Computadors",evaluation:{"Continua":{Teoria:{C1:.15,C2:.25,C3:.4},Laboratorio:{L:.2}}},color:4,uni:"UPC",faculty:"FIB"},
allSubjects.a2={id:"a2",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"IES",fullName:"Introducció a l'Enginyeria del Software",evaluation:{"Continua":{Teoria:{FHC1:.25,FHC2:.15,FHC3:.25},Lab:{C1:.1,C2:.15,P:.1}}},color:3,uni:"UPC",faculty:"FIB"},
allSubjects.a3={id:"a3",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{"E":0},shortName:"IDI",fullName:"Interacció i Disseny d'Interfícies",evaluation:{"Continua":{Teoria:{T1:.25,T2:.5},Lab:{L:.25},Extra:{E:.025}}},color:2,uni:"UPC",faculty:"FIB"},
allSubjects.a4={id:"a4",finalMark:{'Continua':0,'Final':0},necesaryMark:{'Continua':0,'Final':0},version:1,selectedEvaluation:'Continua',grades:{"E":0},shortName:"XC",fullName:"Xarxes de Computadors",evaluation:{"Continua":{Teoria:{T1:.3,T2:.3,T3:.15},Lab:{L:.0625,ExL:.1875},Extra:{E:.1}},"Final":{Teoria:{F:.75},Lab:{L:.0625,ExL:.1875},Extra:{E:.1}}},color:5,uni:"UPC",faculty:"FIB"};
allSubjects.a5={id:"a5",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"BD",fullName:"Bases de dades",evaluation:{"Continua":{Teoria:{F:.6},Lab:{L1:.1,L2:.075,L3:.075},Prob:{Pr:.15}}},color:1,uni:"UPC",faculty:"FIB"},
allSubjects.a6={id:"a6",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"CI",fullName:"Interfícies de Computadors",evaluation:{"Continua":{Teoria:{T1:.23333,T2:.23333,T3:.23333},Lab:{L:.3}}},color:3,uni:"UPC",faculty:"FIB"},
allSubjects.a7={id:"a7",finalMark:{'Continua':0,'Final':0},necesaryMark:{'Continua':0,'Final':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"EDA",fullName:"Estructures de Dades i Algorismes",evaluation:{"Continua":{Examens:{P1:.3,PC:.3,F:.3},Joc:{Joc:.2}},"Final":{Examens:{PC:.3,F:.6},Joc:{Joc:.2}}},color:2,uni:"UPC",faculty:"FIB"},
allSubjects.a8={id:"a8",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"PE",fullName:"Probabilitat i Estadística",evaluation:{"Continua":{"Examen 1":{B1:.11764705882,B2:.1294117647,B3:.14117647058},"Examen 2":{B4:.15294117647,B5:.16470588235,B6:.17647058823},Treball:{B7:.11764705882}}},color:7,uni:"UPC",faculty:"FIB"},
allSubjects.a9={id:"a9",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{},shortName:"SO",fullName:"Sistemes Operatius",evaluation:{"Continua":{Teoria:{T1:.2,T2:.3},Lab:{L1:.225,L2:.225,Test:.05}}},color:4,uni:"UPC",faculty:"FIB"};
allSubjects.a10={id:"a10",shortName:"EEE",fullName:"Empresa i Entorn Econòmic",evaluation:{"Continua":{Macro:{PEC1:.15,PEC2:.15,PEC3:.15},Micro:{PEC4:.15,PEC5:.15,PEC6:.15},"Participación":{P:.1}}},color:8,uni:"UPC",faculty:"FIB",finalMark:{'Continua':0},necesaryMark:{'Continua':0},version:1,selectedEvaluation:'Continua',grades:{}};

loadData();



function updateCookiesStructure(id) {
  if (subjects[id].version == undefined || subjects[id].version < 1) { //to update grades from old format
    subjects[id].grades = reformatGrades(subjects[id].grades);
    let aux = subjects[id].evaluation; delete subjects[id].evaluation; subjects[id].evaluation ={"Continua": aux};
    let aux2 = subjects[id].name; delete subjects[id].name; subjects[id].shortName = aux2;
    subjects[id].selectedEvaluation = 'Continua';
    subjects[id].finalMark = {'Continua':0};
    subjects[id].necesaryMark = {'Continua':0};
    subjects[id].version = 1;
  }
  if (id=='a1'||id=='a2'||id=='a3'||id=='a4'||id=='a5'||id=='a6'||id=='a7'||id=='a8'||id=='a9'||id=='a10') {
    let newSubjectId = {
      "a1": "EfFfxjAZUyF8BjRTRXXm",
      "a2": "Bfs5XE0A5WdzfnqL8x3r",
      "a3": "g4BNzlqHUlMpRA5sRJfg",
      "a4": "Fj08okgYD1tZk3GNZsSl",
      "a5": "fDTb37Ui07sGNUkTVvDu",
      "a6": "KDTapdFduaPFxUMlUGRJ",
      "a7": "14O7zocpbCBa943DZEeQ",
      "a8": "3ES9n8Qhtoe3mAdYnWMO",
      "a9": "AdK85VBBzMm99sCXmBWK",
      "a10": "zZ7fHtVnUeYMYEoMNuv1"
    };
    subjects[newSubjectId[id]] = subjects[id];  
    delete subjects[id];
    Cookies.remove(id);
    id = newSubjectId[id];
    subjects[id].id = id;
    Cookies.set(id, subjects[id], { expires: 365 });
  }
}




/* ------------------------------ UI CREATION ------------------------------ */

//Generate the cards with the subjects from cookies
function loadData(){
  subjects = Cookies.getJSON();
  console.log('Subjects loaded from cookies');
  
  for (const id in subjects) {
    updateCookiesStructure(id);
    createSubjectCardCollapsed(id);
  }
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
  for (const examType in subjects[id].evaluation[subjects[id].selectedEvaluation]) {
    card.children[4].innerHTML += `<h3>${examType}</h3><div></div>`;   
    
    for (const exam in subjects[id].evaluation[subjects[id].selectedEvaluation][examType]) {      
      if (isUndone(id,exam)) {
        card.children[3].innerHTML += `<div onclick="selectInput('in-${id+exam}')" class="scolN" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}">${exam}<div id="bar-${id+exam}">${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}</div></div>`;
        card.children[4].lastChild.innerHTML += `<div><span>${exam}:</span><input type="number" id="in-${id+exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="" class="scolN2" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      }else{
        card.children[3].innerHTML += `<div onclick="selectInput('in-${id+exam}')" class="scol${subjects[id].color}" style="flex-grow: ${subjects[id].evaluation[subjects[id].selectedEvaluation][examType][exam]*100}">${exam}<div id="bar-${id+exam}">${subjects[id].grades[exam]}</div></div>`;
        card.children[4].lastChild.innerHTML += `<div><span>${exam}:</span><input type="number" id="in-${id+exam}" placeholder="${subjects[id].necesaryMark[subjects[id].selectedEvaluation]}" value="${subjects[id].grades[exam]}" class="scol${subjects[id].color}" oninput="updateMarkFromCardInput('${id}', '${exam}', this.value, this);" autocomplete="off" step="0.01" min="0" max="10"></div>`;
      }
    }
  }
  card.children[4].innerHTML += `<div class="eval-select"${Object.keys(subjects[id].evaluation).length <= 1 ? ' style="display: none;"':'' }><span>Evaluación:</span><select onchange="changeEvaluation('${id}',this.value);"></select><img src="media/dislike.svg" style="display: none;" title="Hay otra evaluación mejor"></div>`;
  for (const eval2 in subjects[id].evaluation) {    
    card.children[4].lastChild.children[1].innerHTML += `<option value="${eval2}"${eval2 == subjects[id].selectedEvaluation ? 'selected="selected"':''}>${eval2}</option>`;
  }
}

//Adds the subjects selected in the popup
function addSubjects() {
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
          Cookies.set(id, subjects[id], { expires: 365 });
        } else{
          console.log('Subject dosen\'t exists');
        }
      }).catch(function(error) {
        console.log("Error getting subject info:", error);
      }); 
    } else{
      toast(`Ya tienes ${id.shortName}`);
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

    updateAndDisplayMarks(id);
  } else{
    delete subjects[id].grades[exam];
    uploadGrade(id,exam,undefined);

    barElem.parentElement.className = 'scolN';
    input.className = 'scolN2';

    updateAndDisplayMarks(id);
  }
  
  Cookies.set(id, subjects[id], { expires: 365 });
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

function changeEvaluation(id,eval) { //TODO  
  subjects[id].selectedEvaluation = eval;
  Cookies.set(id, subjects[id], { expires: 365 });
  let card = document.getElementById('card-'+id);
  card.children[3].innerHTML = '';
  card.children[4].innerHTML = '';
  createBarAndInputs(id,card);
  card.lastChild.style.height = (card.lastChild.classList.contains('hidden') ? 0 : card.lastChild.scrollHeight) +'px';
  updateAndDisplayMarks(id);
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
function round(n) {
  return (n==='' || n == undefined) ? undefined : Math.floor(Math.round(n*100))/100;
}

/* ------------------------------ UI MANIPULATION ------------------------------ */

//Expansd or collapes the card
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
  currentScreen.style.display = 'flex';
  topbar.style.display = 'flex';
  popup.style.display = 'none';
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
  Cookies.remove(id);
  if(!isAnonymous){
    let obj ={};
    obj['subjects.'+id] = firebase.firestore.FieldValue.delete();
    userDB.update(obj);
  }
  document.getElementById('card-'+id).remove();
  showToast(`Has borrado <b>${removedSubject.shortName}</b>`,'Deshacer','undoRemoveSubject();');

  if (isEmpty(subjects)) showTutorial();
}

function undoRemoveSubject() {
  let id = removedSubject.id;
  subjects[id] = removedSubject;
  createSubjectCardCollapsed(id);
  Cookies.set(id, subjects[id], { expires: 365 });
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

function loginGoogle() {
  firebase.auth().signInWithRedirect(provider);
}

function logoutGoogle() {
  firebase.auth().signOut();
}

firebase.auth().getRedirectResult().catch(function(error) {console.log(error);});

firebase.auth().onAuthStateChanged(function(user) {
  let bntLogin = document.getElementById('loginButton');
  if (user) { // User is signed in.

    displayName = user.displayName;
    photoURL = user.photoURL;
    isAnonymous = user.isAnonymous;
    uid = user.uid;
        
    console.log(`Signed in as ${displayName} whith ID: ${uid}`);

    bntLogin.textContent = 'Cerrar sesión';
    bntLogin.className = 'btn-red';
    bntLogin.onclick = function(){logoutGoogle(); popupHide(this.parentNode.parentNode); window.history.back();};

    //showToast(`Bienvenido de nuevo <b>${displayName}</b> 😊`);

    userDB = db.collection('users').doc(uid);

    getAndDisplayUserSubjects();


  } else { // User is signed out.
    displayName = 'Anónimo';
    photoURL = 'media/profile-pic.jpg';
    isAnonymous = true;
    uid = 0;
    userDB = null;

    console.log('Signed out')
    bntLogin.textContent = 'Iniciar sesión';
    bntLogin.className = 'btn-green';
    bntLogin.onclick = function(){loginGoogle(); popupHide(this.parentNode.parentNode); window.history.back();};
    showToast('No has iniciado sesión', 'Iniciar sesión','loginGoogle();');
  }
  document.getElementById('user-container').children[1].children[0].src = photoURL;
  document.getElementById('profile-topbar').src = isAnonymous ? 'media/user-circle.svg' : photoURL;
  document.getElementById('user-container').children[1].children[1].textContent = displayName;

});

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
    console.log('To get user info you need to sign in');
    showToast('No has iniciado sesión', 'Iniciar sesión','loginGoogle();');
  }else{
    userDB.get().then(function(doc) {
      if (doc.exists) {
        userInfo = doc.data();
        for (const id in userInfo.subjects) {
          subjectsDB.doc(id).get().then(function(doc) {
            if (doc.exists) {
              let subjectInfo = doc.data();
              if (subjects[id] == undefined){
                subjects[id] = {};
                subjects[id].evaluation = subjectInfo.evaluation;
                subjects[id].selectedEvaluation = Object.keys(subjectInfo.evaluation)[0];
                subjects[id].fullName = subjectInfo.fullName;

                subjects[id].grades = Object.assign({}, subjectInfo.grades, subjects[id].grades, userInfo.subjects[id].grades);
                if (userInfo.subjects[id].color) {
                  subjects[id].color = userInfo.subjects[id].color;
                }else{
                  subjects[id].color = subjectInfo.color;
                }
                console.log(subjects[id].grades);
                
                subjects[id].shortName = subjectInfo.shortName;
                subjects[id].id = id;
                subjects[id].necesaryMark = {};
                subjects[id].finalMark = {};
                subjects[id].version = 1;
        
                updateFinalMark(id);
                updateNecesaryMark(id);
        
                updateCardGrades(id);
                Cookies.set(id, subjects[id], { expires: 365 });
              }
            } else{
              console.log('Subject dosen\'t exists');
            }
          }).catch(function(error) {
            console.log("Error getting subject info:", error);
          });
        }
      } else{
        userDB.set({});
        console.log('User dosen\'t exists');
      }
    }).catch(function(error) {
      console.log("Error getting user info:", error);
    });
  }
}

function test() { 
  getAndDisplayUserSubjects();
}


//this adds a subject to a user
function setSubject() {
  console.log('Testing');

  var docData = {
    subjects: {
      'Fj08okgYD1tZk3GNZsSl': {
        color: 5,
        grades: {}
      }
    },
    uni: 'UPC',
    faculty: 'FIB'
  };
  for (const exam in subjects['a4'].grades) {
    docData.subjects['Fj08okgYD1tZk3GNZsSl'].grades[exam] = Number(subjects['a4'].grades[exam]);
  }
  
  
  var setWithMerge = userDB.update(docData);
  console.log(setWithMerge);
}

function reformatGrades(grades) {
  let newGrades={};
  for (const examType in grades) {
    for (const exam in grades[examType]) {
      newGrades[exam] = Number(grades[examType][exam]);
    }
  }
  return newGrades;
}
