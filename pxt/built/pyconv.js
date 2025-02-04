"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodeutil = require("./nodeutil");
var fs = require("fs");
var U = pxt.Util;
var B = pxt.blocks;
/* tslint:disable:no-trailing-whitespace */
var convPy = "\nimport ast\nimport sys\nimport json\n\ndef to_json(val):\n    if val is None or isinstance(val, (bool, str, int, float)):\n        return val\n    if isinstance(val, list):\n        return [to_json(x) for x in val]\n    if isinstance(val, ast.AST):\n        js = dict()\n        js['kind'] = val.__class__.__name__\n        for attr_name in dir(val):\n            if not attr_name.startswith(\"_\"):\n                js[attr_name] = to_json(getattr(val, attr_name))\n        return js    \n    if isinstance(val, (bytearray, bytes)):\n        return [x for x in val]\n    raise Exception(\"unhandled: %s (type %s)\" % (val, type(val)))\n\njs = dict()\nfor fn in @files@:\n    js[fn] = to_json(ast.parse(open(fn, \"r\").read()))\nprint(json.dumps(js))\n";
/* tslint:enable:no-trailing-whitespace */
var nameMap = {
    "Expr": "ExprStmt",
    "arg": "Arg",
    "arguments": "Arguments",
    "keyword": "Keyword",
    "comprehension": "Comprehension",
    "alias": "Alias",
    "withitem": "WithItem"
};
var simpleNames = {
    "Load": true, "Store": true, "Del": true, "AugLoad": true, "AugStore": true, "Param": true, "And": true,
    "Or": true, "Add": true, "Sub": true, "Mult": true, "MatMult": true, "Div": true, "Mod": true, "Pow": true,
    "LShift": true, "RShift": true, "BitOr": true, "BitXor": true, "BitAnd": true, "FloorDiv": true,
    "Invert": true, "Not": true, "UAdd": true, "USub": true, "Eq": true, "NotEq": true, "Lt": true, "LtE": true,
    "Gt": true, "GtE": true, "Is": true, "IsNot": true, "In": true, "NotIn": true,
};
function stmtTODO(v) {
    pxt.tickEvent("python.todo", { kind: v.kind });
    return B.mkStmt(B.mkText("TODO: " + v.kind));
}
function exprTODO(v) {
    pxt.tickEvent("python.todo", { kind: v.kind });
    return B.mkText(" {TODO: " + v.kind + "} ");
}
function docComment(cmt) {
    if (cmt.trim().split(/\n/).length <= 1)
        cmt = cmt.trim();
    else
        cmt = cmt + "\n";
    return B.mkStmt(B.mkText("/** " + cmt + " */"));
}
var moduleAst = {};
function lookupSymbol(name) {
    if (!name)
        return null;
    if (moduleAst[name])
        return moduleAst[name];
    var parts = name.split(".");
    if (parts.length >= 2) {
        var last = parts.length - 1;
        var par = moduleAst[parts.slice(0, last).join(".")];
        var ename = parts[last];
        if (par) {
            for (var _i = 0, _a = par.body; _i < _a.length; _i++) {
                var stmt_1 = _a[_i];
                if (stmt_1.kind == "ClassDef" || stmt_1.kind == "FunctionDef") {
                    if (stmt_1.name == ename)
                        return stmt_1;
                }
                if (stmt_1.kind == "Assign") {
                    var assignment = stmt_1;
                    if (assignment.targets.length == 1 && getName(assignment.targets[0]) == ename) {
                        return assignment;
                    }
                }
            }
        }
    }
    return null;
}
var ctx;
var currIteration = 0;
var typeId = 0;
var numUnifies = 0;
function mkType(o) {
    if (o === void 0) { o = {}; }
    var r = U.flatClone(o);
    r.tid = ++typeId;
    return r;
}
function currentScope() {
    return ctx.currFun || ctx.currClass || ctx.currModule;
}
function defvar(n, opts) {
    var scopeDef = currentScope();
    var v = scopeDef.vars[n];
    if (!v) {
        v = scopeDef.vars[n] = { type: mkType(), name: n };
    }
    for (var _i = 0, _a = Object.keys(opts); _i < _a.length; _i++) {
        var k = _a[_i];
        v[k] = opts[k];
    }
    return v;
}
var tpString = mkType({ primType: "string" });
var tpNumber = mkType({ primType: "number" });
var tpBoolean = mkType({ primType: "boolean" });
var tpBuffer = mkType({ primType: "Buffer" });
var tpVoid = mkType({ primType: "void" });
function find(t) {
    if (t.union) {
        t.union = find(t.union);
        return t.union;
    }
    return t;
}
function getFullName(n) {
    var s = n;
    var pref = "";
    if (s.parent) {
        pref = getFullName(s.parent);
        if (!pref)
            pref = "";
        else
            pref += ".";
    }
    var nn = n;
    if (nn.name)
        return pref + nn.name;
    else
        return pref + "?" + n.kind;
}
function applyTypeMap(s) {
    var over = U.lookup(typeMap, s);
    if (over)
        return over;
    for (var _i = 0, _a = U.values(ctx.currModule.vars); _i < _a.length; _i++) {
        var v = _a[_i];
        if (!v.isImport)
            continue;
        if (v.expandsTo == s)
            return v.name;
        if (v.isImport && U.startsWith(s, v.expandsTo + ".")) {
            return v.name + s.slice(v.expandsTo.length);
        }
    }
    return s;
}
function t2s(t) {
    t = find(t);
    if (t.primType)
        return t.primType;
    else if (t.classType)
        return applyTypeMap(getFullName(t.classType));
    else if (t.arrayType)
        return t2s(t.arrayType) + "[]";
    else
        return "?" + t.tid;
}
var currErrs = "";
function error(t0, t1) {
    currErrs += "types not compatible: " + t2s(t0) + " and " + t2s(t1) + "; ";
}
function typeCtor(t) {
    if (t.primType)
        return t.primType;
    else if (t.classType)
        return t.classType;
    else if (t.arrayType)
        return "array";
    return null;
}
function isFree(t) {
    return !typeCtor(find(t));
}
function canUnify(t0, t1) {
    t0 = find(t0);
    t1 = find(t1);
    if (t0 === t1)
        return true;
    var c0 = typeCtor(t0);
    var c1 = typeCtor(t1);
    if (!c0 || !c1)
        return true;
    if (c0 !== c1)
        return false;
    if (c0 == "array") {
        return canUnify(t0.arrayType, t1.arrayType);
    }
    return true;
}
function unifyClass(t, cd) {
    t = find(t);
    if (t.classType == cd)
        return;
    if (isFree(t)) {
        t.classType = cd;
        return;
    }
    unify(t, mkType({ classType: cd }));
}
function unify(t0, t1) {
    t0 = find(t0);
    t1 = find(t1);
    if (t0 === t1)
        return;
    if (!canUnify(t0, t1)) {
        error(t0, t1);
        return;
    }
    if (typeCtor(t0) && !typeCtor(t1))
        return unify(t1, t0);
    numUnifies++;
    t0.union = t1;
    if (t0.arrayType && t1.arrayType)
        unify(t0.arrayType, t1.arrayType);
}
function getClassField(ct, n, checkOnly, skipBases) {
    if (checkOnly === void 0) { checkOnly = false; }
    if (skipBases === void 0) { skipBases = false; }
    if (!ct.fields)
        ct.fields = {};
    if (!ct.fields[n]) {
        if (!skipBases)
            for (var par = ct.baseClass; par; par = par.baseClass) {
                if (par.fields && par.fields[n])
                    return par.fields[n];
            }
        if (checkOnly)
            return null;
        ct.fields[n] = {
            inClass: ct,
            name: n,
            type: mkType()
        };
    }
    return ct.fields[n];
}
function getTypeField(t, n, checkOnly) {
    if (checkOnly === void 0) { checkOnly = false; }
    t = find(t);
    var ct = t.classType;
    if (ct)
        return getClassField(ct, n, checkOnly);
    return null;
}
function lookupVar(n) {
    var s = currentScope();
    while (s) {
        var v = U.lookup(s.vars, n);
        if (v)
            return v;
        // go to parent, excluding class scopes
        do {
            s = s.parent;
        } while (s && s.kind == "ClassDef");
    }
    return null;
}
function getClassDef(e) {
    var n = getName(e);
    var v = lookupVar(n);
    if (v)
        return v.classdef;
    var s = lookupSymbol(n);
    if (s && s.kind == "ClassDef")
        return s;
    return null;
}
function typeOf(e) {
    if (e.tsType) {
        return find(e.tsType);
    }
    else {
        e.tsType = mkType();
        return e.tsType;
    }
}
function isOfType(e, name) {
    var t = typeOf(e);
    if (t.classType && t.classType.name == name)
        return true;
    if (t2s(t) == name)
        return true;
    return false;
}
function resetCtx(m) {
    ctx = {
        currClass: null,
        currFun: null,
        currModule: m
    };
}
function scope(f) {
    var prevCtx = U.flatClone(ctx);
    var r;
    try {
        r = f();
    }
    finally {
        ctx = prevCtx;
    }
    return r;
}
function todoExpr(name, e) {
    if (!e)
        return B.mkText("");
    return B.mkGroup([B.mkText("/* TODO: " + name + " "), e, B.mkText(" */")]);
}
function todoComment(name, n) {
    if (n.length == 0)
        return B.mkText("");
    return B.mkGroup([B.mkText("/* TODO: " + name + " "), B.mkGroup(n), B.mkText(" */"), B.mkNewLine()]);
}
function doKeyword(k) {
    var t = expr(k.value);
    if (k.arg)
        return B.mkInfix(B.mkText(k.arg), "=", t);
    else
        return B.mkGroup([B.mkText("**"), t]);
}
function doArgs(args, isMethod) {
    U.assert(!args.kwonlyargs.length);
    var nargs = args.args.slice();
    if (isMethod) {
        U.assert(nargs[0].arg == "self");
        nargs.shift();
    }
    else {
        U.assert(!nargs[0] || nargs[0].arg != "self");
    }
    var didx = args.defaults.length - nargs.length;
    var lst = nargs.map(function (a) {
        var v = defvar(a.arg, { isParam: true });
        if (!a.type)
            a.type = v.type;
        var res = [quote(a.arg), typeAnnot(v.type)];
        if (a.annotation)
            res.push(todoExpr("annotation", expr(a.annotation)));
        if (didx >= 0) {
            res.push(B.mkText(" = "));
            res.push(expr(args.defaults[didx]));
            unify(a.type, typeOf(args.defaults[didx]));
        }
        didx++;
        return B.mkGroup(res);
    });
    if (args.vararg)
        lst.push(B.mkText("TODO *" + args.vararg.arg));
    if (args.kwarg)
        lst.push(B.mkText("TODO **" + args.kwarg.arg));
    return B.H.mkParenthesizedExpression(B.mkCommaSep(lst));
}
var numOps = {
    Sub: 1,
    Div: 1,
    Pow: 1,
    LShift: 1,
    RShift: 1,
    BitOr: 1,
    BitXor: 1,
    BitAnd: 1,
    FloorDiv: 1,
    Mult: 1,
};
var opMapping = {
    Add: "+",
    Sub: "-",
    Mult: "*",
    MatMult: "Math.matrixMult",
    Div: "/",
    Mod: "%",
    Pow: "**",
    LShift: "<<",
    RShift: ">>",
    BitOr: "|",
    BitXor: "^",
    BitAnd: "&",
    FloorDiv: "Math.idiv",
    And: "&&",
    Or: "||",
    Eq: "==",
    NotEq: "!=",
    Lt: "<",
    LtE: "<=",
    Gt: ">",
    GtE: ">=",
    Is: "===",
    IsNot: "!==",
    In: "py.In",
    NotIn: "py.NotIn",
};
var prefixOps = {
    Invert: "~",
    Not: "!",
    UAdd: "P+",
    USub: "P-",
};
var typeMap = {
    "adafruit_bus_device.i2c_device.I2CDevice": "pins.I2CDevice"
};
function stmts(ss) {
    return B.mkBlock(ss.map(stmt));
}
function exprs0(ee) {
    ee = ee.filter(function (e) { return !!e; });
    return ee.map(expr);
}
function setupScope(n) {
    if (!n.vars) {
        n.vars = {};
        n.parent = currentScope();
    }
}
function typeAnnot(t) {
    var s = t2s(t);
    if (s[0] == "?")
        return B.mkText(": any; /** TODO: type **/");
    return B.mkText(": " + t2s(t));
}
function guardedScope(v, f) {
    try {
        return scope(f);
    }
    catch (e) {
        return B.mkStmt(todoComment("conversion failed for " + (v.name || v.kind), []));
    }
}
var stmtMap = {
    FunctionDef: function (n) { return guardedScope(n, function () {
        var isMethod = !!ctx.currClass && !ctx.currFun;
        if (!isMethod)
            defvar(n.name, { fundef: n });
        setupScope(n);
        ctx.currFun = n;
        if (!n.retType)
            n.retType = mkType();
        var prefix = "";
        var funname = n.name;
        var decs = n.decorator_list.filter(function (d) {
            if (getName(d) == "property") {
                prefix = "get";
                return false;
            }
            if (d.kind == "Attribute" && d.attr == "setter" &&
                d.value.kind == "Name") {
                funname = d.value.id;
                prefix = "set";
                return false;
            }
            return true;
        });
        var nodes = [
            todoComment("decorators", decs.map(expr))
        ];
        if (isMethod) {
            var fd = getClassField(ctx.currClass, funname, false, true);
            if (n.body.length == 1 && n.body[0].kind == "Raise")
                n.alwaysThrows = true;
            if (n.name == "__init__") {
                nodes.push(B.mkText("constructor"));
                unifyClass(n.retType, ctx.currClass);
            }
            else {
                if (funname == "__get__" || funname == "__set__") {
                    var i2cArg_1 = "i2cDev";
                    var vv = n.vars[i2cArg_1];
                    if (vv) {
                        var i2cDevClass = lookupSymbol("adafruit_bus_device.i2c_device.I2CDevice");
                        if (i2cDevClass)
                            unifyClass(vv.type, i2cDevClass);
                    }
                    vv = n.vars["value"];
                    if (funname == "__set__" && vv) {
                        var cf = getClassField(ctx.currClass, "__get__");
                        if (cf.fundef)
                            unify(vv.type, cf.fundef.retType);
                    }
                    var nargs = n.args.args;
                    if (nargs[1].arg == "obj") {
                        // rewrite
                        nargs[1].arg = i2cArg_1;
                        if (nargs[nargs.length - 1].arg == "objtype") {
                            nargs.pop();
                            n.args.defaults.pop();
                        }
                        iterPy(n, function (e) {
                            if (e.kind == "Attribute") {
                                var a = e;
                                if (a.attr == "i2c_device" && getName(a.value) == "obj") {
                                    var nm = e;
                                    nm.kind = "Name";
                                    nm.id = i2cArg_1;
                                    delete a.attr;
                                    delete a.value;
                                }
                            }
                        });
                    }
                    funname = funname.replace(/_/g, "");
                }
                if (!prefix) {
                    prefix = funname[0] == "_" ? (fd.isProtected ? "protected" : "private") : "public";
                }
                nodes.push(B.mkText(prefix + " "), quote(funname));
            }
            fd.fundef = n;
        }
        else {
            U.assert(!prefix);
            if (n.name[0] == "_")
                nodes.push(B.mkText("function "), quote(funname));
            else
                nodes.push(B.mkText("export function "), quote(funname));
        }
        nodes.push(doArgs(n.args, isMethod), n.name == "__init__" ? B.mkText("") : typeAnnot(n.retType), todoComment("returns", n.returns ? [expr(n.returns)] : []));
        var body = n.body.map(stmt);
        if (n.name == "__init__") {
            for (var _i = 0, _a = U.values(ctx.currClass.fields); _i < _a.length; _i++) {
                var f = _a[_i];
                if (f.initializer) {
                    body.push(B.mkStmt(B.mkText("this." + quoteStr(f.name) + " = "), expr(f.initializer)));
                }
            }
        }
        nodes.push(B.mkBlock(body));
        return B.mkStmt(B.mkGroup(nodes));
    }); },
    ClassDef: function (n) { return guardedScope(n, function () {
        setupScope(n);
        defvar(n.name, { classdef: n });
        U.assert(!ctx.currClass);
        ctx.currClass = n;
        var nodes = [
            todoComment("keywords", n.keywords.map(doKeyword)),
            todoComment("decorators", n.decorator_list.map(expr)),
            B.mkText("export class "),
            quote(n.name)
        ];
        if (n.bases.length > 0) {
            nodes.push(B.mkText(" extends "));
            nodes.push(B.mkCommaSep(n.bases.map(expr)));
            var b = getClassDef(n.bases[0]);
            if (b)
                n.baseClass = b;
        }
        var body = stmts(n.body);
        nodes.push(body);
        var fieldDefs = U.values(n.fields)
            .filter(function (f) { return !f.fundef && !f.isStatic && !f.isGetSet; })
            .map(function (f) { return B.mkStmt(quote(f.name), typeAnnot(f.type)); });
        body.children = fieldDefs.concat(body.children);
        return B.mkStmt(B.mkGroup(nodes));
    }); },
    Return: function (n) {
        if (n.value) {
            var f = ctx.currFun;
            if (f)
                unify(f.retType, typeOf(n.value));
            return B.mkStmt(B.mkText("return "), expr(n.value));
        }
        else {
            return B.mkStmt(B.mkText("return"));
        }
    },
    AugAssign: function (n) {
        var op = opMapping[n.op];
        if (op.length > 3)
            return B.mkStmt(B.mkInfix(expr(n.target), "=", B.H.mkCall(op, [expr(n.target), expr(n.value)])));
        else
            return B.mkStmt(expr(n.target), B.mkText(" " + op + "= "), expr(n.value));
    },
    Assign: function (n) {
        if (n.targets.length != 1)
            return stmtTODO(n);
        var pref = "";
        var isConstCall = isCallTo(n.value, "const");
        var nm = getName(n.targets[0]) || "";
        var isUpperCase = nm && !/[a-z]/.test(nm);
        if (!ctx.currClass && !ctx.currFun && nm[0] != "_")
            pref = "export ";
        if (nm && ctx.currClass && !ctx.currFun) {
            // class fields can't be const
            isConstCall = false;
            var src = expr(n.value);
            var fd = getClassField(ctx.currClass, nm);
            var attrTp = typeOf(n.value);
            var getter = getTypeField(attrTp, "__get__", true);
            if (getter) {
                unify(fd.type, getter.fundef.retType);
                var implNm = "_" + nm;
                var fdBack = getClassField(ctx.currClass, implNm);
                unify(fdBack.type, attrTp);
                var setter = getTypeField(attrTp, "__set__", true);
                var res = [
                    B.mkNewLine(),
                    B.mkStmt(B.mkText("private "), quote(implNm), typeAnnot(attrTp))
                ];
                if (!getter.fundef.alwaysThrows)
                    res.push(B.mkStmt(B.mkText("get " + quoteStr(nm) + "()"), typeAnnot(fd.type), B.mkBlock([
                        B.mkText("return this." + quoteStr(implNm) + ".get(this.i2c_device)"),
                        B.mkNewLine()
                    ])));
                if (!setter.fundef.alwaysThrows)
                    res.push(B.mkStmt(B.mkText("set " + quoteStr(nm) + "(value"), typeAnnot(fd.type), B.mkText(") "), B.mkBlock([
                        B.mkText("this." + quoteStr(implNm) + ".set(this.i2c_device, value)"),
                        B.mkNewLine()
                    ])));
                fdBack.initializer = n.value;
                fd.isGetSet = true;
                fdBack.isGetSet = true;
                return B.mkGroup(res);
            }
            else if (currIteration < 2) {
                return B.mkText("/* skip for now */");
            }
            unify(fd.type, typeOf(n.targets[0]));
            fd.isStatic = true;
            pref = "static ";
        }
        unify(typeOf(n.targets[0]), typeOf(n.value));
        if (isConstCall || isUpperCase) {
            // first run would have "let" in it
            defvar(getName(n.targets[0]), {});
            var s = pref;
            if (!/^static /.test(pref))
                s += "const ";
            return B.mkStmt(B.mkText(s), B.mkInfix(expr(n.targets[0]), "=", expr(n.value)));
        }
        if (!pref && n.targets[0].kind == "Tuple") {
            var res_1 = [
                B.mkStmt(B.mkText("const tmp = "), expr(n.value))
            ];
            var tup = n.targets[0];
            tup.elts.forEach(function (e, i) {
                res_1.push(B.mkStmt(B.mkInfix(expr(e), "=", B.mkText("tmp[" + i + "]"))));
            });
            return B.mkGroup(res_1);
        }
        return B.mkStmt(B.mkText(pref), B.mkInfix(expr(n.targets[0]), "=", expr(n.value)));
    },
    For: function (n) {
        U.assert(n.orelse.length == 0);
        if (isCallTo(n.iter, "range")) {
            var r = n.iter;
            var def = expr(n.target);
            var ref = quote(getName(n.target));
            unify(typeOf(n.target), tpNumber);
            var start = r.args.length == 1 ? B.mkText("0") : expr(r.args[0]);
            var stop_1 = expr(r.args[r.args.length == 1 ? 0 : 1]);
            return B.mkStmt(B.mkText("for ("), B.mkInfix(def, "=", start), B.mkText("; "), B.mkInfix(ref, "<", stop_1), B.mkText("; "), r.args.length >= 3 ?
                B.mkInfix(ref, "+=", expr(r.args[2])) :
                B.mkInfix(null, "++", ref), B.mkText(")"), stmts(n.body));
        }
        unify(typeOf(n.iter), mkType({ arrayType: typeOf(n.target) }));
        return B.mkStmt(B.mkText("for ("), expr(n.target), B.mkText(" of "), expr(n.iter), B.mkText(")"), stmts(n.body));
    },
    While: function (n) {
        U.assert(n.orelse.length == 0);
        return B.mkStmt(B.mkText("while ("), expr(n.test), B.mkText(")"), stmts(n.body));
    },
    If: function (n) {
        var innerIf = function (n) {
            var nodes = [
                B.mkText("if ("),
                expr(n.test),
                B.mkText(")"),
                stmts(n.body)
            ];
            if (n.orelse.length) {
                nodes[nodes.length - 1].noFinalNewline = true;
                if (n.orelse.length == 1 && n.orelse[0].kind == "If") {
                    // else if
                    nodes.push(B.mkText(" else "));
                    U.pushRange(nodes, innerIf(n.orelse[0]));
                }
                else {
                    nodes.push(B.mkText(" else"), stmts(n.orelse));
                }
            }
            return nodes;
        };
        return B.mkStmt(B.mkGroup(innerIf(n)));
    },
    With: function (n) {
        if (n.items.length == 1 && isOfType(n.items[0].context_expr, "pins.I2CDevice")) {
            var it_1 = n.items[0];
            var id = getName(it_1.optional_vars);
            var res = [];
            var devRef = expr(it_1.context_expr);
            if (id) {
                var v = defvar(id, { isLocal: true });
                id = quoteStr(id);
                res.push(B.mkStmt(B.mkText("const " + id + " = "), devRef));
                unify(typeOf(it_1.context_expr), v.type);
                devRef = B.mkText(id);
            }
            res.push(B.mkStmt(B.mkInfix(devRef, ".", B.mkText("begin()"))));
            U.pushRange(res, n.body.map(stmt));
            res.push(B.mkStmt(B.mkInfix(devRef, ".", B.mkText("end()"))));
            return B.mkGroup(res);
        }
        var cleanup = [];
        var stmts = n.items.map(function (it, idx) {
            var varName = "with" + idx;
            if (it.optional_vars) {
                var id = getName(it.optional_vars);
                U.assert(id != null);
                defvar(id, { isLocal: true });
                varName = quoteStr(id);
            }
            cleanup.push(B.mkStmt(B.mkText(varName + ".end()")));
            return B.mkStmt(B.mkText("const " + varName + " = "), B.mkInfix(expr(it.context_expr), ".", B.mkText("begin()")));
        });
        U.pushRange(stmts, n.body.map(stmt));
        U.pushRange(stmts, cleanup);
        return B.mkBlock(stmts);
    },
    Raise: function (n) {
        var ex = n.exc || n.cause;
        if (!ex)
            return B.mkStmt(B.mkText("throw"));
        var msg;
        if (ex && ex.kind == "Call") {
            var cex = ex;
            if (cex.args.length == 1) {
                msg = expr(cex.args[0]);
            }
        }
        // didn't find string - just compile and quote; and hope for the best
        if (!msg)
            msg = B.mkGroup([B.mkText("`"), expr(ex), B.mkText("`")]);
        return B.mkStmt(B.H.mkCall("control.fail", [msg]));
    },
    Assert: function (n) { return B.mkStmt(B.H.mkCall("control.assert", exprs0([n.test, n.msg]))); },
    Import: function (n) {
        for (var _i = 0, _a = n.names; _i < _a.length; _i++) {
            var nm = _a[_i];
            if (nm.asname)
                defvar(nm.asname, {
                    expandsTo: nm.name
                });
            defvar(nm.name, {
                isPlainImport: true
            });
        }
        return B.mkText("");
    },
    ImportFrom: function (n) {
        var res = [];
        for (var _i = 0, _a = n.names; _i < _a.length; _i++) {
            var nn = _a[_i];
            if (nn.name == "*")
                defvar(n.module, {
                    isImportStar: true
                });
            else {
                var fullname = n.module + "." + nn.name;
                var sym = lookupSymbol(fullname);
                var currname = nn.asname || nn.name;
                if (sym && sym.kind == "Module") {
                    defvar(currname, {
                        isImport: sym,
                        expandsTo: fullname
                    });
                    res.push(B.mkStmt(B.mkText("import " + quoteStr(currname) + " = " + fullname)));
                }
                else {
                    defvar(currname, {
                        expandsTo: fullname
                    });
                }
            }
        }
        return B.mkGroup(res);
    },
    ExprStmt: function (n) {
        return n.value.kind == "Str" ?
            docComment(n.value.s) :
            B.mkStmt(expr(n.value));
    },
    Pass: function (n) { return B.mkStmt(B.mkText(";")); },
    Break: function (n) { return B.mkStmt(B.mkText("break")); },
    Continue: function (n) { return B.mkStmt(B.mkText("break")); },
    Delete: function (n) { return stmtTODO(n); },
    Try: function (n) {
        var r = [
            B.mkText("try"),
            stmts(n.body.concat(n.orelse)),
        ];
        for (var _i = 0, _a = n.handlers; _i < _a.length; _i++) {
            var e = _a[_i];
            r.push(B.mkText("catch ("), e.name ? quote(e.name) : B.mkText("_"));
            // This isn't JS syntax, but PXT doesn't support try at all anyway
            if (e.type)
                r.push(B.mkText("/* instanceof "), expr(e.type), B.mkText(" */"));
            r.push(B.mkText(")"), stmts(e.body));
        }
        if (n.finalbody.length)
            r.push(B.mkText("finally"), stmts(n.finalbody));
        return B.mkStmt(B.mkGroup(r));
    },
    AnnAssign: function (n) { return stmtTODO(n); },
    AsyncFunctionDef: function (n) { return stmtTODO(n); },
    AsyncFor: function (n) { return stmtTODO(n); },
    AsyncWith: function (n) { return stmtTODO(n); },
    Global: function (n) {
        return B.mkStmt(B.mkText("TODO: global: "), B.mkGroup(n.names.map(B.mkText)));
    },
    Nonlocal: function (n) {
        return B.mkStmt(B.mkText("TODO: nonlocal: "), B.mkGroup(n.names.map(B.mkText)));
    },
};
function possibleDef(n) {
    var id = n.id;
    if (n.isdef === undefined) {
        var curr = lookupVar(id);
        if (!curr) {
            if (ctx.currClass && !ctx.currFun) {
                n.isdef = false; // field
                curr = defvar(id, {});
            }
            else {
                n.isdef = true;
                curr = defvar(id, { isLocal: true });
            }
        }
        else {
            n.isdef = false;
        }
        unify(n.tsType, curr.type);
    }
    if (n.isdef)
        return B.mkGroup([B.mkText("let "), quote(id)]);
    else
        return quote(id);
}
function quoteStr(id) {
    if (B.isReservedWord(id))
        return id + "_";
    else if (!id)
        return id;
    else
        return id;
    //return id.replace(/([a-z0-9])_([a-zA-Z0-9])/g, (f: string, x: string, y: string) => x + y.toUpperCase())
}
function getName(e) {
    if (e == null)
        return null;
    if (e.kind == "Name") {
        var s = e.id;
        var v = lookupVar(s);
        if (v && v.expandsTo)
            return v.expandsTo;
        else
            return s;
    }
    if (e.kind == "Attribute") {
        var pref = getName(e.value);
        if (pref)
            return pref + "." + e.attr;
    }
    return null;
}
function quote(id) {
    if (id == "self")
        return B.mkText("this");
    return B.mkText(quoteStr(id));
}
function isCallTo(n, fn) {
    if (n.kind != "Call")
        return false;
    var c = n;
    return getName(c.func) == fn;
}
function binop(left, pyName, right) {
    var op = opMapping[pyName];
    U.assert(!!op);
    if (op.length > 3)
        return B.H.mkCall(op, [left, right]);
    else
        return B.mkInfix(left, op, right);
}
var funMap = {
    "memoryview": { n: "", t: tpBuffer },
    "const": { n: "", t: tpNumber },
    "micropython.const": { n: "", t: tpNumber },
    "int": { n: "Math.trunc", t: tpNumber },
    "len": { n: ".length", t: tpNumber },
    "min": { n: "Math.min", t: tpNumber },
    "max": { n: "Math.max", t: tpNumber },
    "string.lower": { n: ".toLowerCase()", t: tpString },
    "ord": { n: ".charCodeAt(0)", t: tpNumber },
    "bytearray": { n: "pins.createBuffer", t: tpBuffer },
    "bytes": { n: "pins.createBufferFromArray", t: tpBuffer },
    "ustruct.pack": { n: "pins.packBuffer", t: tpBuffer },
    "ustruct.pack_into": { n: "pins.packIntoBuffer", t: tpVoid },
    "ustruct.unpack": { n: "pins.unpackBuffer", t: mkType({ arrayType: tpNumber }) },
    "ustruct.unpack_from": { n: "pins.unpackBuffer", t: mkType({ arrayType: tpNumber }) },
    "ustruct.calcsize": { n: "pins.packedSize", t: tpNumber },
    "pins.I2CDevice.read_into": { n: ".readInto", t: tpVoid },
    "bool": { n: "!!", t: tpBoolean },
    "Array.index": { n: ".indexOf", t: tpNumber },
    "time.sleep": { n: "pause", t: tpVoid, scale: 1000 }
};
function isSuper(v) {
    return isCallTo(v, "super") && v.args.length == 0;
}
function isThis(v) {
    return v.kind == "Name" && v.id == "self";
}
function sourceAt(e) {
    return (ctx.currModule.source[e.lineno - 1] || "").slice(e.col_offset);
}
var exprMap = {
    BoolOp: function (n) {
        var r = expr(n.values[0]);
        for (var i = 1; i < n.values.length; ++i) {
            r = binop(r, n.op, expr(n.values[i]));
        }
        return r;
    },
    BinOp: function (n) {
        if (n.op == "Mod" && n.left.kind == "Str" &&
            (n.right.kind == "Tuple" || n.right.kind == "List")) {
            var fmt = n.left.s;
            var elts_1 = n.right.elts;
            elts_1 = elts_1.slice();
            var res_2 = [B.mkText("`")];
            fmt.replace(/([^%]+)|(%[\d\.]*([a-zA-Z%]))/g, function (f, reg, f2, flet) {
                if (reg)
                    res_2.push(B.mkText(reg.replace(/[`\\$]/g, function (f) { return "\\" + f; })));
                else {
                    var ee = elts_1.shift();
                    var et = ee ? expr(ee) : B.mkText("???");
                    /* tslint:disable:no-invalid-template-strings */
                    res_2.push(B.mkText("${"), et, B.mkText("}"));
                    /* tslint:enable:no-invalid-template-strings */
                }
                return "";
            });
            res_2.push(B.mkText("`"));
            return B.mkGroup(res_2);
        }
        var r = binop(expr(n.left), n.op, expr(n.right));
        if (numOps[n.op]) {
            unify(typeOf(n.left), tpNumber);
            unify(typeOf(n.right), tpNumber);
            unify(n.tsType, tpNumber);
        }
        return r;
    },
    UnaryOp: function (n) {
        var op = prefixOps[n.op];
        U.assert(!!op);
        return B.mkInfix(null, op, expr(n.operand));
    },
    Lambda: function (n) { return exprTODO(n); },
    IfExp: function (n) {
        return B.mkInfix(B.mkInfix(expr(n.test), "?", expr(n.body)), ":", expr(n.orelse));
    },
    Dict: function (n) { return exprTODO(n); },
    Set: function (n) { return exprTODO(n); },
    ListComp: function (n) { return exprTODO(n); },
    SetComp: function (n) { return exprTODO(n); },
    DictComp: function (n) { return exprTODO(n); },
    GeneratorExp: function (n) {
        if (n.generators.length == 1 && n.generators[0].kind == "Comprehension") {
            var comp_1 = n.generators[0];
            if (comp_1.ifs.length == 0) {
                return scope(function () {
                    var v = getName(comp_1.target);
                    defvar(v, { isParam: true }); // TODO this leaks the scope...
                    return B.mkInfix(expr(comp_1.iter), ".", B.H.mkCall("map", [
                        B.mkGroup([quote(v), B.mkText(" => "), expr(n.elt)])
                    ]));
                });
            }
        }
        return exprTODO(n);
    },
    Await: function (n) { return exprTODO(n); },
    Yield: function (n) { return exprTODO(n); },
    YieldFrom: function (n) { return exprTODO(n); },
    Compare: function (n) {
        if (n.ops.length == 1 && (n.ops[0] == "In" || n.ops[0] == "NotIn")) {
            if (find(typeOf(n.comparators[0])) == tpString)
                unify(typeOf(n.left), tpString);
            var idx = B.mkInfix(expr(n.comparators[0]), ".", B.H.mkCall("indexOf", [expr(n.left)]));
            return B.mkInfix(idx, n.ops[0] == "In" ? ">=" : "<", B.mkText("0"));
        }
        var r = binop(expr(n.left), n.ops[0], expr(n.comparators[0]));
        for (var i = 1; i < n.ops.length; ++i) {
            r = binop(r, "And", binop(expr(n.comparators[i - 1]), n.ops[i], expr(n.comparators[i])));
        }
        return r;
    },
    Call: function (n) {
        var cd = getClassDef(n.func);
        var recvTp;
        var recv;
        var methName;
        var fd;
        if (cd) {
            if (cd.fields) {
                var ff = cd.fields["__init__"];
                if (ff)
                    fd = ff.fundef;
            }
        }
        else {
            if (n.func.kind == "Attribute") {
                var attr = n.func;
                recv = attr.value;
                recvTp = typeOf(recv);
                methName = attr.attr;
                var field = getTypeField(recvTp, methName);
                if (field) {
                    if (isSuper(recv) || (isThis(recv) && field.inClass != ctx.currClass)) {
                        field.isProtected = true;
                    }
                }
                if (field && field.fundef)
                    fd = field.fundef;
            }
            if (!fd) {
                var name_1 = getName(n.func);
                var v = lookupVar(name_1);
                if (v)
                    fd = v.fundef;
            }
        }
        var allargs = [];
        var fdargs = fd ? fd.args.args : [];
        if (fdargs[0] && fdargs[0].arg == "self")
            fdargs = fdargs.slice(1);
        for (var i = 0; i < n.args.length; ++i) {
            var e = n.args[i];
            allargs.push(expr(e));
            if (fdargs[i] && fdargs[i].type) {
                unify(typeOf(e), fdargs[i].type);
            }
        }
        if (fd) {
            unify(typeOf(n), fd.retType);
        }
        var nm = getName(n.func);
        var over = U.lookup(funMap, nm);
        if (over) {
            methName = "";
            recv = null;
        }
        if (methName) {
            nm = t2s(recvTp) + "." + methName;
            over = U.lookup(funMap, nm);
            if (!over && find(recvTp).arrayType) {
                nm = "Array." + methName;
                over = U.lookup(funMap, nm);
            }
        }
        if (n.keywords.length > 0) {
            if (fd && !fd.args.kwarg) {
                var formals = fdargs.slice(n.args.length);
                var defls = fd.args.defaults.slice();
                var _loop_1 = function () {
                    var last = formals[formals.length - 1];
                    if (n.keywords.some(function (k) { return k.arg == last.arg; }))
                        return "break";
                    formals.pop();
                    defls.pop();
                };
                while (formals.length > 0) {
                    var state_1 = _loop_1();
                    if (state_1 === "break")
                        break;
                }
                while (defls.length > formals.length)
                    defls.shift();
                while (defls.length < formals.length)
                    defls.unshift(null);
                var actual = U.toDictionary(n.keywords, function (k) { return k.arg; });
                var idx = 0;
                for (var _i = 0, formals_1 = formals; _i < formals_1.length; _i++) {
                    var formal = formals_1[_i];
                    var ex = U.lookup(actual, formal.arg);
                    if (ex)
                        allargs.push(expr(ex.value));
                    else {
                        allargs.push(expr(defls[idx]));
                    }
                    idx++;
                }
            }
            else {
                var keywords = n.keywords.slice();
                if (recv && isOfType(recv, "pins.I2CDevice")) {
                    var stopArg_1 = null;
                    var startArg_1 = null;
                    var endArg_1 = null;
                    keywords = keywords.filter(function (kw) {
                        if (kw.arg == "stop") {
                            if (kw.value.kind == "NameConstant") {
                                var vv = kw.value.value;
                                if (vv === false)
                                    stopArg_1 = B.mkText("true");
                                else
                                    stopArg_1 = B.mkText("false");
                            }
                            else {
                                stopArg_1 = B.mkInfix(null, "!", expr(kw.value));
                            }
                            return false;
                        }
                        else if (kw.arg == "start") {
                            startArg_1 = expr(kw.value);
                            return false;
                        }
                        else if (kw.arg == "end") {
                            endArg_1 = expr(kw.value);
                            return false;
                        }
                        return true;
                    });
                    if (endArg_1 && !startArg_1)
                        startArg_1 = B.mkText("0");
                    if (methName == "read_into") {
                        if (startArg_1) {
                            allargs.push(stopArg_1 || B.mkText("false"));
                            allargs.push(startArg_1);
                        }
                        if (endArg_1)
                            allargs.push(endArg_1);
                    }
                    else {
                        if (stopArg_1)
                            allargs.push(stopArg_1);
                        if (startArg_1 || endArg_1) {
                            allargs[0] = B.mkInfix(allargs[0], ".", B.H.mkCall("slice", endArg_1 ? [startArg_1, endArg_1] : [startArg_1]));
                        }
                    }
                }
                if (keywords.length) {
                    var kwargs = keywords.map(function (kk) {
                        return B.mkGroup([quote(kk.arg), B.mkText(": "), expr(kk.value)]);
                    });
                    allargs.push(B.mkGroup([
                        B.mkText("{"),
                        B.mkCommaSep(kwargs),
                        B.mkText("}")
                    ]));
                }
            }
        }
        if (nm == "super" && allargs.length == 0) {
            if (ctx.currClass && ctx.currClass.baseClass)
                unifyClass(n.tsType, ctx.currClass.baseClass);
            return B.mkText("super");
        }
        if (over != null) {
            if (recv)
                allargs.unshift(expr(recv));
            var overName = over.n;
            if (over.t)
                unify(typeOf(n), over.t);
            if (over.scale) {
                allargs = allargs.map(function (a) {
                    var s = "?";
                    if (a.type == B.NT.Prefix && a.children.length == 0)
                        s = a.op;
                    var n = parseFloat(s);
                    if (!isNaN(n)) {
                        return B.mkText((over.scale * n) + "");
                    }
                    else {
                        return B.mkInfix(a, "*", B.mkText(over.scale + ""));
                    }
                });
            }
            if (overName == "") {
                if (allargs.length == 1)
                    return allargs[0];
            }
            else if (overName[0] == ".") {
                if (allargs.length == 1)
                    return B.mkInfix(allargs[0], ".", B.mkText(overName.slice(1)));
                else
                    return B.mkInfix(allargs[0], ".", B.H.mkCall(overName.slice(1), allargs.slice(1)));
            }
            else {
                return B.H.mkCall(overName, allargs);
            }
        }
        var fn = expr(n.func);
        if (recvTp && recvTp.arrayType) {
            if (methName == "append") {
                methName = "push";
                unify(typeOf(n.args[0]), recvTp.arrayType);
            }
            fn = B.mkInfix(expr(recv), ".", B.mkText(methName));
        }
        var nodes = [
            fn,
            B.mkText("("),
            B.mkCommaSep(allargs),
            B.mkText(")")
        ];
        if (cd) {
            nodes[0] = B.mkText(applyTypeMap(getFullName(cd)));
            nodes.unshift(B.mkText("new "));
        }
        return B.mkGroup(nodes);
    },
    Num: function (n) {
        unify(n.tsType, tpNumber);
        var src = sourceAt(n);
        var m = /^(0[box][0-9a-f]+)/i.exec(src);
        if (m)
            return B.mkText(m[1]);
        return B.mkText(n.n + "");
    },
    Str: function (n) {
        unify(n.tsType, tpString);
        return B.mkText(B.stringLit(n.s));
    },
    FormattedValue: function (n) { return exprTODO(n); },
    JoinedStr: function (n) { return exprTODO(n); },
    Bytes: function (n) {
        return B.mkText("hex `" + U.toHex(new Uint8Array(n.s)) + "`");
    },
    NameConstant: function (n) {
        if (n.value != null)
            unify(n.tsType, tpBoolean);
        return B.mkText(JSON.stringify(n.value));
    },
    Ellipsis: function (n) { return exprTODO(n); },
    Constant: function (n) { return exprTODO(n); },
    Attribute: function (n) {
        var part = typeOf(n.value);
        var fd = getTypeField(part, n.attr);
        if (fd)
            unify(n.tsType, fd.type);
        return B.mkInfix(expr(n.value), ".", B.mkText(quoteStr(n.attr)));
    },
    Subscript: function (n) {
        if (n.slice.kind == "Index") {
            var idx = n.slice.value;
            if (currIteration > 2 && isFree(typeOf(idx))) {
                unify(typeOf(idx), tpNumber);
            }
            return B.mkGroup([
                expr(n.value),
                B.mkText("["),
                expr(idx),
                B.mkText("]"),
            ]);
        }
        else if (n.slice.kind == "Slice") {
            var s = n.slice;
            return B.mkInfix(expr(n.value), ".", B.H.mkCall("slice", [s.lower ? expr(s.lower) : B.mkText("0"),
                s.upper ? expr(s.upper) : null].filter(function (x) { return !!x; })));
        }
        else {
            return exprTODO(n);
        }
    },
    Starred: function (n) { return B.mkGroup([B.mkText("... "), expr(n.value)]); },
    Name: function (n) {
        if (n.id == "self" && ctx.currClass) {
            unifyClass(n.tsType, ctx.currClass);
        }
        else {
            var v = lookupVar(n.id);
            if (v) {
                unify(n.tsType, v.type);
                if (v.isImport)
                    return quote(n.id); // it's import X = Y.Z.X, use X not Y.Z.X
            }
        }
        if (n.ctx.indexOf("Load") >= 0) {
            var nm = getName(n);
            return quote(nm);
        }
        else
            return possibleDef(n);
    },
    List: mkArrayExpr,
    Tuple: mkArrayExpr,
};
function mkArrayExpr(n) {
    unify(n.tsType, mkType({ arrayType: n.elts[0] ? typeOf(n.elts[0]) : mkType() }));
    return B.mkGroup([
        B.mkText("["),
        B.mkCommaSep(n.elts.map(expr)),
        B.mkText("]"),
    ]);
}
function expr(e) {
    var f = exprMap[e.kind];
    if (!f) {
        pxt.tickEvent("python.todo", { kind: e.kind });
        U.oops(e.kind + " - unknown expr");
    }
    typeOf(e);
    return f(e);
}
function stmt(e) {
    var f = stmtMap[e.kind];
    if (!f) {
        pxt.tickEvent("python.todo", { kind: e.kind });
        U.oops(e.kind + " - unknown stmt");
    }
    var cmts = [];
    var scmts = ctx.currModule.comments;
    if (scmts) {
        for (var i = 0; i < e.lineno; ++i) {
            if (scmts[i]) {
                cmts.push(scmts[i]);
                scmts[i] = null;
            }
        }
    }
    var r = f(e);
    if (currErrs) {
        cmts.push("TODO: (below) " + currErrs);
        currErrs = "";
    }
    if (cmts.length) {
        r = B.mkGroup(cmts.map(function (c) { return B.mkStmt(B.H.mkComment(c)); }).concat(r));
    }
    return r;
}
function isEmpty(b) {
    if (!b)
        return true;
    if (b.type == B.NT.Prefix && b.op == "")
        return b.children.every(isEmpty);
    if (b.type == B.NT.NewLine)
        return true;
    return false;
}
// TODO look at scopes of let
function toTS(mod) {
    U.assert(mod.kind == "Module");
    resetCtx(mod);
    if (!mod.vars)
        mod.vars = {};
    var res = mod.body.map(stmt);
    if (res.every(isEmpty))
        return null;
    return [
        B.mkText("namespace " + mod.name + " "),
        B.mkBlock(res)
    ];
}
function parseComments(mod) {
    mod.comments = mod.source.map(function (l) {
        var m = /(\s|^)#\s*(.*)/.exec(l);
        if (m)
            return m[2];
        return null;
    });
}
function iterPy(e, f) {
    if (!e)
        return;
    f(e);
    U.iterMap(e, function (k, v) {
        if (!v || k == "parent")
            return;
        if (v && v.kind)
            iterPy(v, f);
        else if (Array.isArray(v))
            v.forEach(function (x) { return iterPy(x, f); });
    });
}
function parseWithPythonAsync(files) {
    return nodeutil.spawnWithPipeAsync({
        cmd: process.env["PYTHON3"] || (/^win/i.test(process.platform) ? "py" : "python3"),
        args: [],
        input: convPy.replace("@files@", JSON.stringify(files)),
        silent: true
    })
        .then(function (buf) {
        pxt.debug("analyzing python AST (" + buf.length + " bytes)");
        var js = JSON.parse(buf.toString("utf8"));
        // nodeutil.writeFileSync("pyast.json", JSON.stringify(js, null, 2), { encoding: "utf8" })
        var rec = function (v) {
            if (Array.isArray(v)) {
                for (var i = 0; i < v.length; ++i)
                    v[i] = rec(v[i]);
                return v;
            }
            if (!v || !v.kind)
                return v;
            v.kind = U.lookup(nameMap, v.kind) || v.kind;
            if (U.lookup(simpleNames, v.kind))
                return v.kind;
            for (var _i = 0, _a = Object.keys(v); _i < _a.length; _i++) {
                var k = _a[_i];
                v[k] = rec(v[k]);
            }
            return v;
        };
        js.kind = "FileSet";
        js = rec(js);
        delete js.kind;
        //nodeutil.writeFileSync("pyast2.json", JSON.stringify(js, null, 2), { encoding: "utf8" })
        return js;
    });
}
function convertAsync(fns, useInternal) {
    if (useInternal === void 0) { useInternal = false; }
    var mainFiles = [];
    while (/\.py$/.test(fns[0])) {
        mainFiles.push(fns.shift().replace(/\\/g, "/"));
    }
    if (useInternal) {
        return parseWithPythonAsync(mainFiles)
            .then(function (parsedPy) {
            var _loop_2 = function (f) {
                pxt.log("parse: " + f);
                var source = fs.readFileSync(f, "utf8");
                var tokens = pxt.py.lex(source);
                //console.log(pxt.py.tokensToString(tokens))
                var res = pxt.py.parse(source, f, tokens);
                var custompy = pxt.py.dump(res.stmts, true);
                var realpy = pxt.py.dump(parsedPy[f].body, true);
                var path = "tmp/";
                if (custompy != realpy) {
                    fs.writeFileSync(path + "pxtpy.txt", custompy);
                    fs.writeFileSync(path + "realpy.txt", realpy);
                    fs.writeFileSync(path + "realpy.json", JSON.stringify(parsedPy[f]));
                    return { value: nodeutil.spawnWithPipeAsync({
                            cmd: "diff",
                            args: ["-u", path + "pxtpy.txt", path + "realpy.txt"],
                            input: "",
                            silent: true,
                            allowNonZeroExit: true
                        })
                            .then(function (buf) {
                            fs.writeFileSync(path + "diff.patch", buf);
                            console.log("Differences at " + f + "; files written in " + path);
                        }) };
                }
            };
            for (var _i = 0, mainFiles_1 = mainFiles; _i < mainFiles_1.length; _i++) {
                var f = mainFiles_1[_i];
                var state_2 = _loop_2(f);
                if (typeof state_2 === "object")
                    return state_2.value;
            }
            return Promise.resolve();
        });
    }
    var primFiles = U.toDictionary(mainFiles.length ? mainFiles : nodeutil.allFiles(fns[0]), function (s) { return s.replace(/\\/g, "/"); });
    var files = U.concat(fns.map(function (f) { return nodeutil.allFiles(f); })).map(function (f) { return f.replace(/\\/g, "/"); });
    var dirs = {};
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var f = files_1[_i];
        for (var _a = 0, _b = ["/docs/conf.py", "/conf.py", "/setup.py", "/README.md", "/README.rst", "/__init__.py"]; _a < _b.length; _a++) {
            var suff = _b[_a];
            if (U.endsWith(f, suff)) {
                var dirName = f.slice(0, f.length - suff.length);
                dirs[dirName] = 1;
            }
        }
    }
    var pkgFiles = {};
    for (var _c = 0, files_2 = files; _c < files_2.length; _c++) {
        var f = files_2[_c];
        if (U.endsWith(f, ".py") && !U.endsWith(f, "/setup.py") && !U.endsWith(f, "/conf.py")) {
            var par = f;
            while (par) {
                if (dirs[par]) {
                    var modName = f.slice(par.length + 1).replace(/\.py$/, "").replace(/\//g, ".");
                    if (!U.startsWith(modName, "examples.")) {
                        pkgFiles[f] = modName;
                    }
                    break;
                }
                par = par.replace(/\/?[^\/]*$/, "");
            }
        }
    }
    for (var _d = 0, mainFiles_2 = mainFiles; _d < mainFiles_2.length; _d++) {
        var m = mainFiles_2[_d];
        pkgFiles[m] = m.replace(/.*\//, "").replace(/\.py$/, "");
    }
    var pkgFilesKeys = Object.keys(pkgFiles);
    pxt.log("files (" + pkgFilesKeys.length + "):\n   " + pkgFilesKeys.join('\n   '));
    return parseWithPythonAsync(pkgFilesKeys)
        .then(function (js) {
        moduleAst = {};
        U.iterMap(js, function (fn, js) {
            var mname = pkgFiles[fn];
            js.name = mname;
            js.source = fs.readFileSync(fn, "utf8").split(/\r?\n/);
            moduleAst[mname] = js;
        });
        for (var i = 0; i < 5; ++i) {
            currIteration = i;
            U.iterMap(js, function (fn, js) {
                pxt.log("converting " + fn);
                try {
                    toTS(js);
                }
                catch (e) {
                    console.log(e);
                }
            });
        }
        var files = {};
        currIteration = 1000;
        U.iterMap(js, function (fn, js) {
            if (primFiles[fn]) {
                pxt.debug("converting " + fn);
                var s = "//\n// *** " + fn + " ***\n//\n\n";
                parseComments(js);
                var nodes = toTS(js);
                if (!nodes)
                    return;
                var res = B.flattenNode(nodes);
                s += res.output;
                var fn2 = js.name.replace(/\..*/, "") + ".ts";
                files[fn2] = (files[fn2] || "") + s;
            }
            else {
                pxt.debug("skipping " + fn);
            }
        });
        U.iterMap(files, function (fn, s) {
            pxt.log("*** write " + fn);
            fs.writeFileSync(fn, s);
        });
    });
}
exports.convertAsync = convertAsync;
