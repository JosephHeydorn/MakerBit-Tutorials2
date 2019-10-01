"use strict";
/// <reference path="../../built/pxtlib.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var data = require("./data");
var sui = require("./sui");
var pkg = require("./package");
var core = require("./core");
var codecard = require("./codecard");
var electron = require("./electron");
var workspace = require("./workspace");
var dialogs = require("./dialogs");
var searchInput_1 = require("./components/searchInput");
var ScriptSearchMode;
(function (ScriptSearchMode) {
    ScriptSearchMode[ScriptSearchMode["Extensions"] = 0] = "Extensions";
    ScriptSearchMode[ScriptSearchMode["Boards"] = 1] = "Boards";
    ScriptSearchMode[ScriptSearchMode["Experiments"] = 2] = "Experiments";
})(ScriptSearchMode = exports.ScriptSearchMode || (exports.ScriptSearchMode = {}));
var ScriptSearch = /** @class */ (function (_super) {
    __extends(ScriptSearch, _super);
    function ScriptSearch(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            searchFor: '',
            visible: false,
            mode: ScriptSearchMode.Extensions,
            closeIcon: true
        };
        _this.hide = _this.hide.bind(_this);
        _this.handleSearch = _this.handleSearch.bind(_this);
        _this.addUrl = _this.addUrl.bind(_this);
        _this.addBundle = _this.addBundle.bind(_this);
        _this.installGh = _this.installGh.bind(_this);
        _this.addLocal = _this.addLocal.bind(_this);
        _this.toggleExperiment = _this.toggleExperiment.bind(_this);
        _this.importExtensionFile = _this.importExtensionFile.bind(_this);
        return _this;
    }
    ScriptSearch.prototype.hide = function () {
        this.setState({ visible: false });
        // something changed?
        if (this.state.mode == ScriptSearchMode.Experiments &&
            this.state.experimentsState !== pxt.editor.experiments.state())
            this.props.parent.reloadEditor();
    };
    ScriptSearch.prototype.afterHide = function () {
        var r = this.state.resolve;
        if (r) {
            this.setState({ resolve: undefined });
            r();
        }
    };
    ScriptSearch.prototype.showExtensions = function () {
        this.setState({
            visible: true,
            searchFor: '',
            mode: ScriptSearchMode.Extensions,
            closeIcon: true,
            features: undefined,
            resolve: undefined
        });
    };
    ScriptSearch.prototype.showBoardsAsync = function (features, closeIcon) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.setState({
                visible: true,
                searchFor: '',
                mode: ScriptSearchMode.Boards,
                closeIcon: !!closeIcon,
                features: features,
                resolve: resolve
            });
        });
    };
    ScriptSearch.prototype.showExperiments = function () {
        this.setState({
            visible: true, searchFor: '',
            mode: ScriptSearchMode.Experiments,
            closeIcon: true,
            experimentsState: pxt.editor.experiments.state(),
            features: undefined,
            resolve: undefined
        });
    };
    ScriptSearch.prototype.fetchUrlData = function () {
        var emptyResult = {
            data: [],
            status: data.FetchStatus.Complete
        };
        if (!this.state.searchFor || this.state.mode != ScriptSearchMode.Extensions)
            return emptyResult;
        var scriptid = pxt.Cloud.parseScriptId(this.state.searchFor);
        if (!scriptid) {
            return emptyResult;
        }
        var res = this.getDataWithStatus("cloud-search:" + scriptid);
        if (!res.data || (res.data && res.data.statusCode === 404))
            res.data = []; // No shared project with that URL exists
        // cloud may return single result, wrapping in array
        if (!Array.isArray(res.data))
            res.data = [res.data];
        return res;
    };
    ScriptSearch.prototype.fetchGhData = function () {
        var emptyResult = {
            data: [],
            status: data.FetchStatus.Complete
        };
        if (this.state.mode != ScriptSearchMode.Extensions)
            return emptyResult;
        var cloud = pxt.appTarget.cloud || {};
        if (!cloud.packages)
            return emptyResult;
        var searchFor = cloud.githubPackages ? this.state.searchFor : undefined;
        if (!searchFor) {
            var trgConfigFetch = this.getDataWithStatus("target-config:");
            var trgConfig = trgConfigFetch.data;
            if (trgConfigFetch.status === data.FetchStatus.Complete && trgConfig && trgConfig.packages && trgConfig.packages.preferredRepos) {
                searchFor = trgConfig.packages.preferredRepos.join("|");
            }
        }
        if (!searchFor)
            return emptyResult; // No search result and no preferred packages = no results for GH packages
        var res = this.getDataWithStatus("gh-search:" + searchFor);
        if (!res.data || res.data.statusCode === 404) {
            res.data = [];
        }
        return res;
    };
    ScriptSearch.prototype.fetchLocal = function () {
        if (this.state.mode != ScriptSearchMode.Extensions)
            return [];
        return workspace.getHeaders()
            .filter(function (h) { return !!h.githubId; });
    };
    ScriptSearch.prototype.fetchBundled = function () {
        if (this.state.mode != ScriptSearchMode.Boards &&
            this.state.mode != ScriptSearchMode.Extensions)
            return [];
        var query = this.state.searchFor;
        var bundled = pxt.appTarget.bundledpkgs;
        var boards = this.state.mode == ScriptSearchMode.Boards;
        var features = this.state.features;
        return Object.keys(bundled).filter(function (k) { return !/prj$/.test(k); })
            .map(function (k) { return JSON.parse(bundled[k]["pxt.json"]); })
            .filter(function (pk) { return !pk.hidden; })
            .filter(function (pk) { return !query || pk.name.toLowerCase().indexOf(query.toLowerCase()) > -1; }) // search filter
            .filter(function (pk) { return boards || !pkg.mainPkg.deps[pk.name] || pkg.mainPkg.deps[pk.name].cppOnly; }) // don't show package already referenced in extensions
            .filter(function (pk) { return !/---/.test(pk.name); }) //filter any package with ---, these are part of common-packages such as core---linux or music---pwm
            .filter(function (pk) { return boards == !!pk.core; }) // show core in "boards" mode
            .filter(function (pk) { return !features || features.every(function (f) { return pk.features && pk.features.indexOf(f) > -1; }); }); // ensure features are supported
    };
    ScriptSearch.prototype.fetchExperiments = function () {
        if (this.state.mode != ScriptSearchMode.Experiments)
            return [];
        return pxt.editor.experiments.all();
    };
    ScriptSearch.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.visible != nextState.visible
            || this.state.searchFor != nextState.searchFor
            || this.state.mode != nextState.mode;
    };
    ScriptSearch.prototype.componentDidUpdate = function () {
        var searchInput = ReactDOM.findDOMNode(this.refs["searchInput"]);
        if (searchInput) {
            searchInput.focus();
        }
    };
    ScriptSearch.prototype.handleSearch = function (str) {
        // Hidden navigation, used to test /beta or other versions inside released UWP apps
        // Secret prefix is /@, e.g.: /@beta
        var urlPathExec = /^\/@(.*)$/.exec(str);
        var urlPath = urlPathExec && urlPathExec[1];
        if (urlPath) {
            if (urlPath === "devtools" && pxt.BrowserUtils.isPxtElectron()) {
                electron.openDevTools();
                this.hide();
                this.afterHide();
            }
            else {
                var homeUrl_1 = pxt.appTarget.appTheme.homeUrl;
                if (!/\/$/.test(homeUrl_1)) {
                    homeUrl_1 += "/";
                }
                urlPath = urlPath.replace(/^\//, "");
                pxt.winrt.releaseAllDevicesAsync()
                    .then(function () {
                    window.location.href = homeUrl_1 + urlPath;
                })
                    .done();
            }
        }
        else {
            this.setState({ searchFor: str });
        }
    };
    ScriptSearch.prototype.addUrl = function (scr) {
        var _this = this;
        this.hide();
        var p = pkg.mainEditorPkg();
        return p.addDepAsync(scr.name, "pub:" + scr.id)
            .then(function () { return _this.props.parent.reloadHeaderAsync(); })
            .finally(function () { return _this.afterHide(); });
    };
    ScriptSearch.prototype.addBundle = function (scr) {
        var _this = this;
        pxt.tickEvent("packages.bundled", { name: scr.name });
        this.hide();
        this.addDepIfNoConflict(scr, "*")
            .finally(function () { return _this.afterHide(); });
    };
    ScriptSearch.prototype.addLocal = function (hd) {
        var _this = this;
        pxt.tickEvent("packages.local");
        this.hide();
        workspace.getTextAsync(hd.id)
            .then(function (files) {
            var cfg = JSON.parse(files[pxt.CONFIG_NAME]);
            return _this.addDepIfNoConflict(cfg, "workspace:" + hd.id);
        })
            .finally(function () { return _this.afterHide(); });
    };
    ScriptSearch.prototype.installGh = function (scr) {
        var _this = this;
        pxt.tickEvent("packages.github", { name: scr.fullName });
        this.hide();
        core.showLoading("downloadingpackage", lf("downloading extension..."));
        pxt.packagesConfigAsync()
            .then(function (config) { return pxt.github.latestVersionAsync(scr.fullName, config); })
            .then(function (tag) { return pxt.github.pkgConfigAsync(scr.fullName, tag)
            .then(function (cfg) {
            core.hideLoading("downloadingpackage");
            return cfg;
        })
            .then(function (cfg) { return _this.addDepIfNoConflict(cfg, "github:" + scr.fullName + "#" + tag); }); })
            .catch(core.handleNetworkError)
            .finally(function () {
            _this.afterHide();
            core.hideLoading("downloadingpackage");
        });
    };
    ScriptSearch.prototype.addDepIfNoConflict = function (config, version) {
        var _this = this;
        return pkg.mainPkg.findConflictsAsync(config, version)
            .then(function (conflicts) {
            var inUse = config.core ? [] // skip conflict checking for a new core package
                : conflicts.filter(function (c) { return pkg.mainPkg.isPackageInUse(c.pkg0.id); });
            var addDependencyPromise = Promise.resolve(true);
            if (inUse.length) {
                addDependencyPromise = addDependencyPromise
                    .then(function () { return core.confirmAsync({
                    header: lf("Cannot add {0} extension", config.name),
                    hideCancel: true,
                    agreeLbl: lf("Ok"),
                    body: lf("Remove all the blocks from the {0} extension and try again.", inUse[0].pkg0.id)
                }); })
                    .then(function () {
                    return false;
                });
            }
            else if (conflicts.length) {
                var body_1 = conflicts.length === 1 ?
                    // Single conflict: "Extension A is..."
                    lf("Extension {0} is incompatible with {1}. Remove {0} and add {1}?", conflicts[0].pkg0.id, config.name) :
                    // 2 conflicts: "Extensions A and B are..."; 3+ conflicts: "Extensions A, B, C and D are..."
                    lf("Extensions {0} and {1} are incompatible with {2}. Remove them and add {2}?", conflicts.slice(0, -1).map(function (c) { return c.pkg0.id; }).join(", "), conflicts.slice(-1)[0].pkg0.id, config.name);
                addDependencyPromise = addDependencyPromise
                    .then(function () { return _this.state.mode == ScriptSearchMode.Boards
                    ? Promise.resolve(1)
                    : core.confirmAsync({
                        header: lf("Some extensions will be removed"),
                        agreeLbl: lf("Remove extension(s) and add {0}", config.name),
                        agreeClass: "pink",
                        body: body_1
                    }); })
                    .then(function (buttonPressed) {
                    if (buttonPressed !== 0) {
                        var p_1 = pkg.mainEditorPkg();
                        return Promise.all(conflicts.map(function (c) {
                            return p_1.removeDepAsync(c.pkg0.id);
                        }))
                            .then(function () { return true; });
                    }
                    return Promise.resolve(false);
                });
            }
            return addDependencyPromise
                .then(function (shouldAdd) {
                if (shouldAdd) {
                    var p = pkg.mainEditorPkg();
                    return p.addDepAsync(config.name, version)
                        .then(function () { return _this.props.parent.reloadHeaderAsync(); });
                }
                return Promise.resolve();
            });
        });
    };
    ScriptSearch.prototype.toggleExperiment = function (experiment) {
        pxt.editor.experiments.toggle(experiment);
        pxt.tickEvent("experiments.toggle", { "experiment": experiment.id, "enabled": pxt.editor.experiments.isEnabled(experiment) ? 1 : 0 }, { interactiveConsent: true });
        this.forceUpdate();
    };
    ScriptSearch.prototype.importExtensionFile = function () {
        pxt.tickEvent("extensions.import", undefined, { interactiveConsent: true });
        this.hide();
        this.props.parent.showImportFileDialog({ extension: true });
    };
    ScriptSearch.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, mode = _a.mode, closeIcon = _a.closeIcon, visible = _a.visible, searchFor = _a.searchFor, experimentsState = _a.experimentsState;
        if (!visible)
            return React.createElement("div", null);
        var bundles = this.fetchBundled();
        var ghdata = this.fetchGhData();
        var urldata = this.fetchUrlData();
        var local = this.fetchLocal();
        var experiments = this.fetchExperiments();
        var isSearching = searchFor && (ghdata.status === data.FetchStatus.Pending || urldata.status === data.FetchStatus.Pending);
        var disableFileAccessinMaciOs = pxt.appTarget.appTheme.disableFileAccessinMaciOs && (pxt.BrowserUtils.isIOS() || pxt.BrowserUtils.isMac());
        var showImportFile = mode == ScriptSearchMode.Extensions
            && pxt.appTarget.appTheme.importExtensionFiles
            && !disableFileAccessinMaciOs
            && !searchFor;
        var compareConfig = function (a, b) {
            // core first
            if (a.core != b.core)
                return a.core ? -1 : 1;
            // non-beta first
            var abeta = pxt.isPkgBeta(a);
            var bbeta = pxt.isPkgBeta(b);
            if (abeta != bbeta)
                return abeta ? 1 : -1;
            // use weight if core packages
            var aweight = a.weight === undefined ? 50 : a.weight;
            var bweight = b.weight === undefined ? 50 : b.weight;
            if (aweight != bweight)
                return -aweight + bweight;
            // alphabetical sort
            return pxt.Util.strcmp(a.name, b.name);
        };
        bundles.sort(compareConfig);
        var isEmpty = function () {
            if (!searchFor || isSearching) {
                return false;
            }
            return bundles.length + ghdata.data.length + urldata.data.length === 0;
        };
        var headerText = mode == ScriptSearchMode.Boards ? lf("Boards")
            : mode == ScriptSearchMode.Experiments ? lf("Experiments")
                : lf("Extensions");
        var description = mode == ScriptSearchMode.Boards ? lf("Change development board")
            : mode == ScriptSearchMode.Experiments ? lf("Turn on and off experimental features")
                : lf("Add an extension to the project");
        var helpPath = mode == ScriptSearchMode.Boards ? "/boards"
            : mode == ScriptSearchMode.Experiments ? "/experiments"
                : "/extensions";
        var experimentsChanged = mode == ScriptSearchMode.Experiments
            && experimentsState != pxt.editor.experiments.state();
        return (React.createElement(sui.Modal, { isOpen: visible, dimmer: true, className: "searchdialog", size: "fullscreen", onClose: this.hide, closeIcon: closeIcon, header: headerText, helpUrl: helpPath, closeOnDimmerClick: true, closeOnEscape: true, description: description },
            React.createElement("div", { className: "ui" },
                mode == ScriptSearchMode.Experiments ?
                    React.createElement("div", { className: "ui message info" },
                        React.createElement("div", { className: "header" }, lf("WARNING: EXPERIMENTAL FEATURES AHEAD!")),
                        lf("Try out these features and tell us what you think!")) : undefined,
                mode == ScriptSearchMode.Extensions ?
                    React.createElement(searchInput_1.SearchInput, { key: "search", ariaMessage: lf("{0} result matching '{1}'", bundles.length + ghdata.data.length + urldata.data.length, searchFor), placeholder: lf("Search or enter project URL..."), searchHandler: this.handleSearch, inputClassName: "fluid", autoFocus: true, disabled: isSearching }) : undefined,
                isSearching ?
                    React.createElement("div", { className: "ui medium active centered inline loader" })
                    :
                        React.createElement("div", { className: "ui cards centered", role: "listbox" },
                            urldata.data.map(function (scr) {
                                return React.createElement(ScriptSearchCodeCard, { key: 'url' + scr.id, name: scr.name, description: scr.description, url: "/" + scr.id, scr: scr, onCardClick: _this.addUrl, role: "link" });
                            }),
                            local.map(function (scr) {
                                return React.createElement(ScriptSearchCodeCard, { key: 'local' + scr.id, name: scr.name, description: lf("Local copy of {0} hosted on github.com", scr.githubId), url: "https://github.com/" + scr.githubId, imageUrl: scr.icon, scr: scr, onCardClick: _this.addLocal, label: lf("Local"), title: lf("Local GitHub extension"), labelClass: "blue right ribbon", role: "link" });
                            }),
                            bundles.map(function (scr) {
                                return React.createElement(ScriptSearchCodeCard, { key: 'bundled' + scr.name, name: scr.name, description: scr.description, url: "/" + scr.installedVersion, imageUrl: scr.icon, scr: scr, onCardClick: _this.addBundle, label: pxt.isPkgBeta(scr) ? lf("Beta") : undefined, role: "link" });
                            }),
                            ghdata.data.filter(function (repo) { return repo.status == pxt.github.GitRepoStatus.Approved; }).map(function (scr) {
                                return React.createElement(ScriptSearchCodeCard, { name: scr.name.replace(/^pxt-/, ""), description: scr.description, key: 'gha' + scr.fullName, scr: scr, onCardClick: _this.installGh, url: 'github:' + scr.fullName, imageUrl: pxt.github.repoIconUrl(scr), label: pxt.isPkgBeta(scr) ? lf("Beta") : undefined, role: "link", learnMoreUrl: "/pkg/" + scr.fullName });
                            }),
                            ghdata.data.filter(function (repo) { return repo.status != pxt.github.GitRepoStatus.Approved; }).map(function (scr) {
                                return React.createElement(ScriptSearchCodeCard, { name: scr.name.replace(/^pxt-/, ""), description: (scr.description || ""), extracontent: lf("User-provided extension, not endorsed by Microsoft."), key: 'ghd' + scr.fullName, scr: scr, onCardClick: _this.installGh, imageUrl: pxt.github.repoIconUrl(scr), label: pxt.isPkgBeta(scr) ? lf("Beta") : undefined, url: 'github:' + scr.fullName, role: "link", learnMoreUrl: "/pkg/" + scr.fullName });
                            }),
                            experiments.map(function (experiment) {
                                return React.createElement(ScriptSearchCodeCard, { name: experiment.name, scr: experiment, imageUrl: "/static/experiments/" + experiment.id.toLowerCase() + ".png", description: experiment.description, key: 'exp' + experiment.id, role: "link", label: pxt.editor.experiments.isEnabled(experiment) ? lf("Enabled") : lf("Disabled"), labelClass: pxt.editor.experiments.isEnabled(experiment) ? "green right ribbon" : "grey right ribbon", onCardClick: _this.toggleExperiment, feedbackUrl: experiment.feedbackUrl });
                            }),
                            showImportFile ? React.createElement(codecard.CodeCardView, { ariaLabel: lf("Open files from your computer"), role: "button", key: 'import', icon: "upload ui cardimage", iconColor: "secondary", name: lf("Import File..."), description: lf("Open files from your computer"), onClick: this.importExtensionFile }) : undefined),
                isEmpty() ?
                    React.createElement("div", { className: "ui items" },
                        React.createElement("div", { className: "ui item" }, lf("We couldn't find any extensions matching '{0}'", searchFor)))
                    : undefined),
            experimentsChanged ?
                React.createElement("div", { className: "ui warning message" },
                    React.createElement("div", { className: "header" }, lf("Experiments changed")),
                    lf("The editor will reload when leaving this page.")) : undefined,
            mode == ScriptSearchMode.Extensions ? dialogs.githubFooter(lf("Want to create your own extension?"), this.hide) : undefined));
    };
    return ScriptSearch;
}(data.Component));
exports.ScriptSearch = ScriptSearch;
var ScriptSearchCodeCard = /** @class */ (function (_super) {
    __extends(ScriptSearchCodeCard, _super);
    function ScriptSearchCodeCard(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    ScriptSearchCodeCard.prototype.handleClick = function () {
        var _a = this.props, scr = _a.scr, onCardClick = _a.onCardClick;
        onCardClick(scr);
    };
    ScriptSearchCodeCard.prototype.renderCore = function () {
        var _a = this.props, onCardClick = _a.onCardClick, onClick = _a.onClick, scr = _a.scr, rest = __rest(_a, ["onCardClick", "onClick", "scr"]);
        return React.createElement(codecard.CodeCardView, __assign({}, rest, { onClick: this.handleClick }));
    };
    return ScriptSearchCodeCard;
}(sui.StatelessUIElement));
