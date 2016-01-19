var cmdMenu = (function(){
	var intField = null;
	var input = null;
	var inElem = null;
	var sections = null;
	var links = null;
	var cmdFunctions = null;
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
	var location = function () {
		var getJson = new XMLHttpRequest();
		getJson.onreadystatechange = function() {
			if ((getJson.readyState === 4) && (getJson.status === 200)) {
				var testIp = JSON.parse(getJson.responseText);
				if(localStorage.length <= 1 || testIp.ip != localStorage.getItem('ip')) {
					var getInfo = new XMLHttpRequest();
					getInfo.onreadystatechange = function () {
						if((getInfo.readyState === 4) && (getInfo.status === 200)) {
							var usrInfo = JSON.parse(getInfo.responseText);
							for (var c in countryCode) {
								if (countryCode.hasOwnProperty(c)) {
									c = usrInfo.country;
									localStorage.setItem('country', countryCode[c]);
								}
								else {
									localStorage.setItem('country', usrInfo.country);
								}
							}
							localStorage.setItem('ip', usrInfo.ip);
							localStorage.setItem('hostname', usrInfo.hostname);
							localStorage.setItem('city', usrInfo.city);
							localStorage.setItem('region', usrInfo.region);
							localStorage.setItem('loc', usrInfo.loc);
							localStorage.setItem('org', usrInfo.org);
						}
					}
					getInfo.open("GET", "http://ipinfo.io/json", true);
					getInfo.send(null);
				}
			}
		};
		getJson.open("GET", "https://api.ipify.org?format=json", true);
		getJson.send(null);
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
	var siteLinks = function () {
		links = [];
		sitemap = new XMLHttpRequest();
		sitemap.open("GET", "/cmd-menu/sitemap.xml", true);
		sitemap.onreadystatechange = function() {
			if ((sitemap.readyState === 4) && (sitemap.status === 200)) {
				document.querySelector('.results').innerHTML = '';
				var xmlDoc = sitemap.responseXML.getElementsByTagName('loc');
				for (var i = 0; i < xmlDoc.length; i++) {
					var loc = xmlDoc[i].childNodes[0].nodeValue;
					var link = loc.split('/').filter(function(e){ return e === 0 || e}).slice(2).join('/').toString();
					// console.log(links);
					links.push(link);
				}
			} else {
				document.querySelector('.results').innerHTML = '' + ('No sitemap file found');
			}
		}
		sitemap.send();
	}
	var evtKey = function (e){
		var values = JSON.parse(localStorage.getItem('cmds')) || [];
		// var i = 0;
		var command = input.value.trim();
		switch (e.keyCode) {
			case 13 :
				if (command.length > 0) {
					if (typeof cmdFunctions[command.split(' ')[0]] === 'function'){
						cmdFunctions[command.split(' ')[0]](command.split(' ').slice(1), sections, links);
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
	return {
		init: function(ii, section){
			intField = ii;
			inElem = section;
			results();
			siteLinks();
			events();
			getSections();
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
						// console.log('if');
						a.innerHTML = val[i].id.replace('-', ' ');
					} else {
						a.innerHTML = val[i].querySelectorAll('h1, h2, h3, h4, h5, h6')[0].innerText;
						// console.log('else');
					}
					document.querySelector('.results').appendChild(a);
				}
			} else {
				document.querySelector('.results').innerHTML = '' + "No elements to navigate on this page. Try with '-h' flag for more options.";
			}
		} else if (ls.length > 0) {
			if (ls[0] === '-e' || ls[0] === '--external') {
				document.querySelector('.results').innerHTML = '';
				for (var i = 0; i < links.length; i++) {
					for (var i = 0; i < links.length; i++) {
						var a = document.createElement('a');
						var loc = links[i];
						var val = loc.split('/').filter(function(e){ return e !== '' }).slice(-1).toString();
						var text = val.replace(/-|_|\+|%20/gi, " ").replace(/(.*)\.(.*?)$/, "$1");
						a.href = (window.location.protocol + '//' + window.location.hostname + '/' + loc);
						if (val === '') {
							a.innerHTML = "Home";
						} else {
							a.innerHTML = text;
						}
						document.querySelector('.results').appendChild(a);
					}				
				}
			} else if (ls[0] === '-a' || ls[0] === '--all') {
				document.querySelector('.results').innerHTML = '' + '<h3 class="label">Current page:</h3>';
					for (var i = 0; i < val.length; i++) {
						var a = document.createElement('a');
						a.href = '#' + val[i].id;
						if (!val[i].querySelectorAll('h1, h2, h3, h4, h5, h6').length) {
							// console.log('if');
							a.innerHTML = val[i].id.replace('-', ' ');
						} else {
							a.innerHTML = val[i].querySelectorAll('h1, h2, h3, h4, h5, h6')[0].innerText;
							// console.log('else');
						}
						document.querySelector('.results').appendChild(a);
					}
				document.querySelector('.results').innerHTML += '<h3 class="label">Entire website:</h3>'
					for (var i = 0; i < links.length; i++) {
						for (var i = 0; i < links.length; i++) {
							var a = document.createElement('a');
							var loc = links[i];
							var val = loc.split('/').filter(function(e){ return e !== '' }).slice(-1).toString();
							var text = val.replace(/-|_|\+|%20/gi, " ").replace(/(.*)\.(.*?)$/, "$1");
							a.href = (window.location.protocol + '//' + window.location.hostname + '/' + loc);
							if (val === '') {
								a.innerHTML = "Home";
							} else {
								a.innerHTML = text;
							}
							document.querySelector('.results').appendChild(a);
						}				
					}
			} else if (ls[0] === '-h' || ls[0] === '--help') {
				document.querySelector('.results').innerHTML = '' + 'list all available locations to navigate to<br />Usage:<br />ls [option] [target]<br />Options:<br />[] // prints available locations on current page<br />[-e] or [--external] // prints available pages on the website<br />[-h] [--help] // prints help manual';
			} else {
				document.querySelector('.results').innerHTML = '' + 'ls ' + ls.join(' ') + ': command not found';
			}
		}
	},
	cd: function (cd, val, links) {
		if (!cd.length) {
			document.querySelector('.results').innerHTML = '' + 'Missing argument for navigation.';
		} else if (cd[0] === '..' || cd[0] === '-') {
			window.history.go(-1);
			document.getElementById('close-menu').click();
		} else if (cd[0] === '/' || cd[0] === '~') {
			window.location.href = (window.location.protocol + '//' + window.location.hostname);
		} else if (cd[0] === links[links.indexOf(cd[0])]) {
			window.location.href = (window.location.protocol + '//' + window.location.hostname + '/' + cd[0]);
		} else if (val[cd[0]] &&  cd[0] === val[cd[0]].id) {
			document.querySelector('.results').innerHTML = '';
			window.location.href = '#' + cd[0];
			document.getElementById('close-menu').click();
		} else {
			document.querySelector('.results').innerHTML = '' + 'cd ' + cd.join(' ') + ': No such file or directory';
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
	}
});