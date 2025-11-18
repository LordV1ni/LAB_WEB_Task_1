const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const basicAuth = require("basic-auth-connect");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const stockMarket = require("./services/StockMarket");

const stocksRouter = require('./routes/stocksRoutes');
const userRouter  = require('./routes/userRoutes');
const accountRouter = require('./routes/accountRoutes');
const newsRouter  = require('./routes/newsRoutes');
const messagesRouter = require("./routes/messagesRoutes");

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));

/**
 * aktiviere einfache Authentifizierung
 */
app.use(basicAuth(function (user, pass) {
    // Authentifizierung OK, wenn daten zu einem Nutzer passen
    for (let i = 0; i < stockMarket.users.length; i++) {
        if (user === stockMarket.users[i].name && pass === stockMarket.users[i].passwd) {
            return true;
        }
    }
    return false;
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public/Vincent-Lars')));

const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Stock Market Simulation",
            version: "0.1.0",
            description:
                "Provides data for a stock market simulation",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Gero Wedemann",
                url: "https:/hochschule-stralsund.de",
                email: "gero.wedemann@hochschule-stralsund.de",
            },
        },
    },
    apis: [`${__dirname}/routes/*.js`],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs) );

app.use('/api/stocks', stocksRouter);
app.use('/api/user', userRouter);
app.use('/api/account', accountRouter);
app.use('/api/news', newsRouter);
app.use('/api/messages', messagesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
