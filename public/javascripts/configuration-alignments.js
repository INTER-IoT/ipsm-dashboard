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
/*jshint esversion: 6 */
/* globals CONFIG */
$(function () {
    const ipsmApiUrl = `${CONFIG.get('ipsmApiUrl')}alignments`;

    $('#addAlignment').on('click', function () {
        $('#err').empty();
        let newAlignment = $('#configuration').val().trim();
        if (newAlignment) {
            // For some completely strange reasons "async: true" prevents the call from
            // executing successfully on FF...
            // noinspection JSIgnoredPromiseFromCall
            $.ajax({
                type: 'POST',
                url: ipsmApiUrl,
                contentType:'application/xml; charset=utf-8',
                data: newAlignment,
                success: function () {
                    location.reload();
                },
                error: function (jqXHR, textStatus) {
                    let msg = jqXHR.responseJSON.message;
                    if (msg) {
                        $('#err').text(msg);
                    }
                    console.log("ERROR");
                    console.log(textStatus);
                    console.dir(jqXHR);
                    console.dir(jqXHR.getAllResponseHeaders());
                }
            });
        }
    });

    $('.delete').on('click', function () {
        let name = $(this).attr('data-name').trim();
        let version = $(this).attr('data-version').trim();
        // noinspection JSIgnoredPromiseFromCall
        $.ajax({
            type: 'DELETE',
            url: ipsmApiUrl + '/' + name + '/' + version,
            dataType: 'json',
            success: function () {
                location.reload();
            },
            error: function (jqXHR, textStatus) {
                console.log("ERROR");
                console.log(textStatus);
                console.dir(jqXHR);
                console.dir(jqXHR.getAllResponseHeaders());
            }
        });
    });
});
