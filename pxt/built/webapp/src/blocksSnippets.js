"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _cachedBuiltinCategories = null;
function cachedBuiltinCategories() {
    if (!_cachedBuiltinCategories) {
        _cachedBuiltinCategories = {};
        _cachedBuiltinCategories["loops" /* Loops */] = {
            name: lf("{id:category}Loops"),
            nameid: "loops" /* Loops */,
            blocks: [
                {
                    name: "controls_repeat_ext",
                    attributes: {
                        blockId: "controls_repeat_ext",
                        weight: 49
                    },
                    blockXml: "<block type=\"controls_repeat_ext\">\n                    <value name=\"TIMES\">\n                        <shadow type=\"math_whole_number\">\n                            <field name=\"NUM\">4</field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "device_while",
                    attributes: {
                        blockId: "device_while",
                        weight: 48
                    },
                    blockXml: "<block type=\"device_while\">\n                    <value name=\"COND\">\n                        <shadow type=\"logic_boolean\"></shadow>\n                    </value>\n                </block>"
                },
                {
                    name: "pxt_controls_for",
                    attributes: {
                        blockId: "pxt_controls_for",
                        weight: 47
                    },
                    blockXml: "<block type=\"pxt_controls_for\">\n                    <value name=\"VAR\">\n                        <shadow type=\"variables_get_reporter\">\n                            <field name=\"VAR\">" + lf("{id:var}index") + "</field>\n                        </shadow>\n                    </value>\n                    <value name=\"TO\">\n                        <shadow type=\"math_whole_number\">\n                            <field name=\"NUM\">4</field>\n                        </shadow>\n                    </value>\n                </block>"
                },
                {
                    name: "pxt_controls_for_of",
                    attributes: {
                        blockId: "pxt_controls_for_of",
                        weight: 46
                    },
                    blockXml: "<block type=\"pxt_controls_for_of\">\n                    <value name=\"VAR\">\n                        <shadow type=\"variables_get_reporter\">\n                            <field name=\"VAR\">" + lf("{id:var}value") + "</field>\n                        </shadow>\n                    </value>\n                    <value name=\"LIST\">\n                        <shadow type=\"variables_get\">\n                            <field name=\"VAR\">list</field>\n                        </shadow>\n                    </value>\n                </block>"
                }
            ],
            attributes: {
                callingConvention: 0 /* Plain */,
                icon: "loops",
                weight: 50.09,
                paramDefl: {}
            }
        };
        if (pxt.appTarget.runtime && pxt.appTarget.runtime.breakBlock) {
            _cachedBuiltinCategories["loops" /* Loops */].blocks.push({
                name: "pxt_break",
                attributes: {
                    blockId: "break_keyword",
                    weight: 30
                },
                blockXml: "<block type=\"break_keyword\"></block>"
            });
        }
        if (pxt.appTarget.runtime && pxt.appTarget.runtime.continueBlock) {
            _cachedBuiltinCategories["loops" /* Loops */].blocks.push({
                name: "pxt_continue",
                attributes: {
                    blockId: "continue_keyword",
                    weight: 29
                },
                blockXml: "<block type=\"continue_keyword\"></block>"
            });
        }
        _cachedBuiltinCategories["logic" /* Logic */] = {
            name: lf("{id:category}Logic"),
            nameid: "logic" /* Logic */,
            groups: [lf("Conditionals"), lf("Comparison"), lf("Boolean"), "other"],
            blocks: [
                {
                    name: "controls_if",
                    attributes: {
                        blockId: "controls_if",
                        group: lf("Conditionals"),
                        weight: 49
                    },
                    blockXml: "<block type=\"controls_if\" gap=\"8\">\n                    <value name=\"IF0\">\n                        <shadow type=\"logic_boolean\">\n                            <field name=\"BOOL\">TRUE</field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "controls_if_else",
                    attributes: {
                        blockId: "controls_if",
                        group: lf("Conditionals"),
                        weight: 48
                    },
                    blockXml: "<block type=\"controls_if\" gap=\"8\">\n                    <mutation else=\"1\"></mutation>\n                    <value name=\"IF0\">\n                        <shadow type=\"logic_boolean\">\n                            <field name=\"BOOL\">TRUE</field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "logic_compare_eq",
                    attributes: {
                        blockId: "logic_compare",
                        group: lf("Comparison"),
                        weight: 47
                    },
                    blockXml: "<block type=\"logic_compare\" gap=\"8\">\n                    <value name=\"A\">\n                        <shadow type=\"math_number\">\n                            <field name=\"NUM\">0</field>\n                        </shadow>\n                    </value>\n                    <value name=\"B\">\n                        <shadow type=\"math_number\">\n                            <field name=\"NUM\">0</field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "logic_compare_lt",
                    attributes: {
                        blockId: "logic_compare",
                        group: lf("Comparison"),
                        weight: 46
                    },
                    blockXml: "<block type=\"logic_compare\">\n                    <field name=\"OP\">LT</field>\n                    <value name=\"A\">\n                        <shadow type=\"math_number\">\n                            <field name=\"NUM\">0</field>\n                        </shadow>\n                    </value>\n                    <value name=\"B\">\n                        <shadow type=\"math_number\">\n                            <field name=\"NUM\">0</field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "logic_compare_strings",
                    attributes: {
                        blockId: "logic_compare",
                        group: lf("Comparison"),
                        weight: 45
                    },
                    blockXml: "<block type=\"logic_compare\" gap=\"8\">\n                    <value name=\"A\">\n                        <shadow type=\"text\">\n                            <field name=\"TEXT\"></field>\n                        </shadow>\n                    </value>\n                    <value name=\"B\">\n                        <shadow type=\"text\">\n                            <field name=\"TEXT\"></field>\n                        </shadow>\n                    </value>\n                </block>"
                }, {
                    name: "logic_operation_and",
                    attributes: {
                        blockId: "logic_operation",
                        group: lf("Boolean"),
                        weight: 44
                    },
                    blockXml: "<block type=\"logic_operation\" gap=\"8\">\n                    <field name=\"OP\">AND</field>\n                </block>"
                }, {
                    name: "logic_operation_or",
                    attributes: {
                        blockId: "logic_operation",
                        group: lf("Boolean"),
                        weight: 43
                    },
                    blockXml: "<block type=\"logic_operation\" gap=\"8\">\n                    <field name=\"OP\">OR</field>\n                </block>"
                }, {
                    name: "logic_negate",
                    attributes: {
                        blockId: "logic_negate",
                        group: lf("Boolean"),
                        weight: 42
                    },
                    blockXml: "<block type=\"logic_negate\"></block>"
                }, {
                    name: "logic_boolean_true",
                    attributes: {
                        blockId: "logic_boolean",
                        group: lf("Boolean"),
                        weight: 41
                    },
                    blockXml: "<block type=\"logic_boolean\" gap=\"8\">\n                    <field name=\"BOOL\">TRUE</field>\n                </block>"
                }, {
                    name: "logic_boolean_false",
                    attributes: {
                        blockId: "logic_boolean",
                        group: lf("Boolean"),
                        weight: 40
                    },
                    blockXml: "<block type=\"logic_boolean\">\n                    <field name=\"BOOL\">FALSE</field>\n                </block>"
                }
            ],
            attributes: {
                callingConvention: 0 /* Plain */,
                weight: 50.08,
                icon: "logic",
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["variables" /* Variables */] = {
            name: lf("{id:category}Variables"),
            nameid: "variables" /* Variables */,
            blocks: undefined,
            custom: true,
            customClick: function (theEditor) {
                theEditor.showVariablesFlyout();
                return false;
            },
            attributes: {
                weight: 50.07,
                icon: "variables",
                callingConvention: 0 /* Plain */,
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["Math" /* Maths */] = {
            name: lf("{id:category}Math"),
            nameid: "Math" /* Maths */,
            blocks: [
                {
                    name: "math_arithmetic_ADD",
                    attributes: {
                        blockId: "math_arithmetic",
                        weight: 90
                    },
                    blockXml: "<block type=\"math_arithmetic\" gap=\"8\">\n                        <value name=\"A\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"B\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"OP\">ADD</field>\n                    </block>"
                }, {
                    name: "math_arithmetic_MINUS",
                    attributes: {
                        blockId: "math_arithmetic",
                        weight: 89
                    },
                    blockXml: "<block type=\"math_arithmetic\" gap=\"8\">\n                        <value name=\"A\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"B\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"OP\">MINUS</field>\n                    </block>"
                }, {
                    name: "math_arithmetic_TIMES",
                    attributes: {
                        blockId: "math_arithmetic",
                        weight: 88
                    },
                    blockXml: "<block type=\"math_arithmetic\" gap=\"8\">\n                        <value name=\"A\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"B\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"OP\">MULTIPLY</field>\n                    </block>"
                }, {
                    name: "math_arithmetic_DIVIDE",
                    attributes: {
                        blockId: "math_arithmetic",
                        weight: 87
                    },
                    blockXml: "<block type=\"math_arithmetic\" gap=\"8\">\n                        <value name=\"A\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"B\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"OP\">DIVIDE</field>\n                    </block>"
                }, {
                    name: "math_number",
                    attributes: {
                        blockId: "math_number",
                        weight: 86
                    },
                    blockXml: "<block type=\"math_number\" gap=\"8\">\n                        <field name=\"NUM\">0</field>\n                    </block>"
                }, {
                    name: "math_modulo",
                    attributes: {
                        blockId: "math_modulo",
                        weight: 85
                    },
                    blockXml: "<block type=\"math_modulo\">\n                        <value name=\"DIVIDEND\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"DIVISOR\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">1</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }, {
                    name: "math_op2_min",
                    attributes: {
                        blockId: "math_op2",
                        weight: 84
                    },
                    blockXml: "<block type=\"math_op2\" gap=\"8\">\n                        <value name=\"x\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"y\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"op\">min</field>\n                    </block>"
                }, {
                    name: "math_op2_max",
                    attributes: {
                        blockId: "math_op2",
                        weight: 83
                    },
                    blockXml: "<block type=\"math_op2\" gap=\"8\">\n                        <value name=\"x\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"y\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <field name=\"op\">max</field>\n                    </block>"
                }, {
                    name: "math_op3",
                    attributes: {
                        blockId: "math_op3",
                        weight: 82
                    },
                    blockXml: "<block type=\"math_op3\">\n                        <value name=\"x\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }, {
                    name: "math_js_op",
                    attributes: {
                        blockId: "math_js_op",
                        weight: 81
                    },
                    blockXml: "<block type=\"math_js_op\">\n                        <field name=\"OP\">sqrt</field>\n                        <value name=\"ARG0\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }, {
                    name: "math_js_round",
                    attributes: {
                        blockId: "math_js_round",
                        weight: 80
                    },
                    blockXml: "<block type=\"math_js_round\">\n                        <field name=\"OP\">round</field>\n                        <value name=\"ARG0\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }
            ],
            attributes: {
                callingConvention: 0 /* Plain */,
                weight: 50.06,
                icon: "math",
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["functions" /* Functions */] = {
            name: lf("{id:category}Functions"),
            nameid: "functions" /* Functions */,
            blocks: [],
            custom: true,
            customClick: function (theEditor) {
                theEditor.showFunctionsFlyout();
                return false;
            },
            attributes: {
                advanced: true,
                weight: 50.08,
                callingConvention: 0 /* Plain */,
                icon: "functions",
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["arrays" /* Arrays */] = {
            name: lf("{id:category}Arrays"),
            nameid: "arrays" /* Arrays */,
            blocks: [
                {
                    name: "lists_create_with",
                    attributes: {
                        blockId: "lists_create_with",
                        weight: 90
                    },
                    blockXml: "<block type=\"variables_set\" gap=\"8\">\n                        <field name=\"VAR\" variabletype=\"\">" + lf("{id:var}list") + "</field>\n                        <value name=\"VALUE\">\n                            <block type=\"lists_create_with\">\n                                <mutation items=\"2\"></mutation>\n                                <value name=\"ADD0\">\n                                    <shadow type=\"math_number\">\n                                        <field name=\"NUM\">1</field>\n                                    </shadow>\n                                </value>\n                                <value name=\"ADD1\">\n                                    <shadow type=\"math_number\">\n                                        <field name=\"NUM\">2</field>\n                                    </shadow>\n                                </value>\n                            </block>\n                        </value>\n                    </block>"
                }, {
                    name: "lists_create_with",
                    attributes: {
                        blockId: "lists_create_with",
                        weight: 89
                    },
                    blockXml: "<block type=\"variables_set\">\n                        <field name=\"VAR\" variabletype=\"\">" + lf("{id:var}text list") + "</field>\n                        <value name=\"VALUE\">\n                            <block type=\"lists_create_with\">\n                                <mutation items=\"3\"></mutation>\n                                <value name=\"ADD0\">\n                                    <shadow type=\"text\">\n                                        <field name=\"TEXT\">" + lf("a") + "</field>\n                                    </shadow>\n                                </value>\n                                <value name=\"ADD1\">\n                                    <shadow type=\"text\">\n                                        <field name=\"TEXT\">" + lf("b") + "</field>\n                                    </shadow>\n                                </value>\n                                <value name=\"ADD2\">\n                                    <shadow type=\"text\">\n                                        <field name=\"TEXT\">" + lf("c") + "</field>\n                                    </shadow>\n                                </value>\n                            </block>\n                        </value>\n                    </block>"
                }, {
                    name: "lists_create_with",
                    attributes: {
                        blockId: "lists_create_with",
                        weight: 5
                    },
                    blockXml: "<block type=\"lists_create_with\">\n                        <mutation items=\"0\"></mutation>\n                    </block>"
                },
                {
                    name: "lists_index_get",
                    attributes: {
                        blockId: "lists_index_get",
                        weight: 87
                    },
                    blockXml: "<block type=\"lists_index_get\">\n                        <value name=\"LIST\">\n                            <block type=\"variables_get\">\n                                <field name=\"VAR\">" + lf("{id:var}list") + "</field>\n                            </block>\n                        </value>\n                        <value name=\"INDEX\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                    </block>"
                },
                {
                    name: "lists_index_set",
                    attributes: {
                        blockId: "lists_index_set",
                        weight: 86
                    },
                    blockXml: "<block type=\"lists_index_set\">\n                        <value name=\"INDEX\">\n                            <shadow type=\"math_number\">\n                                <field name=\"NUM\">0</field>\n                            </shadow>\n                        </value>\n                        <value name=\"LIST\">\n                            <block type=\"variables_get\">\n                                <field name=\"VAR\">" + lf("{id:var}list") + "</field>\n                            </block>\n                        </value>\n                    </block>"
                },
                {
                    name: "lists_length",
                    attributes: {
                        blockId: "lists_length",
                        weight: 88
                    },
                    blockXml: "<block type=\"lists_length\">\n                        <value name=\"VALUE\">\n                            <block type=\"variables_get\">\n                                <field name=\"VAR\">" + lf("{id:var}list") + "</field>\n                            </block>\n                        </value>\n                    </block>"
                }
            ],
            attributes: {
                advanced: true,
                weight: 50.07,
                icon: "arrays",
                callingConvention: 0 /* Plain */,
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["text" /* Text */] = {
            name: lf("{id:category}Text"),
            nameid: "text" /* Text */,
            blocks: [
                {
                    name: "text",
                    attributes: {
                        blockId: "text",
                        weight: 90
                    },
                    blockXml: "<block type=\"text\"></block>"
                }, {
                    name: "text_length",
                    attributes: {
                        blockId: "text_length",
                        weight: 89
                    },
                    blockXml: "<block type=\"text_length\">\n                        <value name=\"VALUE\">\n                            <shadow type=\"text\">\n                                <field name=\"TEXT\">" + lf("Hello") + "</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }, {
                    name: "text_join",
                    attributes: {
                        blockId: "text_join",
                        weight: 88
                    },
                    blockXml: "<block type=\"text_join\">\n                        <mutation items=\"2\"></mutation>\n                        <value name=\"ADD0\">\n                            <shadow type=\"text\">\n                                <field name=\"TEXT\">" + lf("Hello") + "</field>\n                            </shadow>\n                        </value>\n                        <value name=\"ADD1\">\n                            <shadow type=\"text\">\n                                <field name=\"TEXT\">" + lf("World") + "</field>\n                            </shadow>\n                        </value>\n                    </block>"
                }
            ],
            attributes: {
                advanced: true,
                weight: 50.06,
                icon: "text",
                callingConvention: 0 /* Plain */,
                paramDefl: {}
            }
        };
        _cachedBuiltinCategories["addpackage" /* Extensions */] = {
            name: pxt.toolbox.addPackageTitle(),
            nameid: "addpackage" /* Extensions */,
            blocks: [],
            custom: true,
            customClick: function (theEditor) {
                theEditor.closeFlyout();
                theEditor.showPackageDialog();
                return true;
            },
            attributes: {
                advanced: true,
                weight: -1,
                icon: 'addpackage',
                callingConvention: 0 /* Plain */,
                paramDefl: {}
            }
        };
    }
    return _cachedBuiltinCategories;
}
var pauseUntil;
function getPauseUntil() {
    if (pauseUntil)
        return pauseUntil;
    var opts = pxt.appTarget.runtime && pxt.appTarget.runtime.pauseUntilBlock;
    if (opts) {
        pauseUntil = {
            name: pxtc.PAUSE_UNTIL_TYPE,
            attributes: {
                blockId: pxtc.PAUSE_UNTIL_TYPE,
                blockNamespace: opts.category || "loops",
                weight: opts.weight == null ? 0 : opts.weight
            },
            blockXml: Blockly.Xml.domToText(pxt.blocks.mkPredicateBlock(pxtc.PAUSE_UNTIL_TYPE))
        };
    }
    return pauseUntil;
}
exports.getPauseUntil = getPauseUntil;
function getBuiltinCategory(ns) {
    return cachedBuiltinCategories()[ns];
}
exports.getBuiltinCategory = getBuiltinCategory;
function isBuiltin(ns) {
    return !!cachedBuiltinCategories()[ns];
}
exports.isBuiltin = isBuiltin;
var builtinBlockCache;
function allBuiltinBlocks() {
    if (!builtinBlockCache) {
        builtinBlockCache = {};
        [
            getBuiltinCategory("loops" /* Loops */),
            getBuiltinCategory("logic" /* Logic */),
            getBuiltinCategory("Math" /* Maths */),
            getBuiltinCategory("text" /* Text */),
            getBuiltinCategory("arrays" /* Arrays */)
        ].forEach(function (builtin) {
            builtin.blocks.forEach(function (block) {
                if (block.attributes.blockId && !builtinBlockCache[block.attributes.blockId]) {
                    builtinBlockCache[block.attributes.blockId] = block;
                }
            });
        });
    }
    // Add on start built in block
    builtinBlockCache[ts.pxtc.ON_START_TYPE] = {
        name: ts.pxtc.ON_START_TYPE,
        attributes: {
            blockId: ts.pxtc.ON_START_TYPE,
            weight: pxt.appTarget.runtime.onStartWeight || 10
        },
        blockXml: "<block type=\"pxt-on-start\"></block>"
    };
    // Add pause until built in block
    var pauseUntil = getPauseUntil();
    if (pauseUntil) {
        builtinBlockCache[pxtc.PAUSE_UNTIL_TYPE] = pauseUntil;
    }
    return builtinBlockCache;
}
exports.allBuiltinBlocks = allBuiltinBlocks;
function clearBuiltinBlockCache() {
    builtinBlockCache = undefined;
}
exports.clearBuiltinBlockCache = clearBuiltinBlockCache;
function overrideCategory(ns, def) {
    var cat = getBuiltinCategory(ns);
    if (def && cat) {
        if (Object.keys(def).length === 0) {
            cat.removed = true;
        }
        if (def.name) {
            cat.name = def.name;
        }
        if (def.icon) {
            cat.attributes.icon = def.icon;
        }
        if (def.weight !== undefined) {
            cat.attributes.weight = def.weight;
        }
        if (def.advanced !== undefined) {
            cat.attributes.advanced = def.advanced;
        }
        if (def.groups != undefined) {
            cat.groups = def.groups;
        }
        if (def.blocks) {
            var currentWeight_1 = 100;
            cat.blocks = def.blocks.map(function (b, i) {
                if (b.weight) {
                    currentWeight_1 = b.weight;
                }
                else {
                    currentWeight_1--;
                }
                return blockFromJson(b, currentWeight_1);
            });
        }
    }
}
exports.overrideCategory = overrideCategory;
function blockFromJson(b, currentWeight) {
    return {
        name: b.name,
        snippet: b.snippet,
        snippetName: b.snippetName,
        snippetOnly: b.snippetOnly,
        pySnippet: b.pySnippet,
        pySnippetName: b.pySnippetName,
        attributes: {
            blockId: b.blockId,
            weight: currentWeight || b.weight,
            advanced: b.advanced,
            jsDoc: b.jsDoc,
            group: b.group,
        },
        retType: b.retType,
        blockXml: b.blockXml
    };
}
function blockToJson(b) {
    return {
        name: b.name,
        snippet: b.snippet,
        snippetName: b.snippetName,
        pySnippet: b.pySnippet,
        pySnippetName: b.pySnippetName,
        snippetOnly: b.snippetOnly,
        retType: b.retType,
        weight: b.attributes.weight,
        advanced: b.attributes.advanced,
        jsDoc: b.attributes.jsDoc,
        group: b.attributes.group,
        blockXml: b.blockXml,
        blockId: b.attributes.blockId
    };
}
function categoryToJson(c) {
    return {
        name: c.name,
        icon: c.attributes.icon,
        color: c.attributes.color,
        weight: c.attributes.weight,
        advanced: c.attributes.advanced,
        blocks: (c.blocks) ? c.blocks.map(function (b) { return blockToJson(b); }) : []
    };
}
function overrideToolbox(def) {
    overrideCategory("loops" /* Loops */, def.loops);
    overrideCategory("logic" /* Logic */, def.logic);
    overrideCategory("variables" /* Variables */, def.variables);
    overrideCategory("Math" /* Maths */, def.maths);
    overrideCategory("text" /* Text */, def.text);
    overrideCategory("arrays" /* Arrays */, def.arrays);
    overrideCategory("functions" /* Functions */, def.functions);
}
exports.overrideToolbox = overrideToolbox;
function getToolboxDefinition() {
    return {
        loops: categoryToJson(getBuiltinCategory("loops" /* Loops */)),
        logic: categoryToJson(getBuiltinCategory("logic" /* Logic */)),
        variables: categoryToJson(getBuiltinCategory("variables" /* Variables */)),
        maths: categoryToJson(getBuiltinCategory("Math" /* Maths */)),
        text: categoryToJson(getBuiltinCategory("text" /* Text */)),
        arrays: categoryToJson(getBuiltinCategory("arrays" /* Arrays */)),
        functions: categoryToJson(getBuiltinCategory("functions" /* Functions */))
    };
}
exports.getToolboxDefinition = getToolboxDefinition;
