const express = require('express');
const cors = require('cors');
const multer = require('multer')
const fs = require('fs');
const memeLib = require("./memeGenerator.js");
const upload = multer({ dest: './images/' })

const app = express();
const port = 3005;
let catMemes = [];
let currentMeme = '{}';
let stagedMemeData = '';

const memeGenerator = new memeLib({
    canvasOptions: { // optional
      canvasWidth: 500,
      canvasHeight: 500
    },
    fontOptions: { // optional
      fontSize: 46,
      fontFamily: 'impact',
      lineHeight: 2
    }
  });

app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());
// The images directory that is served as a static server
app.use('/images', express.static('images'));


app.post('/api/upload/', upload.single('memeFile'), (req, res) => {
    console.log(req.file);
    const fileType = (req.file.mimetype === 'image/png') ? '.png' : '.jpg';
    const newFile = './images/' + req.file.filename + fileType;
    fs.rename('./images/' + req.file.filename, newFile, () => {
        currentMeme = req.file;
        fs.writeFileSync('./data/currentMeme.json', JSON.stringify(currentMeme));
        res.sendStatus(200);
    });
});


app.get('/api/memes/', (req, res) => {
    res.send(catMemes);
});


app.get('/api/currentmeme/', (req, res) => {
    res.send(currentMeme);
});


app.post('/api/savecurrent/', (req, res) => {
    if (currentMeme !== '{}') {
        if (stagedMemeData !== '') {
            const fileType = (currentMeme.mimetype === 'image/png') ? '.png' : '.jpg';
            fs.writeFileSync('./images/' + currentMeme.filename + fileType, stagedMemeData, 'base64');
        }
        catMemes.push(currentMeme);
        fs.writeFileSync('./data/catMemes.json', JSON.stringify(catMemes));
        currentMeme = '{}';
        fs.writeFileSync('./data/currentMeme.json', currentMeme);
        stagedMemeData = '';
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.post('/api/creatememe/', (req, res) => {
    console.log('Generating', req.body.filename);
    memeGenerator.generateMeme({
        // you can use either topText or bottomText
        // or both of them at the same time
        topText: req.body.toptext,
        bottomText: req.body.bottomtext,
        url: req.body.filename
      }, (data) => {
        stagedMemeData = data;
        res.send(data);
      });
});


app.delete('/api/deletememe/:id', (req, res) => {
    console.log('Delete', req.params.id);
    const index = catMemes.findIndex((m) => m.findIndex === req.params.id);
    catMemes.splice(index, 1);
    console.log(catMemes);
    fs.writeFileSync('./data/catMemes.json', JSON.stringify(catMemes));
    res.send('Delete Successful!');
});


app.listen(port, () => {
    if (!fs.existsSync('./data/')) {
        fs.mkdirSync('./data');
        console.log('Created data directory');
    }
    const memesFile = './data/catMemes.json';
    if (fs.existsSync(memesFile)) {
        const rawData = fs.readFileSync(memesFile);
        catMemes = JSON.parse(rawData);
    } else {
        // File doesn't exist so create it
        fs.writeFileSync('./data/catMemes.json', JSON.stringify(catMemes));
    }
    console.log('Loaded ' + catMemes.length + '  cat memes!');
    
    const currentFile = './data/currentMeme.json';
    if (fs.existsSync(currentFile)) {
        const rawData = fs.readFileSync('./data/currentMeme.json');
        currentMeme = JSON.parse(rawData);
    } else {
        fs.writeFileSync('./data/currentMeme.json', currentMeme);
    }
    console.log('Loaded currentMeme!', currentMeme);
    console.log('Cat Meme API listening on port ' + port);
});