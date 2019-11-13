# GradeCalc

[GradeCalc](https://gradecalc.net) is a progressive web app for students, it's main porpouse is calculating the necessary mark in the remaining exams to pass a subject.

You can create your own subject and share it, or if someone created it before, you can use theirs.

Also, it allows you to login with Google and store your subjects in the cloud, so you can acces them from yout mobile and pc.

Use it here: [gradecalc.net](https://gradecalc.net)

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

Use this command to insatll all dependencies.

```bash
npm i
```

### Develop

Use this command to compile the js and css when you save the files.

```bash
gulp watch
```

### Build

Use this command to compile all the files to the `dist/` directory.

```bash
npm run dist
```

### Deploy

_100% automated_ with Netlify, just push to master.

### Gulp commands

You can use `gulp js`, `gulp css`, `gulp libs` or `gulp watch`.
