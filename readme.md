[![Netlify Status](https://api.netlify.com/api/v1/badges/3e698f7a-6ceb-49e5-a3bf-142c72746188/deploy-status)](https://app.netlify.com/sites/gradecalc/deploys) [![Build Status](https://travis-ci.com/mauriciabad/GradeCalc.svg?branch=master)](https://travis-ci.com/mauriciabad/GradeCalc) [![Maintainability](https://api.codeclimate.com/v1/badges/f3f3cbb1736c40546d06/maintainability)](https://codeclimate.com/github/mauriciabad/GradeCalc/maintainability)

# GradeCalc

[GradeCalc](https://gradecalc.mauri.app) is a progressive web app for students, its main purpose is to calculate the necessary mark in the remaining exams to pass a subject.

You can create your own subject and share it, or if someone created it before, you can use theirs.

Also, it allows you to login with Google and store your subjects in the cloud, so you can access them from your mobile and pc.

Use it here: [gradecalc.mauri.app](https://gradecalc.mauri.app)

## Features

- Calculate the mark you need to pass.
- Find your subjects in a database.
- Create your own subject template and share it.
- Add, modify and delete subjects.
- Save your marks in your account and device.
- Google+ login.
- Works offline.
- Add to homescreen.
- Solves complex evaluation formulas.

## Development

### Setup

Use this command to install all dependencies.

```bash
npm i
```

### Develop

First, install dependencies and build the app:

```bash
npm i
npm run dist
```

Use this command to compile the JS and CSS when you save the files.

```bash
npm run dev
```

Finally, serve the `dist` folder to view the changes.

### Build

Use this command to compile all the files to the `dist/` directory.

```bash
npm run dist
```

### Deploy

_100% automated_ with Netlify, just push to master.

### Gulp commands

You can use `gulp js`, `gulp css`, `gulp libs` or `gulp watch`.
