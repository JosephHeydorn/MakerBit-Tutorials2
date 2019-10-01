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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var sui = require("./sui");
var core = require("./core");
var coretsx = require("./coretsx");
var cloudsync = require("./cloudsync");
var Cloud = pxt.Cloud;
var Util = pxt.Util;
function showGithubLoginAsync() {
    pxt.tickEvent("github.token.dialog");
    var input;
    return core.confirmAsync({
        header: lf("Log in to GitHub"),
        hideCancel: true,
        hasCloseIcon: true,
        helpUrl: "/github/token",
        onLoaded: function (el) {
            input = el.querySelectorAll('input')[0];
        },
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("p", null,
                lf("Host your code on GitHub and work together with friends on projects."),
                sui.helpIconLink("/github", lf("Learn more about GitHub"))),
            React.createElement("p", null, lf("You will need a GitHub token:")),
            React.createElement("ol", null,
                React.createElement("li", null,
                    lf("Navigate to: "),
                    React.createElement("a", { href: "https://github.com/settings/tokens/new", target: "_blank", rel: "noopener noreferrer" }, lf("GitHub token generation page"))),
                React.createElement("li", null, lf("Put something like 'MakeCode {0}' in description", pxt.appTarget.name)),
                React.createElement("li", null, lf("Select either '{0}' or '{1}' scope, depending which repos you want to edit from here", "repo", "public_repo")),
                React.createElement("li", null, lf("Click generate token, copy it, and paste it below."))),
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "selectUrlToOpenLabel" }, lf("Paste GitHub token here:")),
                React.createElement("input", { type: "url", tabIndex: 0, autoFocus: true, "aria-labelledby": "selectUrlToOpenLabel", placeholder: "0123abcd...", className: "ui blue fluid" }))),
    }).then(function (res) {
        if (!res)
            pxt.tickEvent("github.token.cancel");
        else {
            var hextoken_1 = input.value.trim();
            if (hextoken_1.length != 40 || !/^[a-f0-9]+$/.test(hextoken_1)) {
                pxt.tickEvent("github.token.invalid");
                core.errorNotification(lf("Invalid token format"));
            }
            else {
                pxt.github.token = hextoken_1;
                // try to create a bogus repo - it will fail with
                // 401 - invalid token, 404 - when token doesn't have repo permission,
                // 422 - because the request is bogus, but token OK
                // Don't put any string in repo name - github seems to normalize these
                return pxt.github.createRepoAsync(undefined, "")
                    .then(function (r) {
                    // what?!
                    pxt.reportError("github", "Succeeded creating undefined repo!");
                    core.infoNotification(lf("Something went wrong with validation; token stored"));
                    pxt.storage.setLocal("githubtoken", hextoken_1);
                    pxt.tickEvent("github.token.wrong");
                }, function (err) {
                    pxt.github.token = "";
                    if (!showGithubTokenError(err)) {
                        if (err.statusCode == 422)
                            core.infoNotification(lf("Token validated and stored"));
                        else
                            core.infoNotification(lf("Token stored but not validated"));
                        pxt.github.token = hextoken_1;
                        pxt.storage.setLocal("githubtoken", hextoken_1);
                        pxt.tickEvent("github.token.ok");
                    }
                });
            }
        }
        return Promise.resolve();
    });
}
exports.showGithubLoginAsync = showGithubLoginAsync;
function showGithubTokenError(err) {
    if (err.statusCode == 401) {
        core.errorNotification(lf("GitHub didn't accept token"));
        return true;
    }
    else if (err.statusCode == 404) {
        core.errorNotification(lf("Token has neither '{0}' nor '{1}' scope", "repo", "public_repo"));
        return true;
    }
    else {
        return false;
    }
}
exports.showGithubTokenError = showGithubTokenError;
function githubFooter(msg, close) {
    function githubLogin(e) {
        e.preventDefault();
        close();
        showGithubLoginAsync();
    }
    function githubLogout(e) {
        e.preventDefault();
        close();
        pxt.storage.removeLocal("githubtoken");
        pxt.github.token = "";
        core.infoNotification(lf("Logged out from GitHub"));
    }
    if (!pxt.appTarget.cloud || !pxt.appTarget.cloud.githubPackages)
        return React.createElement("div", null);
    /* tslint:disable:react-a11y-anchors */
    if (pxt.github.token) {
        return (React.createElement("p", null,
            React.createElement("br", null),
            React.createElement("br", null),
            React.createElement("a", { href: "#github", onClick: githubLogout }, lf("Logout from GitHub")),
            React.createElement("br", null),
            React.createElement("br", null)));
    }
    else {
        return (React.createElement("p", null,
            React.createElement("br", null),
            React.createElement("br", null),
            msg,
            " ",
            React.createElement("a", { href: "#github", onClick: githubLogin }, lf("Login to GitHub")),
            React.createElement("br", null),
            React.createElement("br", null)));
    }
}
exports.githubFooter = githubFooter;
function showAboutDialogAsync(projectView) {
    var compileService = pxt.appTarget.compileService;
    var githubUrl = pxt.appTarget.appTheme.githubUrl;
    var targetTheme = pxt.appTarget.appTheme;
    var versions = pxt.appTarget.versions;
    var showCompile = compileService && compileService.githubCorePackage && compileService.gittag && compileService.serviceId;
    var buttons = [];
    if (targetTheme.experiments)
        buttons.push({
            label: lf("Experiments"),
            className: "secondary",
            onclick: function () {
                core.hideDialog();
                pxt.tickEvent("about.experiments", undefined, { interactiveConsent: true });
                projectView.showExperimentsDialog();
            }
        });
    pxt.targetConfigAsync()
        .then(function (config) {
        var isPxtElectron = pxt.BrowserUtils.isPxtElectron();
        var electronManifest = config && config.electronManifest;
        return core.confirmAsync({
            header: lf("About"),
            hideCancel: true,
            agreeLbl: lf("Ok"),
            agreeClass: "positive",
            buttons: buttons,
            jsx: React.createElement("div", null,
                isPxtElectron ?
                    (!pxt.Cloud.isOnline() || !electronManifest)
                        ? React.createElement("p", null, lf("Please connect to internet to check for updates"))
                        : pxt.semver.strcmp(pxt.appTarget.versions.target, electronManifest.latest) < 0
                            ? React.createElement("a", { href: "/offline-app" }, lf("An update {0} for {1} is available", electronManifest.latest, pxt.appTarget.title))
                            : React.createElement("p", null, lf("{0} is up to date", pxt.appTarget.title))
                    : undefined,
                githubUrl && versions ?
                    renderVersionLink(pxt.appTarget.name, versions.target, githubUrl + "/releases/tag/v" + versions.target)
                    : undefined,
                versions ?
                    renderVersionLink("Microsoft MakeCode", versions.pxt, "https://github.com/Microsoft/pxt/releases/tag/v" + versions.pxt)
                    : undefined,
                showCompile ?
                    renderCompileLink(compileService)
                    : undefined,
                React.createElement("p", null,
                    React.createElement("br", null)),
                React.createElement("p", null,
                    targetTheme.termsOfUseUrl ? React.createElement("a", { target: "_blank", className: "item", href: targetTheme.termsOfUseUrl, rel: "noopener noreferrer" }, lf("Terms of Use")) : undefined,
                    "\u00A0\u00A0\u00A0 ",
                    targetTheme.privacyUrl ? React.createElement("a", { target: "_blank", className: "item", href: targetTheme.privacyUrl, rel: "noopener noreferrer" }, lf("Privacy")) : undefined),
                targetTheme.copyrightText ? React.createElement("p", null,
                    " ",
                    targetTheme.copyrightText,
                    " ") : undefined)
        });
    }).done();
}
exports.showAboutDialogAsync = showAboutDialogAsync;
function renderCompileLink(cs) {
    var url;
    var version;
    var name;
    if (typeof cs.codalTarget === "object" && typeof cs.codalTarget.url === "string") {
        url = cs.codalTarget.branch ? pxt.BrowserUtils.joinURLs(cs.codalTarget.url, "releases/tag", cs.codalTarget.branch) : cs.codalTarget.url;
        version = cs.codalTarget.branch || "master";
        name = cs.codalTarget.name || cs.serviceId;
    }
    else {
        url = "https://github.com/" + cs.githubCorePackage + "/releases/tag/" + cs.gittag;
        version = cs.gittag;
        name = cs.serviceId;
    }
    return renderVersionLink(lf("{0} runtime", name), version, url);
}
function renderVersionLink(name, version, url) {
    return React.createElement("p", null,
        lf("{0} version:", name),
        " \u00A0",
        React.createElement("a", { href: encodeURI(url), title: "" + lf("{0} version: {1}", name, version), target: "_blank", rel: "noopener noreferrer" }, version));
}
function showPackageErrorDialogAsync(badPackages, updatePackages, openLegacyEditor) {
    var projectOpen = false;
    var onProjectOpen = function () { return projectOpen = true; };
    var token = new Util.CancellationToken();
    var loaderId = "package-update-cancel";
    pxt.tickEvent("update.extensionErrorsShown");
    return core.dialogAsync({
        header: lf("Extension Errors"),
        hasCloseIcon: true,
        hideCancel: true,
        jsx: React.createElement("div", { className: "wizard-wrapper" },
            React.createElement(ExtensionErrorWizard, { openLegacyEditor: openLegacyEditor, affectedPackages: badPackages, updatePackages: updatePackages, onProjectOpen: onProjectOpen, token: token }))
    })
        .then(function () {
        if (!projectOpen) {
            core.showLoading(loaderId, lf("Stopping update..."));
            return token.cancelAsync();
        }
        return Promise.resolve();
    })
        .then(function () {
        core.hideLoading(loaderId);
        return projectOpen;
    });
}
exports.showPackageErrorDialogAsync = showPackageErrorDialogAsync;
var ExtensionErrorWizard = /** @class */ (function (_super) {
    __extends(ExtensionErrorWizard, _super);
    function ExtensionErrorWizard(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            updating: false,
            showProgressBar: false,
            updateComplete: false,
            packagesUpdated: 0
        };
        _this.startUpdate = _this.startUpdate.bind(_this);
        _this.openProject = _this.openProject.bind(_this);
        _this.openLegacyEditor = _this.openLegacyEditor.bind(_this);
        return _this;
    }
    ExtensionErrorWizard.prototype.startUpdate = function () {
        var _this = this;
        if (this.state.updating)
            return;
        pxt.tickEvent("update.startExtensionUpdate");
        var startTime = Date.now();
        this.setState({
            updating: true
        });
        setTimeout(function () {
            if (_this.props.token.isCancelled())
                return;
            // Switch to progress bar if the update is taking a long time
            if (_this.state.updating && _this.props.affectedPackages.length > 1) {
                _this.setState({
                    showProgressBar: true
                });
            }
        }, 3000);
        var pkgs = this.props.affectedPackages;
        this.props.token.onProgress(function (completed) {
            _this.setState({ packagesUpdated: completed });
        });
        this.props.updatePackages(pkgs, this.props.token)
            .then(function (success) {
            if (_this.props.token.isCancelled())
                return;
            pxt.tickEvent("update.endExtensionUpdate", {
                success: "" + success,
                duration: Date.now() - startTime
            });
            if (!success) {
                _this.setState({
                    updateError: true,
                    updating: false
                });
            }
            else {
                _this.setState({
                    updating: false,
                    updateComplete: true
                });
                setTimeout(function () {
                    if (_this.props.token.isCancelled())
                        return;
                    _this.openProject(true);
                }, 1500);
            }
        });
    };
    ExtensionErrorWizard.prototype.openProject = function (quiet) {
        if (quiet === void 0) { quiet = false; }
        if (!quiet)
            pxt.tickEvent("update.ignoredExtensionErrors");
        this.props.onProjectOpen();
        coretsx.hideDialog();
    };
    ExtensionErrorWizard.prototype.openLegacyEditor = function () {
        this.props.onProjectOpen();
        this.props.openLegacyEditor();
    };
    ExtensionErrorWizard.prototype.buildActionList = function () {
        var actions = [];
        if (!this.state.updateError) {
            actions.push({
                text: lf("Try to fix"),
                title: lf("Update all extensions in the project to their latest versions"),
                callback: this.startUpdate
            });
        }
        actions.push({
            text: lf("Ignore errors and open"),
            title: lf("Ignore errors and open"),
            callback: this.openProject
        });
        if (this.props.openLegacyEditor) {
            actions.push({
                text: lf("Go to the old editor"),
                title: lf("Open this project in the editor where it was created"),
                callback: this.openLegacyEditor
            });
        }
        return actions;
    };
    ExtensionErrorWizard.prototype.render = function () {
        var affectedPackages = this.props.affectedPackages;
        var _a = this.state, updating = _a.updating, updateComplete = _a.updateComplete, packagesUpdated = _a.packagesUpdated, updateError = _a.updateError, showProgressBar = _a.showProgressBar;
        if (updating) {
            var progressString = packagesUpdated === affectedPackages.length ? lf("Finishing up...") :
                lf("Updating extension {0} of {1}...", packagesUpdated + 1, affectedPackages.length);
            return React.createElement("div", null, showProgressBar ?
                React.createElement(ProgressBar, { percentage: 100 * (packagesUpdated / affectedPackages.length), label: progressString }) :
                React.createElement("div", { className: "ui centered inline inverted text loader" }, progressString));
        }
        else if (updateComplete) {
            return React.createElement("div", null,
                React.createElement("h2", { className: "ui center aligned icon header" },
                    React.createElement("i", { className: "green check circle outline icon" }),
                    lf("Update complete")));
        }
        var message = updateError ? lf("Looks like updating didn't fix the issue. How would you like to proceed?") :
            lf("Looks like there are some errors in the extensions added to this project. How would you like to proceed?");
        return React.createElement("div", null,
            React.createElement("p", null, message),
            React.createElement(WizardMenu, { actions: this.buildActionList() }));
    };
    return ExtensionErrorWizard;
}(React.Component));
var ProgressBar = /** @class */ (function (_super) {
    __extends(ProgressBar, _super);
    function ProgressBar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ProgressBar.prototype.render = function () {
        var _a = this.props, percentage = _a.percentage, label = _a.label, cornerRadius = _a.cornerRadius;
        cornerRadius = (cornerRadius == null ? 3 : Math.max(cornerRadius, 0));
        percentage = Math.max(Math.min(percentage, 100), 2);
        return React.createElement("div", null,
            React.createElement("div", { className: "progress-bar-container" },
                React.createElement("svg", { className: "progress-bar", width: "100%", height: "100%" },
                    React.createElement("rect", { className: "progress-bar-bg", width: "100%", height: "100%", rx: cornerRadius, ry: cornerRadius }),
                    React.createElement("rect", { className: "progress-bar-content", width: percentage.toString() + "%", height: "100%", rx: cornerRadius, ry: cornerRadius }))),
            label ? React.createElement("p", { className: "progress-bar-label" }, label) : undefined);
    };
    return ProgressBar;
}(React.Component));
var WizardMenu = /** @class */ (function (_super) {
    __extends(WizardMenu, _super);
    function WizardMenu() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WizardMenu.prototype.render = function () {
        return React.createElement("div", { className: "ui relaxed list", role: "menu" }, this.props.actions.map(function (_a, i) {
            var text = _a.text, title = _a.title, callback = _a.callback;
            return React.createElement("div", { className: "item wizard-action", "aria-label": title, title: title, onClick: callback, role: "menuitem", key: i },
                React.createElement("span", { className: "left floated" },
                    React.createElement("i", { className: "medium arrow right icon" })),
                React.createElement(sui.Link, null, text));
        }));
    };
    return WizardMenu;
}(sui.StatelessUIElement));
function showCommitDialogAsync(repo) {
    var input;
    var deflMsg = lf("Updates.");
    var bump = false;
    var setBump = function (v) {
        bump = !!v;
    };
    return core.confirmAsync({
        header: lf("Commit to {0}", repo),
        agreeLbl: lf("Commit"),
        onLoaded: function (el) {
            input = el.querySelectorAll('input')[0];
        },
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "selectUrlToOpenLabel" }, lf("Describe your changes.")),
                React.createElement("input", { type: "url", tabIndex: 0, autoFocus: true, "aria-labelledby": "selectUrlToOpenLabel", placeholder: deflMsg, className: "ui blue fluid" })),
            React.createElement("div", { className: "ui field" },
                React.createElement(sui.PlainCheckbox, { label: lf("Publish to users (bump)"), onChange: setBump }))),
    }).then(function (res) {
        if (res) {
            pxt.tickEvent("app.commit.ok");
            return {
                msg: input.value || deflMsg,
                bump: bump
            };
        }
        return undefined;
    });
}
exports.showCommitDialogAsync = showCommitDialogAsync;
function showPRDialogAsync(repo, prURL) {
    return core.confirmAsync({
        header: lf("Commit conflict in {0}", repo),
        agreeLbl: lf("Resolve conflict"),
        disagreeLbl: lf("I'm done!"),
        body: lf("The latest online version of {0} contains edits conflicting with yours. We have created a pull request (PR) that you can use to resolve the conflicts. Once you're done, sync to get all merged changes. In the meantime we have taken you to the latest online version of {0}.", repo),
    }).then(function (res) {
        if (res) {
            pxt.tickEvent("app.commit.pr");
            window.open(prURL, "_blank");
            // wait for the user to click "I'm done"
            return showPRDialogAsync(repo, prURL);
        }
        return Promise.resolve();
    });
}
exports.showPRDialogAsync = showPRDialogAsync;
function showImportUrlDialogAsync() {
    var input;
    var shareUrl = pxt.appTarget.appTheme.shareUrl || "https://makecode.com/";
    return core.confirmAsync({
        header: lf("Open project URL"),
        onLoaded: function (el) {
            input = el.querySelectorAll('input')[0];
        },
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("div", { className: "ui icon violet message" },
                React.createElement("i", { className: "user icon", "aria-hidden": true }),
                React.createElement("div", { className: "content" },
                    React.createElement("h3", { className: "header" }, lf("User-provided content")),
                    React.createElement("p", null,
                        lf("The content below is provided by a user, and is not endorsed by Microsoft."),
                        React.createElement("br", null),
                        lf("If you think it's not appropriate, please report abuse through Settings -> Report Abuse.")))),
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "selectUrlToOpenLabel" }, lf("Copy the URL of the project.")),
                React.createElement("input", { type: "url", tabIndex: 0, autoFocus: true, "aria-labelledby": "selectUrlToOpenLabel", placeholder: lf("{0} or {1}...", shareUrl, "https://github.com/..."), className: "ui blue fluid" }))),
    }).then(function (res) {
        if (res) {
            pxt.tickEvent("app.open.url");
            var url = input.value;
            var projectId = void 0;
            if (/^(github:|https:\/\/github\.com\/)/.test(url)) {
                projectId = pxt.github.noramlizeRepoId(url);
            }
            else {
                projectId = pxt.Cloud.parseScriptId(url);
            }
            if (!projectId) {
                return Promise.reject(new Error(lf("Sorry, the project url looks invalid.")));
            }
            return Promise.resolve(projectId);
        }
        // Cancelled
        return Promise.resolve(undefined);
    });
}
exports.showImportUrlDialogAsync = showImportUrlDialogAsync;
function showCreateGithubRepoDialogAsync(name) {
    pxt.tickEvent("github.create.dialog");
    if (name) {
        name = name.toLocaleLowerCase().replace(/\s+/g, '-');
        name = name.replace(/[^\w\-]/g, '');
        if (!/^pxt-/.test(name))
            name = 'pxt-' + name;
    }
    var repoName = name || "";
    var repoDescription = "";
    var repoPublic = true;
    function repoNameError() {
        if (repoName == "pxt-" + lf("Untitled").toLocaleLowerCase()
            || repoName == "pxt-untitled")
            return lf("Please pick a different name.");
        var repoNameRx = /^[\w\-]{1,64}$/;
        if (!repoNameRx.test(repoName))
            return lf("Repository names must be less than 64 characters and cannot include spaces or special characters.");
        return undefined;
    }
    function onNameChanged(v) {
        v = v.trim();
        if (repoName != v) {
            repoName = v;
            coretsx.forceUpdate();
        }
    }
    function onDescriptionChanged(v) {
        if (repoDescription != v) {
            repoDescription = v;
            coretsx.forceUpdate();
        }
    }
    function onPublicChanged(e) {
        var v = e.currentTarget.selectedIndex == 0;
        if (repoPublic != v) {
            repoPublic = v;
            coretsx.forceUpdate();
        }
    }
    return core.confirmAsync({
        hideCancel: true,
        hasCloseIcon: true,
        header: lf("Create GitHub repository"),
        jsxd: function () {
            var nameErr = repoNameError();
            return React.createElement("div", { className: "ui form" },
                React.createElement("p", null,
                    lf("Host your code on GitHub and work together with friends."),
                    sui.helpIconLink("/github", lf("Learn more about GitHub"))),
                React.createElement("div", { className: "ui field" },
                    React.createElement(sui.Input, { type: "url", value: repoName, onChange: onNameChanged, label: lf("Repository name"), placeholder: "pxt-my-gadget...", class: "fluid", error: nameErr })),
                React.createElement("div", { className: "ui field" },
                    React.createElement(sui.Input, { type: "text", value: repoDescription, onChange: onDescriptionChanged, label: lf("Repository description"), placeholder: lf("MakeCode extension for my gadget"), class: "fluid" })),
                React.createElement("div", { className: "ui field" },
                    React.createElement("select", { className: "ui dropdown", onChange: onPublicChanged },
                        React.createElement("option", { "aria-selected": repoPublic, value: "true" }, lf("Public repository, anyone can look at your code.")),
                        React.createElement("option", { "aria-selected": !repoPublic, value: "false" }, lf("Private repository, your code is only visible to you.")))));
        },
    }).then(function (res) {
        if (!res)
            pxt.tickEvent("github.create.cancel");
        else {
            if (!repoNameError()) {
                core.showLoading("creategithub", lf("creating {0} repository...", repoName));
                return pxt.github.createRepoAsync(repoName, repoDescription.trim(), !repoPublic)
                    .finally(function () { return core.hideLoading("creategithub"); })
                    .then(function (r) {
                    pxt.tickEvent("github.create.ok");
                    return pxt.github.noramlizeRepoId("https://github.com/" + r.fullName);
                }, function (err) {
                    if (!showGithubTokenError(err)) {
                        if (err.statusCode == 422)
                            core.errorNotification(lf("Repository '{0}' already exists.", repoName));
                        else
                            core.errorNotification(err.message);
                        pxt.tickEvent("github.create.error", { statusCode: err.statusCode });
                    }
                    return "";
                });
            }
            else {
                core.errorNotification(lf("Invalid repository name."));
                pxt.tickEvent("github.create.invalidname");
            }
        }
        return "";
    });
}
exports.showCreateGithubRepoDialogAsync = showCreateGithubRepoDialogAsync;
function showImportGithubDialogAsync() {
    var res = "";
    var createNew = function () {
        res = "NEW";
        core.hideDialog();
    };
    core.showLoading("githublist", lf("Getting repo list..."));
    return pxt.github.listUserReposAsync()
        .finally(function () { return core.hideLoading("githublist"); })
        .then(function (repos) {
        var isPXT = function (r) { return /pxt|makecode/.test(r.name); };
        return repos.filter(isPXT).concat(repos.filter(function (r) { return !isPXT(r); }))
            .map(function (r) { return ({
            name: r.fullName,
            description: r.description,
            updatedAt: r.updatedAt,
            onClick: function () {
                res = pxt.github.noramlizeRepoId("https://github.com/" + r.fullName);
                core.hideDialog();
            },
        }); });
    })
        .then(function (repos) { return core.confirmAsync({
        header: lf("Clone or create your own GitHub repo"),
        hideAgree: true,
        /* tslint:disable:react-a11y-anchors */
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("div", { className: "ui relaxed divided list", role: "menu" },
                React.createElement("div", { key: "create new", className: "item" },
                    React.createElement("i", { className: "large plus circle middle aligned icon" }),
                    React.createElement("div", { className: "content" },
                        React.createElement("a", { onClick: createNew, role: "menuitem", className: "header", title: lf("Create new GitHub repository") },
                            React.createElement("b", null, lf("Create new..."))),
                        React.createElement("div", { className: "description" }, lf("Create a new GitHub repo in your account.")))),
                repos.map(function (r) {
                    return React.createElement("div", { key: r.name, className: "item" },
                        React.createElement("i", { className: "large github middle aligned icon" }),
                        React.createElement("div", { className: "content" },
                            React.createElement("a", { onClick: r.onClick, role: "menuitem", className: "header" }, r.name),
                            React.createElement("div", { className: "description" },
                                pxt.Util.timeSince(r.updatedAt),
                                ". ",
                                r.description)));
                })),
            React.createElement("div", { className: "ui icon green message" },
                React.createElement("i", { className: "info circle icon" }),
                React.createElement("div", { className: "content" },
                    React.createElement("h3", { className: "header" }, lf("Not finding what you're looking for?")),
                    React.createElement("p", null, lf("Use the 'Import URL' option in the previous dialog to import repo by exact URL."))))),
    }); }).then(function () { return res; });
}
exports.showImportGithubDialogAsync = showImportGithubDialogAsync;
function showImportFileDialogAsync(options) {
    var input;
    var exts = [pxt.appTarget.compile.saveAsPNG ? ".png" : ".mkcd"];
    if (pxt.appTarget.compile.hasHex) {
        exts.push(".hex");
    }
    if (pxt.appTarget.compile.useUF2) {
        exts.push(".uf2");
    }
    return core.confirmAsync({
        header: lf("Open {0} file", exts.join(lf(" or "))),
        onLoaded: function (el) {
            input = el.querySelectorAll('input')[0];
        },
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "selectFileToOpenLabel" }, lf("Select a {0} file to open.", exts.join(lf(" or ")))),
                React.createElement("input", { type: "file", tabIndex: 0, autoFocus: true, "aria-labelledby": "selectFileToOpenLabel", className: "ui blue fluid" })),
            React.createElement("div", { className: "ui secondary segment" }, lf("You can import files by dragging and dropping them anywhere in the editor!"))),
    }).then(function (res) {
        if (res) {
            return input.files[0];
        }
        return undefined;
    });
}
exports.showImportFileDialogAsync = showImportFileDialogAsync;
function showReportAbuseAsync(pubId) {
    // send users to github directly for unwanted repoes
    var ghid = /^https:\/\/github\.com\//i.test(pubId) && pxt.github.parseRepoUrl(pubId);
    if (ghid) {
        pxt.tickEvent("reportabuse.github");
        window.open("https://github.com/contact/report-content", "_blank");
        return;
    }
    // shared script id section
    var urlInput;
    var reasonInput;
    var shareUrl = pxt.appTarget.appTheme.shareUrl || "https://makecode.com/";
    core.confirmAsync({
        header: lf("Report Abuse"),
        onLoaded: function (el) {
            urlInput = el.querySelectorAll('input')[0];
            reasonInput = el.querySelectorAll('textarea')[0];
            if (pubId)
                urlInput.value = shareUrl + pubId;
        },
        agreeLbl: lf("Submit"),
        jsx: React.createElement("div", { className: "ui form" },
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "abuseUrlLabel" }, lf("What is the URL of the offensive project?")),
                React.createElement("input", { type: "url", "aria-labelledby": "abuseUrlLabel", tabIndex: 0, autoFocus: true, placeholder: "Enter project URL here..." })),
            React.createElement("div", { className: "ui field" },
                React.createElement("label", { id: "abuseDescriptionLabel" }, lf("Why do you find it offensive?")),
                React.createElement("textarea", { "aria-labelledby": "abuseDescriptionLabel" }))),
    }).done(function (res) {
        if (res) {
            pxt.tickEvent("app.reportabuse.send");
            var id = pxt.Cloud.parseScriptId(urlInput.value);
            if (!id) {
                core.errorNotification(lf("Sorry, the project url looks invalid."));
            }
            else {
                core.infoNotification(lf("Sending abuse report..."));
                Cloud.privatePostAsync(id + "/abusereports", {
                    text: reasonInput.value
                })
                    .then(function (res) {
                    core.infoNotification(lf("Report sent. Thank you!"));
                })
                    .catch(function (e) {
                    if (e.statusCode == 404)
                        core.warningNotification(lf("Oops, we could not find this script."));
                    else
                        core.handleNetworkError(e);
                });
            }
        }
    });
}
exports.showReportAbuseAsync = showReportAbuseAsync;
function showResetDialogAsync() {
    return core.confirmAsync({
        header: lf("Reset"),
        body: lf("You are about to clear all projects. Are you sure? This operation cannot be undone."),
        agreeLbl: lf("Reset"),
        agreeClass: "red",
        agreeIcon: "sign out",
        disagreeLbl: lf("Cancel")
    });
}
exports.showResetDialogAsync = showResetDialogAsync;
function showCloudSignInDialog() {
    var providers = cloudsync.providers();
    if (providers.length == 0)
        return;
    if (providers.length == 1)
        providers[0].login();
    else {
        core.dialogAsync({
            header: lf("Sign in"),
            body: lf("Please choose your cloud storage provider."),
            hideCancel: true,
            buttons: providers.map(function (p) { return ({
                label: p.friendlyName,
                className: "positive small",
                icon: "user circle",
                onclick: function () {
                    p.login();
                }
            }); })
        });
    }
}
exports.showCloudSignInDialog = showCloudSignInDialog;
