
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

function showResults(x) {
    alert("SFPL has " + x);
}

function showNegResults(x) {
    alert("SFPL doesn't have " + x);
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
	addStyleLink(chrome.extension.getURL("linkback.css"));

	var body = document.getElementsByTagName('body')[0];
	var div = document.createElement('div');
	div.setAttribute('id', 'LinkBack');
	div.setAttribute('class', 'linkback');

	pane=document.createElement('div');
	pane.setAttribute('class','linkbackinner');
	
	div.appendChild(pane);
	body.appendChild(div);

    }
    return pane;
}

function insertOpenClose() {
    openclose = document.createElement('div');
    openclose.setAttribute('class', 'linkbackopener');
    opencloseUpdate();
    openclose.addEventListener('click', openCloseHandler, true);
    return openclose;
}



doPopup();

