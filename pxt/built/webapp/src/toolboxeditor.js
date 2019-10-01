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
var srceditor = require("./srceditor");
var compiler = require("./compiler");
var ToolboxEditor = /** @class */ (function (_super) {
    __extends(ToolboxEditor, _super);
    function ToolboxEditor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.extensionsMap = {};
        _this.subcategoryMap = {};
        _this.topBlocks = [];
        return _this;
    }
    ToolboxEditor.prototype.shouldShowBlock = function (blockId, ns, shadow) {
        var filters = this.parent.state.editorState && this.parent.state.editorState.filters;
        if (filters) {
            // block-level filters should not apply to shadow blocks (nested)
            var blockFilter = filters.blocks && filters.blocks[blockId];
            var categoryFilter = filters.namespaces && filters.namespaces[ns];
            // First try block filters
            if (blockFilter != undefined && blockFilter == pxt.editor.FilterState.Hidden && !shadow)
                return false;
            if (blockFilter != undefined)
                return true;
            // Check if category is hidden
            if (categoryFilter != undefined && categoryFilter == pxt.editor.FilterState.Hidden)
                return false;
            if (categoryFilter != undefined)
                return true;
            // Check default filter state
            if (filters.defaultState != undefined && filters.defaultState == pxt.editor.FilterState.Hidden && !shadow)
                return false;
        }
        return true;
    };
    ToolboxEditor.prototype.shouldShowCustomCategory = function (ns) {
        var filters = this.parent.state.editorState && this.parent.state.editorState.filters;
        if (filters) {
            // These categories are special and won't have any children so we need to check the filters manually
            if (ns === "variables" && (!filters.blocks ||
                filters.blocks["variables_set"] ||
                filters.blocks["variables_get"] ||
                filters.blocks["variables_change"]) &&
                (!filters.namespaces || filters.namespaces["variables"] !== pxt.editor.FilterState.Disabled)) {
                return true;
            }
            else if (ns === "functions" && (!filters.blocks ||
                filters.blocks["function_definition"] ||
                filters.blocks["procedures_defnoreturn"] ||
                filters.blocks["procedures_callnoreturn"]) &&
                (!filters.namespaces || filters.namespaces["functions"] !== pxt.editor.FilterState.Disabled)) {
                return true;
            }
            else {
                return false;
            }
        }
        return true;
    };
    ToolboxEditor.prototype.getSearchSubset = function () {
        var _this = this;
        if (!this.searchSubset && this.blockInfo) {
            this.searchSubset = {};
            var searchSubset_1 = this.searchSubset;
            // Go through all built in blocks
            var blockDefinitions = pxt.blocks.blockDefinitions();
            for (var id in blockDefinitions) {
                var blockDef = blockDefinitions[id];
                if (this.shouldShowBlock(id, blockDef.category)) {
                    // Add to search subset
                    searchSubset_1[id] = true;
                }
            }
            // Go through all blocks and apply filter
            this.blockInfo.blocks.forEach(function (fn) {
                var ns = (fn.attributes.blockNamespace || fn.namespace).split('.')[0];
                if (fn.attributes.debug && !pxt.options.debug)
                    return;
                if (fn.attributes.deprecated || fn.attributes.blockHidden)
                    return;
                if (_this.shouldShowBlock(fn.attributes.blockId, ns)) {
                    // Add to search subset
                    searchSubset_1[fn.attributes.blockId] = true;
                }
            });
        }
        return this.searchSubset;
    };
    ToolboxEditor.prototype.searchAsync = function (searchTerm) {
        var searchOptions = {
            term: searchTerm,
            subset: this.getSearchSubset()
        };
        return compiler.apiSearchAsync(searchOptions)
            .then(function (fns) { return fns; })
            .then(function (searchResults) {
            pxt.debug("searching for: " + searchTerm);
            return searchResults;
        });
    };
    ToolboxEditor.prototype.clearCaches = function () {
        this.searchSubset = undefined;
    };
    ToolboxEditor.prototype.getAllCategories = function () {
        return this.getToolboxCategories(false).concat(this.getToolboxCategories(true));
    };
    ToolboxEditor.prototype.getToolboxCategories = function (isAdvanced) {
        if (!this.blockInfo)
            return [];
        var that = this;
        function filterNamespaces(namespaces) {
            return namespaces.filter(function (_a) {
                var md = _a[1];
                return !md.deprecated && (isAdvanced ? md.advanced : !md.advanced);
            });
        }
        var namespaces = filterNamespaces(this.getNamespaces()
            .map(function (ns) { return [ns, that.getNamespaceAttrs(ns)]; }));
        function createSubCategories(parent, names, isAdvanced) {
            return names.map(function (subns) {
                var ns = parent[0];
                var md = parent[1];
                // Don't show subcategory if there are no blocks to show
                var blocks = that.getBlocksForCategory(ns, subns).filter(function (block) { return that.shouldShowBlock(block.attributes.blockId, ns); });
                if (!blocks.length)
                    return undefined;
                var name = pxt.Util.rlf("{id:subcategory}" + subns);
                return {
                    nameid: ns,
                    name: name,
                    subns: subns,
                    color: md.color,
                    icon: md.icon,
                    groups: md.groups,
                    groupIcons: md.groupIcons,
                    groupHelp: md.groupHelp,
                    labelLineWidth: md.labelLineWidth,
                    blocks: blocks,
                    advanced: isAdvanced
                };
            }).filter(function (subns) { return !!subns; });
        }
        function createCategories(names, isAdvanced) {
            return names
                .sort(function (_a, _b) {
                var md1 = _a[1];
                var md2 = _b[1];
                // sort by fn weight
                var w2 = (md2 ? md2.weight || 50 : 50);
                var w1 = (md1 ? md1.weight || 50 : 50);
                return w2 >= w1 ? 1 : -1;
            }).map(function (_a) {
                var ns = _a[0], md = _a[1];
                var isBuiltIn = that.isBuiltIn(ns);
                var builtInCategory = isBuiltIn ? that.getBuiltinCategory(ns) : undefined;
                // We need the blocks to figure out if all blocks are hidden
                var blocks = that.getBlocksForCategory(ns).filter(function (block) { return that.shouldShowBlock(block.attributes.blockId, ns); });
                var hasExtensionButtons = that.extensionsMap[ns];
                var hasCustomClick = builtInCategory && builtInCategory.customClick;
                var subcategories;
                if ((md.subcategories && md.subcategories.length) || that.subcategoryMap[ns]) {
                    subcategories = createSubCategories([ns, md], md.subcategories || Object.keys(that.subcategoryMap[ns]), isAdvanced);
                }
                var hasBlocks = blocks.length || hasExtensionButtons || hasCustomClick || (subcategories && subcategories.length);
                // Don't show the category if there are no blocks in it
                if (!hasBlocks)
                    return undefined;
                if (hasCustomClick) {
                    // Ensure that we need to show this custom category
                    if (!that.shouldShowCustomCategory(ns))
                        return undefined;
                }
                // Prepare the category
                var category = {
                    nameid: ns,
                    name: md.block ? md.block : undefined,
                    color: md.color,
                    icon: md.icon,
                    groups: md.groups,
                    groupIcons: md.groupIcons,
                    groupHelp: md.groupHelp,
                    labelLineWidth: md.labelLineWidth,
                    blocks: blocks,
                    subcategories: subcategories,
                    advanced: isAdvanced
                };
                // Apply specific builtin customizations
                if (isBuiltIn) {
                    category.name = builtInCategory.name;
                    category.icon = md.icon ? pxt.toolbox.getNamespaceIcon(md.icon)
                        || md.icon : pxt.toolbox.getNamespaceIcon(ns);
                    category.groups = builtInCategory.groups || md.groups;
                    category.customClick = builtInCategory.customClick;
                }
                return category;
            }).filter(function (cat) { return !!cat; });
        }
        return createCategories(namespaces, isAdvanced);
    };
    ToolboxEditor.prototype.moveFocusToFlyout = function () { };
    ToolboxEditor.prototype.abstractShowFlyout = function (treeRow) {
        var _this = this;
        var ns = treeRow.nameid, name = treeRow.name, subns = treeRow.subns, icon = treeRow.icon, color = treeRow.color, groups = treeRow.groups, groupIcons = treeRow.groupIcons, groupHelp = treeRow.groupHelp, labelLineWidth = treeRow.labelLineWidth, blocks = treeRow.blocks;
        var inTutorial = this.parent.state.tutorialOptions
            && !!this.parent.state.tutorialOptions.tutorial;
        var fns = blocks;
        if (!fns || !fns.length)
            return false;
        if (!pxt.appTarget.appTheme.hideFlyoutHeadings) {
            // Add the Heading label
            this.showFlyoutHeadingLabel(ns, name, subns, icon, color);
        }
        // Organize and rearrange methods into groups
        var blockGroups = {};
        var sortedGroups = [];
        if (groups)
            sortedGroups = groups;
        // Create a dict of group icon pairs
        var groupIconsDict = {};
        if (groups && groupIcons) {
            var groupIconsList = groupIcons;
            for (var i = 0; i < sortedGroups.length; i++) {
                var groupIcon = groupIconsList[i];
                groupIconsDict[sortedGroups[i]] = groupIcon || '';
            }
        }
        // Create a dict of group help callback pairs
        var groupHelpDict = {};
        if (groups && groupHelp) {
            var groupHelpCallbackList = groupHelp;
            for (var i = 0; i < sortedGroups.length; i++) {
                var helpCallback = groupHelpCallbackList[i];
                groupHelpDict[sortedGroups[i]] = helpCallback || '';
            }
        }
        // Organize the blocks into the different groups
        for (var bi = 0; bi < fns.length; ++bi) {
            var blk = fns[bi];
            var group = blk.attributes.group || 'other';
            if (!blockGroups[group])
                blockGroups[group] = [];
            blockGroups[group].push(blk);
        }
        var groupLength = Object.keys(blockGroups).length;
        if (groupLength > 1) {
            // Add any missing groups to the sorted groups list
            Object.keys(blockGroups).sort().forEach(function (group) {
                if (sortedGroups.indexOf(group) == -1) {
                    sortedGroups.push(group);
                }
            });
            // Add labels and insert the blocks into the flyout
            for (var bg = 0; bg < sortedGroups.length; ++bg) {
                var group = sortedGroups[bg];
                // Check if there are any blocks in that group
                if (!blockGroups[group] || !blockGroups[group].length)
                    continue;
                // Add the group label
                if (group != 'other' && !inTutorial) {
                    this.showFlyoutGroupLabel(group, groupIconsDict[group], labelLineWidth, groupHelpDict[group]);
                }
                // Add the blocks in that group
                if (blockGroups[group]) {
                    this.showFlyoutBlocks(ns, color, blockGroups[group]);
                }
            }
        }
        else if (groupLength == 1) {
            Object.keys(blockGroups).forEach(function (blockGroup) {
                _this.showFlyoutBlocks(ns, color, blockGroups[blockGroup]);
            });
        }
        return true;
    };
    // To be extended by editor
    ToolboxEditor.prototype.getNamespaceAttrs = function (ns) {
        var info = this.blockInfo.apis.byQName[ns];
        if (info) {
            return info.attributes;
        }
        if (this.extensionsMap[ns]) {
            var config = this.extensionsMap[ns];
            return {
                weight: 0,
                blockId: config.name,
                color: config.extension.color || '#7f8c8d',
                advanced: config.extension.advanced || false,
                callingConvention: 0 /* Plain */,
                paramDefl: {}
            };
        }
        return undefined;
    };
    // To be extended by editor
    ToolboxEditor.prototype.getNamespaces = function () {
        var _this = this;
        var namespaces = [];
        // Add extension namespaces if not already in
        this.extensions.forEach(function (config) {
            var name = config.name;
            var namespace = config.extension.namespace || name;
            if (!_this.extensionsMap[namespace])
                _this.extensionsMap[namespace] = config;
            if (!namespaces.filter(function (ns) { return ns == namespace; })) {
                namespaces.push(name);
            }
        });
        return namespaces;
    };
    ToolboxEditor.prototype.getTopBlocks = function () {
        // Order top blocks by weight
        return this.topBlocks.sort(function (fn1, fn2) {
            // sort by fn weight
            var w1 = fn1.attributes.topblockWeight || fn1.attributes.weight || 50;
            var w2 = fn2.attributes.topblockWeight || fn2.attributes.weight || 50;
            return w2 >= w1 ? 1 : -1;
        });
    };
    return ToolboxEditor;
}(srceditor.Editor));
exports.ToolboxEditor = ToolboxEditor;
