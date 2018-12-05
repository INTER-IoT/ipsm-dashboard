/*
  Copyright 2016-2018 Universitat Politècnica de València
  Copyright 2016-2018 Università della Calabria
  Copyright 2016-2018 Prodevelop, SL
  Copyright 2016-2018 Technische Universiteit Eindhoven
  Copyright 2016-2018 Fundación de la Comunidad Valenciana para la Investigación, Promoción y Estudios Comerciales de Valenciaport
  Copyright 2016-2018 Rinicom Ltd
  Copyright 2016-2018 Association pour le développement de la formation professionnelle dans le transport
  Copyright 2016-2018 Noatum Ports Valenciana, S.A.U.
  Copyright 2016-2018 XLAB razvoj programske opreme in svetovanje d.o.o.
  Copyright 2016-2018 Systems Research Institute Polish Academy of Sciences
  Copyright 2016-2018 Azienda Sanitaria Locale TO5
  Copyright 2016-2018 Alessandro Bassi Consulting SARL
  Copyright 2016-2018 Neways Technologies B.V.

  See the NOTICE file distributed with this work for additional information
  regarding copyright ownership.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
//jshint node: true, esversion: 6
const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const httpLogger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const messages = require('./routes/messages');
const index = require('./routes/index');

const app = express();
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

const logger = require('winston');
logger.add(logger.transports.File, { filename: 'logs/dashboard.log' });
logger.level = 'info';

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.locals = {
    partials: path.join(__dirname, 'views', 'partials') + path.sep
};


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(httpLogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/messages', messages);
app.use('/', index);

// catch 404 and forward to error handler
app.use( function (req, res, next) {
    if (!req.url.match(/^.*\.map$/)) {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    } else {
        res.end();
    }
});

// error handler:
// in development it will print stacktrace
// in production no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: app.get('env') === 'development' ? err : {}
    });
});

module.exports = app;
