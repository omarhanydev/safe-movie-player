const Plyr = require("plyr");
const {dialog } = require("electron").remote;
const srt2vtt = require('srt-to-vtt');
const fs = require('fs');
let vidUrl = '';
let vidUrlCut = '';
let subUrl = '';
let cutUrl = '';
let jsonData = [];
let cutPlayer;
let fileNameOld, fileName, pos;
let autoCut;
let autoCutSens;

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

function tableToJson(table) {
    var data = [];

    // first row needs to be headers
    var headers = [];
    for (var i=0; i<table.rows[0].cells.length-1; i++) {
        headers[i] = table.rows[0].cells[i].innerHTML.toLowerCase().replace(/ /gi,'');
    }

    // go through cells
    for (var i=1; i<table.rows.length; i++) {

        var tableRow = table.rows[i];
        var rowData = {};

        for (var j=0; j<tableRow.cells.length-1; j++) {

            rowData[ headers[j] ] = tableRow.cells[j].innerHTML;

        }

        data.push(rowData);
    }
    data.pop();
    return data;
}


function closestElm(el, selector) {
    if (typeof selector === 'string') {
        matches = el.webkitMatchesSelector ? 'webkitMatchesSelector' : (el.msMatchesSelector ? 'msMatchesSelector' : 'matches');
        while (el.parentElement) {
            if (el[matches](selector)) {
                return el
            };
            el = el.parentElement;
        }
    } else {
        while (el.parentElement) {
            if (el === selector) {
                return el
            };
            el = el.parentElement;
        }
    }

    return null;
}
function cloneRow() {
    var row = document.querySelector(".hide"); // find row to copy
    var table = document.getElementById("table"); // find table to append to
    var clone = row.cloneNode(true); // copy children too
    clone.classList = '';
    row.before(clone);
    // table.appendChild(clone); // add new row to end of table
    clone.querySelector('.table-remove').addEventListener('click', function (event) {
        closestElm(this, 'tr').remove();
    });
}



function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    };
    rawFile.send(null);
}


document.getElementById('autoCutCheckbox').addEventListener('change', function (event) {
    if(document.getElementById('autoCutCheckbox').checked){
        document.getElementById('addBtn').classList.add('uk-opacity-50');
    } else {
        document.getElementById('addBtn').classList.remove('uk-opacity-50');
    }
});

document.querySelector('#selectBtn').addEventListener('click', function (event) {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{name: 'Videos',
            extensions: ['mkv', 'avi', 'mp4', 'mov', 'm4v', 'rmvb', 'mpg', 'mpeg']}]
    }).then((data) => {
        vidUrl = data.filePaths[0];
        autoCut = document.getElementById('autoCutCheckbox').checked;
        autoCutSens = parseInt(document.getElementById('autoCutInput').value);
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{name: 'Subtitles',
                extensions: ['srt']}]
        }).then((data) => {
            if(data.filePaths.length){
                subUrl = data.filePaths[0];
                fs.createReadStream(subUrl)
                    .pipe(srt2vtt())
                    .pipe(fs.createWriteStream(subUrl.replace('.srt', '.vtt')));
                subUrl = subUrl.replace('.srt', '.vtt');
            }
            if(autoCut){
                var $vid = document.createElement('div');
                $vid.innerHTML = `
        <video id="player"  width="500" height="300" autoplay playsinline controls>
            <source src="${vidUrl}" type="video/mp4" />
            <track kind="captions" label="Subtitle" src="${subUrl}" srclang="ar" default />
        </video>
        `;
                document.body.classList.remove('uk-flex');
                document.querySelector('#app').innerHTML = '';
                document.body.appendChild($vid);
                let count = 0;
                let timeout;

                const player = new Plyr('#player', {
                    captions: { active: true, language: 'ar', update: false },
                    volume: 1,
                    invertTime: false,
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'airplay', 'fullscreen']
                });

                player.on("playing", event => {
                    clearTimeout(timeout);
                    if (event.type === "playing") {
                        timeout = setInterval(function() {
                            count = 0;
                            // console.log("count cleared", count);
                        }, 5000)
                    }
                });

                player.on('timeupdate', event => {
                    let instance = event.detail.plyr;
                    nude.load('player');
                    nude.scan(function(result){
                        if(result){
                            if(count<=autoCutSens){
                                count++;
                            }
                            if(count>autoCutSens){
                                count = 0;
                                instance.currentTime = instance.currentTime + 45;
                                document.getElementById('player').style.opacity = "0";
                                instance.volume = 0;
                            }
                        } else {
                            if(document.getElementById('player').style.opacity === "0"){
                                setTimeout(function () {
                                    document.getElementById('player').style.opacity = "1";
                                    instance.volume = 1;
                                    count = 0;
                                }, 10000);
                            }
                        }
                    });
                });
            } else {
                dialog.showOpenDialog({
                    properties: ['openFile'],
                    filters: [{name: 'Safe Files',
                        extensions: ['safe']}]
                }).then((data) => {
                    cutUrl = data.filePaths[0];
                    readTextFile(cutUrl, function(text){
                        jsonData = JSON.parse(text);
                    });
                    var $vid = document.createElement('div');
                    $vid.innerHTML = `
        <video id="player"  width="500" height="300" autoplay playsinline controls>
            <source src="${vidUrl}" type="video/mp4" />
            <track kind="captions" label="Subtitle" src="${subUrl}" srclang="ar" default />
        </video>
        `;
                    document.body.classList.remove('uk-flex');
                    document.querySelector('#app').innerHTML = '';
                    document.body.appendChild($vid);

                    const player = new Plyr('#player', {
                        captions: { active: true, language: 'ar', update: false },
                        volume: 1,
                        invertTime: false,
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'airplay', 'fullscreen']
                    });

                    player.on('timeupdate', event => {
                        let instance = event.detail.plyr;
                        let currentTime = instance.currentTime;
                        jsonData.forEach((item) => {
                            if (currentTime > hmsToSecondsOnly(item.starttime) && currentTime < hmsToSecondsOnly(item.endtime)) {
                                instance.currentTime = hmsToSecondsOnly(item.endtime);
                            }
                        });
                    });

                } , reason => {
                    console.log(reason);
                });
            }
        } , reason => {
            console.log(reason);
        });
    } , reason => {
        console.log(reason);
    });
});




document.querySelector('#addBtn').addEventListener('click', function (event) {
    document.querySelector('#cutPlayerWrap').innerHTML = '';
    document.querySelector('#cutTableWrap').innerHTML = '';
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{name: 'Videos',
            extensions: ['mkv', 'avi', 'mp4', 'mov', 'm4v', 'rmvb', 'mpg', 'mpeg']}]
    }).then((data) => {
        vidUrlCut = data.filePaths[0];
        document.querySelector('#cutPlayerWrap').innerHTML = `
        <video id="cutPlayer" playsinline controls>
            <source src="${vidUrlCut}" type="video/mp4" />
        </video>
        `;
        cutPlayer = new Plyr('#cutPlayer', {
            captions: { active: true, language: 'ar', update: false },
            volume: 1,
            invertTime: false,
            controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'airplay']
        });
        fileNameOld = vidUrlCut.split( '\\' ).pop();
        fileName = fileNameOld.split( '//' ).pop();
        pos = fileName.lastIndexOf(".");
        fileName = fileName.substr(0, pos < 0 ? fileName.length : pos) + ".safe";

        document.querySelector('#cutTableWrap').innerHTML = `
        <h1>Cut Scenes</h1>
        <small>
            <ul>
                <li>Please add unsuitable scenes start and end time, you can also add more than one scene.</li>
                <li>After adding scene timings, click <strong>"Save as file"</strong> button to save a ".safe" file in the same folder of movie</li>
                <li>Click <strong>“Play Safe Movie”</strong> button to choose the movie safely using the exported ".safe" file.</li>
            </ul>
        </small>
    <div class="uk-clearfix">
        <div class="uk-float-right">
            <div class="table-add">
                Add
                <span uk-icon="plus-circle"></span>
            </div>
        </div>
    </div>
    <div class="uk-clearfix"></div>
    <div class="table-editable">
        <table id="table" class="table uk-table uk-table-striped uk-table-hover uk-table-small uk-table-middle">
        <thead>
            <tr>
            <th class="uk-table-expand">Start Time</th>
            <th class="uk-table-expand">End Time</th>
            <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td contenteditable="true">00:00:00</td>
                <td contenteditable="true">00:00:00</td>
                <td>
                    <span class="uk-text-danger table-remove" uk-icon="close"></span>
                </td>
            </tr>
            <tr class="hide">
                <td contenteditable="true">00:00:00</td>
                <td contenteditable="true">00:00:00</td>
                <td>
                    <span class="uk-text-danger table-remove" uk-icon="close"></span>
                </td>
            </tr>
        </tbody>
    </table>
    <p class="uk-text-right">
        <button class="uk-button uk-button-primary" id="export-btn" type="button">Save as file</button>
    </p>
`;

        document.querySelector('.table-remove').addEventListener('click', function (event) {
            closestElm(this, 'tr').remove();
        });

        document.querySelector('.table-add').addEventListener('click', function (event) {
            cloneRow();
        });

        document.querySelector('.uk-modal-close-full').addEventListener('click', function (event) {
            cutPlayer.pause();
        });

        document.getElementById('export-btn').addEventListener('click', function (event) {
            dialog.showSaveDialog({
                title: "Save file",
                defaultPath : fileName,
                buttonLabel : "Save",

                filters :[
                    {name: 'safe', extensions: ['safe',]}
                ]
            }).then((data) => {
                console.log(data);
                fs.writeFileSync(data.filePath, JSON.stringify(tableToJson(document.getElementById('table'))), 'utf-8');
                UIkit.modal('#addNewCuts').hide();
                cutPlayer.pause();
                document.getElementById('autoCutCheckbox').checked = false;
            }, reason => {
                console.log(reason);
            });
        });

    }, reason => {
        console.log(reason);
    });
});
