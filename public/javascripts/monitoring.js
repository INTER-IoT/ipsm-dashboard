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
/*jshint esversion: 6 */
/* globals io, randomColor */
$(function () {
    let socket = io.connect(`http://${location.host}`, {'force new connection': true});
    let monitor = new Map();
    let monitorUI = new Map();
    let state = {
        pause: false,
        active: 0
    };

    $('[data-toggle="tooltip"]').tooltip({
        trigger : 'hover'
    });

    $('.selChan').on('click',function () {
        socket.emit('check-monitoring-status', {
            uuid: $(this).attr('data-uuid'),
            sink: $(this).attr('data-sink')
        });
    });

    $('#refresh').on('click', function () {
        monitorUI.forEach(function (val, key) {
            clearUI(key);
        });
        $('#content').empty().height(40);
    });

    $('#pause').on('click', function () {
        state.pause = true;
        $('#pause').addClass('disabled');
        $('#play').removeClass('disabled');
    });

    $('#play').on('click', function () {
        state.pause = false;
        $('#pause').removeClass('disabled');
        $('#play').addClass('disabled');
    });

    socket.on('monitoring-status', function (data) {
        let isChecked = $(`#${data.uuid}`).prop('checked');
        let isMonitored = data.value;
        if (isChecked && !isMonitored) {
            if ((state.active === 0) && !state.pause) {
                $('#pause').removeClass('disabled');
                $('#refresh').removeClass('disabled');
            }
            state.active += 1;
            socket.emit('monitor-channel', {
                uuid: data.uuid,
                sink: data.sink
            });
        } else if (!isChecked && isMonitored) {
            let key = data.uuid;
            clearUI(key);
            if (state.active === 1) {
                $('#pause').addClass('disabled');
                $('#refresh').addClass('disabled');
                if (state.pause) {
                    $('#play').addClass('disabled');
                    state.pause = false;
                }
            }
            state.active -= 1;
            socket.emit('stop-monitoring', {
                uuid: key
            });
        }
    });

    function showMessage() {
        let key = $(this).attr('data-key');
        let idx = $(this).attr('data-idx');
        let cont = $('#content');
        cont.text(monitor.get(key)[idx]).height(0).height(cont[0].scrollHeight );
    }

    function clearUI(key) {
        $(`#${key}-buff`).empty();
        monitor.delete(key);
        if (monitorUI.has(key)) {
            monitorUI.get(key).forEach(el => el.remove());
            monitorUI.delete(key);
        }
    }

    $(".msgBuf").on('click',  ".msgel", showMessage);

    socket.on('monitoring-result', function (data) {
        if (!state.pause) {
            let key = data.channel;
            let val = data.value;
            if (monitor.has(key)) {
                monitor.get(key).push(val);
                let el = $(`<i class="msgel glyphicon glyphicon-envelope" style="color: ${randomColor()};" data-key="${key}" data-idx="${monitor.get(key).length - 1}" data-toggle="tooltip" title="Click to view the message content" data-placement="top"></i>`);
                monitorUI.get(key).push(el);
            } else {
                monitor.set(key, [val]);
                let el = $(`<i class="msgel glyphicon glyphicon-envelope" style="color: ${randomColor()};" data-key="${key}" data-idx="0" data-toggle="tooltip" title="Click to view the message content" data-placement="top"></i>`);
                monitorUI.set(key, [el]);
            }
            $(`#${key}-buff`).html(monitorUI.get(key));
        }
    });

});
