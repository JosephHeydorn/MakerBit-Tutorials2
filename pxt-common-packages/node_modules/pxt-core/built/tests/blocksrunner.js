/// <reference path="..\..\localtypings\pxtblockly.d.ts" />
/// <reference path="..\..\built\pxtblocks.d.ts" />
/// <reference path="..\..\built\pxtcompiler.d.ts" />
/// <reference path="..\..\built\pxteditor.d.ts" />
var WEB_PREFIX = "http://localhost:9876";
// Blockly crashes if this isn't defined
Blockly.Msg.DELETE_VARIABLE = "Delete the '%1' variable";
// target.js should be embedded in the page
pxt.setAppTarget(window.pxtTargetBundle);
// Webworker needs this config to run
pxt.webConfig = {
    relprefix: undefined,
    verprefix: undefined,
    workerjs: WEB_PREFIX + "/blb/worker.js",
    monacoworkerjs: undefined,
    gifworkerjs: undefined,
    pxtVersion: undefined,
    pxtRelId: undefined,
    pxtCdnUrl: undefined,
    commitCdnUrl: undefined,
    blobCdnUrl: undefined,
    cdnUrl: undefined,
    targetVersion: undefined,
    targetRelId: undefined,
    targetUrl: undefined,
    targetId: undefined,
    simUrl: undefined,
    partsUrl: undefined,
    runUrl: undefined,
    docsUrl: undefined,
    isStatic: undefined,
};
var BlocklyCompilerTestHost = /** @class */ (function () {
    function BlocklyCompilerTestHost() {
    }
    BlocklyCompilerTestHost.createTestHostAsync = function () {
        if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.extendFieldEditors && pxt.editor.initFieldExtensionsAsync) {
            return pxt.editor.initFieldExtensionsAsync({})
                .then(function (res) {
                if (res.fieldEditors)
                    res.fieldEditors.forEach(function (fi) {
                        pxt.blocks.registerFieldEditor(fi.selector, fi.editor, fi.validator);
                    });
            })
                .then(function () { return new BlocklyCompilerTestHost(); });
        }
        return Promise.resolve(new BlocklyCompilerTestHost());
    };
    BlocklyCompilerTestHost.prototype.readFile = function (module, filename) {
        if (module.id == "this" && filename == "pxt.json") {
            return JSON.stringify(pxt.appTarget.blocksprj.config);
        }
        var bundled = pxt.getEmbeddedScript(module.id);
        if (bundled) {
            return bundled[filename];
        }
        return "";
    };
    BlocklyCompilerTestHost.prototype.writeFile = function (module, filename, contents) {
        if (filename == pxt.CONFIG_NAME)
            return; // ignore config writes
        throw ts.pxtc.Util.oops("trying to write " + module + " / " + filename);
    };
    BlocklyCompilerTestHost.prototype.getHexInfoAsync = function (extInfo) {
        return pxt.hex.getHexInfoAsync(this, extInfo);
    };
    BlocklyCompilerTestHost.prototype.cacheStoreAsync = function (id, val) {
        return Promise.resolve();
    };
    BlocklyCompilerTestHost.prototype.cacheGetAsync = function (id) {
        return Promise.resolve(null);
    };
    BlocklyCompilerTestHost.prototype.downloadPackageAsync = function (pkg) {
        return Promise.resolve();
    };
    BlocklyCompilerTestHost.cachedFiles = {};
    return BlocklyCompilerTestHost;
}());
function fail(msg) {
    chai.assert(false, msg);
}
var cachedBlocksInfo;
function getBlocksInfoAsync() {
    if (cachedBlocksInfo) {
        return Promise.resolve(cachedBlocksInfo);
    }
    return BlocklyCompilerTestHost.createTestHostAsync()
        .then(function (host) {
        var pkg = new pxt.MainPackage(host);
        return pkg.getCompileOptionsAsync();
    }, function (err) { return fail('Unable to create test host'); })
        .then(function (opts) {
        opts.ast = true;
        var resp = pxtc.compile(opts);
        if (resp.diagnostics && resp.diagnostics.length > 0)
            resp.diagnostics.forEach(function (diag) { return console.error(diag.messageText); });
        if (!resp.success)
            return Promise.reject("Could not compile");
        // decompile to blocks
        var apis = pxtc.getApiInfo(resp.ast, opts.jres);
        var blocksInfo = pxtc.getBlocksInfo(apis);
        pxt.blocks.initializeAndInject(blocksInfo);
        cachedBlocksInfo = blocksInfo;
        return cachedBlocksInfo;
    }, function (err) { return fail('Could not get compile options'); });
}
function testXmlAsync(blocksfile) {
    return initAsync()
        .then(function () { return getBlocksInfoAsync(); })
        .then(function (blocksInfo) {
        var workspace = new Blockly.Workspace();
        Blockly.mainWorkspace = workspace;
        var xml = Blockly.Xml.textToDom(blocksfile);
        try {
            Blockly.Xml.domToWorkspace(xml, workspace);
        }
        catch (e) {
            if (e.message && e.message.indexOf("isConnected") !== -1) {
                fail("Could not build workspace, this usually means a blockId (aka blockly 'type') changed");
            }
            fail(e.message);
        }
        var err = compareBlocklyTrees(xml, Blockly.Xml.workspaceToDom(workspace));
        if (err) {
            fail("XML mismatch (" + err.reason + ") " + err.chain + " \n See https://makecode.com/develop/blockstests for more info");
        }
    }, function (err) { return fail("Unable to get block info: " + JSON.stringify(err)); });
}
function mkLink(el) {
    var tag = el.tagName.toLowerCase();
    switch (tag) {
        case "block":
        case "shadow":
            return "<" + tag + " type=\"" + el.getAttribute("type") + "\">";
        case "value":
        case "statement":
        case "title":
        case "field":
            return "<" + tag + " name=\"" + el.getAttribute("name") + "\">";
        default:
            return "<" + tag + ">";
            ;
    }
}
function compareBlocklyTrees(a, b, prev) {
    if (prev === void 0) { prev = []; }
    prev.push(mkLink(a));
    if (!shallowEquals(a, b))
        return {
            chain: prev.join(" -> "),
            reason: "mismatched element"
        };
    for (var i = 0; i < a.childNodes.length; i++) {
        var childA = a.childNodes.item(i);
        if (childA.nodeType === Node.ELEMENT_NODE) {
            var childB = getMatchingChild(childA, b);
            if (!childB)
                return {
                    chain: prev.join(" -> "),
                    reason: "missing child " + mkLink(childA)
                };
            var err = compareBlocklyTrees(childA, childB, prev.slice());
            if (err) {
                return err;
            }
        }
    }
    return undefined;
}
function getMatchingChild(searchFor, parent) {
    for (var i = 0; i < parent.childNodes.length; i++) {
        var child = parent.childNodes.item(i);
        if (child.nodeType === Node.ELEMENT_NODE && shallowEquals(searchFor, child))
            return child;
    }
    return undefined;
}
function shallowEquals(a, b) {
    if (a.tagName.toLowerCase() !== b.tagName.toLowerCase())
        return false;
    switch (a.tagName.toLowerCase()) {
        case "block":
        case "shadow":
            return a.getAttribute("type") === b.getAttribute("type");
        case "value":
        case "statement":
            return a.getAttribute("name") === b.getAttribute("name");
        case "title":
        case "field":
            return a.getAttribute("name") === b.getAttribute("name") && a.textContent.trim() === b.textContent.trim();
        case "mutation":
            var aAttributes = a.attributes;
            var bAttributes = b.attributes;
            if (aAttributes.length !== bAttributes.length)
                return false;
            for (var i = 0; i < aAttributes.length; i++) {
                var attrName = aAttributes.item(i).name;
                if (a.getAttribute(attrName) != b.getAttribute(attrName))
                    return false;
            }
            return a.textContent.trim() === b.textContent.trim();
        case "data":
            return a.textContent.trim() === b.textContent.trim();
        case "next":
        case "comment":
            return true;
    }
    return true;
}
var init = false;
function initAsync() {
    if (init)
        return Promise.resolve();
    init = true;
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.extendFieldEditors && pxt.editor.initFieldExtensionsAsync) {
        return pxt.editor.initFieldExtensionsAsync({})
            .then(function (res) {
            if (res.fieldEditors)
                res.fieldEditors.forEach(function (fi) {
                    pxt.blocks.registerFieldEditor(fi.selector, fi.editor, fi.validator);
                });
        });
    }
    return Promise.resolve();
}
function encode(testcase) {
    return testcase.split(/[\\\/]/g).map(encodeURIComponent).join("/");
}
if (testJSON.libsTests && testJSON.libsTests.length) {
    describe("block tests in target", function () {
        this.timeout(5000);
        var _loop_1 = function (test_1) {
            describe("for package " + test_1.packageName, function () {
                var _loop_2 = function (testFile) {
                    it("file " + testFile.testName, function () { return testXmlAsync(testFile.contents); });
                };
                for (var _i = 0, _a = test_1.testFiles; _i < _a.length; _i++) {
                    var testFile = _a[_i];
                    _loop_2(testFile);
                }
            });
        };
        for (var _i = 0, _a = testJSON.libsTests; _i < _a.length; _i++) {
            var test_1 = _a[_i];
            _loop_1(test_1);
        }
    });
}
if (testJSON.commonTests && testJSON.commonTests.length) {
    describe("block tests in common-packages", function () {
        this.timeout(5000);
        var _loop_3 = function (test_2) {
            describe("for package " + test_2.packageName, function () {
                var _loop_4 = function (testFile) {
                    it("file " + testFile.testName, function () { return testXmlAsync(testFile.contents); });
                };
                for (var _i = 0, _a = test_2.testFiles; _i < _a.length; _i++) {
                    var testFile = _a[_i];
                    _loop_4(testFile);
                }
            });
        };
        for (var _i = 0, _a = testJSON.commonTests; _i < _a.length; _i++) {
            var test_2 = _a[_i];
            _loop_3(test_2);
        }
    });
}
