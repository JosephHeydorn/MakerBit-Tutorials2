// total=4106 new=47.56% cached=0.00% other=52.44%
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
pxsim.setTitle("core");
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


function _main___P201110(s) {
let r0 = s.r0, step = s.pc;
s.pc = -1;


while (true) {
if (yieldSteps-- < 0 && maybeYield(s, step, r0)) return null;
switch (step) {
  case 0:

    r0 = (0.5 * 256);
    s.tmp_0 = r0;
    r0 = (s.tmp_0 | 0);
    globals.oneHalfFx8___201555 = (r0);
    globals.i___201583 = (1);
    globals.f___201585 = (0.5);
    r0 = (globals.i___201583 + globals.f___201585);
    globals.plus___201588 = (r0);
    r0 = (globals.i___201583 - globals.f___201585);
    globals.minus___201592 = (r0);
    r0 = pxsim.Math_.random();
    globals.r___201595 = (r0);
    r0 = pxsim.Math_.randomRange(5, 10);
    globals.ri___201598 = (r0);
    r0 = undefined;
    return leave(s, r0)
  default: oops()
} } }
_main___P201110.info = {"start":0,"length":0,"line":0,"column":0,"endLine":0,"endColumn":0,"fileName":"test.ts","functionName":"<main>","argumentNames":[]}
_main___P201110.continuations = [  ]

function _main___P201110_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: _main___P201110, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  tmp_0: undefined,
} }





function Fx8__P201548(s) {
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
Fx8__P201548.info = {"start":42,"length":68,"line":4,"column":0,"endLine":6,"endColumn":1,"fileName":"fixed.ts","functionName":"Fx8","argumentNames":["v"]}

function Fx8__P201548_mk(s) {
    checkStack(s.depth);
    return {
        parent: s, fn: Fx8__P201548, depth: s.depth + 1,
        pc: 0, retval: undefined, r0: undefined, overwrittenPC: false, lambdaArgs: null,
  tmp_0: undefined,
  arg0: undefined,
} }





const breakpoints = setupDebugger(1, ["oneHalfFx8___201555","plus___201588","i___201583","f___201585","minus___201592","r___201595","ri___201598"])

return _main___P201110
})
