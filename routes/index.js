/*
  Copyright 2016-2019 Universitat Politècnica de València
  Copyright 2016-2019 Università della Calabria
  Copyright 2016-2019 Prodevelop, SL
  Copyright 2016-2019 Technische Universiteit Eindhoven
  Copyright 2016-2019 Fundación de la Comunidad Valenciana para la Investigación, Promoción y Estudios Comerciales de Valenciaport
  Copyright 2016-2019 Rinicom Ltd
  Copyright 2016-2019 Association pour le développement de la formation professionnelle dans le transport
  Copyright 2016-2019 Noatum Ports Valenciana, S.A.U.
  Copyright 2016-2019 XLAB razvoj programske opreme in svetovanje d.o.o.
  Copyright 2016-2019 Systems Research Institute Polish Academy of Sciences
  Copyright 2016-2019 Azienda Sanitaria Locale TO5
  Copyright 2016-2019 Alessandro Bassi Consulting SARL
  Copyright 2016-2019 Neways Technologies B.V.

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
const ipsmRest = require('../helpers/ipsm-rest');
const messages = require('../helpers/messages');
const async = require('async');

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', {
        active: "main"
    });
});

/* GET translation page. */
router.get('/translation', (req, res) => {
    async.parallel([
        (cb) => {
            ipsmRest.getAlignments((alignments) => {
                cb(null, alignments);
            });
        },
        messages.list
    ], (err, results) => {
        if (err) {
            return res.render('error', {
                error: err
            });
        }
        res.render('rest-translation', {
            alignments: results[0],
            messages: results[1],
            ipsmApiUrl: process.env.IPSM_API_URL
        });
    });
});

/* GET monitoring page. */
router.get('/monitoring', (req, res) => {
    ipsmRest.getChannels((channels) => {
        res.render('monitoring', {
            channels: channels
        });
    });
});

/* GET configuration - alignments page. */
router.get('/alignments', (req, res) => {
    ipsmRest.getAlignments((alignments) => {
        res.render('alignments', {
            alignments: alignments,
            ipsmApiUrl: process.env.IPSM_API_URL
        });
    });
});

/* GET configuration - channels page. */
router.get('/channels', (req, res) => {
    async.parallel([
        (cb) => {
            ipsmRest.getAlignments((alignments) => {
                cb(null, alignments);
            });
        },
        (cb) => {
            ipsmRest.getChannels((channels) => {
                cb(null, channels);
            });
        }
    ], (err, result) => {
        if (err) {
            res.render('err');
        } else {
            res.render('channels', {
                alignments: result[0],
                channels: result[1].sort((a,b) => a.id <= b.id),
                ipsmApiUrl: process.env.IPSM_API_URL
            });
        }
    });
});

module.exports = router;
