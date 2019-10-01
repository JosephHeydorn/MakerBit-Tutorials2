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
var data = require("./data");
var sui = require("./sui");
var core = require("./core");
var workspace = require("./workspace");
var compiler = require("./compiler");
var searchInput_1 = require("./components/searchInput");
var projects_1 = require("./projects");
var ScriptManagerDialog = /** @class */ (function (_super) {
    __extends(ScriptManagerDialog, _super);
    function ScriptManagerDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.handleKeyDown = function (e) {
            var charCode = core.keyCodeFromEvent(e);
            var ctrlCmd = pxt.BrowserUtils.isMac() ? e.metaKey : e.ctrlKey;
            if (ctrlCmd && charCode === 65 /* a */) {
                _this.handleSelectAll(e);
            }
        };
        _this.handleAreaClick = function () {
            _this.setState({ selected: {} });
        };
        _this.handleSelectAll = function (event) {
            var selected = _this.state.selected;
            var headers = _this.getSortedHeaders();
            var selectedAll = headers.length > 0 && headers.length == Object.keys(selected).length;
            if (selectedAll) {
                // Deselect all if selected
                selected = {};
            }
            else {
                // Select all
                headers.forEach(function (header, index) {
                    selected[index] = 1;
                });
            }
            _this.setState({ selected: selected });
            event.stopPropagation();
            event.preventDefault();
        };
        _this.toggleSortName = function (force) {
            var _a = _this.state, sortedBy = _a.sortedBy, sortedAsc = _a.sortedAsc;
            if (sortedBy == 'name' && !force)
                sortedAsc = !sortedAsc;
            else
                sortedAsc = true; // Default asc
            _this.setState({ sortedBy: 'name', sortedAsc: sortedAsc, markedNew: {}, selected: {} });
        };
        _this.toggleSortTime = function (force) {
            var _a = _this.state, sortedAsc = _a.sortedAsc, sortedBy = _a.sortedBy;
            if (sortedBy == 'time' && !force)
                sortedAsc = !sortedAsc;
            else
                sortedAsc = false; // Default desc
            _this.setState({ sortedBy: 'time', sortedAsc: sortedAsc, markedNew: {}, selected: {} });
        };
        _this.handleSortName = function () {
            _this.toggleSortName(true);
        };
        _this.handleSortTime = function () {
            _this.toggleSortTime(true);
        };
        _this.handleToggleSortName = function () {
            _this.toggleSortName(false);
        };
        _this.handleToggleSortTime = function () {
            _this.toggleSortTime(false);
        };
        _this.handleSwitchSortDirection = function () {
            var sortedAsc = _this.state.sortedAsc;
            _this.setState({ sortedAsc: !sortedAsc, markedNew: {}, selected: {} });
        };
        _this.state = {
            visible: false,
            selected: {},
            markedNew: {},
            view: 'grid',
            sortedBy: 'time',
            sortedAsc: false
        };
        _this.close = _this.close.bind(_this);
        _this.handleCardClick = _this.handleCardClick.bind(_this);
        _this.handleDelete = _this.handleDelete.bind(_this);
        _this.handleOpen = _this.handleOpen.bind(_this);
        _this.handleDuplicate = _this.handleDuplicate.bind(_this);
        _this.handleSwitchView = _this.handleSwitchView.bind(_this);
        _this.handleSearch = _this.handleSearch.bind(_this);
        _this.handleCheckboxClick = _this.handleCheckboxClick.bind(_this);
        return _this;
    }
    ScriptManagerDialog.prototype.hide = function () {
        this.setState({ visible: false, searchFor: undefined });
    };
    ScriptManagerDialog.prototype.close = function () {
        this.setState({ visible: false, searchFor: undefined });
        if (this.props.onClose)
            this.props.onClose();
    };
    ScriptManagerDialog.prototype.show = function () {
        this.setState({ visible: true });
        compiler.projectSearchClear();
    };
    ScriptManagerDialog.prototype.fetchLocalData = function () {
        var headers = this.getData("headers:" + (this.state.searchFor || ''));
        return headers;
    };
    ScriptManagerDialog.prototype.handleCardClick = function (e, scr, index, force) {
        var shifted = e.shiftKey;
        var ctrlCmd = (force && !shifted) || (pxt.BrowserUtils.isMac() ? e.metaKey : e.ctrlKey);
        var _a = this.state, selected = _a.selected, multiSelect = _a.multiSelect, multiSelectStart = _a.multiSelectStart;
        if (shifted && ctrlCmd)
            return;
        // If ctrl/cmd is down, toggle from the list
        if (ctrlCmd) {
            if (selected[index])
                delete selected[index];
            else
                selected[index] = 1;
            if (selected[index])
                multiSelectStart = index;
        }
        else if (shifted) {
            selected = {};
            // Shift is down, use the start position to select all the projects in between
            for (var i = Math.min(index, multiSelectStart); i <= Math.max(index, multiSelectStart); i++) {
                selected[i] = 1;
            }
            multiSelect = true;
        }
        else if (multiSelect) {
            // Clear multi select state
            selected = {};
            multiSelect = false;
        }
        if (!shifted && !ctrlCmd) {
            if (Object.keys(selected).length == 1 && selected[index]) {
                // Deselect the currently selected card if we click on it again
                delete selected[index];
            }
            else {
                selected = {};
                selected[index] = 1;
                // Use this as an indicator for any future multi-select clicks
                multiSelectStart = index;
            }
        }
        this.setState({ selected: selected, multiSelect: multiSelect, multiSelectStart: multiSelectStart });
        e.stopPropagation();
        e.preventDefault();
    };
    ScriptManagerDialog.prototype.handleCheckboxClick = function (e, scr, index) {
        this.handleCardClick(e, scr, index, true);
        e.preventDefault();
        e.stopPropagation();
    };
    ScriptManagerDialog.prototype.handleDelete = function () {
        var _this = this;
        var selected = this.state.selected;
        var headers = this.getSortedHeaders();
        var selectedLength = Object.keys(selected).length;
        core.confirmDelete(selectedLength == 1 ? headers[parseInt(Object.keys(selected)[0])].name : selectedLength.toString(), function () {
            var promises = [];
            headers.forEach(function (header, index) {
                if (selected[index]) {
                    // Delete each selected project
                    header.isDeleted = true;
                    promises.push(workspace.saveAsync(header, {}));
                }
            });
            _this.setState({ selected: {} });
            return Promise.all(promises)
                .then(function () {
                data.clearCache();
            });
        }, selectedLength > 1);
    };
    ScriptManagerDialog.prototype.handleOpen = function () {
        var header = this.getSelectedHeader();
        core.showLoading("changeheader", lf("loading..."));
        this.props.parent.loadHeaderAsync(header)
            .done(function () {
            core.hideLoading("changeheader");
        });
    };
    ScriptManagerDialog.prototype.handleDuplicate = function () {
        var _this = this;
        var header = this.getSelectedHeader();
        // Prompt for the new project name
        var opts = {
            header: lf("Choose a new name for your project"),
            agreeLbl: lf("Duplicate"),
            agreeClass: "green approve positive",
            agreeIcon: "clone",
            initialValue: workspace.createDuplicateName(header),
            placeholder: lf("Enter your project name here")
        };
        return core.promptAsync(opts).then(function (res) {
            if (res === null)
                return Promise.resolve(false); // null means cancelled, empty string means ok (but no value entered)
            var files;
            return workspace.getTextAsync(header.id)
                .then(function (text) {
                files = text;
                // Duplicate the existing header
                return workspace.duplicateAsync(header, text, false);
            })
                .then(function (clonedHeader) {
                // Update the name of the new header
                clonedHeader.name = res;
                // Set the name in the pxt.json (config)
                var cfg = JSON.parse(files[pxt.CONFIG_NAME]);
                cfg.name = clonedHeader.name;
                files[pxt.CONFIG_NAME] = JSON.stringify(cfg, null, 4);
                return clonedHeader;
            })
                .then(function (clonedHeader) { return workspace.saveAsync(clonedHeader, files); })
                .then(function () {
                data.invalidate("headers:");
                data.invalidate("headers:" + _this.state.searchFor);
                _this.setState({ selected: {}, markedNew: { '0': 1 }, sortedBy: 'time', sortedAsc: false });
                setTimeout(function () {
                    _this.setState({ markedNew: {} });
                }, 5 * 1000);
                return true;
            });
        });
    };
    ScriptManagerDialog.prototype.handleSwitchView = function () {
        var newView = this.state.view == 'grid' ? 'list' : 'grid';
        this.setState({ view: newView });
    };
    ScriptManagerDialog.prototype.handleSearch = function (inputValue) {
        this.setState({ searchFor: inputValue, selected: {} }); // Clear selected list when searching
    };
    ScriptManagerDialog.prototype.getSelectedHeader = function () {
        var selected = this.state.selected;
        var indexes = Object.keys(selected);
        if (indexes.length !== 1)
            return null; // Sanity check
        var index = parseInt(indexes[0]);
        var headers = this.getSortedHeaders();
        return headers[index];
    };
    ScriptManagerDialog.prototype.getSortedHeaders = function () {
        var _a = this.state, sortedBy = _a.sortedBy, sortedAsc = _a.sortedAsc;
        var headers = this.fetchLocalData() || [];
        return headers.sort(this.getSortingFunction(sortedBy, sortedAsc));
    };
    ScriptManagerDialog.prototype.getSortingFunction = function (sortedBy, sortedAsc) {
        var sortingFunction = function (a, b) {
            if (sortedBy === 'time') {
                return sortedAsc ?
                    a.modificationTime - b.modificationTime :
                    b.modificationTime - a.modificationTime;
            }
            return sortedAsc ?
                a.name.localeCompare(b.name) :
                b.name.localeCompare(a.name);
        };
        return sortingFunction;
    };
    ScriptManagerDialog.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, visible = _a.visible, selected = _a.selected, markedNew = _a.markedNew, view = _a.view, searchFor = _a.searchFor, sortedBy = _a.sortedBy, sortedAsc = _a.sortedAsc;
        if (!visible)
            return React.createElement("div", null);
        var darkTheme = pxt.appTarget.appTheme.baseTheme == 'dark';
        var headers = this.getSortedHeaders() || [];
        headers = headers.filter(function (h) { return !h.isDeleted; });
        var isSearching = false;
        var hasHeaders = !searchFor ? headers.length > 0 : true;
        var selectedAll = headers.length > 0 && headers.length == Object.keys(selected).length;
        var headerActions;
        if (hasHeaders) {
            headerActions = [];
            headerActions.push(React.createElement(searchInput_1.SearchInput, { key: "search", ariaMessage: lf("{0} result matching '{1}'", headers.length, searchFor), placeholder: lf("Search..."), className: "mobile hide", searchHandler: this.handleSearch, disabled: isSearching, style: { flexGrow: 1 }, searchOnChange: true }));
            if (Object.keys(selected).length > 0) {
                if (Object.keys(selected).length == 1) {
                    headerActions.push(React.createElement(sui.Button, { key: "edit", icon: "edit outline", className: "icon", text: lf("Open"), textClass: "landscape only", title: lf("Open Project"), onClick: this.handleOpen }));
                    headerActions.push(React.createElement(sui.Button, { key: "clone", icon: "clone outline", className: "icon", text: lf("Duplicate"), textClass: "landscape only", title: lf("Duplicate Project"), onClick: this.handleDuplicate }));
                }
                headerActions.push(React.createElement(sui.Button, { key: "delete", icon: "trash", className: "icon red", text: lf("Delete"), textClass: "landscape only", title: lf("Delete Project"), onClick: this.handleDelete }));
                headerActions.push(React.createElement("div", { key: "divider", className: "divider" }));
            }
            headerActions.push(React.createElement(sui.Button, { key: "view", icon: view == 'grid' ? 'th list' : 'grid layout', className: "icon", title: "" + (view == 'grid' ? lf("List view") : lf("Grid view")), onClick: this.handleSwitchView }));
        }
        return (React.createElement(sui.Modal, { isOpen: visible, className: "scriptmanager", size: "fullscreen", onClose: this.close, dimmer: true, header: lf("My Projects"), closeIcon: true, headerActions: headerActions, closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            !hasHeaders ? React.createElement("div", { className: "empty-content" },
                React.createElement("h2", { className: "ui center aligned header " + (darkTheme ? "inverted" : "") },
                    React.createElement("div", { className: "content" },
                        lf("It's empty in here"),
                        React.createElement("div", { className: "sub header" }, lf("Go back to create a new project"))))) : undefined,
            hasHeaders && view == 'grid' ?
                React.createElement("div", { role: "button", className: "ui container fluid", style: { height: "100%" }, onClick: this.handleAreaClick, onKeyDown: this.handleKeyDown },
                    React.createElement("div", { className: "sort-by" },
                        React.createElement("div", { role: "menu", className: "ui menu compact buttons" },
                            React.createElement(sui.DropdownMenu, { role: "menuitem", text: sortedBy == 'time' ? lf("Last Modified") : lf("Name"), title: lf("Sort by dropdown"), className: "inline button " + (darkTheme ? 'inverted' : '') },
                                React.createElement(sui.Item, { role: "menuitem", icon: sortedBy == 'name' ? 'check' : undefined, className: (sortedBy != 'name' ? 'no-icon' : '') + " " + (darkTheme ? 'inverted' : ''), text: lf("Name"), tabIndex: -1, onClick: this.handleSortName }),
                                React.createElement(sui.Item, { role: "menuitem", icon: sortedBy == 'time' ? 'check' : undefined, className: (sortedBy != 'time' ? 'no-icon' : '') + " " + (darkTheme ? 'inverted' : ''), text: lf("Last Modified"), tabIndex: -1, onClick: this.handleSortTime })),
                            React.createElement(sui.Button, { role: "menuitem", icon: "arrow " + (sortedAsc ? 'up' : 'down'), className: "" + (darkTheme ? 'inverted' : ''), onClick: this.handleSwitchSortDirection, title: lf("Switch sort order to {0}", !sortedAsc ? lf("ascending") : lf("descending")) }))),
                    React.createElement("div", { className: "ui cards" }, headers.sort(this.getSortingFunction(sortedBy, sortedAsc)).map(function (scr, index) {
                        var isMarkedNew = !!markedNew[index];
                        var isSelected = !!selected[index];
                        var showMarkedNew = isMarkedNew && !isSelected;
                        var labelIcon = "circle outline " + (isSelected ? 'check' : '') + " " + (isSelected ? 'green' : 'grey') + " " + (darkTheme ? 'inverted' : '');
                        if (showMarkedNew)
                            labelIcon = undefined;
                        var labelClass = showMarkedNew ? 'orange right ribbon label' :
                            "right corner label large selected-label";
                        var label = showMarkedNew ? lf("New") : undefined;
                        return React.createElement(projects_1.ProjectsCodeCard, { key: 'local' + scr.id + scr.recentUse, cardType: "file", className: "file " + (isMarkedNew ? 'warning' : isSelected ? 'positive' : ''), name: scr.name, time: scr.recentUse, url: scr.pubId && scr.pubCurrent ? "/" + scr.pubId : "", scr: scr, index: index, labelIcon: labelIcon, labelClass: labelClass, label: label, onCardClick: _this.handleCardClick, onLabelClick: _this.handleCheckboxClick });
                    }))) : undefined,
            hasHeaders && view == 'list' ?
                React.createElement("div", { role: "table", className: "ui container", style: { height: "100%" }, onClick: this.handleAreaClick, onKeyDown: this.handleKeyDown },
                    React.createElement("table", { className: "ui definition unstackable table " + (darkTheme ? 'inverted' : '') },
                        React.createElement("thead", { className: "full-width" },
                            React.createElement("tr", null,
                                React.createElement("th", { onClick: this.handleSelectAll, tabIndex: 0, onKeyDown: sui.fireClickOnEnter, title: selectedAll ? lf("De-select all projects") : lf("Select all projects"), style: { cursor: 'pointer' } },
                                    React.createElement(sui.Icon, { icon: "circle outline large " + (selectedAll ? 'check' : '') })),
                                React.createElement("th", { onClick: this.handleToggleSortName, tabIndex: 0, onKeyDown: sui.fireClickOnEnter, title: lf("Sort by Name {0}", sortedAsc ? lf("ascending") : lf("descending")), style: { cursor: 'pointer' } },
                                    lf("Name"),
                                    " ",
                                    sortedBy == 'name' ? React.createElement(sui.Icon, { icon: "arrow " + (sortedAsc ? 'up' : 'down') }) : undefined),
                                React.createElement("th", { onClick: this.handleToggleSortTime, tabIndex: 0, onKeyDown: sui.fireClickOnEnter, title: lf("Sort by Last Modified {0}", sortedAsc ? lf("ascending") : lf("descending")), style: { cursor: 'pointer' } },
                                    lf("Last Modified"),
                                    " ",
                                    sortedBy == 'time' ? React.createElement(sui.Icon, { icon: "arrow " + (sortedAsc ? 'up' : 'down') }) : undefined))),
                        React.createElement("tbody", null, headers.sort(this.getSortingFunction(sortedBy, sortedAsc)).map(function (scr, index) {
                            var isMarkedNew = !!markedNew[index];
                            var isSelected = !!selected[index];
                            var showMarkedNew = isMarkedNew && !isSelected;
                            return React.createElement(ProjectsCodeRow, { key: 'local' + scr.id + scr.recentUse, selected: isSelected, onRowClicked: _this.handleCardClick, index: index, scr: scr, markedNew: showMarkedNew },
                                React.createElement("td", null, scr.name),
                                React.createElement("td", null, pxt.Util.timeSince(scr.recentUse)));
                        }))))
                : undefined));
    };
    return ScriptManagerDialog;
}(data.Component));
exports.ScriptManagerDialog = ScriptManagerDialog;
var ProjectsCodeRow = /** @class */ (function (_super) {
    __extends(ProjectsCodeRow, _super);
    function ProjectsCodeRow(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        _this.handleCheckboxClick = _this.handleCheckboxClick.bind(_this);
        return _this;
    }
    ProjectsCodeRow.prototype.handleClick = function (e) {
        this.props.onRowClicked(e, this.props.scr, this.props.index);
    };
    ProjectsCodeRow.prototype.handleCheckboxClick = function (e) {
        this.props.onRowClicked(e, this.props.scr, this.props.index, true);
        e.preventDefault();
        e.stopPropagation();
    };
    ProjectsCodeRow.prototype.renderCore = function () {
        var _a = this.props, scr = _a.scr, onRowClicked = _a.onRowClicked, onClick = _a.onClick, selected = _a.selected, markedNew = _a.markedNew, children = _a.children, rest = __rest(_a, ["scr", "onRowClicked", "onClick", "selected", "markedNew", "children"]);
        return React.createElement("tr", __assign({ tabIndex: 0 }, rest, { onKeyDown: sui.fireClickOnEnter, onClick: this.handleClick, style: { cursor: 'pointer' }, className: "" + (markedNew ? 'warning' : selected ? 'positive' : '') }),
            React.createElement("td", { className: "collapsing", onClick: this.handleCheckboxClick },
                React.createElement(sui.Icon, { icon: "circle outline large " + (selected ? "check green" : markedNew ? 'black' : '') })),
            children);
    };
    return ProjectsCodeRow;
}(sui.StatelessUIElement));
