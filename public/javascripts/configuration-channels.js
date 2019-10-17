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
    const ipsmApiUrl = `${CONFIG.get('ipsmApiUrl')}channels`;

    $('#addChannel').on('click', function () {
        let src = $('#inputSource').val().trim();
        let trg = $('#inputTarget').val().trim();
        let selectInputAlignment = $('#selectInputAlignment');
        let selectOutputAlignment = $('#selectOutputAlignment');
        let inpName = selectInputAlignment.find(":selected").attr('data-name').trim();
        let outName = selectOutputAlignment.find(":selected").attr('data-name').trim();
        let inpVersion = selectInputAlignment.find(":selected").attr('data-version').trim();
        let outVersion = selectOutputAlignment.find(":selected").attr('data-version').trim();
        $('#err').empty();
        if (src !== "" && trg !== "") {
            // noinspection JSIgnoredPromiseFromCall
            $.ajax({
                type: 'POST',
                url: ipsmApiUrl,
                contentType:'application/json; charset=utf-8',
                dataType: 'json',
                cache: false,
                data: JSON.stringify({
                    'source': src,
                    'sink': trg,
                    'inpAlignmentName': inpName,
                    'inpAlignmentVersion': inpVersion,
                    'outAlignmentName': outName,
                    'outAlignmentVersion': outVersion
                }),
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
                },
                complete: function () {
                    // location.reload();
                }
            });
        }
    });

    $('.delete').on('click', function () {
        let id = parseInt($(this).attr('data-id').trim());
        // noinspection JSIgnoredPromiseFromCall
        $.ajax({
            type: 'DELETE',
            url: ipsmApiUrl + '/' + id,
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
