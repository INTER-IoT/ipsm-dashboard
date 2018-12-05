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
/*jshint node: true, esversion: 6 */
const express = require('express');
const router = express.Router();
const logger = require('winston');
const messages = require('../helpers/messages');
const pd = require('pretty-data').pd;

router.get('/:fname/:raw?', (req, res) => {
    let fname = req.params.fname;
    messages.fetch(fname)((err, data) => {
        if (!err) {
            if (req.params.raw) {
                res.json(data);
            } else {
                res.json(pd.json(data));
            }
        } else {
            logger.error(err);
            res.status(404);
            res.end();
        }
    });
});

router.get('/', (req, res) => {
    messages.list((err, data) => {
        if (!err) {
            res.json(data);
        } else {
            logger.error(err);
            res.status(500);
            res.end();
        }
    });
});

module.exports = router;
