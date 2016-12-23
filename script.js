
var openclose;
var pane;			// contents pane
var savedResults;

var ISBNRegex = /(97(8|9))?\d{9}(\d|X)/g;

var SFPLTemplate = "https://sfpl.bibliocommons.com/search?custom_query=identifier%3A(#{ISBN})&suppress=true&custom_edit=false";

var SFPLTestBad = "Can't Find What You're Looking For";

// utils

function unique(list) {
    return list.filter(function (x, i, a) { 
	return a.indexOf(x) == i; 
    })};

function includes(s1,s2) {
    return s1.indexOf(s2) >= 0;
}


function doPopup() {
    var pageText = document.body.innerText;
    var match = pageText.match(ISBNRegex);
    if (match != null) {
	isbns = unique(match);
	for (idx in isbns) {
	    doQuery(match[idx]);
	}
    }
}

// HTML utils

// borrowed from Prototype
function unescapeHTML(text) {
    var div = document.createElement('div');
    div.innerHTML = text;
    return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
}


function insertText(container, text) {
    var node = document.createTextNode(unescapeHTML(text));
    container.appendChild(node);
}

function insertLink(container, url, title) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    insertText(link, title);
    container.appendChild(link);
    return link;
}

function addStyleLink(href) {
    var head, link;
    head = document.getElementsByTagName('head')[0];
    if (!head) { head = document.getElementsByTagName('body')[0]; } // headless body found in topless bar
    if (!head) { return; }
    link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'all';
    link.href = href;
    head.appendChild(link);
}

function makeResultItem() {
    makeWindow();
    // TODO this is all very provisional
    var div = document.createElement('div');    
    div.setAttribute('class','entry');
    pane.appendChild(div);
    return div;
}


function showNegResults(x) {
    insertText(makeResultItem(), "SFPL doesn't have " + x);
}


function showResults(x) {
    var r = makeResultItem();
    // conceivable this would be a different URL, but most times the query url will also be display url
    insertLink(r, makeQueryUrl(x), "SFPL has " + x);
}


function makeQueryUrl(isbn) {
    return SFPLTemplate.replace(/#{ISBN}/, isbn)
}

function doQuery(ISBN) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", makeQueryUrl(ISBN), true);
    xhr.onreadystatechange = function() {
	if (xhr.readyState == 4) {
	    if (xhr.status = 200) {
		var results = xhr.responseText;
		if (includes(results, SFPLTestBad)) {
		    showNegResults(ISBN);
		}
		else {
		    showResults(ISBN);
		}
	    }
	    else {
		insertError(xhr.status, xhr.statusText);
	    }
	}
    };
    xhr.send();
}


function  makeWindow() {
    if (pane == null) {

	addStyleLink(chrome.extension.getURL("reset.css"));
	addStyleLink(chrome.extension.getURL("librium.css"));

	var body = document.getElementsByTagName('body')[0];
	var div = document.createElement('div');
	div.setAttribute('id', 'Librium');
	div.setAttribute('class', 'librium');

	pane=document.createElement('div');
	pane.setAttribute('class','libriuminner');
	
	div.appendChild(pane);
	body.appendChild(div);

    }
    return pane;
}

function insertOpenClose() {
    openclose = document.createElement('div');
    openclose.setAttribute('class', 'libriumopener');
    opencloseUpdate();
    openclose.addEventListener('click', openCloseHandler, true);
    return openclose;
}



doPopup();

