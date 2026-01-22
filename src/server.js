
require('dotenv/config');
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Sentry = require("@sentry/node");

const logger = require('./utils/createLogger');

let connection = `mongodb://${process.env.DB_USUARIO}:${process.env.DB_SENHA}@${process.env.DB_HOST}:27017/${process.env.DB_BANCO}?authSource=admin`;

app.use(bodyParser.json({ limit: '50mb', extended: false }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

app.use(function(req, res, next) {
    const logg = logger.createLogger('file');
    req.logg = logg;

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization");
    next();
});

Sentry.init({
    dsn: "https://52d40ffcafc79bee194bf2088654604c@o4508955890221056.ingest.us.sentry.io/4508956562161664",
  });

console.log('Webhook iniciado, iniciando conexão com banco de dados');

const db = require("./models")
db.mongoose.connect(connection, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })
    .then(() => {
        console.log("Banco OK");
    })
    .catch(err => {
        console.error("Erro conexão com o banco", err);
        process.exit();
    });

// Define Routes
require('./routes/clientes.route')(app);
require('./routes/test.route')(app);

app.get("/", function(req, res) {
    res.json({
    message: 'Webhook'
  }); 

});

app.get("/debug-sentry", function mainHandler(req, res) {
    try {
      foo();
    } catch (e) {
      Sentry.captureException(e);
    }
  });

const PORT = 3006;

app.use(express.static(__dirname + '/app/uploads'));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}.`);
});
