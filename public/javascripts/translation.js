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
/* globals io */
$(function () {
    let socket = io.connect(`http://${location.host}`, {'force new connection': true});
    let msgNo = 0;
    let sampleMessage = '';
    let channelSelect = $('#channelSelect');
    let jsonldData = $('#jsonld-data');
    let sendToIpsm = $('#sendToIpsm');
    let messages = $('#messages');
    function setUiState() {
        let channelSel = channelSelect.find(":selected").val().trim();
        let channelSrc = channelSelect.find(":selected").attr('data-source').trim();
        let channelTrg = channelSelect.find(":selected").attr('data-target').trim();
        let messageSel = messages.val().trim();
        if (channelSel !== "none" && messageSel !== "none") {
            sendToIpsm.prop('disabled', false);
            socket.emit('translation-setup', {
              "channel": channelSel,
              "message": messageSel,
              "source": channelSrc,
              "target": channelTrg
            });
        } else {
            sendToIpsm.prop('disabled', true);
        }
    }

    jsonldData.on('input propertychange', function() {
        sampleMessage = $(this).val().trim();
    });

    messages.val("none");
    $('#channelSelect option[value="none"]').prop('selected', true);

    messages.on('change', function () {
        let data= $(this).val().trim();
        sampleMessage = '';
        jsonldData.val('');
        if (data !== "none") {
            $('#jsonld-data').val('');
            // noinspection JSIgnoredPromiseFromCall
            $.ajax({
                type: 'GET',
                url: "http://" + location.host + "/messages/" + data,
                dataType: 'json',
                success: function (msg) {
                    $('#jsonld-data').val(msg);
                },
                error: function (jqXHR, textStatus) {
                    console.log("ERROR");
                    console.log(textStatus);
                    console.dir(jqXHR);
                    console.dir(jqXHR.getAllResponseHeaders());
                }
            });
        }
        setUiState();
    });

    channelSelect.on('change', function () {
        setUiState();
        msgNo = 0;
        $('#jsonld-result').html("");
        $('#msgNo').html("");
    });


    sendToIpsm.on('click', function () {
        $('#sendToIpsm').prop('disabled', true);
        if (sampleMessage) {
            let source = $('#channelSelect').find(":selected").attr('data-source').trim();
            let data = JSON.parse(sampleMessage);
            socket.emit('translate', JSON.stringify({
                source: source,
                data: data
            }));
        } else {
            socket.emit('translate');
        }
    });

    socket.on('translation-result', function (data) {
        let res = $('#jsonld-result');
        let resBgColor = res.parent().css('backgroundColor');
        let hexColor = hexc(resBgColor.toString());
        res.html(data).parent().css('background-color',(hexColor === '#f5f5f5' ? '#ddd' : '#f5f5f5'));
        $('#sendToIpsm').prop('disabled', false);
        msgNo += 1;
        $('#msgNo').html(`(<b>${msgNo}</b>)`);
    });

    function hexc(colorval) {
        let parts = colorval.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!parts) {
            parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        }
        delete(parts[0]);
        for (let i = 1; i <= 3; ++i) {
            parts[i] = parseInt(parts[i]).toString(16);
            if (parts[i].length === 1) {
                parts[i] = '0' + parts[i];
            }
        }
        return '#' + parts.join('');
    }
});
