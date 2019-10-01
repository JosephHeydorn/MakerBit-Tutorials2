// total=6948 new=70.39% cached=0.00% other=29.61%
(function (ectx) {
'use strict';
const runtime = ectx.runtime;
const oops = ectx.oops;
const doNothing = ectx.doNothing;
const pxsim = ectx.pxsim;
const globals = ectx.globals;
const maybeYield = ectx.maybeYield;
const setupDebugger = ectx.setupDebugger;
const isBreakFrame = ectx.isBreakFrame;
const breakpoint = ectx.breakpoint;
const trace = ectx.trace;
const checkStack = ectx.checkStack;
const leave = ectx.leave;
const checkResumeConsumed = ectx.checkResumeConsumed;
const setupResume = ectx.setupResume;
const setupLambda = ectx.setupLambda;
const checkSubtype = ectx.checkSubtype;
const failedCast = ectx.failedCast;
const buildResume = ectx.buildResume;
const mkVTable = ectx.mkVTable;
const __this = runtime;
const pxtrt = pxsim.pxtrt;
let yieldSteps = 1;
ectx.setupYield(function() { yieldSteps = 100; })
pxsim.setTitle("bluetooth");
pxsim.setConfigData({}, {});
pxtrt.mapKeyNames = [
 ""
];
__this.setupPerfCounters([]);
const pxsim_Array__getAt = pxsim.Array_.getAt;
const pxsim_Array__length = pxsim.Array_.length;
const pxsim_Array__mk = pxsim.Array_.mk;
const pxsim_Array__push = pxsim.Array_.push;
const pxsim_Boolean__bang = pxsim.Boolean_.bang;
const pxsim_String__concat = pxsim.String_.concat;
const pxsim_String__stringConv = pxsim.String_.stringConv;
const pxsim_numops_toBool = pxsim.numops.toBool;
const pxsim_numops_toBoolDecr = pxsim.numops.toBoolDecr;
const pxsim_pxtcore_mkAction = pxsim.pxtcore.mkAction;
const pxsim_pxtcore_mkClassInstance = pxsim.pxtcore.mkClassInstance;
const pxsim_pxtrt_ldlocRef = pxsim.pxtrt.ldlocRef;
const pxsim_pxtrt_mapGetByString = pxsim.pxtrt.mapGetByString;
const pxsim_pxtrt_stclo = pxsim.pxtrt.stclo;
const pxsim_pxtrt_stlocRef = pxsim.pxtrt.stlocRef;
const pxsim_Boolean_ = pxsim.Boolean_;
const pxsim_pxtcore = pxsim.pxtcore;
const pxsim_String_ = pxsim.String_;
const pxsim_ImageMethods = pxsim.ImageMethods;
const pxsim_Array_ = pxsim.Array_;
const pxsim_pxtrt = pxsim.pxtrt;
const pxsim_numops = pxsim.numops;


function _main___P206226(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    globals.listeners___206511 = (undefined);
    r0 = (0.5 * 256);
    s.tmp_0 = r0;
    r0 = (s.tmp_0 | 0);
    globals.oneHalfFx8___206671 = (r0);
    s.tmp_0 = console_addListener__P206514_mk(s);
    s.tmp_0.arg0 = inline__P206717;
    s.pc = 1; return s.tmp_0;
  case 1:
    r0 = s.retval;
    r0 = undefined;
    return leave(s, r0)
  default: oops()
} } }
_main___P206226.info = {"start":0,"length":0,"line":0,"column":0,"endLine":0,"endColumn":0,"fileName":"bluetooth.ts","functionName":"<main>","argumentNames":[]}
_main___P206226.continuations = [  ]

function _main___P206226_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: _main___P206226, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  tmp_0: undefined,
} }





function inline__P206717(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    if (s.lambdaArgs) {
      s.arg0 = (s.lambdaArgs[0]);
      s.lambdaArgs = null;
    }
    r0 = undefined;
    r0 = undefined;
    return leave(s, r0)
  default: oops()
} } }
inline__P206717.info = {"start":345,"length":29,"line":15,"column":24,"endLine":15,"endColumn":53,"fileName":"bluetooth.ts","functionName":"inline","argumentNames":["msg"]}

function inline__P206717_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: inline__P206717, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  arg0: undefined,
} }





function bluetooth___log__P206715(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    if (s.lambdaArgs) {
      s.arg0 = (s.lambdaArgs[0]);
      s.lambdaArgs = null;
    }
    r0 = undefined;
    return leave(s, r0)
  default: oops()
} } }
bluetooth___log__P206715.info = {"start":262,"length":58,"line":12,"column":4,"endLine":14,"endColumn":5,"fileName":"bluetooth.ts","functionName":"__log","argumentNames":["msg"]}

function bluetooth___log__P206715_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: bluetooth___log__P206715, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  arg0: undefined,
} }





function console_addListener__P206514(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    if (s.lambdaArgs) {
      s.arg0 = (s.lambdaArgs[0]);
      s.lambdaArgs = null;
    }
    r0 = pxsim_numops_toBoolDecr(s.arg0);
    s.tmp_1 = r0;
    r0 = pxsim_Boolean__bang(s.tmp_1);
    s.tmp_0 = r0;
    r0 = pxsim_numops_toBoolDecr(s.tmp_0);
    if (!r0) { step = 1; continue; }
    { step = 5; continue; }
  case 1:
  case 2:
    r0 = pxsim_numops_toBoolDecr(globals.listeners___206511);
    s.tmp_3 = r0;
    r0 = pxsim_Boolean__bang(s.tmp_3);
    s.tmp_2 = r0;
    r0 = pxsim_numops_toBoolDecr(s.tmp_2);
    if (!r0) { step = 3; continue; }
    r0 = pxsim_Array__mk();
    globals.listeners___206511 = (r0);
  case 3:
  case 4:
    r0 = pxsim_Array__push(globals.listeners___206511, s.arg0);
  case 5:
    r0 = undefined;
    return leave(s, r0)
  default: oops()
} } }
console_addListener__P206514.info = {"start":1217,"length":186,"line":46,"column":4,"endLine":51,"endColumn":5,"fileName":"pxt_modules/core/console.ts","functionName":"addListener","argumentNames":["listener"]}

function console_addListener__P206514_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: console_addListener__P206514, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  tmp_0: undefined,
  tmp_1: undefined,
  tmp_2: undefined,
  tmp_3: undefined,
  arg0: undefined,
} }





function Fx8__P206664(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    if (s.lambdaArgs) {
      s.arg0 = (s.lambdaArgs[0]);
      s.lambdaArgs = null;
    }
    r0 = (s.arg0 * 256);
    s.tmp_0 = r0;
    r0 = (s.tmp_0 | 0);
    return leave(s, r0)
  default: oops()
} } }
Fx8__P206664.info = {"start":42,"length":68,"line":4,"column":0,"endLine":6,"endColumn":1,"fileName":"pxt_modules/core/fixed.ts","functionName":"Fx8","argumentNames":["v"]}

function Fx8__P206664_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: Fx8__P206664, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  tmp_0: undefined,
  arg0: undefined,
} }





const breakpoints = setupDebugger(1, [])

return _main___P206226
})
