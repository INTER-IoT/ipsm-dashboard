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
const fs = require('fs');
// require('dotenv-safe').load(); // Has to be commented out for Docker!

function envVarsDefined() {
    const envVars = [
        'KAFKA_BOOTSTRAP_BROKERS',
        'ZOOKEEPER',
        'KAFKA_CLIENT_SSL_CERT',
        'KAFKA_CLIENT_SSL_KEY',
        'KAFKA_CLIENT_SSL_PASS',
        'KAFKA_CA_CERT',
        'KAFKACAT',
        'IPSM_API_URL'
    ];
    let i = envVars.length;
    while (i--) {
       if (!process.env[envVars[i]]) {
           return false;
       }
    }
    return true;
}

if (!envVarsDefined()) {
    console.log('\n\tERROR: Dashboard configuration incomplete or missing\n');
    process.exit(1);
}

const app = require('../app');
const http = require('http');
const pd = require('pretty-data').pd;
const logger = require('winston');
const async = require('async');

const port = process.env.PORT || 3000;
app.set('port', port);

const server = http.createServer(app);
const io = require('socket.io')(server);
const kafka = require('no-kafka');
const uuid = require('uuid');
const messages = require('../helpers/messages');
const kafkaTopics = require('../helpers/kafka-topics');

server.listen(port,'0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);

let newConsumer = function (name) {
    let c = new kafka.SimpleConsumer({
        connectionString: process.env.KAFKA_BOOTSTRAP_BROKERS,
        groupId: uuid.v4(),
        ssl: {
            requestCert: true,
            rejectUnauthorized: false,
            key: fs.readFileSync(process.env.KAFKA_CLIENT_SSL_KEY, 'utf8'),
            cert: fs.readFileSync(process.env.KAFKA_CLIENT_SSL_CERT, 'utf8'),
            passphrase: process.env.KAFKA_CLIENT_SSL_PASS,
            // Necessary only if the server uses the self-signed certificate
            ca: [fs.readFileSync(process.env.KAFKA_CA_CERT, 'utf8')]
        }
    });
    c.name = name;
    return c;
};

let newProducer = function (name) {
    let p = new kafka.Producer({
        connectionString: process.env.KAFKA_BOOTSTRAP_BROKERS,
        clientId: uuid.v4(),
        ssl: {
            requestCert: true,
            rejectUnauthorized: false,
            key: fs.readFileSync(process.env.KAFKA_CLIENT_SSL_KEY, 'utf8'),
            cert: fs.readFileSync(process.env.KAFKA_CLIENT_SSL_CERT, 'utf8'),
            passphrase: process.env.KAFKA_CLIENT_SSL_PASS,
            // Necessary ONLY if the server uses a self-signed certificate
            ca: [fs.readFileSync(process.env.KAFKA_CA_CERT, 'utf8')]
        }
    });
    p.name = name;
    return p;
};

io.on('connection', (socket) => {
    logger.info('New Websocket connection');
    let p = newProducer(socket.id);
    p.init().then(() => {
        logger.info(`Kafka producer "${p.name}" ready`);
        socket.kafka = {
            producer: p,
            translator: {
                setup: {}
            },
            monitor: new Map(),
            monLog: new Map()
        };
        // return;
    });

    socket.on('disconnect', () => {
        logger.info('Websockets client disconnected');
        if (socket.kafka && socket.kafka.producer && socket.kafka.producer.name) {
            socket.kafka.producer.end();
            logger.info(`Kafka producer "${socket.kafka.producer.name}" closed`);
        }
        if (socket.kafka && socket.kafka.translator && socket.kafka.translator.consumer) {
            socket.kafka.translator.consumer.end();
            logger.info('Message translator consumer closed');
        }
        let keys = Array.from(socket.kafka.monitor.keys());
        async.each(keys, (key, cb) => {
            socket.kafka.monitor.get(key).consumer.end();
            logger.info(`Kafka consumer for "${key}" closed`);
            cb();
        }, () => {
            logger.info('All channel monitoring consumers closed');
        });
    });

    socket.on('translation-setup', (setup) => {
        if (socket.kafka.translator.setup && socket.kafka.translator.setup.channel === setup.channel) {
            socket.kafka.translator.setup.message = setup.message;
            logger.debug(`Translation setup:\n${JSON.stringify(socket.kafka.translator.setup)}\n`);
            logger.info('Reusing translation setup – only message selection has changed');
            return;
        }
        socket.kafka.translator.setup = setup;
        kafkaTopics.list((err, topics) => {
            if (err) {
                logger.error(err);
            } else {
                async.parallel([
                    (cb) => {
                        if (topics.indexOf(setup.source) < 0) {
                            kafkaTopics.create(setup.source, cb);
                        } else {
                            cb();
                        }
                    },
                    (cb) => {
                        if (topics.indexOf(setup.target) < 0) {
                            kafkaTopics.create(setup.target, cb);
                        } else {
                            cb();
                        }
                    }
                ], () => {
                    logger.debug(`Translation setup:\n${JSON.stringify(socket.kafka.translator.setup)}\n`);
                    if (socket.kafka.translator.consumer) {
                        socket.kafka.translator.consumer.end();
                        logger.info('Message translator consumer closed');
                    }
                    logger.info('Creating new message translator consumer');
                    let c = newConsumer('translator');
                    c.init().then(function () {
                        logger.info(`Message translator consumer ready`);
                    })
                    .then(function () {
                        return c.subscribe(
                            setup.target,
                            0,
                            {
                                groupId: setup.channel,
                                autoCommit: true,
                                autoCommitIntervalMs: 5000,
                                fetchMaxWaitMs: 100,
                                fetchMinBytes: 1,
                                fetchMaxBytes: 1024 * 1024,
                                fromOffset: true,
                                encoding: 'utf8'
                            },
                            function (mSet) {
                                mSet.forEach(function (m) {
                                    logger.debug('Translated message received from channel');
                                    let res = pd.json(m.message.value.toString('utf8'));
                                    socket.emit('translation-result', res);
                                });
                            }
                        );
                    })
                    .then(function () {
                        socket.kafka.translator.consumer = c;
                    });
                    // catch errors?
                });
            }
        });
    });

    socket.on('translate', (m) => {
        logger.debug('Sending message to channel');
        if (m) {
            let msg = JSON.parse(m);
            let payload = [{
                topic: msg.source,
                partition: 0,
                message: {
                    value: JSON.stringify(msg.data)
                }
            }];
            socket.kafka.producer.send(payload)
            .then((result) => {
                logger.debug(`Message successfully sent to channel: ${result}`);
            });
        } else {
            messages.fetch(socket.kafka.translator.setup.message)( (err, data) => {
                let payload = {
                    topic: socket.kafka.translator.setup.source,
                    partition: 0,
                    message: {
                        value: JSON.stringify(data)
                    }
                };
                socket.kafka.producer.send(payload)
                .then((result) => {
                    logger.debug(`Message successfully sent to channel: ${result}`);
                });
            });
        }
    });

    socket.on('check-monitoring-status', (msg) => {
        var key = msg.uuid;
        var sink = msg.sink;
        logger.info(`Checking monitoring status for "${key}"`);
        socket.emit('monitoring-status', {
            uuid: key,
            sink: sink,
            value: socket.kafka.monitor.has(key)
        });
    });

    socket.on('monitor-channel', (msg) => {
        let key = msg.uuid;
        let outTopic = msg.sink;
        kafkaTopics.create(`${outTopic}`, (err) => {
            if (err && !err.message.match(/TopicExistsException/)) {
                logger.error(err);
            } else {
                logger.info(`Setting up monitoring for "${key}"...`);

                if (!socket.kafka.monitor.has(key)) {
                    let consumer = newConsumer(`monitoring-${key}`);
                    consumer.init().then(function () {
                        logger.info(`Monitoring consumer for "${key}" ready`);
                    })
                    .then(function () {
                        return consumer.subscribe(
                            outTopic,
                            0,
                            {
                                groupId: key,
                                autoCommit: true,
                                autoCommitIntervalMs: 5000,
                                fetchMaxWaitMs: 100,
                                fetchMinBytes: 1,
                                fetchMaxBytes: 1024 * 1024,
                                fromOffset: true,
                                encoding: 'utf8'
                            },
                            function (mSet) {
                                mSet.forEach(function (m) {
                                    logger.debug(`Monitoring data for channel ${key}`);
                                    let res = pd.json(m.message.value.toString('utf8'));
                                    socket.emit('monitoring-result', {
                                        channel: key,
                                        value: res
                                    });
                                });
                            }
                        );
                    })
                    .then(function () {
                        socket.kafka.monitor.set(key, {
                            consumer: consumer
                        });
                    })
                    .catch(err => {
                        logger.error(`Kafka monitoring consumer for "${key}" error:`);
                        logger.error(err);
                    });
                }
            }
        });

    });

    socket.on('stop-monitoring', (msg) => {
        let key = msg.uuid;
        if (socket.kafka.monitor.has(key)) {
            logger.info(`Shutting down monitoring for "${key}"`);
            socket.kafka.monitor.get(key).consumer.end();
            logger.info(`Kafka consumer for "${key}" closed`);
            socket.kafka.monitor.delete(key);
            logger.debug(`Stopped monitoring channel "${key}"`);
        }
    });

});

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    logger.info(`Server listening on ${bind}`);
}
