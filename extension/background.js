function isOpen() {
    // default to true
    return localStorage.getItem('librium_open') != "false"
}

// good christ chrome makes you jump through hopes to store 1 bit
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log("hatemylife" + request.cmd)
	if (request.cmd == "isOpen")
	    sendResponse(isOpen());
	else if (request.cmd == "setOpen") {
	    var nv = request.value;
	    localStorage.setItem('librium_open', nv);
	    sendResponse("set");
	} else if (request.cmd == "switchOpen") {
	    var nv = !(isOpen());
	    localStorage.setItem('librium_open', nv);
	    sendResponse(nv);
	} else if (request.cmd == "crossScript") {
	    var url = request.url;
	    console.log("pkm: " + url);
	    fetch(url)
		.then(function(response) {
		    sendResponse(response.text())
		});
		      
	}
    });

