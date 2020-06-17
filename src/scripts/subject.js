class Subject {
  shortName = '';
  fullName  = '';
  faculty   = '';
  uni       = '';
  course    = '';
  color     = this.random(1,8);
  creationDate = {seconds: Math.floor(Date.now()/1000), nanoseconds: 0};
  creatorId = '';
  creator   = '';
  
  evaluations = {};
  // {
  //   Continua: {
  //     exams: {
  //       TP: {type: 'Teoria', weight: 0.175},
  //       TT: {type: 'Teoria', weight: 0.175},
  //       NP: {type: 'Practicas', weight: 0.35},
  //       Pr: {type: 'Trabajo', weight: 0.15},
  //       Tr: {type: 'Trabajo', weight: 0.15}
  //     }
  //   }
  // }
  
  grades    = {}; // {NP: 5}
  finalMark = {}; // {Continua: 1.75}
  necesaryMarks = {}; // { Continua: {TP: 5,TT: 5,NP: 5,Pr: 5,Tr: 5} }
  selectedEvaluation = Object.keys(this.evaluations)[0]; // 'Continua'  

  constructor({
    shortName = '',
    fullName  = '',
    faculty   = '',
    uni       = '',
    course    = '',
    color     = this.random(1,8),
    creationDate = {seconds: Math.floor(Date.now()/1000), nanoseconds: 0},
    creatorId = '',
    creator   = '',
    evaluations = {},
    grades    = {},
    finalMark = {},
    necesaryMarks = {},
    selectedEvaluation,
  }) {
    this.shortName = shortName;
    this.fullName  = fullName;
    this.faculty   = faculty;
    this.uni       = uni;
    this.course    = course;
    this.color     = color;
    this.creationDate = creationDate;
    this.creatorId = creatorId;
    this.creator   = creator;
    this.evaluations = evaluations;
    this.grades    = grades;
    this.finalMark = finalMark;
    this.necesaryMarks = necesaryMarks;
    this.selectedEvaluation = selectedEvaluation ? selectedEvaluation : Object.keys(evaluations)[0];
  }


  setGrade(exam, grade=0) {
    this.grades[exam] = grade;

    this.updateFinalMark();
    this.necesaryMarks();
  }

  get passed() {
    const evaluation = this.selectedEvaluation;
    
    return this.evaluations[evaluation] !== undefined 
      && this.finalMark[evaluation] >= (this.evaluations[evaluation].passMark || 5);
  }
  
  isExamUndone(exam) {
    return this.grades[exam] === undefined;
  }

  updateFinalMark() {
    for (const evaluation in this.evaluations) {
      this.finalMark[evaluation] = 0;
      for (const exam in this.evaluations[evaluation].exams) {
        if (!this.isExamUndone(exam)) this.finalMark[evaluation] += this.grades[exam] * this.evaluations[evaluation].exams[exam].weight;
      }
      this.finalMark[evaluation] = this.round(this.finalMark[evaluation]);
    }
  }

  updateNecesaryMarks() {
    for (const exam in this.necesaryMarks[this.selectedEvaluation]) { 
      this.necesaryMarks[evaluation][exam] = undefined;
    }

    this.gradeCalcAllEqual();
  }
  
  
  gradeCalcAllEqual(evaluation = this.selectedEvaluation) {
    const passMark = this.evaluations[evaluation].passMark || 5;
    let sumUndoneExams = 0;
    let exams = [];
    let currentFinalMark = 0;
    let necesaryMark = passMark;

    for (const exam in this.evaluations[evaluation].exams) {
      if (this.isExamUndone(exam)){
        sumUndoneExams += this.evaluations[evaluation].exams[exam].weight;
        exams.push(exam);
      }else{
        currentFinalMark += this.evaluations[evaluation].exams[exam].weight * this.grades[exam];
      }
    }

    necesaryMark = (passMark - currentFinalMark) / sumUndoneExams;

    for (const exam in this.evaluations[evaluation].exams) {
      if (this.isExamUndone(exam)){
        this.necesaryMarks[evaluation][exam] = Math.max(0, this.round(necesaryMark));
      } else {
        this.necesaryMarks[evaluation][exam] = this.grades[exam];
      }
    }
  }

  //returns n rounded to d decimals (2)
  round(n, d = 2) {
    return (isNaN(n) || n === '' || n == undefined) ? undefined : Math.floor(Math.round(n * (10 ** d))) / (10 ** d);
  }
  
  // returns a random number from min to max
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = Subject;