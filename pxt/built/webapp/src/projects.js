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
var core = require("./core");
var discourse = require("./discourse");
var codecard = require("./codecard");
var carousel = require("./carousel");
var dialogs_1 = require("./dialogs");
var Projects = /** @class */ (function (_super) {
    __extends(Projects, _super);
    function Projects(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: false
        };
        _this.showLanguagePicker = _this.showLanguagePicker.bind(_this);
        _this.showAboutDialog = _this.showAboutDialog.bind(_this);
        _this.chgHeader = _this.chgHeader.bind(_this);
        _this.chgGallery = _this.chgGallery.bind(_this);
        _this.chgCode = _this.chgCode.bind(_this);
        _this.importProject = _this.importProject.bind(_this);
        _this.showScriptManager = _this.showScriptManager.bind(_this);
        _this.cloudSignIn = _this.cloudSignIn.bind(_this);
        _this.setSelected = _this.setSelected.bind(_this);
        return _this;
    }
    Projects.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.visible != nextState.visible
            || this.state.searchFor != nextState.searchFor
            || this.state.selectedCategory != nextState.selectedCategory
            || this.state.selectedIndex != nextState.selectedIndex;
    };
    Projects.prototype.setSelected = function (category, index) {
        if (index == undefined || this.state.selectedCategory == category && this.state.selectedIndex == index) {
            this.setState({ selectedCategory: undefined, selectedIndex: undefined });
        }
        else {
            this.setState({ selectedCategory: category, selectedIndex: index });
        }
    };
    Projects.prototype.componentDidUpdate = function (prevProps, prevState) {
        if (this.state.selectedCategory !== prevState.selectedCategory) {
            this.ensureSelectedItemVisible();
        }
    };
    Projects.prototype.ensureSelectedItemVisible = function () {
        var activeCarousel = this.refs['activeCarousel'];
        if (activeCarousel) {
            var domNode = activeCarousel.getCarouselDOM();
            this.scrollElementIntoViewIfNeeded(domNode);
        }
    };
    Projects.prototype.scrollElementIntoViewIfNeeded = function (domNode) {
        var containerDomNode = ReactDOM.findDOMNode(this.refs['homeContainer']);
        // Determine if `domNode` fully fits inside `containerDomNode`.
        // If not, set the container's scrollTop appropriately.
        var domTop = domNode.getBoundingClientRect().top;
        var delta = domTop;
        var offset = 30;
        containerDomNode.parentElement.scrollTop = containerDomNode.parentElement.scrollTop + delta - offset;
    };
    Projects.prototype.showLanguagePicker = function () {
        pxt.tickEvent("projects.langpicker");
        this.props.parent.showLanguagePicker();
    };
    Projects.prototype.showAboutDialog = function () {
        dialogs_1.showAboutDialogAsync(this.props.parent);
    };
    Projects.prototype.chgHeader = function (hdr) {
        pxt.tickEvent("projects.header");
        core.showLoading("changeheader", lf("loading..."));
        this.props.parent.loadHeaderAsync(hdr)
            .done(function () {
            core.hideLoading("changeheader");
        });
    };
    Projects.prototype.chgGallery = function (scr) {
        pxt.tickEvent("projects.gallery", { name: scr.name });
        switch (scr.cardType) {
            case "template":
                var prj = pxt.Util.clone(pxt.appTarget.blocksprj);
                prj.config.dependencies = {}; // clear all dependencies
                this.chgCode(scr, true, prj);
                break;
            case "example":
                this.chgCode(scr, true);
                break;
            case "codeExample":
                this.chgCode(scr, false);
                break;
            case "side":
                this.props.parent.newEmptyProject(scr.name, scr.url);
                break;
            case "tutorial":
                this.props.parent.startTutorial(scr.url, scr.name);
                break;
            default:
                var m = /^\/#tutorial:([a-z0A-Z0-9\-\/]+)$/.exec(scr.url); // Tutorial
                if (m)
                    this.props.parent.startTutorial(m[1]);
                else {
                    if (scr.youTubeId && !scr.url)
                        return; // Handled by href
                    else if (/^https:\/\//i.test(scr.url))
                        return; // Handled by href
                    else if (scr.url)
                        if (/^\//i.test(scr.url))
                            return; // Handled by href
                        else
                            core.errorNotification(lf("Sorry, the project url looks invalid."));
                    else
                        this.props.parent.newEmptyProject(scr.name.toLowerCase());
                }
        }
    };
    Projects.prototype.chgCode = function (scr, loadBlocks, prj) {
        return this.props.parent.importExampleAsync({ name: scr.name, path: scr.url, loadBlocks: loadBlocks, prj: prj });
    };
    Projects.prototype.importProject = function () {
        pxt.tickEvent("projects.importdialog", undefined, { interactiveConsent: true });
        this.props.parent.importProjectDialog();
    };
    Projects.prototype.showScriptManager = function () {
        pxt.tickEvent("projects.showall.header", undefined, { interactiveConsent: true });
        this.props.parent.showScriptManager();
    };
    Projects.prototype.cloudSignIn = function () {
        pxt.tickEvent("projects.signin", undefined, { interactiveConsent: true });
        dialogs_1.showCloudSignInDialog();
    };
    Projects.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, selectedCategory = _a.selectedCategory, selectedIndex = _a.selectedIndex;
        var targetTheme = pxt.appTarget.appTheme;
        var targetConfig = this.getData("target-config:");
        var lang = pxt.Util.userLanguage();
        // collect localized and unlocalized galleries
        var galleries = {};
        if (targetConfig && targetConfig.localizedGalleries && targetConfig.localizedGalleries[lang])
            pxt.Util.jsonCopyFrom(galleries, targetConfig.localizedGalleries[lang]);
        if (targetConfig && targetConfig.galleries)
            pxt.Util.jsonCopyFrom(galleries, targetConfig.galleries);
        // lf("Make")
        // lf("Code")
        // lf("Projects")
        // lf("Examples")
        // lf("Tutorials")
        var showHeroBanner = !!targetTheme.homeScreenHero;
        var tabClasses = sui.cx([
            'ui segment bottom attached tab active tabsegment'
        ]);
        var signIn = "";
        var signInIcon = "";
        if (this.getData("sync:hascloud")) {
            signInIcon = this.getData("sync:status") == "syncing" ? "cloud download" : "user circle";
            signIn = this.getData("sync:username") || lf("Sign in");
        }
        return React.createElement("div", { ref: "homeContainer", className: tabClasses, role: "main" },
            showHeroBanner ?
                React.createElement("div", { className: "ui segment getting-started-segment", style: { backgroundImage: "url(" + encodeURI(targetTheme.homeScreenHero) + ")" } }) : undefined,
            React.createElement("div", { key: "mystuff_gallerysegment", className: "ui segment gallerysegment mystuff-segment", role: "region", "aria-label": lf("My Projects") },
                React.createElement("div", { className: "ui grid equal width padded heading" },
                    React.createElement("div", { className: "column", style: { zIndex: 1 } }, targetTheme.scriptManager ? React.createElement("h2", { role: "button", className: "ui header myproject-header", title: lf("See all projects"), tabIndex: 0, onClick: this.showScriptManager, onKeyDown: sui.fireClickOnEnter },
                        lf("My Projects"),
                        React.createElement("span", { className: "ui grid-dialog-btn" },
                            React.createElement(sui.Icon, { icon: "angle right" }))) : React.createElement("h2", { className: "ui header" }, lf("My Projects"))),
                    React.createElement("div", { className: "column right aligned", style: { zIndex: 1 } }, pxt.appTarget.compile || (pxt.appTarget.cloud && pxt.appTarget.cloud.sharing && pxt.appTarget.cloud.importing) ?
                        React.createElement(sui.Button, { key: "import", icon: "upload", className: "import-dialog-btn", textClass: "landscape only", text: lf("Import"), title: lf("Import a project"), onClick: this.importProject }) : undefined)),
                React.createElement("div", { className: "content" },
                    React.createElement(ProjectsCarousel, { key: "mystuff_carousel", parent: this.props.parent, name: 'recent', onClick: this.chgHeader }))),
            Object.keys(galleries).map(function (galleryName) {
                return React.createElement("div", { key: galleryName + "_gallerysegment", className: "ui segment gallerysegment", role: "region", "aria-label": pxt.Util.rlf(galleryName) },
                    React.createElement("h2", { className: "ui header heading" },
                        pxt.Util.rlf(galleryName),
                        " "),
                    React.createElement("div", { className: "content" },
                        React.createElement(ProjectsCarousel, { ref: "" + (selectedCategory == galleryName ? 'activeCarousel' : ''), key: galleryName + "_carousel", parent: _this.props.parent, name: galleryName, path: galleries[galleryName], onClick: _this.chgGallery, setSelected: _this.setSelected, selectedIndex: selectedCategory == galleryName ? selectedIndex : undefined })));
            }),
            targetTheme.organizationUrl || targetTheme.organizationUrl || targetTheme.privacyUrl || targetTheme.copyrightText ? React.createElement("div", { className: "ui horizontal small divided link list homefooter" },
                targetTheme.organizationUrl && targetTheme.organization ? React.createElement("a", { className: "item", target: "_blank", rel: "noopener noreferrer", href: targetTheme.organizationUrl }, targetTheme.organization) : undefined,
                targetTheme.selectLanguage ? React.createElement(sui.Link, { className: "item", icon: "xicon globe", text: lf("Language"), onClick: this.showLanguagePicker, onKeyDown: sui.fireClickOnEnter }) : undefined,
                targetTheme.termsOfUseUrl ? React.createElement("a", { target: "_blank", className: "item", href: targetTheme.termsOfUseUrl, rel: "noopener noreferrer" }, lf("Terms of Use")) : undefined,
                targetTheme.privacyUrl ? React.createElement("a", { target: "_blank", className: "item", href: targetTheme.privacyUrl, rel: "noopener noreferrer" }, lf("Privacy")) : undefined,
                pxt.appTarget.versions ? React.createElement(sui.Link, { className: "item", text: "v" + pxt.appTarget.versions.target, onClick: this.showAboutDialog, onKeyDown: sui.fireClickOnEnter }) : undefined,
                targetTheme.copyrightText ? React.createElement("div", { className: "ui item copyright" }, targetTheme.copyrightText) : undefined) : undefined);
    };
    return Projects;
}(data.Component));
exports.Projects = Projects;
var ProjectsMenu = /** @class */ (function (_super) {
    __extends(ProjectsMenu, _super);
    function ProjectsMenu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.brandIconClick = _this.brandIconClick.bind(_this);
        _this.orgIconClick = _this.orgIconClick.bind(_this);
        return _this;
    }
    ProjectsMenu.prototype.brandIconClick = function () {
        pxt.tickEvent("projects.brand", undefined, { interactiveConsent: true });
    };
    ProjectsMenu.prototype.orgIconClick = function () {
        pxt.tickEvent("projects.org", undefined, { interactiveConsent: true });
    };
    ProjectsMenu.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return false;
    };
    ProjectsMenu.prototype.renderCore = function () {
        var targetTheme = pxt.appTarget.appTheme;
        return React.createElement("div", { id: "homemenu", className: "ui borderless fixed " + (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menubar" },
            React.createElement("div", { className: "left menu" },
                React.createElement("a", { href: targetTheme.logoUrl, "aria-label": lf("{0} Logo", targetTheme.boardName), role: "menuitem", target: "blank", rel: "noopener", className: "ui item logo brand", onClick: this.brandIconClick },
                    targetTheme.logo || targetTheme.portraitLogo
                        ? React.createElement("img", { className: "ui " + (targetTheme.logoWide ? "small" : "") + " logo " + (targetTheme.logo ? " portrait hide" : ''), src: targetTheme.logo || targetTheme.portraitLogo, alt: lf("{0} Logo", targetTheme.boardName) })
                        : React.createElement("span", { className: "name" }, targetTheme.boardName),
                    targetTheme.portraitLogo ? (React.createElement("img", { className: "ui " + (targetTheme.logoWide ? "small" : "mini") + " image portrait only", src: targetTheme.portraitLogo, alt: lf("{0} Logo", targetTheme.boardName) })) : null)),
            React.createElement("div", { className: "ui item home mobile hide" },
                React.createElement(sui.Icon, { icon: "icon home large" }),
                " ",
                React.createElement("span", null, lf("Home"))),
            React.createElement("div", { className: "right menu" },
                React.createElement("a", { href: targetTheme.organizationUrl, target: "blank", rel: "noopener", className: "ui item logo organization", onClick: this.orgIconClick },
                    targetTheme.organizationWideLogo || targetTheme.organizationLogo
                        ? React.createElement("img", { className: "ui logo " + (targetTheme.organizationWideLogo ? " portrait hide" : ''), src: targetTheme.organizationWideLogo || targetTheme.organizationLogo, alt: lf("{0} Logo", targetTheme.organization) })
                        : React.createElement("span", { className: "name" }, targetTheme.organization),
                    targetTheme.organizationLogo ? (React.createElement("img", { className: 'ui mini image portrait only', src: targetTheme.organizationLogo, alt: lf("{0} Logo", targetTheme.organization) })) : null)),
            targetTheme.betaUrl ? React.createElement("a", { href: "" + targetTheme.betaUrl, className: "ui red mini corner top left attached label betalabel", role: "menuitem" }, lf("Beta")) : undefined);
    };
    return ProjectsMenu;
}(data.Component));
exports.ProjectsMenu = ProjectsMenu;
var ProjectsCarousel = /** @class */ (function (_super) {
    __extends(ProjectsCarousel, _super);
    function ProjectsCarousel(props) {
        var _this = _super.call(this, props) || this;
        _this.prevGalleries = [];
        _this.hasFetchErrors = false;
        _this.state = {};
        _this.closeDetail = _this.closeDetail.bind(_this);
        _this.closeDetailOnEscape = _this.closeDetailOnEscape.bind(_this);
        _this.reload = _this.reload.bind(_this);
        _this.newProject = _this.newProject.bind(_this);
        _this.showScriptManager = _this.showScriptManager.bind(_this);
        _this.handleCardClick = _this.handleCardClick.bind(_this);
        return _this;
    }
    ProjectsCarousel.prototype.componentDidMount = function () {
        if (this.props.parent.state.header) {
            if (this.latestProject && this.latestProject.element) {
                this.latestProject.element.focus();
            }
        }
    };
    ProjectsCarousel.prototype.fetchGallery = function (path) {
        var res = this.getData("gallery:" + encodeURIComponent(path));
        if (res) {
            if (res instanceof Error) {
                this.hasFetchErrors = true;
            }
            else {
                this.prevGalleries = pxt.Util.concat(res.map(function (g) { return g.cards; }));
            }
        }
        return this.prevGalleries || [];
    };
    ProjectsCarousel.prototype.fetchLocalData = function () {
        var headers = this.getData("header:*");
        return headers;
    };
    ProjectsCarousel.prototype.newProject = function () {
        var _this = this;
        pxt.tickEvent("projects.new", undefined, { interactiveConsent: true });
        if (pxt.appTarget.appTheme.nameProjectFirst) {
            this.props.parent.askForProjectNameAsync()
                .then(function (name) {
                _this.props.parent.newProject({ name: name });
            });
        }
        else {
            this.props.parent.newProject({ name: name });
        }
    };
    ProjectsCarousel.prototype.showScriptManager = function () {
        pxt.tickEvent("projects.showscriptmanager", undefined, { interactiveConsent: true });
        this.props.parent.showScriptManager();
    };
    ProjectsCarousel.prototype.closeDetail = function () {
        var name = this.props.name;
        pxt.tickEvent("projects.detail.close");
        this.props.setSelected(name, undefined);
    };
    ProjectsCarousel.prototype.getCarouselDOM = function () {
        var carouselDom = ReactDOM.findDOMNode(this.refs["carousel"]);
        return carouselDom;
    };
    ProjectsCarousel.prototype.getDetailDOM = function () {
        var detailDom = ReactDOM.findDOMNode(this.refs["detailView"]);
        return detailDom;
    };
    ProjectsCarousel.prototype.closeDetailOnEscape = function (e) {
        var charCode = core.keyCodeFromEvent(e);
        if (charCode != core.ESC_KEY)
            return;
        this.closeDetail();
        document.removeEventListener('keydown', this.closeDetailOnEscape);
        e.preventDefault();
    };
    ProjectsCarousel.prototype.componentWillReceiveProps = function (nextProps) {
        if (nextProps.selectedIndex != undefined) {
            document.addEventListener('keydown', this.closeDetailOnEscape);
        }
    };
    ProjectsCarousel.prototype.reload = function () {
        this.setState({});
    };
    ProjectsCarousel.prototype.handleCardClick = function (e, scr, index) {
        var name = this.props.name;
        if (this.props.setSelected) {
            // Set this item as selected
            pxt.tickEvent("projects.detail.open");
            this.props.setSelected(name, index);
        }
        else {
            this.props.onClick(scr);
        }
    };
    ProjectsCarousel.prototype.renderCore = function () {
        var _this = this;
        var _a = this.props, name = _a.name, path = _a.path, selectedIndex = _a.selectedIndex;
        var targetTheme = pxt.appTarget.appTheme;
        if (path) {
            // Fetch the gallery
            this.hasFetchErrors = false;
            var cards = this.fetchGallery(path);
            if (this.hasFetchErrors) {
                return React.createElement("div", { className: "ui carouselouter" },
                    React.createElement("div", { role: "button", className: "carouselcontainer", tabIndex: 0, onClick: this.reload },
                        React.createElement("p", { className: "ui grey inverted segment" }, lf("Oops, please connect to the Internet and try again."))));
            }
            else {
                var selectedElement = cards[selectedIndex];
                return React.createElement("div", null,
                    React.createElement(carousel.Carousel, { ref: "carousel", bleedPercent: 20, selectedIndex: selectedIndex }, cards.map(function (scr, index) {
                        return React.createElement(ProjectsCodeCard, { className: "example", key: path + scr.name, name: scr.name, url: scr.url, imageUrl: scr.imageUrl, youTubeId: scr.youTubeId, label: scr.label, labelClass: scr.labelClass, tags: scr.tags, scr: scr, index: index, onCardClick: _this.handleCardClick, cardType: scr.cardType, tutorialStep: scr.tutorialStep, tutorialLength: scr.tutorialLength });
                    })),
                    selectedElement && React.createElement("div", { ref: "detailView", className: "detailview" },
                        React.createElement(sui.CloseButton, { onClick: this.closeDetail }),
                        React.createElement(ProjectsDetail, { parent: this.props.parent, name: selectedElement.name, key: 'detail' + selectedElement.name, description: selectedElement.description, url: selectedElement.url, imageUrl: selectedElement.imageUrl, largeImageUrl: selectedElement.largeImageUrl, youTubeId: selectedElement.youTubeId, scr: selectedElement, onClick: this.props.onClick, cardType: selectedElement.cardType, tags: selectedElement.tags })));
            }
        }
        else {
            var headers = this.fetchLocalData();
            var showNewProject = pxt.appTarget.appTheme && !pxt.appTarget.appTheme.hideNewProjectButton;
            var showScriptManagerCard = targetTheme.scriptManager && headers.length > ProjectsCarousel.NUM_PROJECTS_HOMESCREEN;
            return React.createElement(carousel.Carousel, { bleedPercent: 20 },
                showNewProject ? React.createElement("div", { role: "button", className: "ui card link buttoncard newprojectcard", title: lf("Creates a new empty project"), onClick: this.newProject, onKeyDown: sui.fireClickOnEnter },
                    React.createElement("div", { className: "content" },
                        React.createElement(sui.Icon, { icon: "huge add circle" }),
                        React.createElement("span", { className: "header" }, lf("New Project")))) : undefined,
                headers.slice(0, ProjectsCarousel.NUM_PROJECTS_HOMESCREEN).map(function (scr, index) {
                    var boardsvg = pxt.bundledSvg(scr.board);
                    var tutorialStep = scr.tutorial ? scr.tutorial.tutorialStep
                        : scr.tutorialCompleted ? scr.tutorialCompleted.steps - 1
                            : undefined;
                    var tutoriallength = scr.tutorial ? scr.tutorial.tutorialStepInfo.length
                        : scr.tutorialCompleted ? scr.tutorialCompleted.steps
                            : undefined;
                    return React.createElement(ProjectsCodeCard, { key: 'local' + scr.id + scr.recentUse, 
                        // ref={(view) => { if (index === 1) this.latestProject = view }}
                        cardType: "file", className: scr.githubId ? "file github" : (boardsvg && scr.board) ? "file board" : "file", imageUrl: scr.githubId ? undefined : boardsvg, name: scr.name, time: scr.recentUse, url: scr.pubId && scr.pubCurrent ? "/" + scr.pubId : "", scr: scr, index: index, onCardClick: _this.handleCardClick, tutorialStep: tutorialStep, tutorialLength: tutoriallength });
                }),
                showScriptManagerCard ? React.createElement("div", { role: "button", className: "ui card link buttoncard scriptmanagercard", title: lf("See all projects"), onClick: this.showScriptManager, onKeyDown: sui.fireClickOnEnter },
                    React.createElement("div", { className: "content" },
                        React.createElement(sui.Icon, { icon: "huge right angle" }),
                        React.createElement("span", { className: "header" }, lf("See all projects")))) : undefined);
        }
    };
    ProjectsCarousel.NUM_PROJECTS_HOMESCREEN = 8;
    return ProjectsCarousel;
}(data.Component));
exports.ProjectsCarousel = ProjectsCarousel;
var ProjectsCodeCard = /** @class */ (function (_super) {
    __extends(ProjectsCodeCard, _super);
    function ProjectsCodeCard(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        _this.handleLabelClick = _this.handleLabelClick.bind(_this);
        return _this;
    }
    ProjectsCodeCard.prototype.handleClick = function (e) {
        this.props.onCardClick(e, this.props.scr, this.props.index);
    };
    ProjectsCodeCard.prototype.handleLabelClick = function (e) {
        this.props.onLabelClick(e, this.props.scr, this.props.index);
    };
    ProjectsCodeCard.prototype.renderCore = function () {
        var _a = this.props, scr = _a.scr, onCardClick = _a.onCardClick, onLabelClick = _a.onLabelClick, onClick = _a.onClick, rest = __rest(_a, ["scr", "onCardClick", "onLabelClick", "onClick"]);
        return React.createElement(codecard.CodeCardView, __assign({}, rest, { onClick: this.handleClick, onLabelClicked: onLabelClick ? this.handleLabelClick : undefined }));
    };
    return ProjectsCodeCard;
}(sui.StatelessUIElement));
exports.ProjectsCodeCard = ProjectsCodeCard;
var ProjectsDetail = /** @class */ (function (_super) {
    __extends(ProjectsDetail, _super);
    function ProjectsDetail(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleDetailClick = _this.handleDetailClick.bind(_this);
        _this.handleOpenForumUrlInEditor = _this.handleOpenForumUrlInEditor.bind(_this);
        return _this;
    }
    ProjectsDetail.prototype.handleDetailClick = function () {
        var _a = this.props, cardType = _a.cardType, url = _a.url, youTubeId = _a.youTubeId, scr = _a.scr, onClick = _a.onClick;
        var isForum = cardType == "forumUrl";
        var isLink = isForum || (!isCodeCardType(cardType) && (youTubeId || url));
        if (isLink) {
            var linkHref = (youTubeId && !url) ? "https://youtu.be/" + youTubeId :
                ((/^https:\/\//i.test(url)) || (/^\//i.test(url)) ? url : '');
            window.open(linkHref, '_blank');
        }
        else {
            onClick(scr);
        }
        function isCodeCardType(value) {
            switch (value) {
                case "file":
                case "example":
                case "codeExample":
                case "tutorial":
                case "side":
                case "template":
                case "package":
                case "hw":
                case "forumUrl":
                    return true;
                default:
                    return false;
            }
        }
    };
    ProjectsDetail.prototype.handleOpenForumUrlInEditor = function () {
        var url = this.props.url;
        discourse.extractSharedIdFromPostUrl(url)
            .then(function (projectId) {
            // if we have a projectid, load it
            if (projectId)
                window.location.hash = "pub:" + projectId; // triggers reload
            else {
                core.warningNotification(lf("Oops, we could not find the program in the forum."));
            }
        })
            .catch(core.handleNetworkError);
    };
    ProjectsDetail.prototype.renderCore = function () {
        var _a = this.props, name = _a.name, description = _a.description, imageUrl = _a.imageUrl, largeImageUrl = _a.largeImageUrl, youTubeId = _a.youTubeId, cardType = _a.cardType, tags = _a.tags;
        var image = largeImageUrl || imageUrl || (youTubeId && "https://img.youtube.com/vi/" + youTubeId + "/0.jpg");
        var tagColors = pxt.appTarget.appTheme.tagColors || {};
        var descriptions = description && description.split("\n");
        var clickLabel = lf("Show Instructions");
        if (cardType == "tutorial")
            clickLabel = lf("Start Tutorial");
        else if (cardType == "codeExample" || cardType == "example")
            clickLabel = lf("Open Example");
        else if (cardType == "forumUrl")
            clickLabel = lf("Open in Forum");
        else if (cardType == "template")
            clickLabel = lf("New Project");
        else if (youTubeId)
            clickLabel = lf("Play Video");
        return React.createElement("div", { className: "ui grid stackable padded" },
            image && React.createElement("div", { className: "imagewrapper" },
                React.createElement("div", { className: "image", style: { backgroundImage: "url(\"" + image + "\")" } })),
            React.createElement("div", { className: "column twelve wide" },
                React.createElement("div", { className: "segment" },
                    React.createElement("div", { className: "header" },
                        " ",
                        name,
                        " "),
                    tags && React.createElement("div", { className: "ui labels" }, tags.map(function (tag) { return React.createElement("div", { className: "ui " + (tagColors[tag] || '') + " label" }, pxt.Util.rlf(tag)); })),
                    descriptions && descriptions.map(function (desc, index) {
                        return React.createElement("p", { key: "line" + index, className: "detail" }, desc);
                    }),
                    React.createElement("div", { className: "actions" },
                        React.createElement(sui.Button, { key: "action_" + clickLabel, text: clickLabel, className: "approve huge positive", onClick: this.handleDetailClick, onKeyDown: sui.fireClickOnEnter, autoFocus: true }),
                        cardType == "forumUrl" && React.createElement(sui.Button, { key: "action_open", text: lf("Open in Editor"), className: "approve huge", onClick: this.handleOpenForumUrlInEditor, onKeyDown: sui.fireClickOnEnter })))));
    };
    return ProjectsDetail;
}(data.Component));
exports.ProjectsDetail = ProjectsDetail;
function githubLogin() {
    core.showLoading("ghlogin", lf("Logging you in to GitHub..."));
    var self = window.location.href.replace(/#.*/, "");
    var state = ts.pxtc.Util.guidGen();
    pxt.storage.setLocal("oauthState", state);
    pxt.storage.setLocal("oauthType", "github");
    var login = pxt.Cloud.getServiceUrl() +
        "/oauth/login?state=" + state +
        "&response_type=token&client_id=gh-token&redirect_uri=" +
        encodeURIComponent(self);
    window.location.href = login;
}
var ImportDialog = /** @class */ (function (_super) {
    __extends(ImportDialog, _super);
    function ImportDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: false
        };
        _this.close = _this.close.bind(_this);
        _this.importHex = _this.importHex.bind(_this);
        _this.importUrl = _this.importUrl.bind(_this);
        _this.cloneGithub = _this.cloneGithub.bind(_this);
        return _this;
    }
    ImportDialog.prototype.hide = function () {
        this.setState({ visible: false });
    };
    ImportDialog.prototype.close = function () {
        this.setState({ visible: false });
    };
    ImportDialog.prototype.show = function () {
        this.setState({ visible: true });
    };
    ImportDialog.prototype.importHex = function () {
        pxt.tickEvent("projects.import", undefined, { interactiveConsent: true });
        this.hide();
        this.props.parent.showImportFileDialog();
    };
    ImportDialog.prototype.importUrl = function () {
        pxt.tickEvent("projects.importurl", undefined, { interactiveConsent: true });
        this.hide();
        this.props.parent.showImportUrlDialog();
    };
    ImportDialog.prototype.cloneGithub = function () {
        pxt.tickEvent("github.projects.clone", undefined, { interactiveConsent: true });
        this.hide();
        this.props.parent.showImportGithubDialog();
    };
    ImportDialog.prototype.renderCore = function () {
        var visible = this.state.visible;
        var disableFileAccessinMaciOs = pxt.appTarget.appTheme.disableFileAccessinMaciOs && (pxt.BrowserUtils.isIOS() || pxt.BrowserUtils.isMac());
        /* tslint:disable:react-a11y-anchors */
        return (React.createElement(sui.Modal, { isOpen: visible, className: "importdialog", size: "small", onClose: this.close, dimmer: true, closeIcon: true, header: lf("Import"), closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            React.createElement("div", { className: pxt.github.token ? "ui three cards" : "ui two cards" },
                pxt.appTarget.compile && !disableFileAccessinMaciOs ?
                    React.createElement(codecard.CodeCardView, { ariaLabel: lf("Open files from your computer"), role: "button", key: 'import', icon: "upload", iconColor: "secondary", name: lf("Import File..."), description: lf("Open files from your computer"), onClick: this.importHex }) : undefined,
                pxt.appTarget.cloud && pxt.appTarget.cloud.sharing && pxt.appTarget.cloud.importing ?
                    React.createElement(codecard.CodeCardView, { ariaLabel: lf("Open a shared project URL or GitHub repo"), role: "button", key: 'importurl', icon: "cloud download", iconColor: "secondary", name: lf("Import URL..."), description: lf("Open a shared project URL or GitHub repo"), onClick: this.importUrl }) : undefined,
                pxt.github.token ?
                    React.createElement(codecard.CodeCardView, { ariaLabel: lf("Clone or create your own GitHub repository"), role: "button", key: 'importgithub', icon: "github", iconColor: "secondary", name: lf("Your GitHub Repo..."), description: lf("Clone or create your own GitHub repository"), onClick: this.cloneGithub }) : undefined),
            pxt.github.token || true ? undefined :
                React.createElement("p", null,
                    React.createElement("br", null),
                    React.createElement("br", null),
                    React.createElement("a", { className: "small", href: "#github", role: "button", onClick: githubLogin, "aria-label": lf("GitHub login") }, lf("GitHub login")))));
    };
    return ImportDialog;
}(data.Component));
exports.ImportDialog = ImportDialog;
var ExitAndSaveDialog = /** @class */ (function (_super) {
    __extends(ExitAndSaveDialog, _super);
    function ExitAndSaveDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: false,
            emoji: ""
        };
        _this.hide = _this.hide.bind(_this);
        _this.modalDidOpen = _this.modalDidOpen.bind(_this);
        _this.handleChange = _this.handleChange.bind(_this);
        _this.save = _this.save.bind(_this);
        _this.skip = _this.skip.bind(_this);
        return _this;
    }
    ExitAndSaveDialog.prototype.componentWillReceiveProps = function (newProps) {
        this.handleChange(newProps.parent.state.projectName);
    };
    ExitAndSaveDialog.prototype.hide = function () {
        this.setState({ visible: false });
    };
    ExitAndSaveDialog.prototype.show = function () {
        pxt.tickEvent('exitandsave.show', undefined, { interactiveConsent: false });
        this.setState({ visible: true });
    };
    ExitAndSaveDialog.prototype.modalDidOpen = function (ref) {
        // Save on enter typed
        var dialogInput = document.getElementById('projectNameInput');
        if (dialogInput) {
            if (!pxt.BrowserUtils.isMobile())
                dialogInput.setSelectionRange(0, 9999);
            dialogInput.onkeydown = function (e) {
                var charCode = core.keyCodeFromEvent(e);
                if (charCode === core.ENTER_KEY) {
                    e.preventDefault();
                    var approveButton = ref.getElementsByClassName("approve positive").item(0);
                    if (approveButton)
                        approveButton.click();
                }
            };
        }
    };
    ExitAndSaveDialog.prototype.handleChange = function (name) {
        this.setState({ projectName: name });
        var untitled = lf("Untitled");
        name = name || ""; // guard against null/undefined
        if (!name || pxt.Util.toArray(untitled).some(function (c, i) { return untitled.substr(0, i + 1) == name; })) {
            // the frowny face here seemed a bit pessimistic - the user didn't to anything wrong
            this.setState({ emoji: "" });
        }
        else {
            var emojis = ["😌", "😄", "😃", "😍"];
            var emoji = emojis[Math.min(name.length, emojis.length) - 1];
            var n = name.length >> 1;
            if (n > emojis.length)
                for (var i = 0; i < Math.min(2, n - emojis.length); ++i)
                    emoji += emojis[emojis.length - 1];
            this.setState({ emoji: emoji });
        }
    };
    ExitAndSaveDialog.prototype.skip = function () {
        pxt.tickEvent("exitandsave.skip", undefined, { interactiveConsent: true });
        this.hide();
        this.props.parent.openHome();
    };
    ExitAndSaveDialog.prototype.save = function () {
        var _this = this;
        var newName = this.state.projectName;
        this.hide();
        var p = Promise.resolve();
        // save project name if valid change
        if (newName && this.props.parent.state.projectName != newName) {
            pxt.tickEvent("exitandsave.projectrename", { length: newName && newName.length }, { interactiveConsent: true });
            p = p.then(function () { return _this.props.parent.updateHeaderNameAsync(newName); });
        }
        p.done(function () {
            _this.props.parent.openHome();
        });
    };
    ExitAndSaveDialog.prototype.headerText = function () {
        return lf("Project has no name {0}", this.state.emoji);
    };
    ExitAndSaveDialog.prototype.actions = function () {
        return [{
                label: lf("Save"),
                onclick: this.save,
                icon: 'check',
                className: 'approve positive'
            }, {
                label: lf("Skip"),
                onclick: this.skip
            }];
    };
    ExitAndSaveDialog.prototype.renderCore = function () {
        var _a = this.state, visible = _a.visible, projectName = _a.projectName;
        return (React.createElement(sui.Modal, { isOpen: visible, className: "exitandsave", size: "tiny", onClose: this.hide, dimmer: true, buttons: this.actions(), closeIcon: true, header: this.headerText(), closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true, modalDidOpen: this.modalDidOpen },
            React.createElement("div", null,
                React.createElement("p", null, lf("Give your project a name.")),
                React.createElement("div", { className: "ui form" },
                    React.createElement(sui.Input, { ref: "filenameinput", autoFocus: !pxt.BrowserUtils.isMobile(), id: "projectNameInput", ariaLabel: lf("Type a name for your project"), autoComplete: false, value: projectName || '', onChange: this.handleChange })))));
    };
    return ExitAndSaveDialog;
}(data.Component));
exports.ExitAndSaveDialog = ExitAndSaveDialog;
var NewProjectNameDialog = /** @class */ (function (_super) {
    __extends(NewProjectNameDialog, _super);
    function NewProjectNameDialog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NewProjectNameDialog.prototype.headerText = function () {
        return lf("Your project needs a name {0}", this.state.emoji);
    };
    NewProjectNameDialog.prototype.actions = function () {
        return [{
                label: lf("Create!"),
                onclick: this.save,
                icon: 'check',
                className: 'approve positive'
            }];
    };
    NewProjectNameDialog.prototype.askNameAsync = function () {
        var _this = this;
        this.setState({ projectName: "", emoji: "" });
        this.show();
        return new Promise(function (resolve) {
            _this.nameCb = resolve;
        });
    };
    NewProjectNameDialog.prototype.skip = function () {
        this.hide();
    };
    NewProjectNameDialog.prototype.save = function () {
        var newName = this.state.projectName;
        this.hide();
        if (this.nameCb)
            this.nameCb(newName);
        this.nameCb = null;
    };
    return NewProjectNameDialog;
}(ExitAndSaveDialog));
exports.NewProjectNameDialog = NewProjectNameDialog;
var ChooseHwDialog = /** @class */ (function (_super) {
    __extends(ChooseHwDialog, _super);
    function ChooseHwDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.prevGalleries = [];
        _this.state = {
            visible: false
        };
        _this.close = _this.close.bind(_this);
        return _this;
    }
    ChooseHwDialog.prototype.hide = function () {
        this.setState({ visible: false });
    };
    ChooseHwDialog.prototype.close = function () {
        this.setState({ visible: false });
    };
    ChooseHwDialog.prototype.show = function () {
        this.setState({ visible: true });
    };
    ChooseHwDialog.prototype.fetchGallery = function () {
        var path = "/hardware";
        var res = this.getData("gallery:" + encodeURIComponent(path));
        if (res) {
            if (res instanceof Error) {
                // ignore
            }
            else {
                this.prevGalleries = pxt.Util.concat(res.map(function (g) { return g.cards; }))
                    .filter(function (c) { return !!c.variant; });
            }
        }
        return this.prevGalleries || [];
    };
    ChooseHwDialog.prototype.setHwVariant = function (cfg) {
        pxt.tickEvent("projects.choosehwvariant", { hwid: cfg.name }, { interactiveConsent: true });
        this.hide();
        pxt.setHwVariant(cfg.name);
        var editor = this.props.parent;
        editor.reloadHeaderAsync()
            .then(function () { return editor.compile(); })
            .done();
    };
    ChooseHwDialog.prototype.renderCore = function () {
        var _this = this;
        var visible = this.state.visible;
        if (!visible)
            return React.createElement("div", null);
        var variants = pxt.getHwVariants();
        var _loop_1 = function (v) {
            if (!v.card)
                v.card = {
                    name: v.description
                };
            var savedV = v;
            v.card.onClick = function () { return _this.setHwVariant(savedV); };
        };
        for (var _i = 0, variants_1 = variants; _i < variants_1.length; _i++) {
            var v = variants_1[_i];
            _loop_1(v);
        }
        var cards = this.fetchGallery();
        var _loop_2 = function (card) {
            var savedV = variants.find(function (variant) { return variant.name == card.variant; });
            if (savedV)
                card.onClick = function () { return _this.setHwVariant(savedV); };
            else {
                pxt.reportError("hw", "invalid variant");
            }
        };
        for (var _a = 0, cards_1 = cards; _a < cards_1.length; _a++) {
            var card = cards_1[_a];
            _loop_2(card);
        }
        cards = cards.filter(function (card) { return !!card.onClick; });
        /* tslint:disable:react-a11y-anchors */
        return (React.createElement(sui.Modal, { isOpen: visible, className: "hardwaredialog", size: "large", onClose: this.close, dimmer: true, closeIcon: true, header: lf("Choose your hardware"), closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            React.createElement("div", { className: "group" },
                React.createElement("div", { className: "ui cards centered", role: "listbox" },
                    cards.map(function (card) {
                        return React.createElement(codecard.CodeCardView, { key: 'card' + card.name, name: card.name, ariaLabel: card.name, description: card.description, imageUrl: card.imageUrl, learnMoreUrl: card.url, onClick: card.onClick });
                    }),
                    variants.map(function (cfg) {
                        return React.createElement(codecard.CodeCardView, { key: 'variant' + cfg.name, name: cfg.card.name, ariaLabel: cfg.card.name, description: cfg.card.description, imageUrl: cfg.card.imageUrl, learnMoreUrl: cfg.card.learnMoreUrl, onClick: cfg.card.onClick });
                    }))),
            React.createElement("p", null,
                React.createElement("br", null),
                React.createElement("br", null),
                lf("No hardware? Or want to add some?"),
                " ",
                React.createElement("a", { className: "small", href: "/hardware", target: "_blank", rel: "noopener noreferrer", "aria-label": lf("Learn more about hardware") }, lf("Learn more!")))));
    };
    return ChooseHwDialog;
}(data.Component));
exports.ChooseHwDialog = ChooseHwDialog;
