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
/* globals CONFIG */
$(function () {
    const ipsmApiUrl = CONFIG.get('ipsmApiUrl') + 'translation';
    let sampleMessage = '';
    let removeElem = function () {
        $(this).remove();
    };
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    const escapeHtml = (string) => {
      return String(string).replace(/[&<>"'`=\/]/g, (s) => {
        return entityMap[s];
      });
    };

    $('#addStep').on('click', function () {
        let selectAlignment = $('#selectAlignment');
        if (selectAlignment.find(":selected").val() !== 'none') {
            let alName = selectAlignment.find(":selected").attr('data-name').trim();
            let alVersion = selectAlignment.find(":selected").attr('data-version').trim();
            let alDesc = selectAlignment.find(":selected").attr('data-desc').trim();
            let elem = $('<tr data-name="'+ alName +'"  data-version="'+ alVersion +'"><td>'+ alDesc +'</td><td style="width: 2em;"><button type="button" class="btn btn-xs btn-danger"> <span class="glyphicon glyphicon-remove"></span> </button></td></tr>');
            elem.on('click', removeElem);
            $('#alignmentsTab').append(elem);
        }
    });

    let jsonldData = $('#jsonld-data');
    jsonldData.on('input propertychange', function() {
        sampleMessage = $(this).val().trim();
    });
    let messages = $('#messages');
    $('#selectAlignment').val('none');
    messages.val('none');

    messages.on('change', function () {
        let data= $(this).val().trim();
        sampleMessage = '';
        jsonldData.val('');
        if (data !== 'none') {
            jsonldData.val('');
            // noinspection JSIgnoredPromiseFromCall
            $.ajax({
                type: 'GET',
                url: 'http://' + location.host + '/messages/' + data,
                dataType: 'json',
                success: function (msg) {
                    jsonldData.val(msg);
                },
                error: function (jqXHR, textStatus) {
                    console.log("ERROR");
                    console.log(textStatus);
                    console.dir(jqXHR);
                    console.dir(jqXHR.getAllResponseHeaders());
                }
            });
        }
    });

    $('#sendToIpsm').on('click', function () {
        let steps = [];
        $('#alignmentsTab > tbody  > tr').each(function (idx, row) {
            steps.push({
                name: $(row).attr('data-name'),
                version: $(row).attr('data-version')
            });
        });
        sampleMessage = jsonldData.val().trim();
        if (sampleMessage !== '') {
            // noinspection JSIgnoredPromiseFromCall
            $.ajax({
                type: 'POST',
                url: ipsmApiUrl,
                crossDomain: true,
                data: JSON.stringify({
                    alignIDs: steps,
                    graphStr: sampleMessage
                }),
                contentType: 'application/json; charset=utf-8',
                success: function (msg) {
                    $('#jsonld-result').html(escapeHtml(msg.graphStr));
                },
                error: function (jqXHR) {
                    $('#jsonld-result').html(`<b class="red">ERROR</b>: ${jqXHR.responseJSON.message}`);
                }
            });
        }
    });

});
