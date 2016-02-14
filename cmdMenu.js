var cmdMenu = (function(){

    var intField = null;
    var input = null;
    var inElem = null;
    var sections = null;
    var cmdFunctions = null;
    var pages = null;
    var events = function () {
        input = document.querySelector(intField);
        input.addEventListener('keydown', evtKey, false);
    };

    var results = function () {
        var res = document.getElementById('main-nav');
        var p = document.createElement('p');
        p.className = 'results';
        p.innerHTML = '';
        res.appendChild(p);
    };

    var getSections = function () {
        sections = document.getElementsByTagName(inElem);
    };

    var update = localStorage.getItem('update');
    if(!update){
        localStorage.setItem('update', new Date().toUTCString());
    };

    var getPages = function() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", pages, true);
        xhr.send(null);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var query = localStorage.getItem('pages');
                    var time = xhr.getResponseHeader("Last-Modified");
                    if (time > update || query === null) {
                        setIndex();
                    }
                }
            }
        }
    };

    var setIndex = function () {
        index = new XMLHttpRequest();
        index.open("GET", pages, true);
        index.send(null);
        index.onreadystatechange = function() {
            if (index.readyState === 4) {
                if (index.status === 200) {
                    obj = JSON.parse(index.responseText);
                    q = [];
                    for (i = 0, j = obj.length; i < j; i++) {
                        q.push(obj[i]);
                        localStorage.setItem('pages', JSON.stringify(q));
                        localStorage.setItem('update', new Date().toUTCString());
                    }
                }
            }
        }
    };

    var location = function () {
        if(!sessionStorage.getItem('session')) {
            var getInfo = new XMLHttpRequest();
            sessionStorage.setItem('session', new Date().toUTCString());
            getInfo.open("GET", "http://ipinfo.io/json", true);
            getInfo.send();
            getInfo.onreadystatechange = function () {
                if((getInfo.readyState === 4) && (getInfo.status === 200)) {
                    var usrInfo = JSON.parse(getInfo.responseText);
                    if(typeof countryCode === 'object') {
                        for (var c in countryCode) {
                            if (countryCode.hasOwnProperty(c)) {
                                c = usrInfo.country;
                                localStorage.setItem('country', countryCode[c]);
                            }
                            else {
                                localStorage.setItem('country', usrInfo.country);
                            }
                        }
                    } else {
                        localStorage.setItem('country', usrInfo.country);
                    }
                    localStorage.setItem('ip', usrInfo.ip);
                    localStorage.setItem('hostname', usrInfo.hostname);
                    localStorage.setItem('city', usrInfo.city);
                    localStorage.setItem('region', usrInfo.region);
                    localStorage.setItem('loc', usrInfo.loc);
                    localStorage.setItem('org', usrInfo.org);
                }
            }
        }
    };

    var history = function () {
        var index = -1;     
        function changeValue(cmdIndex) {
            index += cmdIndex;
            if (localStorage.getItem('cmds') != null){
                var cmdVals = JSON.parse(localStorage.getItem('cmds')).reverse();
                document.querySelector(intField).value = cmdVals[index];
                if (index < 0) {
                    index = -1;
                    document.querySelector(intField).value = '';
                } else if (index >= JSON.parse(localStorage.getItem('cmds')).length) {
                    index = cmdVals.length;
                    document.querySelector(intField).value = cmdVals[cmdVals.length -1];
                }
            }
        }
        return {
            prevCmd: function () {
                changeValue(1);
            },
            nextCmd: function () {
                changeValue(-1);
            },
            val: function () {
                return index;
            }
        };
    }();

    var evtKey = function (e){
        var values = JSON.parse(localStorage.getItem('cmds')) || [];
        var command = input.value.trim();
        switch (e.keyCode) {
            case 13 :
                if (command.length > 0) {
                    if (typeof cmdFunctions[command.split(' ')[0]] === 'function'){
                        cmdFunctions[command.split(' ')[0]](command.split(' ').slice(1), sections, JSON.parse(localStorage.getItem('pages')));
                    } else {
                        results();
                        document.querySelector('.results').innerHTML = '' + command + ': command not found';
                    }
                    try {
                        values.push(command);
                        localStorage.setItem("cmds", JSON.stringify(values));
                        intField.value = command;
                    } catch (e) {
                        localStorage.clear();
                        values.push(command);
                        localStorage.setItem("cmds", JSON.stringify(values));
                        intField.value = command;
                    }
                } else {
                    results();
                    document.querySelector('.results').innerHTML = '' + 'empty value';
                }
                break;
            case 38 :
                history.prevCmd();
                break;
            case 40 :
                history.nextCmd();
                break;
            default:
        }
    };

    var highlight = function () {
        var url = window.location.search.replace('?q=','');
        var text = decodeURIComponent(url).split("_").join(" ");
        var el = document.querySelectorAll(inElem);
        var regex = new RegExp(text,"gi");
        var replace = '<span class="highlight">' + text + '</span>';
        if (url.length) {
            for (var i = 0, l = el.length; i <l; i++) {
                el[i].innerHTML = el[i].innerHTML.replace(regex, replace);
            };
        }
    };

    return {
        init: function(element, section, map){
            intField = element;
            inElem = section;
            pages = map || "/pages.json";
            results();
            events();
            getSections();
            getPages();
            highlight();
            location();
        },
        cmds: function (cmd) {
            cmdFunctions = cmd;
        },
        country : function(code) {
            countryCode = code;
        }
    }
})();

cmdMenu.cmds({
    ls: function (ls, val, links) {
        if (!ls.length) {
            if(val.length){
                document.querySelector('.results').innerHTML = '';
                for (var i = 0; i < val.length; i++) {
                    var a = document.createElement('a');
                    a.href = '#' + val[i].id;
                    if (!val[i].querySelectorAll('h1, h2, h3, h4, h5, h6').length) {
                        a.innerHTML = val[i].id.replace('-', ' ');
                    } else {
                        a.innerHTML = val[i].querySelectorAll('h1, h2, h3, h4, h5, h6')[0].innerText;
                    }
                    document.querySelector('.results').appendChild(a);
                }
            } else {
                document.querySelector('.results').innerHTML = '' + "No elements to navigate on this page. Try with '-h' flag for more options.";
            }
        } else {
            switch(ls[0]) {
                case '-e':
                case '--external':
                    document.querySelector('.results').innerHTML = '';
                    for (var i = 0, j = links.length; i < j; i++) {
                        var a = document.createElement('a');
                        a.href = (window.location.protocol + '//' + window.location.hostname + links[i].url);
                        if (links[i].url === '/' || links[i].url === '/home' || links[i].url === window.location.hostname) {
                            a.innerHTML = "Homepage";
                        } else {
                            a.innerHTML = links[i].title;
                        }
                        document.querySelector('.results').appendChild(a);
                    }
                    break;
                case '-a':
                case '--all':
                    document.querySelector('.results').innerHTML = '' + '<h3 class="label">Current page:</h3>';
                    for (var i = 0; i < val.length; i++) {
                        var a = document.createElement('a');
                        a.href = '#' + val[i].id;
                        if (!val[i].querySelectorAll('h1, h2, h3, h4, h5, h6').length) {
                            a.innerHTML = val[i].id.replace('-', ' ');
                        } else {
                            a.innerHTML = val[i].querySelectorAll('h1, h2, h3, h4, h5, h6')[0].innerText;
                        }
                        document.querySelector('.results').appendChild(a);
                    }
                    document.querySelector('.results').innerHTML += '<h3 class="label">Entire website:</h3>';
                    for (var i = 0, j = links.length; i < j; i++) {
                        var a = document.createElement('a');
                        a.href = (window.location.protocol + '//' + window.location.hostname + links[i].url);
                        if (links[i].url === '/' || links[i].url === '/home' || links[i].url === window.location.hostname) {
                            a.innerHTML = "Homepage";
                        } else {
                            a.innerHTML = links[i].title;
                        }
                        document.querySelector('.results').appendChild(a);
                    }
                    break;
                case '-h':
                case '--help':
                    document.querySelector('.results').innerHTML = '' + 'list all available locations to navigate to<br />Usage:<br />ls [option] [target]<br />Options:<br />[] // prints available locations on current page<br />[-e] or [--external] // prints available pages on the website<br />[-h], [--help] // prints help manual';
                    break;
                default: 
                    document.querySelector('.results').innerHTML = '' + 'ls ' + ls.join(' ') + ': command not found';
            }
        }
    },
    cd: function (cd, val, links) {
        if (!cd.length) {
            document.querySelector('.results').innerHTML = '' + 'Missing argument for navigation.';
        } else {
            var url = [];
            var vals = [];
            for (var i = 0, j = links.length; i < j; i++) {
                url.push(links[i].url);
            }
            for (var v= 0, z = val.length; v < z; v++) {
                vals.push(val[v].id);
            }
            switch(cd[0]) {
                case '..':
                case '-':   
                    window.history.go(-1);
                    break;
                case '/':
                case '~': 
                    window.location.href = (window.location.protocol + '//' + window.location.hostname);
                    break;
                case url[url.indexOf(cd[0])]: 
                    window.location.href = (window.location.protocol + '//' + window.location.hostname + cd[0]);
                    break;
                case vals[vals.indexOf(cd[0])]:
                    window.location.href = '#' + cd[0];
                    document.getElementById('close-menu').click();
                    document.querySelector('.results').innerHTML = '';
                    break;
                    case '-h':
                    case '--help':
                        document.querySelector('.results').innerHTML = '' + 'Navigate on current website<br />Usage:<br />cd [target]<br />Options:<br />[] // prints available locations on current page<br />[-e] or [--external] // prints available pages on the website<br />[-h], [--help] // prints help manual';
                        break;
                default:
                    document.querySelector('.results').innerHTML = '' + 'cd ' + cd.join(' ') + ': No such file or directory';
            }
        }
    },
    who: function (who) {
        if (!who.length) {
            document.querySelector('.results').innerHTML = '' + "Username: guest<br />Location: " + 
                localStorage.getItem('city') + ", " + 
                localStorage.getItem('region') + "<br />Country: " + 
                localStorage.getItem('country') + "<br />Coordinates: " + 
                localStorage.getItem('loc');
        } else {
            document.querySelector('.results').innerHTML = '' + ('who ' + who.join(' ') + ': command not found');
        }
    },
    hostname: function (hostname) {
        if (!hostname.length) {
            document.querySelector('.results').innerHTML = '' + localStorage.getItem('hostname');
        } else {
            document.querySelector('.results').innerHTML = '' + 'hostname ' + hostname.join(' ') + ': command not found';
        }
    },
    ifconfig: function (ifconfig) {
        if (!ifconfig.length) {
            document.querySelector('.results').innerHTML = '' + "IP: " + 
                localStorage.getItem('ip') + "<br />Network: " + 
                localStorage.getItem('org');
        } else {
            document.querySelector('.results').innerHTML = '' + 'ifconfig ' + ifconfig.join(' ') + ': command not found';
        }
    },
    help: function (help) {
        if (!help.length) {
            document.querySelector('.results').innerHTML = '' + "type 'ls' or 'cd' for available options";
        } else {
            document.querySelector('.results').innerHTML = '' + 'help ' + help.join(' ') + ': command not found';
        }
    },
    hello: function (hello) {
        if (!hello.length) {
            document.querySelector('.results').innerHTML = '' + "Hello , world!";
        } else {
            document.querySelector('.results').innerHTML = '' + "Hello " + hello.join(' ') + ": command not found";
        }
    },
    exit: function (exit) {
        if (!exit.length) {
            document.querySelector('.results').innerHTML = '' + "Good bye!";
            try {
                setTimeout (function(){
                    window.open('https://www.google.com','_self');
                }, 1000);
            } catch (e) {
                setTimeout (function(){
                    window.close();
                }, 1000);
            }
        } else {
            document.querySelector('.results').innerHTML = '' + 'exit ' + exit.join(' ') + ': command not found';
        }
    },
    find: function (find, val, links) {
        if(!find.length) {
            document.querySelector('.results').innerHTML = '' + "Error: location or search argument is missing";
        } else {
            if(find[0] === '.') {
                var query = find.slice(1).join(" ");
                var text = document.body.innerText || document.body.textContent;
                if(text.indexOf(query) === -1) {
                    document.querySelector('.results').innerHTML = '' + 'No results matching ' + '"' + find.slice(1).join(" ") + '"';
                } else {
                    window.location.href = window.location.pathname + '?q=' + query.split(" ").join("_");
                }
            } else if (find[0] === '/') {
                document.querySelector('.results').innerHTML = '';
                var query = find.slice(1).join(" ").toLowerCase();
                ids = [];
                for (var i = 0, j = links.length; i < j; i++) {
                    obj = links[i];
                    for (var key in obj) {                        
                        if (!obj.hasOwnProperty(key)) { continue; }
                        if(obj[key].toLowerCase().indexOf(query) >= 0) {
                            ids.push(parseInt(obj["id"]));
                            break;
                        } else {
                            document.querySelector('.results').innerHTML = '' + 'No results matching ' + '"' + find.slice(1).join(" ") + '"';
                        }
                    }
                }
                for (var k = 0, l = ids.length; k < l; k++) {
                    document.querySelector('.results').innerHTML = '';
                    var q = ids[k];
                    var a = document.createElement('a');
                    a.innerHTML = links[q-1].title;
                    a.href = links[q-1].url + "?q=" + query.split(" ").join("_");
                    document.querySelector('.results').appendChild(a);
                }
            }
        }
    }
});