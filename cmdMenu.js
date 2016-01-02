var cmdMenu = (function(){
	var intField = null;
	var input = null;
	var inElem = null;
	var sections = null;
	var cmdFunctions = null;
	var events = function () {
		input = document.querySelector(intField);
		input.addEventListener('keypress', evtInput);
	};
	var results = document.querySelector('#main-nav');
	var p = document.createElement('p');
	p.className = 'results';
	p.innerHTML = '';
	results.appendChild(p);
	var getSections = function () {
		sections = document.getElementsByTagName(inElem);
	};
	var evtInput = function (e){
		if(e.keyCode === 13){
			var command = input.value.trim();
			if(command.length > 0) {
				if (typeof cmdFunctions[command.split(' ')[0]] === 'function'){
					cmdFunctions[command.split(' ')[0]](command.split(' ').slice(1), sections);
				} else {
					p.innerHTML = '';
					p.innerHTML = command + ': command not found';
				}
				localStorage.setItem("prevCmd", command);
			} else {
				p.innerHTML = '';
				p.innerHTML = 'empty value';
			}
		}
	};
	return {
		init: function(ii, section){
			intField = ii;
			inElem = section;
			events();
			getSections();
		},
		cmds: function (z) {
			cmdFunctions = z;
		}
	}
})();

cmdMenu.cmds({
	ls: function (ls, val) {
		document.querySelector('.results').innerHTML = '';
		if (!ls.length) {
			for (i = 0; i < val.length; i++) {
				var a = document.createElement('a');
				a.href = '#' + val[i].id;
				if (!val[i].querySelectorAll('h1, h2, h3, h4, h5, h6').length) {
					a.innerHTML = val[i].id.replace('-', ' ');
				} else {
					a.innerHTML = val[i].querySelectorAll('h1, h2, h3, h4, h5, h6')[0].innerText;
				}
				document.querySelector('.results').appendChild(a);
			}
		} else if (ls[0] === '-e' || ls[0] === '--external') {
			var sitemap = new XMLHttpRequest();
			sitemap.open("GET", "http://localhost/cmd-menu/sitemap.xml", true);
			sitemap.onreadystatechange = function() {
				if (sitemap.readyState == 4) {
					if (sitemap.status == 200) {
						var xmlDoc = sitemap.responseXML.getElementsByTagName('loc');
						for (var i = 0; i < xmlDoc.length; i++) {
							var a = document.createElement('a');
							var loc = xmlDoc[i].childNodes[0].nodeValue;
							var val = loc.split('/').filter(function(e){ return e === 0 || e }).slice(-1).toString();
							var text = val.replace(/-|_|\+|%20/gi, " ").replace(/(.*)\.(.*?)$/, "$1");
							a.href = loc;
							a.innerHTML = text;
							document.querySelector('.results').appendChild(a);
						}
					} else {
						document.querySelector('.results').innerHTML = 'No sitemap file found';
					}
				}
			}
			sitemap.send();
		} else if (ls[0] === '-h' || ls[0] === '--help') {
			document.querySelector('.results').innerHTML = '\
			list all available locations to navigate to<br />\
			Usage:<br />\
			ls [option] [target]<br />Options:<br />\
			[] // prints available locations on current page<br />\
			[-e] // prints available pages on the website<br />\
			[-h] // prints help manual<br />\
			[--help] // prints help manual';
		}  else {
			document.querySelector('.results').innerHTML = 'ls ' + ls + ': command not found';
		}
	},
	cd: function (cd, val) {
		document.querySelector('.results').innerHTML = '';
		// document.querySelector('.results').innerHTML = "cd cd cd cd";
		if (cd[0] === '..' || cd[0] === '-') {
			var hash = window.location.hash;
			if (window.location.hash !== "#main-nav") {
				window.history.go(-2);
				return false;
			} else {				
				window.history.go(-1);
				return false;
			}
		}  else {
			document.querySelector('.results').innerHTML = 'cd ' + cd + ': command not found';
		}
	},
	help: function (help) {
		document.querySelector('.results').innerHTML = '';
		document.querySelector('.results').innerHTML = "type 'ls' or 'cd' for available options";
	}
});