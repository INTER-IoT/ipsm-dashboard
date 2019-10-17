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
const logger = require('winston');
const exec = require('child_process').exec;
const kafkacat = process.env.KAFKACAT;
const kafkaBootstrap = process.env.KAFKA_BOOTSTRAP_BROKERS;

const list = (cb) => {
    exec(`${kafkacat} -b ${kafkaBootstrap} -L | grep topic`, (err, stdout) => {
        if (err) {
            cb(err);
        } else {
            let lines = stdout.split("\n");
            let topics = [];
            lines.forEach((l) => {
                let t = l.match(/\s*topic "([^"]+)".*/);
                if (t && t[1] !== "__consumer_offsets") {
                    topics.push(t[1]);
                }
            });
            logger.debug(`Available topics:\n\t${topics.join("\n\t")}\n`);
            cb(null, topics);
        }
    });
};

const create = (topic, cb) => {
    exec(`${kafkacat} -b ${kafkaBootstrap} -L -t ${topic}`, (err) => {
        if (err) {
            cb(err);
        } else {
            logger.info(`Topic "${topic}" available and ready`);
            cb();
        }
    });
};

exports.create = create;
exports.list = list;
