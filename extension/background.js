function isOpen() {
    // default to true
    return localStorage.getItem('librium_open') != "false"
}

// good christ chrome makes you jump through hopes to store 1 bit
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
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
	}
    });
