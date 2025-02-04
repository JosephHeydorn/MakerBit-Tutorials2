/// <reference path="pxtlib.d.ts" />
/// <reference path="pxtcompiler.d.ts" />
/// <reference path="pxtpy.d.ts" />
/// <reference path="pxtsim.d.ts" />
import Map = pxt.Map;
import * as commandParser from './commandparser';
export interface UserConfig {
    localToken?: string;
    noAutoBuild?: boolean;
    noAutoStart?: boolean;
    localBuild?: boolean;
    noSerial?: boolean;
}
export declare let globalConfig: UserConfig;
export declare function pokeRepoAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function execCrowdinAsync(cmd: string, ...args: string[]): Promise<void>;
export declare function apiAsync(path: string, postArguments?: string): Promise<void>;
export declare function queryAsync(msg: string, defl: string): Promise<string>;
export declare function yesNoAsync(msg: string): Promise<boolean>;
export declare function uploadTargetReleaseAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function uploadTargetRefsAsync(repoPath: string): Promise<void>;
export declare function ghpPushAsync(builtPackaged: string, minify?: boolean): Promise<void>;
export interface BuildTargetOptions {
    localDir?: boolean;
    packaged?: boolean;
    skipCore?: boolean;
    quick?: boolean;
    rebundle?: boolean;
}
export declare function buildTargetAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function internalBuildTargetAsync(options?: BuildTargetOptions): Promise<void>;
export declare function serveAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function installAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function addAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function initAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function serviceAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function augmnetDocsAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function timeAsync(): Promise<void>;
export declare function exportCppAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function formatAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function uploadTargetTranslationsAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function downloadTargetTranslationsAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function staticpkgAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function cleanAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function cleanGenAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function npmInstallNativeAsync(): Promise<void>;
export declare function buildJResSpritesAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function buildJResAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function buildAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function gendocsAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function consoleAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function deployAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function runAsync(parsed?: commandParser.ParsedCommand): Promise<void>;
export declare function testAsync(): Promise<void>;
export interface SavedProject {
    name: string;
    files: Map<string>;
}
export declare function extractAsync(parsed: commandParser.ParsedCommand): Promise<void>;
export declare function hexdumpAsync(c: commandParser.ParsedCommand): Promise<void>;
export declare function hex2uf2Async(c: commandParser.ParsedCommand): Promise<void>;
export interface SnippetInfo {
    type: string;
    code: string;
    ignore: boolean;
    index: number;
}
export declare function getSnippets(source: string): SnippetInfo[];
export interface CodeSnippet {
    name: string;
    code: string;
    type: string;
    ext: string;
    packages: pxt.Map<string>;
    file?: string;
}
export declare function getCodeSnippets(fileName: string, md: string): CodeSnippet[];
export declare function mainCli(targetDir: string, args?: string[]): Promise<void>;
