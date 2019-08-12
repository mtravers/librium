var openclose;			// the opener DOM object
var homeSiteUrl = "https://github.com/mtravers/librium";

// Turn this on to show negative results
var showMisses = false;

// TODO separate file at least
// Note: these should all be https: urls, in combo with extension like SSH Everywhere will avoid mixed-content blocks.
var libraries =
    [{name: "SFPL",
      template: "https://sfpl.bibliocommons.com/search?custom_query=identifier%3A(#{ISBN})&suppress=true&custom_edit=false",
      test_bad: /\<h4.*Nothing found for.*?identifier.*?\<\/h4\>/,
      title_extractor: /class="title-content".*?\>(.*?)\<\/span\>/
      },
     {name: "SMCL",
      template: "https://smplibrary.bibliocommons.com/search?custom_query=identifier%3A(#{ISBN})&suppress=true&custom_edit=false",
      test_bad: /\<h4.*Nothing found for.*?identifier.*?\<\/h4\>/,
      title_extractor: /class="title-content".*?\>(.*?)\<\/span\>/
     },
     {name: "UCSF",
      template: "https://ucsfcat.library.ucsf.edu/search~S0/?searchtype=i&searcharg=#{ISBN}",
      test_bad: /No matches found/,
      title_extractor: /class\=\"bibInfoLabel\"\>Title[\s\S]*?<strong>([\s\S]*?)( :.*)?\<\/strong/
     },
     {name: "Link+",
      template: "https://csul.iii.com/search/?searchtype=i&SORT=D&searcharg=#{ISBN}",
      test_bad: /No matches found/,
      // hideous
      title_extractor: /\<h2.*?class\=\"briefcitTitle\"\>[\s\S]*?\>(.*?)\</
     },
     // Presumably this will have an entry for almost every valid ISBN...maybe only show as last resort?
     {name: "Worldcat",
      template: "https://www.worldcat.org/search?q=bn%3A#{ISBN}",
      test_bad: /No results match your search/,
      title_extractor: /id=\"result-1\".*<strong>(.*?)( :.*)?<\/strong>/
     },
     // Doesn't work in tests, presumably requires specific client id or something
     {name: "Bookos",
      template: "https://bookos-z1.org/s/?q=#{ISBN}",
      test_bad: /On your request nothing has been found/,
      title_extractor: /class\=\"tdn\"\>(.*?)\<\/a\>/
     }
    ];

// match an ISBN with arbitrary hyphens (note: this is fairly permissive, downfiltered by following code)
var ISBNRegex = /\b\d(\d|\-){8,}(\d|X)\b/g;

// Should be smart enough to figure if ISBN13 and ISBN10 refer to same entity 
function findISBNs(s) {
    var matches = s.match(ISBNRegex);
    var realMatches = {};
    for (i in matches) {
	var trimmed = matches[i].replace(/\-/g,'');
	if (trimmed.length == 10 && validateISBN10(trimmed)) {
	    var key = trimmed.substring(0,9);
	    realMatches[key] = trimmed;
	} else if (trimmed.length == 13 && validateISBN13(trimmed)) {
	    var key = trimmed.substring(3,12)
	    realMatches[key] = trimmed;
	}
    }
    realMatches = values(realMatches);
    console.log("ISBNs found: " + realMatches.toString());
    return realMatches;
}

// DOI/SciHub (TODO if any more things added, make this properly data-driven)
// Note: unlike the ISBN/libraries, this does not ping a server to see if the resource exists.
// SciHub doesn't have an API or other way to easily do this, AFAICT.

var sciHubBase = "http://sci-hub.tw/"; // This changes frequently

// From https://github.com/zaytoun/scihub.py/blob/master/scihub/scihub.py
// Not used yet.
var sciHubHosts =  ['sci-hub.hk',
                    'sci-hub.tw',
                    'sci-hub.la',
                    'sci-hub.mn',
                    'sci-hub.name',
                    'sci-hub.is',
                    'sci-hub.tv',
                    'sci-hub.ws',
                    'www.sci-hub.cn',
                    'sci-hub.sci-hub.hk',
                    'sci-hub.sci-hub.tw',
                    'sci-hub.sci-hub.mn',
                    'sci-hub.sci-hub.tv',
                    'tree.sci-hub.la'];

var DOIRegex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>\[\]])\S)+)/g;

const unique = (value, index, self) => {
    return self.indexOf(value) === index;
}

function findDOIs(s) {
    var matches = s.match(DOIRegex)
    if (matches == null)
	return [];
    else 
	return matches.filter(unique);
}

function makeSciHubUrl(doi) {
    return sciHubBase + doi;
}


// utils

// amazed this isn't built-in somewhere
function values(obj) {

    return Object.keys(obj).map(function (key) {return obj[key];})
}

// validates a 10-digit ISBN (with hyphens stripped out)
function validateISBN10(isbn) {
    var sum = 0
    for (var i=0;i<9;i++) {
	sum += parseInt(isbn[i]) * (i + 1)
    }
    var check = sum % 11;
    var checkd = (check == 10) ? "X" : check.toString();
    return checkd == isbn[9];
}

function validateISBN13(isbn) {
    var prefix = isbn.substring(0,3);
    // TODO validate check digit, but has some funky algorithm
    return prefix == '978' || prefix == '979';
}


function doPopup() {
    var pageText = document.body.innerText;
    // page must contain "ISBN" for any matches
    if (pageText.match(/ISBN/)) {
	var isbns = findISBNs(pageText);
	for (idx in isbns) {
	    for (i in libraries) {
		doQuery(libraries[i], isbns[idx]);
	    }
	}
    }
    var dois = findDOIs(pageText);
    for (idx in dois) {
	var doi = dois[idx];
	insertLink(makeResultItem(), makeSciHubUrl(doi), "SciHub " + doi);
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

function insertOpenClose() {
    openclose = document.createElement('div');
    openclose.setAttribute('class', 'libriumopener');
    opencloseUpdate();
    openclose.addEventListener('click', openCloseHandler, true);
    return openclose;
}

function insertImgLink(container, imgUrl, linkUrl) {
    var link = document.createElement('a');	
    if (linkUrl) link.setAttribute('href', linkUrl);
    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('border', '0');
    img.setAttribute('style', 'vertical-align: middle');
    link.appendChild(img);
    container.appendChild(link);
    return link;
}

function insertImg(container, imgUrl) {
    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('border', '0');
    img.setAttribute('style', 'vertical-align: middle');
    container.appendChild(img);
    return img;
}

function opencloseUpdate() {
    openclose.innerHTML = ''
    ifOpen(
	function () {
	    insertImg(openclose, chrome.extension.getURL("down.png"));
	    hide(closedPane);
	    show(openPane);
	},
	function () {
	    insertImg(openclose, chrome.extension.getURL("up.png"));
	    hide(openPane);
	    show(closedPane);
	});
}

function insertLink(container, url, title) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
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

// contents views
var pane;
var openPane;
var closedPane;

function makeResultItem() {
    makeWindow();
    // TODO this is all very provisional
    var div = document.createElement('div');    
    div.setAttribute('class','entry');
    openPane.appendChild(div);
    return div;
}


function showNegResults(library, x) {
    var msg = library.name + " doesn't have " + x;
    if (showMisses) {
	insertText(makeResultItem(), msg);
    } else {
	console.log(msg);
    }
}

var resultCount = 0;

function showResults(library, isbn, results) {
    resultCount += 1;
    updateOpenView(library, isbn, results)
    updateClosedView()
}

function updateClosedView() {
    closedPane.innerHTML = resultCount + " items found";
}

function updateOpenView(library, isbn, results) {
    var name = isbn;
    if (library.title_extractor) {
	var match = results.match(library.title_extractor);
	if (match) {
	    name = match[1];
	}
    }
    // conceivable this would be a different URL, but most times the query url will also be display url
    insertLink(makeResultItem(), makeQueryUrl(library, isbn), library.name + " has " + name);
}


function makeQueryUrl(library, isbn) {
    return library.template.replace(/#{ISBN}/, isbn);
}

function doQuery(library, ISBN) {
    chrome.extension.sendMessage({cmd:"crossScript", url: makeQueryUrl(library, ISBN)},
				 function(response) {
				     if (response.status == 200) {
					 var results = response.text();
					 if (results.length == 0) {
					     console.log(library.name + ": empty");
					 } else if (results.match(library.test_bad)) {
					     showNegResults(library, ISBN);
					 }
					 else {
					     showResults(library, ISBN, results);
					 }
				     }
				     else {
					 insertError(response.status());
				     }
				 }
				);
}
				

// function doQuery(library, ISBN) {
//     var xhr = new XMLHttpRequest();
//     xhr.open("GET", makeQueryUrl(library, ISBN), true);
//     xhr.withCredentials = true;
//     xhr.onreadystatechange = function() {
// 	if (xhr.readyState == XMLHttpRequest.DONE) {
// 	    if (xhr.status = 200) {
// 		var results = xhr.responseText;
// 		if (results.length == 0) {
// 		    console.log(library.name + ": empty");
// 		} else
// 		if (results.match(library.test_bad)) {
// 		    showNegResults(library, ISBN);
// 		}
// 		else {
// 		    showResults(library, ISBN, results);
// 		}
// 	    }
// 	    else {
// 		insertError(xhr.status, xhr.statusText);
// 	    }
// 	}
//     };
//     xhr.send();
// }

function ifOpen(yes, no) {
    chrome.extension.sendMessage({cmd:"isOpen"}, function(response) {
	if (response) {
	    yes.call();
	}
	else {
	    no.call();
	}
    });
}

function invertOpen() {
    chrome.extension.sendMessage({cmd:"switchOpen"}, function(response) {
    });
}

// unused
function setOpen(nv) {
    chrome.extension.sendMessage({cmd:"setOpen",value: nv}, function(response) {
    });
}

function openCloseHandler() {
    invertOpen();
    opencloseUpdate();
}

function hide(elt) {
    elt.style.display = "none";
}
function show(elt) {
    elt.style.display = "block";
}

function insertEndMatter() {

    var div = document.createElement('div');
    div.setAttribute('class','libriumfooter');
    pane.appendChild(div);

    insertLink(div, homeSiteUrl, "Librium");
    insertText(div, ' ');

    div.appendChild(insertOpenClose());

}

function  makeWindow() {
    if (pane == null) {

	addStyleLink(chrome.extension.getURL("reset.css"));
	addStyleLink(chrome.extension.getURL("librium.css"));

	var body = document.getElementsByTagName('body')[0];
	var div = document.createElement('div');
	div.setAttribute('id', 'Librium');
	div.setAttribute('class', 'librium');

	pane = document.createElement('div');
	pane.setAttribute('class','libriuminner');
	
	div.appendChild(pane);

	openPane = document.createElement('div');
	openPane.setAttribute('class','libriuminner');
	openPane.setAttribute('id','openpane');
	pane.appendChild(openPane);

	closedPane = document.createElement('div');
	closedPane.setAttribute('class','libriuminner');
	closedPane.setAttribute('id','closedpane');
	pane.appendChild(closedPane);
	hide(closedPane);

	body.appendChild(div);

	insertEndMatter();

    }
    return pane;
}

if (!(typeof(document) == "undefined")) {
    doPopup();
 }



