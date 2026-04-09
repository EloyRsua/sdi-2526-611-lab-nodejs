// 1. IMPORTACIONES DE MÓDULOS
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const crypto = require('crypto');
const expressSession = require('express-session');
const fileUpload = require('express-fileupload');
const { MongoClient } = require("mongodb");

// 2. INICIALIZACIÓN DE LA APP
const app = express();
let jwt = require('jsonwebtoken');
app.set('jwt', jwt);

// 3. CONFIGURACIONES (Settings)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.set('uploadPath', __dirname);
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

// 4. MIDDLEWARES GLOBALES
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(expressSession({
  secret: 'abcdefg',
  resave: true,
  saveUninitialized: true
}));

// Gestión de archivos
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  createParentPath: true
}));

// 5. CONEXIÓN A BASE DE DATOS Y REPOSITORIOS
const connectionStrings = 'mongodb+srv://admin:sdi@musicstorecluster.85bsu7o.mongodb.net/?appName=musicstorecluster';
const dbClient = new MongoClient(connectionStrings);

// Importar Repositorios
const songsRepository = require("./repositories/songsRepository.js");
const favoriteSongsRepository = require("./repositories/favoriteSongsRepository.js");
const usersRepository = require("./repositories/usersRepository.js");
const commentsRepository = require("./repositories/commentsRepository.js");
const purchasesRepository = require("./repositories/purchasesRepository.js");

// Inicializar Repositorios
songsRepository.init(app, dbClient);
favoriteSongsRepository.init(app, dbClient);
usersRepository.init(app, dbClient);
commentsRepository.init(app, dbClient);
purchasesRepository.init(app, dbClient);

// Guardar en app (opcional, para acceder desde req.app.get)
app.set("songsRepository", songsRepository);
app.set("commentsRepository", commentsRepository);
app.set("purchasesRepository", purchasesRepository);

// 6. MIDDLEWARES DE CONTROL DE ACCESO (Router Log)
const userSessionRouter = require('./routes/userSessionRouter');
const userAudiosRouter = require('./routes/userAudiosRouter');

app.use("/songs/add", userSessionRouter);
app.use("/publications", userSessionRouter);
app.use("/audios/", userAudiosRouter);
app.use("/shop/", userSessionRouter);
app.use("/songs/favorites", userSessionRouter);
app.use("/songs/buy", userSessionRouter);

const userTokenRouter = require('./routes/userTokenRouter');
app.use("/api/v1.0/songs/", userTokenRouter);

// 7. RUTAS (Routes)
// API primero (buena práctica)
require("./routes/api/songsAPIv1.0.js")(app, songsRepository,usersRepository);

// Rutas de la web
require("./routes/users.js")(app, usersRepository);
require("./routes/comments.js")(app, commentsRepository);
require("./routes/songs/favorites.js")(app, favoriteSongsRepository);
require("./routes/songs.js")(app, songsRepository);

// Índice
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 8. MANEJO DE ERRORES (Debe ir al final)
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;