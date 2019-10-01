"use strict";
/// <reference path="../../localtypings/pxtarget.d.ts" />
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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var data = require("./data");
var sui = require("./sui");
var core = require("./core");
var Util = pxt.Util;
var CategoryNameID;
(function (CategoryNameID) {
    CategoryNameID["Loops"] = "loops";
    CategoryNameID["Logic"] = "logic";
    CategoryNameID["Variables"] = "variables";
    CategoryNameID["Maths"] = "Math";
    CategoryNameID["Functions"] = "functions";
    CategoryNameID["Arrays"] = "arrays";
    CategoryNameID["Text"] = "text";
    CategoryNameID["Extensions"] = "addpackage";
})(CategoryNameID = exports.CategoryNameID || (exports.CategoryNameID = {}));
var Toolbox = /** @class */ (function (_super) {
    __extends(Toolbox, _super);
    function Toolbox(props) {
        var _this = _super.call(this, props) || this;
        _this.handleRootElementRef = function (c) {
            _this.rootElement = c;
        };
        _this.state = {
            categories: [],
            visible: false,
            loading: false,
            showAdvanced: false
        };
        _this.setSelection = _this.setSelection.bind(_this);
        _this.advancedClicked = _this.advancedClicked.bind(_this);
        _this.recipesClicked = _this.recipesClicked.bind(_this);
        _this.recoverToolbox = _this.recoverToolbox.bind(_this);
        return _this;
    }
    Toolbox.prototype.getElement = function () {
        return this.rootElement;
    };
    Toolbox.prototype.hide = function () {
        this.setState({ visible: false });
    };
    Toolbox.prototype.showLoading = function () {
        this.setState({ visible: true, loading: true });
    };
    Toolbox.prototype.show = function () {
        this.setState({ visible: true });
    };
    Toolbox.prototype.setSelectedItem = function (item) {
        this.selectedItem = item;
    };
    Toolbox.prototype.setPreviousItem = function () {
        if (this.selectedIndex > 0) {
            var newIndex = --this.selectedIndex;
            // Check if the previous item has a subcategory
            var previousItem = this.items[newIndex];
            this.setSelection(previousItem, newIndex);
        }
        else if (this.state.showSearchBox) {
            // Focus the search box if it exists
            var searchBox = this.refs.searchbox;
            if (searchBox)
                searchBox.focus();
        }
    };
    Toolbox.prototype.setNextItem = function () {
        if (this.items.length - 1 > this.selectedIndex) {
            var newIndex = ++this.selectedIndex;
            this.setSelection(this.items[newIndex], newIndex);
        }
    };
    Toolbox.prototype.setSearch = function () {
        // Focus the search box if it exists
        var searchBox = this.refs.searchbox;
        if (searchBox)
            searchBox.focus();
    };
    Toolbox.prototype.clear = function () {
        this.clearSelection();
        this.selectedIndex = 0;
        this.selectedTreeRow = undefined;
    };
    Toolbox.prototype.clearSelection = function () {
        this.setState({ selectedItem: undefined, expandedItem: undefined, focusSearch: false });
    };
    Toolbox.prototype.clearSearch = function () {
        this.setState({ hasSearch: false, searchBlocks: undefined, focusSearch: false });
    };
    Toolbox.prototype.setSelection = function (treeRow, index, force) {
        var _a = this.props, editorname = _a.editorname, parent = _a.parent;
        var nameid = treeRow.nameid, subns = treeRow.subns, customClick = treeRow.customClick;
        pxt.tickEvent(editorname + ".toolbox.click", undefined, { interactiveConsent: true });
        var id = subns ? nameid + subns : nameid;
        if (this.state.selectedItem == id && !force) {
            this.clearSelection();
            // Hide flyout
            this.closeFlyout();
        }
        else {
            var handled = false;
            if (customClick) {
                handled = customClick(parent);
                if (handled)
                    return;
            }
            if (!handled) {
                this.setState({ selectedItem: id, expandedItem: nameid, focusSearch: false });
                this.selectedIndex = index;
                this.selectedTreeRow = treeRow;
                if (treeRow.advanced && !this.state.showAdvanced)
                    this.showAdvanced();
                if (!customClick) {
                    // Show flyout
                    this.showFlyout(treeRow);
                }
            }
        }
    };
    Toolbox.prototype.focus = function () {
        if (!this.rootElement)
            return;
        if (this.selectedItem && this.selectedItem.getTreeRow()) {
            // Focus the selected item
            var selectedItem = this.selectedItem.props.treeRow;
            var selectedItemIndex = this.items.indexOf(selectedItem);
            this.setSelection(selectedItem, selectedItemIndex, true);
        }
        else {
            // Focus first item in the toolbox
            this.selectFirstItem();
        }
    };
    Toolbox.prototype.selectFirstItem = function () {
        if (this.items[0]) {
            this.setSelection(this.items[0], 0, true);
        }
    };
    Toolbox.prototype.moveFocusToFlyout = function () {
        var parent = this.props.parent;
        parent.moveFocusToFlyout();
    };
    Toolbox.prototype.componentDidUpdate = function (prevProps, prevState) {
        if (prevState.visible != this.state.visible
            || prevState.loading != this.state.loading
            || prevState.showAdvanced != this.state.showAdvanced
            || this.state.expandedItem != prevState.expandedItem) {
            this.props.parent.resize();
        }
        if (this.state.hasSearch && this.state.searchBlocks != prevState.searchBlocks) {
            // Referesh search items
            this.refreshSearchItem();
        }
        else if (prevState.hasSearch && !this.state.hasSearch && this.state.selectedItem == 'search') {
            // No more search
            this.closeFlyout();
        }
    };
    Toolbox.prototype.componentDidCatch = function (error, info) {
        // Log what happened
        var editorname = this.props.editorname;
        pxt.tickEvent(editorname + ".toolbox.crashed", { error: error });
        // Update error state
        this.setState({ hasError: true });
    };
    Toolbox.prototype.recoverToolbox = function () {
        // Recover from above error state
        this.setState({ hasError: false });
    };
    Toolbox.prototype.advancedClicked = function () {
        var editorname = this.props.editorname;
        pxt.tickEvent(editorname + ".advanced", undefined, { interactiveConsent: true });
        this.showAdvanced();
    };
    Toolbox.prototype.recipesClicked = function () {
        var editorname = this.props.editorname;
        pxt.tickEvent(editorname + ".recipes");
        this.props.parent.parent.showRecipesDialog();
    };
    Toolbox.prototype.showAdvanced = function () {
        var parent = this.props.parent;
        if (this.selectedItem && this.selectedItem.props.treeRow
            && this.selectedItem.props.treeRow.advanced) {
            this.clear();
            this.closeFlyout();
        }
        this.setState({ showAdvanced: !this.state.showAdvanced });
    };
    Toolbox.prototype.getSearchBlocks = function () {
        var parent = this.props.parent;
        var searchBlocks = this.state.searchBlocks;
        return searchBlocks.map(function (searchResult) {
            return {
                name: searchResult.qName,
                attributes: {
                    blockId: searchResult.id
                },
                builtinBlock: searchResult.builtinBlock,
                builtinField: searchResult.field
            };
        });
    };
    Toolbox.prototype.refreshSelection = function () {
        var parent = this.props.parent;
        if (!this.state.selectedItem || !this.selectedTreeRow)
            return;
        if (this.selectedTreeRow.customClick) {
            this.selectedTreeRow.customClick(parent);
        }
        else {
            this.showFlyout(this.selectedTreeRow);
        }
    };
    Toolbox.prototype.refreshSearchItem = function () {
        var searchTreeRow = ToolboxSearch.getSearchTreeRow();
        this.showFlyout(searchTreeRow);
    };
    Toolbox.prototype.showFlyout = function (treeRow) {
        var parent = this.props.parent;
        // const t0 = performance.now();
        parent.showFlyout(treeRow);
        // const t1 = performance.now();
        // pxt.debug("perf: call to showFlyout took " + (t1 - t0) + " milliseconds.");
    };
    Toolbox.prototype.closeFlyout = function () {
        var parent = this.props.parent;
        parent.closeFlyout();
    };
    Toolbox.prototype.hasAdvancedCategories = function () {
        var categories = this.state.categories;
        return categories.some(function (category) { return category.advanced; });
    };
    Toolbox.prototype.getNonAdvancedCategories = function () {
        var categories = this.state.categories;
        return categories.filter(function (category) { return !category.advanced; });
    };
    Toolbox.prototype.getAdvancedCategories = function () {
        var categories = this.state.categories;
        return categories.filter(function (category) { return category.advanced; });
    };
    Toolbox.prototype.getAllCategoriesList = function (visibleOnly) {
        var _a = this.state, categories = _a.categories, hasSearch = _a.hasSearch, expandedItem = _a.expandedItem;
        var categoriesList = [];
        if (hasSearch)
            categoriesList.push(ToolboxSearch.getSearchTreeRow());
        categories.forEach(function (category) {
            categoriesList.push(category);
            if (category.subcategories &&
                (!visibleOnly || visibleOnly && category.nameid == expandedItem)) {
                category.subcategories.forEach(function (subcategory) {
                    categoriesList.push(subcategory);
                });
            }
        });
        return categoriesList;
    };
    Toolbox.prototype.shouldComponentUpdate = function (nextProps, nextState) {
        if (this.state != nextState)
            return true;
        return false;
    };
    Toolbox.prototype.isRtl = function () {
        var editorname = this.props.editorname;
        return editorname == 'monaco' ? false : Util.isUserLanguageRtl();
    };
    Toolbox.prototype.renderCore = function () {
        var _this = this;
        var _a = this.props, editorname = _a.editorname, parent = _a.parent;
        var _b = this.state, showAdvanced = _b.showAdvanced, visible = _b.visible, loading = _b.loading, selectedItem = _b.selectedItem, expandedItem = _b.expandedItem, hasSearch = _b.hasSearch, showSearchBox = _b.showSearchBox, hasError = _b.hasError;
        if (!visible)
            return React.createElement("div", { style: { display: 'none' } });
        var theme = pxt.appTarget.appTheme;
        var tutorialOptions = parent.parent.state.tutorialOptions;
        var inTutorial = !!tutorialOptions && !!tutorialOptions.tutorial;
        var hasTopBlocks = !!theme.topBlocks && !inTutorial;
        if (loading || hasError)
            return React.createElement("div", null,
                React.createElement("div", { className: "blocklyTreeRoot" },
                    React.createElement("div", { className: "blocklyTreeRow", style: { opacity: 0 } })),
                loading ? React.createElement("div", { className: "ui active dimmer" },
                    React.createElement("div", { className: "ui loader indeterminate" })) : undefined,
                hasError ? React.createElement("div", { className: "ui" },
                    lf("Toolbox crashed.."),
                    React.createElement(sui.Button, { icon: 'refresh', onClick: this.recoverToolbox, text: lf("Reload"), className: 'fluid' })) : undefined);
        var hasAdvanced = this.hasAdvancedCategories();
        var nonAdvancedCategories = this.getNonAdvancedCategories();
        var advancedCategories = hasAdvanced ? this.getAdvancedCategories() : [];
        this.items = this.getAllCategoriesList();
        var hasRecipes = !!theme.recipes && !inTutorial && this.items.length > 0;
        var searchTreeRow = ToolboxSearch.getSearchTreeRow();
        var topBlocksTreeRow = {
            nameid: 'topblocks',
            name: lf("{id:category}Basic"),
            color: pxt.toolbox.getNamespaceColor('topblocks'),
            icon: pxt.toolbox.getNamespaceIcon('topblocks')
        };
        var appTheme = pxt.appTarget.appTheme;
        var classes = sui.cx([
            'pxtToolbox',
            appTheme.invertedToolbox ? 'invertedToolbox' : '',
            appTheme.coloredToolbox ? 'coloredToolbox' : ''
        ]);
        var index = 0;
        return React.createElement("div", { ref: this.handleRootElementRef, className: classes, id: editorname + "EditorToolbox" },
            React.createElement(ToolboxStyle, { categories: this.items }),
            showSearchBox ? React.createElement(ToolboxSearch, { ref: "searchbox", parent: parent, toolbox: this, editorname: editorname }) : undefined,
            React.createElement("div", { className: "blocklyTreeRoot" },
                React.createElement("div", { role: "tree" },
                    hasSearch ? React.createElement(CategoryItem, { key: "search", toolbox: this, index: index++, selected: selectedItem == "search", treeRow: searchTreeRow, onCategoryClick: this.setSelection }) : undefined,
                    hasTopBlocks ? React.createElement(CategoryItem, { key: "topblocks", toolbox: this, selected: selectedItem == "topblocks", treeRow: topBlocksTreeRow, onCategoryClick: this.setSelection }) : undefined,
                    nonAdvancedCategories.map(function (treeRow) { return (React.createElement(CategoryItem, { key: treeRow.nameid, toolbox: _this, index: index++, selected: selectedItem == treeRow.nameid, childrenVisible: expandedItem == treeRow.nameid, treeRow: treeRow, onCategoryClick: _this.setSelection }, treeRow.subcategories ? treeRow.subcategories.map(function (subTreeRow) { return (React.createElement(CategoryItem, { key: subTreeRow.nameid + subTreeRow.subns, index: index++, toolbox: _this, selected: selectedItem == (subTreeRow.nameid + subTreeRow.subns), treeRow: subTreeRow, onCategoryClick: _this.setSelection })); }) : undefined)); }),
                    hasAdvanced || hasRecipes ? React.createElement(TreeSeparator, { key: "advancedseparator" }) : undefined,
                    hasRecipes ? React.createElement(CategoryItem, { toolbox: this, treeRow: { nameid: "", name: pxt.toolbox.recipesTitle(), color: pxt.toolbox.getNamespaceColor('recipes'), icon: pxt.toolbox.getNamespaceIcon('recipes') }, onCategoryClick: this.recipesClicked }) : undefined,
                    hasAdvanced ? React.createElement(CategoryItem, { toolbox: this, treeRow: { nameid: "", name: pxt.toolbox.advancedTitle(), color: pxt.toolbox.getNamespaceColor('advanced'), icon: pxt.toolbox.getNamespaceIcon(showAdvanced ? 'advancedexpanded' : 'advancedcollapsed') }, onCategoryClick: this.advancedClicked }) : undefined,
                    showAdvanced ? advancedCategories.map(function (treeRow) { return (React.createElement(CategoryItem, { key: treeRow.nameid, toolbox: _this, index: index++, selected: selectedItem == treeRow.nameid, childrenVisible: expandedItem == treeRow.nameid, treeRow: treeRow, onCategoryClick: _this.setSelection }, treeRow.subcategories ? treeRow.subcategories.map(function (subTreeRow) { return (React.createElement(CategoryItem, { key: subTreeRow.nameid, toolbox: _this, index: index++, selected: selectedItem == (subTreeRow.nameid + subTreeRow.subns), treeRow: subTreeRow, onCategoryClick: _this.setSelection })); }) : undefined)); }) : undefined)));
    };
    return Toolbox;
}(data.Component));
exports.Toolbox = Toolbox;
var CategoryItem = /** @class */ (function (_super) {
    __extends(CategoryItem, _super);
    function CategoryItem(props) {
        var _this = _super.call(this, props) || this;
        _this.handleTreeRowRef = function (c) {
            _this.treeRowElement = c;
        };
        _this.state = {
            selected: props.selected
        };
        _this.handleClick = _this.handleClick.bind(_this);
        _this.handleKeyDown = _this.handleKeyDown.bind(_this);
        return _this;
    }
    CategoryItem.prototype.getTreeRow = function () {
        return this.treeRowElement;
    };
    CategoryItem.prototype.componentWillReceiveProps = function (nextProps) {
        var newState = {};
        if (nextProps.selected != undefined) {
            newState.selected = nextProps.selected;
        }
        if (Object.keys(newState).length > 0)
            this.setState(newState);
    };
    CategoryItem.prototype.componentDidUpdate = function (prevProps, prevState) {
        var toolbox = this.props.toolbox;
        if (this.state.selected) {
            this.props.toolbox.setSelectedItem(this);
            if (!toolbox.state.focusSearch)
                this.focusElement();
        }
    };
    CategoryItem.prototype.focusElement = function () {
        this.treeRowElement.focus();
    };
    CategoryItem.prototype.handleClick = function (e) {
        var _a = this.props, treeRow = _a.treeRow, onCategoryClick = _a.onCategoryClick, index = _a.index;
        if (onCategoryClick)
            onCategoryClick(treeRow, index);
        e.preventDefault();
        e.stopPropagation();
    };
    CategoryItem.prototype.handleKeyDown = function (e) {
        var _a = this.props, toolbox = _a.toolbox, childrenVisible = _a.childrenVisible;
        var isRtl = Util.isUserLanguageRtl();
        var charCode = core.keyCodeFromEvent(e);
        if (charCode == 40) {
            this.nextItem();
        }
        else if (charCode == 38) {
            this.previousItem();
        }
        else if ((charCode == 39 && !isRtl) || (charCode == 37 && isRtl)) {
            // Focus inside flyout
            toolbox.moveFocusToFlyout();
        }
        else if (charCode == 27) {
            // Close the flyout
            toolbox.closeFlyout();
        }
        else if (charCode == core.ENTER_KEY || charCode == core.SPACE_KEY) {
            sui.fireClickOnEnter.call(this, e);
        }
        else if (charCode == core.TAB_KEY
            || charCode == 37 /* Left arrow key */
            || charCode == 39 /* Left arrow key */
            || charCode == 17 /* Ctrl Key */
            || charCode == 16 /* Shift Key */
            || charCode == 91 /* Cmd Key */) {
            // Escape tab and shift key
        }
        else {
            toolbox.setSearch();
        }
    };
    CategoryItem.prototype.previousItem = function () {
        var _a = this.props, toolbox = _a.toolbox, childrenVisible = _a.childrenVisible;
        var editorname = toolbox.props.editorname;
        pxt.tickEvent(editorname + ".toolbox.keyboard.prev\"", undefined, { interactiveConsent: true });
        toolbox.setPreviousItem();
    };
    CategoryItem.prototype.nextItem = function () {
        var _a = this.props, toolbox = _a.toolbox, childrenVisible = _a.childrenVisible;
        var editorname = toolbox.props.editorname;
        pxt.tickEvent(editorname + ".toolbox.keyboard.next\"", undefined, { interactiveConsent: true });
        toolbox.setNextItem();
    };
    CategoryItem.prototype.renderCore = function () {
        var _a = this.props, toolbox = _a.toolbox, childrenVisible = _a.childrenVisible;
        var selected = this.state.selected;
        return React.createElement(TreeItem, null,
            React.createElement(TreeRow, __assign({ ref: this.handleTreeRowRef, isRtl: toolbox.isRtl() }, this.props, { selected: selected, onClick: this.handleClick, onKeyDown: this.handleKeyDown })),
            React.createElement(TreeGroup, { visible: childrenVisible }, this.props.children));
    };
    return CategoryItem;
}(data.Component));
exports.CategoryItem = CategoryItem;
var TreeRow = /** @class */ (function (_super) {
    __extends(TreeRow, _super);
    function TreeRow(props) {
        var _this = _super.call(this, props) || this;
        _this.handleTreeRowRef = function (c) {
            _this.treeRow = c;
        };
        _this.state = {};
        _this.onmouseenter = _this.onmouseenter.bind(_this);
        _this.onmouseleave = _this.onmouseleave.bind(_this);
        return _this;
    }
    TreeRow.prototype.focus = function () {
        if (this.treeRow)
            this.treeRow.focus();
    };
    TreeRow.prototype.getProperties = function () {
        var treeRow = this.props.treeRow;
        return treeRow;
    };
    TreeRow.prototype.onmouseenter = function () {
        var appTheme = pxt.appTarget.appTheme;
        var metaColor = this.getMetaColor();
        var invertedMultipler = appTheme.blocklyOptions
            && appTheme.blocklyOptions.toolboxOptions
            && appTheme.blocklyOptions.toolboxOptions.invertedMultiplier || 0.3;
        if (appTheme.invertedToolbox) {
            this.treeRow.style.backgroundColor = pxt.toolbox.fadeColor(metaColor || '#ddd', invertedMultipler, false);
        }
    };
    TreeRow.prototype.onmouseleave = function () {
        var appTheme = pxt.appTarget.appTheme;
        var metaColor = this.getMetaColor();
        if (appTheme.invertedToolbox) {
            this.treeRow.style.backgroundColor = (metaColor || '#ddd');
        }
    };
    TreeRow.prototype.getMetaColor = function () {
        var color = this.props.treeRow.color;
        return pxt.toolbox.convertColor(color) || pxt.toolbox.getNamespaceColor('default');
    };
    TreeRow.prototype.renderCore = function () {
        var _a = this.props, selected = _a.selected, onClick = _a.onClick, onKeyDown = _a.onKeyDown, isRtl = _a.isRtl;
        var _b = this.props.treeRow, nameid = _b.nameid, subns = _b.subns, name = _b.name, icon = _b.icon;
        var appTheme = pxt.appTarget.appTheme;
        var metaColor = this.getMetaColor();
        var invertedMultipler = appTheme.blocklyOptions
            && appTheme.blocklyOptions.toolboxOptions
            && appTheme.blocklyOptions.toolboxOptions.invertedMultiplier || 0.3;
        var treeRowStyle = {
            paddingLeft: '0px'
        };
        var treeRowClass = 'blocklyTreeRow';
        if (appTheme.invertedToolbox) {
            // Inverted toolbox
            treeRowStyle.backgroundColor = (metaColor || '#ddd');
            treeRowStyle.color = '#fff';
        }
        else {
            if (appTheme.coloredToolbox) {
                // Colored toolbox
                treeRowStyle.color = "" + metaColor;
            }
            var border = "8px solid " + metaColor;
            if (isRtl) {
                treeRowStyle.borderRight = border;
            }
            else {
                treeRowStyle.borderLeft = border;
            }
        }
        // Selected
        if (selected) {
            treeRowClass += ' blocklyTreeSelected';
            if (appTheme.invertedToolbox) {
                treeRowStyle.backgroundColor = "" + pxt.toolbox.fadeColor(metaColor, invertedMultipler, false);
            }
            else {
                treeRowStyle.backgroundColor = (metaColor || '#ddd');
            }
            treeRowStyle.color = '#fff';
        }
        // Icon
        var iconClass = ("blocklyTreeIcon" + (subns ? 'more' : icon ? (nameid || icon).toLowerCase() : 'Default')).replace(/\s/g, '');
        var iconContent = subns ? pxt.toolbox.getNamespaceIcon('more') : icon || pxt.toolbox.getNamespaceIcon('default');
        var iconImageStyle;
        if (iconContent.length > 1) {
            // It's probably an image icon, and not an icon code
            iconImageStyle = React.createElement("style", null, ".blocklyTreeIcon." + iconClass + " {\n                    background-image: url(\"" + Util.pathJoin(pxt.webConfig.commitCdnUrl, encodeURI(icon)) + "\")!important;\n                    width: 30px;\n                    height: 100%;\n                    background-size: 20px !important;\n                    background-repeat: no-repeat !important;\n                    background-position: 50% 50% !important;\n                }");
            iconContent = undefined;
        }
        var rowTitle = name ? name : Util.capitalize(subns || nameid);
        return React.createElement("div", { role: "button", ref: this.handleTreeRowRef, className: treeRowClass, style: treeRowStyle, tabIndex: 0, "aria-label": lf("Toggle category {0}", rowTitle), "aria-expanded": selected, onMouseEnter: this.onmouseenter, onMouseLeave: this.onmouseleave, onClick: onClick, onContextMenu: onClick, onKeyDown: onKeyDown ? onKeyDown : sui.fireClickOnEnter },
            React.createElement("span", { className: "blocklyTreeIcon", role: "presentation" }),
            iconImageStyle,
            React.createElement("span", { style: { display: 'inline-block' }, className: "blocklyTreeIcon " + iconClass, role: "presentation" }, iconContent),
            React.createElement("span", { className: "blocklyTreeLabel" }, rowTitle));
    };
    return TreeRow;
}(data.Component));
exports.TreeRow = TreeRow;
var TreeSeparator = /** @class */ (function (_super) {
    __extends(TreeSeparator, _super);
    function TreeSeparator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TreeSeparator.prototype.renderCore = function () {
        return React.createElement(TreeItem, null,
            React.createElement("div", { className: "blocklyTreeSeparator" },
                React.createElement("span", { style: { display: 'inline-block' }, role: "presentation" })));
    };
    return TreeSeparator;
}(data.Component));
exports.TreeSeparator = TreeSeparator;
var TreeItem = /** @class */ (function (_super) {
    __extends(TreeItem, _super);
    function TreeItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TreeItem.prototype.renderCore = function () {
        var selected = this.props.selected;
        return React.createElement("div", { role: "treeitem", "aria-selected": selected }, this.props.children);
    };
    return TreeItem;
}(data.Component));
exports.TreeItem = TreeItem;
var TreeGroup = /** @class */ (function (_super) {
    __extends(TreeGroup, _super);
    function TreeGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TreeGroup.prototype.renderCore = function () {
        var visible = this.props.visible;
        return React.createElement("div", { role: "group", style: { backgroundPosition: '0px 0px', 'display': visible ? '' : 'none' } }, this.props.children);
    };
    return TreeGroup;
}(data.Component));
exports.TreeGroup = TreeGroup;
var ToolboxSearch = /** @class */ (function (_super) {
    __extends(ToolboxSearch, _super);
    function ToolboxSearch(props) {
        var _this = _super.call(this, props) || this;
        _this.search = Util.debounce(function () {
            _this.searchImmediate();
        }, 300, false);
        _this.state = {};
        _this.searchImmediate = _this.searchImmediate.bind(_this);
        _this.handleKeyDown = _this.handleKeyDown.bind(_this);
        _this.handleChange = _this.handleChange.bind(_this);
        return _this;
    }
    ToolboxSearch.getSearchTreeRow = function () {
        return {
            nameid: 'search',
            name: lf("{id:category}Search"),
            color: pxt.toolbox.getNamespaceColor('search'),
            icon: pxt.toolbox.getNamespaceIcon('search')
        };
    };
    ToolboxSearch.prototype.handleChange = function () {
        this.search();
    };
    ToolboxSearch.prototype.handleKeyDown = function (e) {
        var toolbox = this.props.toolbox;
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        if (charCode === 40 /* Down Key */) {
            // Select first item in the toolbox
            toolbox.selectFirstItem();
        }
    };
    ToolboxSearch.prototype.focus = function () {
        this.refs.searchInput.focus();
    };
    ToolboxSearch.prototype.searchImmediate = function () {
        var _this = this;
        var _a = this.props, parent = _a.parent, toolbox = _a.toolbox, editorname = _a.editorname;
        var searchTerm = this.refs.searchInput.value;
        var searchAccessibilityLabel = '';
        var hasSearch = false;
        pxt.tickEvent(editorname + ".search", undefined, { interactiveConsent: true });
        // Execute search
        parent.searchAsync(searchTerm)
            .done(function (blocks) {
            if (blocks.length == 0) {
                searchAccessibilityLabel = lf("No search results...");
            }
            else {
                searchAccessibilityLabel = lf("{0} result matching '{1}'", blocks.length, searchTerm.toLowerCase());
            }
            hasSearch = searchTerm != '';
            var newState = {};
            newState.hasSearch = hasSearch;
            newState.searchBlocks = blocks;
            newState.focusSearch = true;
            if (hasSearch)
                newState.selectedItem = 'search';
            toolbox.setState(newState);
            _this.setState({ searchAccessibilityLabel: searchAccessibilityLabel });
        });
    };
    ToolboxSearch.prototype.renderCore = function () {
        var searchAccessibilityLabel = this.state.searchAccessibilityLabel;
        return React.createElement("div", { id: "blocklySearchArea" },
            React.createElement("div", { id: "blocklySearchInput", className: "ui fluid icon input", role: "search" },
                React.createElement("input", { ref: "searchInput", type: "text", placeholder: lf("Search..."), onFocus: this.searchImmediate, onKeyDown: this.handleKeyDown, onChange: this.handleChange, id: "blocklySearchInputField", className: "blocklySearchInputField", "aria-label": lf("Search"), autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false }),
                React.createElement("i", { className: "search icon", role: "presentation", "aria-hidden": "true" }),
                React.createElement("div", { className: "accessible-hidden", id: "blocklySearchLabel", "aria-live": "polite" },
                    " ",
                    searchAccessibilityLabel,
                    " ")));
    };
    return ToolboxSearch;
}(data.Component));
exports.ToolboxSearch = ToolboxSearch;
var ToolboxTrashIcon = /** @class */ (function (_super) {
    __extends(ToolboxTrashIcon, _super);
    function ToolboxTrashIcon() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ToolboxTrashIcon.prototype.renderCore = function () {
        return React.createElement("div", { id: "blocklyTrashIcon", style: { opacity: 0, display: 'none' } },
            React.createElement("i", { className: "trash icon", "aria-hidden": "true" }));
    };
    return ToolboxTrashIcon;
}(data.Component));
exports.ToolboxTrashIcon = ToolboxTrashIcon;
var ToolboxStyle = /** @class */ (function (_super) {
    __extends(ToolboxStyle, _super);
    function ToolboxStyle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ToolboxStyle.prototype.renderCore = function () {
        var categories = this.props.categories;
        // Add inline CSS for each category used so that the tutorial engine is able to render blocks
        // and assosiate them with a specific category
        return React.createElement("style", null, categories.filter(function (c) { return !!c.color; }).map(function (category) {
            return "span.docs.inlineblock." + category.nameid.toLowerCase() + " {\n                    background-color: " + category.color + ";\n                    border-color: " + pxt.toolbox.fadeColor(category.color, 0.1, false) + ";\n                }";
        }));
    };
    return ToolboxStyle;
}(data.Component));
exports.ToolboxStyle = ToolboxStyle;
