load("../extension/script.js")

// Note: these aren't actually valid (or invalid) everywhere, need to do this on a per-site basis I think.
var goodISBN = "9781524731656";
var badISBN = "9780870334337";

// Note: the extension requires https:, but the test require that UCSF and Link+ urls be changed to http: Argh.


function warn(s) {
    print(s);
}

function writeContents(c, file) {
    var f = new java.io.File(file);
    var w = new java.io.FileWriter(f);
    w.write(c);
    w.close();
}

function download(lib) {
    
}

function testLibrary(lib) {

    print("testing " + lib.name);
    var realGoodISBN = goodISBN;
    if (lib.name == 'UCSF') { realGoodISBN = '0867209372'; }

    var good = readUrl(makeQueryUrl(lib, realGoodISBN))
    var bad = readUrl(makeQueryUrl(lib, badISBN));

    writeContents(good, lib.name + "-good.html");
    writeContents(bad, lib.name + "-bad.html");

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


