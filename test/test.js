load("../extension/script.js")

var goodISBN = "9781524731656";
var badISBN = "9780870334337";

function warn(s) {
    print(s);
}

function testLibrary(lib) {
    print("testing " + lib.name);
    var good = readUrl(makeQueryUrl(lib, goodISBN))
    var bad = readUrl(makeQueryUrl(lib, badISBN));
    
    if (good.match(lib.test_bad)) {
	warn(lib.name + ": good page matched as bad");
    }
    if (!bad.match(lib.test_bad)) {
	warn(lib.name + ": bad page matched as good");
    }
    if (!good.match(lib.title_extractor)) {
	warn(lib.name + ": title extract failed");
    }
}

for (i in libraries) {
    testLibrary(libraries[i]);
}
