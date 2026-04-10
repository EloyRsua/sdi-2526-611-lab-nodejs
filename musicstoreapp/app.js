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
const jwt = require('jsonwebtoken');
const rest = require('request');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
let { Song } = require('./schemas/song.schema');
let { SongRequest } = require('./schemas/songRequest.schema');

// 2. INICIALIZACIÓN DE LA APP
const app = express();

// 3. CONFIGURACIÓN DE SWAGGER (Documentación)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de la tienda de música de SDI',
      version: '1.0.0',
      description: 'Documentación interactiva de la API',
    },components: {
      schemas: {
        Song,
        SongRequest

      }
    },
    servers: [
      {
        url: 'http://localhost: :8081',
        description: 'Servidor de pruebas de la aplicación',
      },
    ],
  },
  apis: ['./routes/api/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// 4. SETTINGS (Configuraciones de App)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.set('uploadPath', __dirname);
app.set('clave', 'abcdefg');
app.set('crypto', crypto);
app.set('jwt', jwt);
app.set('rest', rest);

// 5. MIDDLEWARES GLOBALES Y SEGURIDAD
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
  next();
});

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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 6. CONEXIÓN A BASE DE DATOS Y REPOSITORIOS
const connectionStrings = 'mongodb+srv://admin:sdi@musicstorecluster.85bsu7o.mongodb.net/?appName=musicstorecluster';
const dbClient = new MongoClient(connectionStrings);

// Importar Repositorios
const songsRepository = require("./repositories/songsRepository.js");
const favoriteSongsRepository = require("./repositories/favoriteSongsRepository.js");
const usersRepository = require("./repositories/usersRepository.js");
const commentsRepository = require("./repositories/commentsRepository.js");
const purchasesRepository = require("./repositories/purchasesRepository.js");

// Inicializar e Inyectar en App
songsRepository.init(app, dbClient);
favoriteSongsRepository.init(app, dbClient);
usersRepository.init(app, dbClient);
commentsRepository.init(app, dbClient);
purchasesRepository.init(app, dbClient);

app.set("songsRepository", songsRepository);
app.set("commentsRepository", commentsRepository);
app.set("purchasesRepository", purchasesRepository);
app.set("usersRepository", usersRepository);
app.set("favoriteSongsRepository", favoriteSongsRepository);

// 7. MIDDLEWARES DE CONTROL DE ACCESO (Routers de control)
const userSessionRouter = require('./routes/userSessionRouter');
const userAudiosRouter = require('./routes/userAudiosRouter');
const userTokenRouter = require('./routes/userTokenRouter');

// Aplicar filtros a rutas específicas
app.use("/songs/add", userSessionRouter);
app.use("/publications", userSessionRouter);
app.use("/audios/", userAudiosRouter);
app.use("/shop/", userSessionRouter);
app.use("/songs/favorites", userSessionRouter);
app.use("/songs/buy", userSessionRouter);
app.use("/api/v1.0/songs/", userTokenRouter);

// 8. RUTAS (Routes)
// API (Rutas de servicios)
require("./routes/api/songsAPIv1.0.js")(app, songsRepository, usersRepository);

// Vistas (Rutas de la web)
require("./routes/users.js")(app, usersRepository);
require("./routes/comments.js")(app, commentsRepository);
require("./routes/songs/favorites.js")(app, favoriteSongsRepository);
require("./routes/songs.js")(app, songsRepository);

// Índice
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 9. MANEJO DE ERRORES
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