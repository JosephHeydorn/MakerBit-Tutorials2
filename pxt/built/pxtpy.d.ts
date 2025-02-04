/// <reference path="pxtlib.d.ts" />
/// <reference path="pxtcompiler.d.ts" />
declare namespace pxt.py {
    enum VarModifier {
        NonLocal = 0,
        Global = 1,
    }
    interface ParameterDesc extends pxtc.ParameterDesc {
        pyType?: Type;
    }
    interface SymbolInfo extends pxtc.SymbolInfo, VarDescOptions {
        pyRetType?: Type;
        pySymbolType?: Type;
        pyInstanceType?: Type;
        parameters: ParameterDesc[];
        pyAST?: AST;
        isProtected?: boolean;
        moduleTypeMarker?: {};
        declared?: number;
    }
    interface TypeOptions {
        union?: Type;
        classType?: SymbolInfo;
        moduleType?: SymbolInfo;
        primType?: string;
        typeArgs?: Type[];
        anyType?: boolean;
    }
    interface Type extends TypeOptions {
        tid: number;
    }
    interface VarDescOptions {
        expandsTo?: string;
        isImportStar?: boolean;
        isPlainImport?: boolean;
        isLocal?: boolean;
        isParam?: boolean;
        isImport?: SymbolInfo;
        modifier?: VarModifier;
        firstRefPos?: number;
        firstAssignPos?: number;
        firstAssignDepth?: number;
    }
    interface AST {
        startPos?: number;
        endPos?: number;
        kind: string;
    }
    interface Stmt extends AST {
        _stmtBrand: void;
        _comments?: Token[];
    }
    interface Symbol extends Stmt {
        _symbolBrand: void;
        symInfo: SymbolInfo;
    }
    interface Expr extends AST {
        tsType?: Type;
        symbolInfo?: SymbolInfo;
        inCalledPosition?: boolean;
        _exprBrand: void;
    }
    type expr_context = "Load" | "Store" | "Del" | "AugLoad" | "AugStore" | "Param";
    type boolop = "And" | "Or";
    type operator = "Add" | "Sub" | "Mult" | "MatMult" | "Div" | "Mod" | "Pow" | "LShift" | "RShift" | "BitOr" | "BitXor" | "BitAnd" | "FloorDiv";
    type unaryop = "Invert" | "Not" | "UAdd" | "USub";
    type cmpop = "Eq" | "NotEq" | "Lt" | "LtE" | "Gt" | "GtE" | "Is" | "IsNot" | "In" | "NotIn";
    type identifier = string;
    type int = number;
    interface Arg extends AST {
        kind: "Arg";
        arg: identifier;
        annotation?: Expr;
    }
    interface Arguments extends AST {
        kind: "Arguments";
        args: Arg[];
        vararg?: Arg;
        kwonlyargs: Arg[];
        kw_defaults: Expr[];
        kwarg?: Arg;
        defaults: Expr[];
    }
    interface Keyword extends AST {
        kind: "Keyword";
        arg?: identifier;
        value: Expr;
    }
    interface Comprehension extends AST {
        kind: "Comprehension";
        target: Expr;
        iter: Expr;
        ifs: Expr[];
        is_async: int;
    }
    interface Module extends Symbol, ScopeDef {
        kind: "Module";
        body: Stmt[];
        name?: string;
        source: string;
        tsFilename: string;
        tsBody?: pxtc.SymbolInfo[];
    }
    interface ExceptHandler extends AST {
        kind: "ExceptHandler";
        type?: Expr;
        name?: identifier;
        body: Stmt[];
    }
    interface Alias extends AST {
        kind: "Alias";
        name: identifier;
        asname?: identifier;
    }
    interface WithItem extends AST {
        kind: "WithItem";
        context_expr: Expr;
        optional_vars?: Expr;
    }
    interface AnySlice extends AST {
        _anySliceBrand: void;
    }
    interface Slice extends AnySlice {
        kind: "Slice";
        lower?: Expr;
        upper?: Expr;
        step?: Expr;
    }
    interface ExtSlice extends AnySlice {
        kind: "ExtSlice";
        dims: AnySlice[];
    }
    interface Index extends AnySlice {
        kind: "Index";
        value: Expr;
    }
    interface ScopeDef extends Stmt {
        vars?: Map<SymbolInfo>;
        parent?: ScopeDef;
        blockDepth?: number;
    }
    interface FunctionDef extends Symbol, ScopeDef {
        kind: "FunctionDef";
        name: identifier;
        args: Arguments;
        body: Stmt[];
        decorator_list: Expr[];
        returns?: Expr;
        alwaysThrows?: boolean;
        callers?: Expr[];
    }
    interface AsyncFunctionDef extends Stmt {
        kind: "AsyncFunctionDef";
        name: identifier;
        args: Arguments;
        body: Stmt[];
        decorator_list: Expr[];
        returns?: Expr;
    }
    interface ClassDef extends Symbol, ScopeDef {
        kind: "ClassDef";
        name: identifier;
        bases: Expr[];
        keywords: Keyword[];
        body: Stmt[];
        decorator_list: Expr[];
        baseClass?: ClassDef;
        isEnum?: boolean;
        isNamespace?: boolean;
    }
    interface Return extends Stmt {
        kind: "Return";
        value?: Expr;
    }
    interface Delete extends Stmt {
        kind: "Delete";
        targets: Expr[];
    }
    interface Assign extends Symbol {
        kind: "Assign";
        targets: Expr[];
        value: Expr;
    }
    interface AugAssign extends Stmt {
        kind: "AugAssign";
        target: Expr;
        op: operator;
        value: Expr;
    }
    interface AnnAssign extends Stmt {
        kind: "AnnAssign";
        target: Expr;
        annotation: Expr;
        value?: Expr;
        simple: int;
    }
    interface For extends Stmt {
        kind: "For";
        target: Expr;
        iter: Expr;
        body: Stmt[];
        orelse: Stmt[];
    }
    interface AsyncFor extends Stmt {
        kind: "AsyncFor";
        target: Expr;
        iter: Expr;
        body: Stmt[];
        orelse: Stmt[];
    }
    interface While extends Stmt {
        kind: "While";
        test: Expr;
        body: Stmt[];
        orelse: Stmt[];
    }
    interface If extends Stmt {
        kind: "If";
        test: Expr;
        body: Stmt[];
        orelse: Stmt[];
    }
    interface With extends Stmt {
        kind: "With";
        items: WithItem[];
        body: Stmt[];
    }
    interface AsyncWith extends Stmt {
        kind: "AsyncWith";
        items: WithItem[];
        body: Stmt[];
    }
    interface Raise extends Stmt {
        kind: "Raise";
        exc?: Expr;
        cause?: Expr;
    }
    interface Try extends Stmt {
        kind: "Try";
        body: Stmt[];
        handlers: ExceptHandler[];
        orelse: Stmt[];
        finalbody: Stmt[];
    }
    interface Assert extends Stmt {
        kind: "Assert";
        test: Expr;
        msg?: Expr;
    }
    interface Import extends Stmt {
        kind: "Import";
        names: Alias[];
    }
    interface ImportFrom extends Stmt {
        kind: "ImportFrom";
        module?: identifier;
        names: Alias[];
        level?: int;
    }
    interface Global extends Stmt {
        kind: "Global";
        names: identifier[];
    }
    interface Nonlocal extends Stmt {
        kind: "Nonlocal";
        names: identifier[];
    }
    interface ExprStmt extends Stmt {
        kind: "ExprStmt";
        value: Expr;
    }
    interface Pass extends Stmt {
        kind: "Pass";
    }
    interface Break extends Stmt {
        kind: "Break";
    }
    interface Continue extends Stmt {
        kind: "Continue";
    }
    interface BoolOp extends Expr {
        kind: "BoolOp";
        op: boolop;
        values: Expr[];
    }
    interface BinOp extends Expr {
        kind: "BinOp";
        left: Expr;
        op: operator;
        right: Expr;
    }
    interface UnaryOp extends Expr {
        kind: "UnaryOp";
        op: unaryop;
        operand: Expr;
    }
    interface Lambda extends Expr {
        kind: "Lambda";
        args: Arguments;
        body: Expr;
    }
    interface IfExp extends Expr {
        kind: "IfExp";
        test: Expr;
        body: Expr;
        orelse: Expr;
    }
    interface Dict extends Expr {
        kind: "Dict";
        keys: Expr[];
        values: Expr[];
    }
    interface Set extends Expr {
        kind: "Set";
        elts: Expr[];
    }
    interface ListComp extends Expr {
        kind: "ListComp";
        elt: Expr;
        generators: Comprehension[];
    }
    interface SetComp extends Expr {
        kind: "SetComp";
        elt: Expr;
        generators: Comprehension[];
    }
    interface DictComp extends Expr {
        kind: "DictComp";
        key: Expr;
        value: Expr;
        generators: Comprehension[];
    }
    interface GeneratorExp extends Expr {
        kind: "GeneratorExp";
        elt: Expr;
        generators: Comprehension[];
    }
    interface Await extends Expr {
        kind: "Await";
        value: Expr;
    }
    interface Yield extends Expr {
        kind: "Yield";
        value?: Expr;
    }
    interface YieldFrom extends Expr {
        kind: "YieldFrom";
        value: Expr;
    }
    interface Compare extends Expr {
        kind: "Compare";
        left: Expr;
        ops: cmpop[];
        comparators: Expr[];
    }
    interface Call extends Expr {
        kind: "Call";
        func: Expr;
        args: Expr[];
        keywords: Keyword[];
    }
    interface Num extends Expr {
        kind: "Num";
        n: number;
        ns: string;
    }
    interface Str extends Expr {
        kind: "Str";
        s: string;
    }
    interface FormattedValue extends Expr {
        kind: "FormattedValue";
        value: Expr;
        conversion?: int;
        format_spec?: Expr;
    }
    interface JoinedStr extends Expr {
        kind: "JoinedStr";
        values: Expr[];
    }
    interface Bytes extends Expr {
        kind: "Bytes";
        s: number[];
    }
    interface NameConstant extends Expr {
        kind: "NameConstant";
        value: boolean;
    }
    interface Ellipsis extends Expr {
        kind: "Ellipsis";
    }
    interface Constant extends Expr {
        kind: "Constant";
        value: any;
    }
    interface AssignmentExpr extends Expr {
        ctx: expr_context;
    }
    interface Attribute extends AssignmentExpr {
        kind: "Attribute";
        value: Expr;
        attr: identifier;
    }
    interface Subscript extends AssignmentExpr {
        kind: "Subscript";
        value: Expr;
        slice: AnySlice;
    }
    interface Starred extends AssignmentExpr {
        kind: "Starred";
        value: Expr;
    }
    interface Name extends AssignmentExpr {
        kind: "Name";
        id: identifier;
        isdef?: boolean;
    }
    interface List extends AssignmentExpr {
        kind: "List";
        elts: Expr[];
    }
    interface Tuple extends AssignmentExpr {
        kind: "Tuple";
        elts: Expr[];
    }
}
declare namespace pxt.py {
}
declare namespace pxt.py {
    interface Py2TsRes {
        generated: Map<string>;
        diagnostics: pxtc.KsDiagnostic[];
    }
    function py2ts(opts: pxtc.CompileOptions): Py2TsRes;
    function convert(opts: pxtc.CompileOptions): pxtc.KsDiagnostic[];
}
declare namespace pxt.py {
    enum TokenType {
        Id = 0,
        Op = 1,
        Keyword = 2,
        Number = 3,
        String = 4,
        NewLine = 5,
        Comment = 6,
        Indent = 7,
        Dedent = 8,
        EOF = 9,
        Error = 10,
    }
    interface Token {
        type: TokenType;
        value: string;
        auxValue?: any;
        quoted?: string;
        stringPrefix?: string;
        startPos: number;
        endPos: number;
    }
    function position(startPos: number, source: string): {
        line: number;
        column: number;
    };
    function patchPosition(d: pxtc.KsDiagnostic, src: string): void;
    function tokenToString(t: Token): string;
    function friendlyTokenToString(t: Token, source: string): string;
    function tokensToString(ts: Token[]): string;
    function lex(_source: string): Token[];
}
declare namespace pxt.py {
    function dump(asts: AST[], cmp?: boolean): string;
    function parse(_source: string, _filename: string, _tokens: Token[]): {
        stmts: Stmt[];
        diagnostics: pxtc.KsDiagnostic[];
    };
}
declare namespace pxt.py {
    function decompileToPython(program: ts.Program, filename: string): pxtc.CompileResult;
    const INDENT = "    ";
}
declare namespace pxt.py.rx {
    function isIdentifierStart(code: number): boolean;
    function isIdentifierChar(code: number): boolean;
    function isSpace(ch: number): boolean;
    function isNewline(ch: number): boolean;
}
