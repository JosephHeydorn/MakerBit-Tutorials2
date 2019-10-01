"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var pkg = require("./package");
var core = require("./core");
var srceditor = require("./srceditor");
var sui = require("./sui");
var workspace = require("./workspace");
var dialogs = require("./dialogs");
var coretsx = require("./coretsx");
var data = require("./data");
var markedui = require("./marked");
var compiler = require("./compiler");
var GithubComponent = /** @class */ (function (_super) {
    __extends(GithubComponent, _super);
    function GithubComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.diffCache = {};
        _this.goBack = _this.goBack.bind(_this);
        _this.handlePullClick = _this.handlePullClick.bind(_this);
        _this.handleBranchClick = _this.handleBranchClick.bind(_this);
        _this.handleGithubError = _this.handleGithubError.bind(_this);
        return _this;
    }
    GithubComponent.prototype.clearCache = function () {
        this.diffCache = {};
    };
    GithubComponent.prototype.saveGitJsonAsync = function (gs) {
        return __awaiter(this, void 0, void 0, function () {
            var f;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        f = pkg.mainEditorPkg().files[pxt.github.GIT_JSON];
                        return [4 /*yield*/, f.setContentAsync(JSON.stringify(gs, null, 4))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.switchToBranchAsync = function (newBranch) {
        return __awaiter(this, void 0, void 0, function () {
            var header, gs, parsed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        header = this.props.parent.state.header;
                        gs = this.getGitJson();
                        parsed = this.parsedRepoId();
                        header.githubId = parsed.fullName + "#" + newBranch;
                        gs.repo = header.githubId;
                        gs.prUrl = null;
                        return [4 /*yield*/, this.saveGitJsonAsync(gs)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.newBranchAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gid, initialBranchName, branchName, gs, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gid = this.parsedRepoId();
                        return [4 /*yield*/, pxt.github.getNewBranchNameAsync(gid.fullName, "patch-")];
                    case 1:
                        initialBranchName = _a.sent();
                        return [4 /*yield*/, core.promptAsync({
                                header: lf("New branch name"),
                                body: lf("Name cannot have spaces or special characters. Examples: {0}", "my_feature, add-colors, fix_something"),
                                agreeLbl: lf("Create"),
                                initialValue: initialBranchName
                            })];
                    case 2:
                        branchName = _a.sent();
                        if (!branchName)
                            return [2 /*return*/];
                        this.showLoading(lf("creating branch..."));
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, 7, 8]);
                        gs = this.getGitJson();
                        return [4 /*yield*/, pxt.github.createNewBranchAsync(gid.fullName, branchName, gs.commit.sha)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.switchToBranchAsync(branchName)];
                    case 5:
                        _a.sent();
                        this.forceUpdate();
                        return [3 /*break*/, 8];
                    case 6:
                        e_1 = _a.sent();
                        this.handleGithubError(e_1);
                        return [3 /*break*/, 8];
                    case 7:
                        this.hideLoading();
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.switchBranchAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var gid, branches, branchList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gid = this.parsedRepoId();
                        return [4 /*yield*/, pxt.github.listRefsExtAsync(gid.fullName, "heads")];
                    case 1:
                        branches = _a.sent();
                        branchList = Object.keys(branches.refs).map(function (r) { return ({
                            name: r,
                            description: branches.refs[r],
                            onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                                var prevBranch;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            core.hideDialog();
                                            return [4 /*yield*/, this.setStateAsync({ needsCommitMessage: false })];
                                        case 1:
                                            _a.sent();
                                            prevBranch = this.parsedRepoId().tag;
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, , 5, 8]);
                                            return [4 /*yield*/, this.switchToBranchAsync(r)];
                                        case 3:
                                            _a.sent();
                                            return [4 /*yield*/, this.pullAsync()];
                                        case 4:
                                            _a.sent();
                                            return [3 /*break*/, 8];
                                        case 5:
                                            if (!this.state.needsCommitMessage) return [3 /*break*/, 7];
                                            return [4 /*yield*/, this.switchToBranchAsync(prevBranch)];
                                        case 6:
                                            _a.sent();
                                            _a.label = 7;
                                        case 7: return [7 /*endfinally*/];
                                        case 8: return [2 /*return*/];
                                    }
                                });
                            }); }
                        }); });
                        branchList.unshift({
                            name: lf("Create new branch"),
                            description: lf("Based on {0}", gid.tag),
                            onClick: function () {
                                core.hideDialog();
                                return _this.newBranchAsync();
                            }
                        });
                        return [4 /*yield*/, core.confirmAsync({
                                header: lf("Switch to a different branch"),
                                hideAgree: true,
                                /* tslint:disable:react-a11y-anchors */
                                jsx: React.createElement("div", { className: "ui form" },
                                    React.createElement("div", { className: "ui relaxed divided list", role: "menu" }, branchList.map(function (r) {
                                        return React.createElement("div", { key: r.name, className: "item" },
                                            React.createElement("i", { className: "large github middle aligned icon" }),
                                            React.createElement("div", { className: "content" },
                                                React.createElement("a", { onClick: r.onClick, role: "menuitem", className: "header" }, r.name),
                                                React.createElement("div", { className: "description" }, r.description)));
                                    }))),
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.handleBranchClick = function (e) {
        pxt.tickEvent("github.branch");
        e.stopPropagation();
        this.switchBranchAsync().done();
    };
    GithubComponent.prototype.goBack = function () {
        pxt.tickEvent("github.backButton", undefined, { interactiveConsent: true });
        this.props.parent.openPreviousEditor();
    };
    GithubComponent.prototype.handlePullClick = function (e) {
        pxt.tickEvent("github.pull");
        this.pullAsync().done();
    };
    GithubComponent.prototype.forkAsync = function (fromError) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, pref, res, gs, newGithubId, header, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsed = this.parsedRepoId();
                        pref = fromError ? lf("You don't seem to have write permission to {0}.\n", parsed.fullName) : "";
                        return [4 /*yield*/, core.confirmAsync({
                                header: lf("Do you want to fork {0}?", parsed.fullName),
                                body: pref +
                                    lf("Forking repo creates a copy under your account. You can later ask {0} to include your changes via a pull request.", parsed.owner),
                                agreeLbl: "Fork",
                                agreeIcon: "copy outline"
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res)
                            return [2 /*return*/];
                        this.showLoading(lf("forking repo (this may take a minute or two)..."));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, 6, 7]);
                        gs = this.getGitJson();
                        return [4 /*yield*/, pxt.github.forkRepoAsync(parsed.fullName, gs.commit.sha)];
                    case 3:
                        newGithubId = _a.sent();
                        header = this.props.parent.state.header;
                        header.githubId = newGithubId;
                        gs.repo = header.githubId;
                        return [4 /*yield*/, this.saveGitJsonAsync(gs)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        e_2 = _a.sent();
                        this.handleGithubError(e_2);
                        return [3 /*break*/, 7];
                    case 6:
                        this.hideLoading();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.handleGithubError = function (e) {
        var statusCode = parseInt(e.statusCode);
        if (e.isOffline || statusCode === 0)
            core.warningNotification(lf("Please connect to internet and try again."));
        else if (statusCode == 401)
            core.warningNotification(lf("GitHub access token looks invalid; logout and try again."));
        else if (e.needsWritePermission) {
            if (this.state.triedFork) {
                core.warningNotification(lf("You don't have write permission."));
            }
            else {
                core.hideDialog();
                this.forkAsync(true).done();
            }
        }
        else {
            pxt.reportException(e);
            core.warningNotification(lf("Oops, something went wrong. Please try again."));
        }
    };
    GithubComponent.prototype.bumpAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            function onBumpChange(e) {
                bumpType = e.currentTarget.name;
                coretsx.forceUpdate();
            }
            var v, vmajor, vminor, vpatch, bumpType, ok, newv, newVer, header, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        v = pxt.semver.parse(pkg.mainPkg.config.version || "0.0.0");
                        vmajor = pxt.semver.parse(pxt.semver.stringify(v));
                        vmajor.major++;
                        vmajor.minor = 0;
                        vmajor.patch = 0;
                        vminor = pxt.semver.parse(pxt.semver.stringify(v));
                        vminor.minor++;
                        vminor.patch = 0;
                        vpatch = pxt.semver.parse(pxt.semver.stringify(v));
                        vpatch.patch++;
                        bumpType = "patch";
                        return [4 /*yield*/, core.confirmAsync({
                                header: lf("Pick a release version"),
                                agreeLbl: lf("Create release"),
                                disagreeLbl: lf("Cancel"),
                                jsxd: function () { return React.createElement("div", { className: "grouped fields" },
                                    React.createElement("label", null,
                                        lf("Choose a release version that describes the changes you made to the code."),
                                        sui.helpIconLink("/github/release#versioning", lf("Learn about version numbers."))),
                                    React.createElement("div", { className: "field" },
                                        React.createElement("div", { className: "ui radio checkbox" },
                                            React.createElement("input", { type: "radio", name: "patch", checked: bumpType == "patch", "aria-checked": bumpType == "patch", onChange: onBumpChange }),
                                            React.createElement("label", null, lf("{0}: patch (bug fixes or other non-user visible changes)", pxt.semver.stringify(vpatch))))),
                                    React.createElement("div", { className: "field" },
                                        React.createElement("div", { className: "ui radio checkbox" },
                                            React.createElement("input", { type: "radio", name: "minor", checked: bumpType == "minor", "aria-checked": bumpType == "minor", onChange: onBumpChange }),
                                            React.createElement("label", null, lf("{0}: minor change (added function or optional parameters)", pxt.semver.stringify(vminor))))),
                                    React.createElement("div", { className: "field" },
                                        React.createElement("div", { className: "ui radio checkbox" },
                                            React.createElement("input", { type: "radio", name: "major", checked: bumpType == "major", "aria-checked": bumpType == "major", onChange: onBumpChange }),
                                            React.createElement("label", null, lf("{0}: major change (renamed functions, deleted parameters or functions)", pxt.semver.stringify(vmajor)))))); }
                            })];
                    case 1:
                        ok = _a.sent();
                        if (!ok)
                            return [2 /*return*/];
                        newv = vpatch;
                        if (bumpType == "major")
                            newv = vmajor;
                        else if (bumpType == "minor")
                            newv = vminor;
                        newVer = pxt.semver.stringify(newv);
                        this.showLoading(lf("creating release..."));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, 6, 7]);
                        header = this.props.parent.state.header;
                        return [4 /*yield*/, workspace.bumpAsync(header, newVer)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.maybeReloadAsync()];
                    case 4:
                        _a.sent();
                        this.hideLoading();
                        core.infoNotification(lf("GitHub release created."));
                        return [3 /*break*/, 7];
                    case 5:
                        e_3 = _a.sent();
                        this.handleGithubError(e_3);
                        return [3 /*break*/, 7];
                    case 6:
                        this.hideLoading();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.showLoading = function (msg) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setStateAsync({ loadingMessage: msg })];
                    case 1:
                        _a.sent();
                        core.showLoading("githubjson", msg);
                        return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.hideLoading = function () {
        if (this.state.loadingMessage) {
            core.hideLoading("githubjson");
            this.setState({ loadingMessage: undefined });
        }
    };
    GithubComponent.prototype.pkgConfigKey = function (cfgtxt) {
        var cfg = JSON.parse(cfgtxt);
        delete cfg.version;
        return JSON.stringify(cfg);
    };
    GithubComponent.prototype.maybeReloadAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var header, files, newKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        header = this.props.parent.state.header;
                        return [4 /*yield*/, workspace.getTextAsync(header.id)];
                    case 1:
                        files = _a.sent();
                        // save file content from workspace, so they won't get overridden
                        pkg.mainEditorPkg().setFiles(files);
                        newKey = this.pkgConfigKey(files[pxt.CONFIG_NAME]);
                        if (!(newKey == this.state.previousCfgKey)) return [3 /*break*/, 3];
                        // refresh pull status
                        return [4 /*yield*/, this.refreshPullAsync()];
                    case 2:
                        // refresh pull status
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.setStateAsync({ needsPull: undefined, previousCfgKey: newKey })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.props.parent.reloadHeaderAsync()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.pullAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, _a, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.showLoading(lf("pulling changes..."));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, 10, 11]);
                        this.setState({ needsPull: undefined });
                        return [4 /*yield*/, workspace.pullAsync(this.props.parent.state.header)
                                .catch(this.handleGithubError)];
                    case 2:
                        status_1 = _b.sent();
                        _a = status_1;
                        switch (_a) {
                            case workspace.PullStatus.NoSourceControl: return [3 /*break*/, 3];
                            case workspace.PullStatus.UpToDate: return [3 /*break*/, 3];
                            case workspace.PullStatus.NeedsCommit: return [3 /*break*/, 4];
                            case workspace.PullStatus.GotChanges: return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 3:
                        this.setState({ needsPull: false });
                        return [3 /*break*/, 8];
                    case 4:
                        this.setState({ needsCommitMessage: true });
                        return [4 /*yield*/, this.refreshPullAsync()];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this.maybeReloadAsync()];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_4 = _b.sent();
                        this.handleGithubError(e_4);
                        return [3 /*break*/, 11];
                    case 10:
                        this.hideLoading();
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.getGitJson = function () {
        var gitJsonText = pkg.mainEditorPkg().getAllFiles()[pxt.github.GIT_JSON];
        var gitJson = JSON.parse(gitJsonText || "{}");
        return gitJson;
    };
    GithubComponent.prototype.parsedRepoId = function () {
        var header = this.props.parent.state.header;
        return pxt.github.parseRepoId(header.githubId);
    };
    GithubComponent.prototype.commitCoreAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var header, repo, commitId, prUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        header = this.props.parent.state.header;
                        repo = header.githubId;
                        return [4 /*yield*/, workspace.commitAsync(header, {
                                message: this.state.description
                            })];
                    case 1:
                        commitId = _a.sent();
                        if (!commitId) return [3 /*break*/, 5];
                        return [4 /*yield*/, workspace.prAsync(header, commitId, this.state.description || lf("Commit conflict"))];
                    case 2:
                        prUrl = _a.sent();
                        return [4 /*yield*/, dialogs.showPRDialogAsync(repo, prUrl)
                            // when the dialog finishes, we pull again - it's possible the user
                            // has resolved the conflict in the meantime
                        ];
                    case 3:
                        _a.sent();
                        // when the dialog finishes, we pull again - it's possible the user
                        // has resolved the conflict in the meantime
                        return [4 /*yield*/, workspace.pullAsync(header)
                            // skip bump in this case - we don't know if it was merged
                        ];
                    case 4:
                        // when the dialog finishes, we pull again - it's possible the user
                        // has resolved the conflict in the meantime
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        this.setState({ description: "" });
                        return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.commitAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.setState({ needsCommitMessage: false });
                        this.showLoading(lf("commit and push..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, this.commitCoreAsync()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.maybeReloadAsync()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        e_5 = _a.sent();
                        this.handleGithubError(e_5);
                        return [3 /*break*/, 6];
                    case 5:
                        this.hideLoading();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    GithubComponent.prototype.lineDiff = function (lineA, lineB) {
        var df = pxt.github.diff(lineA.split("").join("\n"), lineB.split("").join("\n"), {
            context: Infinity
        });
        var ja = [];
        var jb = [];
        for (var i = 0; i < df.length;) {
            var j = i;
            var mark = df[i][0];
            while (df[j] && df[j][0] == mark)
                j++;
            var chunk = df.slice(i, j).map(function (s) { return s.slice(2); }).join("");
            if (mark == " ") {
                ja.push(React.createElement("code", { key: i, className: "ch-common" }, chunk));
                jb.push(React.createElement("code", { key: i, className: "ch-common" }, chunk));
            }
            else if (mark == "-") {
                ja.push(React.createElement("code", { key: i, className: "ch-removed" }, chunk));
            }
            else if (mark == "+") {
                jb.push(React.createElement("code", { key: i, className: "ch-added" }, chunk));
            }
            else {
                pxt.Util.oops();
            }
            i = j;
        }
        return {
            a: React.createElement("div", { className: "inline-diff" }, ja),
            b: React.createElement("div", { className: "inline-diff" }, jb)
        };
    };
    GithubComponent.prototype.showDiff = function (isBlocksMode, f) {
        var _this = this;
        var cache = this.diffCache[f.name];
        if (!cache || cache.file !== f) {
            cache = { file: f };
            this.diffCache[f.name] = cache;
        }
        if (cache.gitFile == f.baseGitContent && cache.editorFile == f.content)
            return cache.diff;
        var isBlocks = /\.blocks$/.test(f.name);
        var baseContent = f.baseGitContent || "";
        var content = f.content;
        var legendJSX;
        var diffJSX;
        if (isBlocks) {
            var markdown = "\n```diffblocksxml\n" + baseContent + "\n---------------------\n" + content + "\n```\n";
            diffJSX = React.createElement(markedui.MarkedContent, { key: "diffblocksxxml" + f.name, parent: this.props.parent, markdown: markdown });
            legendJSX = React.createElement("p", { className: "legend" },
                React.createElement("span", null,
                    React.createElement("span", { className: "added icon" }),
                    lf("added, changed or moved")),
                React.createElement("span", null,
                    React.createElement("span", { className: "deleted icon" }),
                    lf("deleted")),
                React.createElement("span", null,
                    React.createElement("span", { className: "notchanged icon" }),
                    lf("not changed")),
                sui.helpIconLink("/github/diff#blocks", lf("Learn about reading differences in blocks code.")));
        }
        else {
            var classes_1 = {
                "@": "diff-marker",
                " ": "diff-unchanged",
                "+": "diff-added",
                "-": "diff-removed",
            };
            var diffLines_1 = pxt.github.diff(f.baseGitContent || "", f.content, { ignoreWhitespace: true });
            var lnA_1 = 0, lnB_1 = 0;
            var lastMark_1 = "";
            var savedDiff_1 = null;
            var linesTSX = diffLines_1.map(function (ln, idx) {
                var m = /^@@ -(\d+),\d+ \+(\d+),\d+/.exec(ln);
                if (m) {
                    lnA_1 = parseInt(m[1]) - 1;
                    lnB_1 = parseInt(m[2]) - 1;
                }
                else {
                    if (ln[0] != "+")
                        lnA_1++;
                    if (ln[0] != "-")
                        lnB_1++;
                }
                var nextMark = diffLines_1[idx + 1] ? diffLines_1[idx + 1][0] : "";
                var next2Mark = diffLines_1[idx + 2] ? diffLines_1[idx + 2][0] : "";
                var currDiff = React.createElement("code", null, ln.slice(2));
                if (savedDiff_1) {
                    currDiff = savedDiff_1;
                    savedDiff_1 = null;
                }
                else if (ln[0] == "-" && (lastMark_1 == " " || lastMark_1 == "@") && nextMark == "+"
                    && (next2Mark == " " || next2Mark == "@" || next2Mark == "")) {
                    var r = _this.lineDiff(ln.slice(2), diffLines_1[idx + 1].slice(2));
                    currDiff = r.a;
                    savedDiff_1 = r.b;
                }
                lastMark_1 = ln[0];
                return (React.createElement("tr", { key: lnA_1 + lnB_1, className: classes_1[ln[0]] },
                    React.createElement("td", { className: "line-a", "data-content": lnA_1 }),
                    React.createElement("td", { className: "line-b", "data-content": lnB_1 }),
                    ln[0] == "@"
                        ? React.createElement("td", { colSpan: 2, className: "change" },
                            React.createElement("code", null, ln))
                        : React.createElement("td", { className: "marker", "data-content": ln[0] }),
                    ln[0] == "@"
                        ? undefined
                        : React.createElement("td", { className: "change" }, currDiff)));
            });
            diffJSX = linesTSX.length ? React.createElement("table", { className: "diffview" },
                React.createElement("tbody", null, linesTSX)) : undefined;
        }
        var deletedFiles = [];
        var addedFiles = [];
        if (f.name == pxt.CONFIG_NAME) {
            var oldCfg_1 = pxt.allPkgFiles(JSON.parse(f.baseGitContent));
            var newCfg_1 = pxt.allPkgFiles(JSON.parse(f.content));
            deletedFiles = oldCfg_1.filter(function (fn) { return newCfg_1.indexOf(fn) == -1; });
            addedFiles = newCfg_1.filter(function (fn) { return oldCfg_1.indexOf(fn) == -1; });
        }
        // backing .ts for .blocks/.py files
        var virtualF = isBlocksMode && pkg.mainEditorPkg().files[f.getVirtualFileName(pxt.JAVASCRIPT_PROJECT_NAME)];
        if (virtualF == f)
            virtualF = undefined;
        cache.gitFile = f.baseGitContent;
        cache.editorFile = f.content;
        cache.revert = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, gs, _i, deletedFiles_1, d, prev, _a, addedFiles_1, d;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pxt.tickEvent("github.revert", { start: 1 });
                        return [4 /*yield*/, core.confirmAsync({
                                header: lf("Would you like to revert changes to {0}?", f.name),
                                body: lf("Changes will be lost for good. No undo."),
                                agreeLbl: lf("Revert"),
                                agreeClass: "red",
                                agreeIcon: "trash",
                            })];
                    case 1:
                        res = _b.sent();
                        if (!res)
                            return [2 /*return*/];
                        pxt.tickEvent("github.revert", { ok: 1 });
                        this.setState({ needsCommitMessage: false }); // maybe we no longer do
                        if (!(f.baseGitContent == null)) return [3 /*break*/, 4];
                        return [4 /*yield*/, pkg.mainEditorPkg().removeFileAsync(f.name)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.props.parent.reloadHeaderAsync()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!(f.name == pxt.CONFIG_NAME)) return [3 /*break*/, 7];
                        gs = this.getGitJson();
                        for (_i = 0, deletedFiles_1 = deletedFiles; _i < deletedFiles_1.length; _i++) {
                            d = deletedFiles_1[_i];
                            prev = workspace.lookupFile(gs.commit, d);
                            pkg.mainEditorPkg().setFile(d, prev && prev.blobContent || "// Cannot restore.");
                        }
                        for (_a = 0, addedFiles_1 = addedFiles; _a < addedFiles_1.length; _a++) {
                            d = addedFiles_1[_a];
                            delete pkg.mainEditorPkg().files[d];
                        }
                        return [4 /*yield*/, f.setContentAsync(f.baseGitContent)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, this.props.parent.reloadHeaderAsync()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 7: return [4 /*yield*/, f.setContentAsync(f.baseGitContent)
                        // revert generated .ts file as well
                    ];
                    case 8:
                        _b.sent();
                        if (!virtualF) return [3 /*break*/, 10];
                        return [4 /*yield*/, virtualF.setContentAsync(virtualF.baseGitContent)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        this.forceUpdate();
                        _b.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        }); };
        cache.diff = (React.createElement("div", { key: f.name, className: "ui segments filediff" },
            React.createElement("div", { className: "ui segment diffheader" },
                React.createElement("span", null, f.name),
                React.createElement(sui.Button, { className: "small", icon: "undo", text: lf("Revert"), ariaLabel: lf("Revert file"), title: lf("Revert file"), textClass: "landscape only", onClick: cache.revert }),
                legendJSX,
                deletedFiles.length == 0 ? undefined :
                    React.createElement("p", null, lf("Reverting this file will also restore: {0}", deletedFiles.join(", "))),
                addedFiles.length == 0 ? undefined :
                    React.createElement("p", null, lf("Reverting this file will also remove: {0}", addedFiles.join(", "))),
                virtualF && !isBlocksMode ? React.createElement("p", null, lf("Reverting this file will also revert: {0}", virtualF.name)) : undefined),
            diffJSX ?
                React.createElement("div", { className: "ui segment diff" }, diffJSX)
                :
                    React.createElement("div", { className: "ui segment" },
                        React.createElement("p", null, lf("Whitespace changes only.")))));
        return cache.diff;
    };
    GithubComponent.prototype.refreshPullAsync = function () {
        var _this = this;
        return this.setStateAsync({ needsPull: undefined })
            .then(function () { return workspace.hasPullAsync(_this.props.parent.state.header); })
            .then(function (v) { return _this.setStateAsync({ needsPull: v }); })
            .catch(function (e) {
            var statusCode = parseInt(e.statusCode);
            if (e.isOffline || statusCode === 0) {
                // don't report offline on this one
                _this.setState({ needsPull: undefined });
                return;
            }
            _this.handleGithubError(e);
        });
    };
    GithubComponent.prototype.setVisible = function (b) {
        if (b === this.state.isVisible)
            return;
        if (b) {
            this.setState({
                previousCfgKey: this.pkgConfigKey(pkg.mainEditorPkg().files[pxt.CONFIG_NAME].content)
            });
            this.refreshPullAsync().done();
        }
        else {
            this.clearCache();
            this.setState({
                needsCommitMessage: false,
                needsPull: undefined
            });
        }
    };
    GithubComponent.prototype.renderCore = function () {
        // TODO: disable commit changes if no changes available
        // TODO: commitAsync handle missing token or failed push
        var _this = this;
        var isBlocksMode = pkg.mainPkg.getPreferredEditor() == pxt.BLOCKS_PROJECT_NAME;
        var diffFiles = pkg.mainEditorPkg().sortedFiles().filter(function (p) { return p.baseGitContent != p.content; });
        var needsCommit = diffFiles.length > 0;
        var displayDiffFiles = isBlocksMode && !pxt.options.debug ? diffFiles.filter(function (f) { return /\.blocks$/.test(f.name); }) : diffFiles;
        var needsPull = this.state.needsPull;
        var githubId = this.parsedRepoId();
        var master = githubId.tag == "master";
        var gs = this.getGitJson();
        // don't use gs.prUrl, as it gets cleared often
        var url = "https://github.com/" + githubId.fullName + (master ? "" : "/tree/" + githubId.tag);
        var needsToken = !pxt.github.token;
        // this will show existing PR if any
        var prUrl = !gs.isFork && master ? null :
            "https://github.com/" + githubId.fullName + "/compare/" + githubId.tag + "?expand=1";
        return (React.createElement("div", { id: "githubArea" },
            React.createElement("div", { id: "serialHeader", className: "ui serialHeader" },
                React.createElement("div", { className: "leftHeaderWrapper" },
                    React.createElement("div", { className: "leftHeader" },
                        React.createElement(sui.Button, { title: lf("Go back"), icon: "arrow left", text: lf("Go back"), textClass: "landscape only", tabIndex: 0, onClick: this.goBack, onKeyDown: sui.fireClickOnEnter }))),
                React.createElement("div", { className: "rightHeader" },
                    React.createElement(sui.Button, { icon: "" + (needsPull === true ? "down arrow" : needsPull === false ? "check" : "sync"), className: needsPull === true ? "positive" : "", text: lf("Pull changes"), textClass: "landscape only", title: lf("Pull changes from GitHub to get your code up-to-date."), onClick: this.handlePullClick, onKeyDown: sui.fireClickOnEnter }),
                    !needsToken ? React.createElement(sui.Link, { className: "ui button", icon: "user plus", href: "https://github.com/" + githubId.fullName + "/settings/collaboration", target: "_blank", title: lf("Invite collaborators."), onKeyDown: sui.fireClickOnEnter }) : undefined,
                    React.createElement(sui.Link, { className: "ui button", icon: "github", href: url, title: lf("Open repository in GitHub."), target: "_blank", onKeyDown: sui.fireClickOnEnter }))),
            React.createElement(MessageComponent, { parent: this, needsToken: needsToken, githubId: githubId, master: master, gs: gs, isBlocks: isBlocksMode }),
            React.createElement("div", { className: "ui form" },
                !prUrl ? undefined :
                    React.createElement("a", { href: prUrl, role: "button", className: "ui link create-pr", target: "_blank", rel: "noopener noreferrer" }, lf("Pull request")),
                React.createElement("h3", { className: "header" },
                    React.createElement("i", { className: "large github icon" }),
                    React.createElement("span", { className: "repo-name" }, githubId.fullName),
                    React.createElement("span", { onClick: this.handleBranchClick, role: "button", className: "repo-branch" },
                        "#" + githubId.tag,
                        React.createElement("i", { className: "dropdown icon" }))),
                needsCommit ?
                    React.createElement(CommmitComponent, { parent: this, needsToken: needsToken, githubId: githubId, master: master, gs: gs, isBlocks: isBlocksMode })
                    : React.createElement(NoChangesComponent, { parent: this, needsToken: needsToken, githubId: githubId, master: master, gs: gs, isBlocks: isBlocksMode }),
                React.createElement("div", { className: "ui" }, displayDiffFiles.map(function (df) { return _this.showDiff(isBlocksMode, df); })),
                pxt.github.token ? dialogs.githubFooter("", function () { return _this.props.parent.forceUpdate(); }) : undefined)));
    };
    return GithubComponent;
}(data.Component));
var MessageComponent = /** @class */ (function (_super) {
    __extends(MessageComponent, _super);
    function MessageComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.handleSignInClick = _this.handleSignInClick.bind(_this);
        return _this;
    }
    MessageComponent.prototype.handleSignInClick = function (e) {
        var _this = this;
        pxt.tickEvent("github.signin");
        e.stopPropagation();
        dialogs.showGithubLoginAsync()
            .done(function () { return _this.props.parent.forceUpdate(); });
    };
    MessageComponent.prototype.renderCore = function () {
        var needsCommitMessage = this.props.parent.state.needsCommitMessage;
        var needsToken = !pxt.github.token;
        return React.createElement("div", null,
            needsToken ? React.createElement("div", { className: "ui info message join" },
                React.createElement("p", null,
                    lf("Host your code on GitHub and work together with friends on projects."),
                    sui.helpIconLink("/github", lf("Learn more about GitHub"))),
                React.createElement(sui.Button, { className: "tiny green", text: lf("Sign in"), onClick: this.handleSignInClick })) : undefined,
            !needsToken && needsCommitMessage ? React.createElement("div", { className: "ui warning message" },
                React.createElement("div", { className: "content" }, lf("You need to commit your changes before you can pull from GitHub."))) : undefined);
    };
    return MessageComponent;
}(sui.StatelessUIElement));
var CommmitComponent = /** @class */ (function (_super) {
    __extends(CommmitComponent, _super);
    function CommmitComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.handleDescriptionChange = _this.handleDescriptionChange.bind(_this);
        _this.handleCommitClick = _this.handleCommitClick.bind(_this);
        return _this;
    }
    CommmitComponent.prototype.handleDescriptionChange = function (v) {
        this.props.parent.setState({ description: v });
    };
    CommmitComponent.prototype.handleCommitClick = function (e) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pxt.tickEvent("github.commit");
                        if (!!pxt.github.token) return [3 /*break*/, 2];
                        return [4 /*yield*/, dialogs.showGithubLoginAsync()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!pxt.github.token) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.props.parent.commitAsync()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CommmitComponent.prototype.renderCore = function () {
        var githubId = this.props.githubId;
        return React.createElement("div", null,
            React.createElement("div", { className: "ui field" },
                React.createElement(sui.Input, { type: "url", placeholder: lf("Describe your changes."), value: this.props.parent.state.description, onChange: this.handleDescriptionChange })),
            React.createElement("div", { className: "field" },
                React.createElement("p", null,
                    lf("Save your changes in GitHub."),
                    sui.helpIconLink("/github/commit", lf("Learn about commiting and pushing code into GitHub.")))),
            React.createElement("div", { className: "ui field" },
                React.createElement(sui.Button, { className: "primary", text: lf("Commit changes"), icon: "up arrow", onClick: this.handleCommitClick, onKeyDown: sui.fireClickOnEnter })));
    };
    return CommmitComponent;
}(sui.StatelessUIElement));
var NoChangesComponent = /** @class */ (function (_super) {
    __extends(NoChangesComponent, _super);
    function NoChangesComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.handleBumpClick = _this.handleBumpClick.bind(_this);
        return _this;
    }
    NoChangesComponent.prototype.handleBumpClick = function (e) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pxt.tickEvent("github.bump");
                        e.stopPropagation();
                        if (!!pxt.github.token) return [3 /*break*/, 2];
                        return [4 /*yield*/, dialogs.showGithubLoginAsync()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (pxt.github.token)
                            this.props.parent.bumpAsync();
                        return [2 /*return*/];
                }
            });
        });
    };
    NoChangesComponent.prototype.renderCore = function () {
        var _a = this.props, needsToken = _a.needsToken, githubId = _a.githubId, master = _a.master, gs = _a.gs;
        var needsLicenseMessage = !needsToken && gs.commit && !gs.commit.tree.tree.some(function (f) {
            return /^LICENSE/.test(f.path.toUpperCase()) || /^COPYING/.test(f.path.toUpperCase());
        });
        return React.createElement("div", null,
            React.createElement("p", null, lf("No local changes found.")),
            master ? React.createElement("div", { className: "ui divider" }) : undefined,
            master ? gs.commit && gs.commit.tag ?
                React.createElement("div", { className: "ui field" },
                    React.createElement("p", null,
                        lf("Current release: {0}", gs.commit.tag),
                        sui.helpIconLink("/github/release", lf("Learn about releases."))))
                :
                    React.createElement("div", { className: "ui field" },
                        React.createElement("p", null,
                            lf("Bump up the version number and create a release on GitHub."),
                            sui.helpIconLink("/github/release#license", lf("Learn more about extension releases."))),
                        React.createElement(sui.Button, { className: "primary", text: lf("Create release"), onClick: this.handleBumpClick, onKeyDown: sui.fireClickOnEnter })) : undefined,
            master && needsLicenseMessage ? React.createElement("div", { className: "ui message" },
                React.createElement("div", { className: "content" },
                    lf("Your project doesn't seem to have a license. This makes it hard for others to use it."),
                    " ",
                    React.createElement("a", { href: "https://github.com/" + githubId.fullName + "/community/license/new?branch=" + githubId.tag + "&template=mit", role: "button", className: "ui link", target: "_blank", rel: "noopener noreferrer" }, lf("Add license")))) : undefined);
    };
    return NoChangesComponent;
}(sui.StatelessUIElement));
var Editor = /** @class */ (function (_super) {
    __extends(Editor, _super);
    function Editor(parent) {
        var _this = _super.call(this, parent) || this;
        _this.parent = parent;
        _this.handleViewRef = function (c) {
            _this.view = c;
            if (_this.view)
                _this.view.setVisible(_this.isVisible);
        };
        _this.handleViewRef = _this.handleViewRef.bind(_this);
        return _this;
    }
    Editor.prototype.getId = function () {
        return "githubEditor";
    };
    Editor.prototype.getCurrentSource = function () {
        // modifications are done on the EditorFile object, so make sure
        // we don't store some cached data in this.currSource
        var f = pkg.mainEditorPkg().files[pxt.github.GIT_JSON];
        return f.content;
    };
    Editor.prototype.hasHistory = function () { return true; };
    Editor.prototype.hasEditorToolbar = function () {
        return false;
    };
    Editor.prototype.setVisible = function (b) {
        this.isVisible = b;
        if (this.view)
            this.view.setVisible(b);
    };
    Editor.prototype.setHighContrast = function (hc) {
    };
    Editor.prototype.acceptsFile = function (file) {
        return file.name === pxt.github.GIT_JSON;
    };
    Editor.prototype.loadFileAsync = function (file, hc) {
        var _this = this;
        // force refresh to ensure we have a view
        return _super.prototype.loadFileAsync.call(this, file, hc)
            .then(function () { return compiler.getBlocksAsync(); }) // make sure to load block definitions
            .then(function () { return _this.parent.forceUpdate(); });
    };
    Editor.prototype.display = function () {
        if (!this.isVisible)
            return undefined;
        var header = this.parent.state.header;
        if (!header || !header.githubId)
            return undefined;
        return React.createElement(GithubComponent, { ref: this.handleViewRef, parent: this.parent });
    };
    return Editor;
}(srceditor.Editor));
exports.Editor = Editor;
