var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
console.log(">>> 1. Cargando módulos...");
let app = express();

let expressSession = require('express-session');
app.use(expressSession({
  secret: 'abcdefg',
  resave: true,
  saveUninitialized: true
}));

const userSessionRouter = require('./routes/userSessionRouter');
const userAudiosRouter = require('./routes/userAudiosRouter');
app.use("/songs/add",userSessionRouter);
app.use("/publications",userSessionRouter);
//app.use("/audios/",userSessionRouter);
app.use("/audios/",userAudiosRouter);
app.use("/shop/",userSessionRouter);
app.use("/songs/favorites",userSessionRouter);
app.use("/songs/buy",userSessionRouter);
app.use("/purchases",userSessionRouter);

let crypto = require('crypto');

// Subida de archivos (fileupload)
let fileUpload = require('express-fileupload');
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  createParentPath: true
}));
app.set('uploadPath', __dirname);
app.set('clave','abcdefg');
app.set('crypto',crypto);

// Middlewares básicos y Body-parser integrados
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// Conexion a MongoDB
console.log(">>> 2. Conectando a MongoDB...");
const { MongoClient } = require("mongodb");
const connectionStrings = 'mongodb+srv://admin:sdi@musicstorecluster.85bsu7o.mongodb.net/?appName=musicstorecluster';
const dbClient = new MongoClient(connectionStrings);

//Repositorios
console.log(">>> 3. Inicializando repositorios...");
let songsRepository = require("./repositories/songsRepository.js");
songsRepository.init(app, dbClient);
app.set("songsRepository", songsRepository);

let favoriteSongsRepository = require("./repositories/favoriteSongsRepository.js");
favoriteSongsRepository.init(app, dbClient);

const usersRepository = require("./repositories/usersRepository.js");
usersRepository.init(app, dbClient);
require("./routes/users.js")(app, usersRepository);
let indexRouter = require('./routes/index');
//let usersRouter = require('./routes/users');

let commentsRepository = require("./repositories/commentsRepository.js");
commentsRepository.init(app, dbClient);
app.set("commentsRepository", commentsRepository);

require("./routes/comments.js")(app, commentsRepository);


// 1. Primero las de favoritos (antes que songs.js, por el orden de procesamiento de rutas)
require("./routes/songs/favorites.js")(app, favoriteSongsRepository);

// 2. Luego las de canciones
require("./routes/songs.js")(app, songsRepository);

// 3. Luego las genéricas
app.use('/', indexRouter);
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;