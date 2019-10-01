/// <reference types="node" />
import * as events from 'events';
export interface SpawnOptions {
    cmd: string;
    args: string[];
    cwd?: string;
    shell?: boolean;
    pipe?: boolean;
    input?: string;
    silent?: boolean;
    envOverrides?: pxt.Map<string>;
    allowNonZeroExit?: boolean;
}
export declare let targetDir: string;
export declare let pxtCoreDir: string;
export declare let cliFinalizers: (() => Promise<void>)[];
export declare function addCliFinalizer(f: () => Promise<void>): void;
export declare function runCliFinalizersAsync(): Promise<void>;
export declare function setTargetDir(dir: string): void;
export declare function readResAsync(g: events.EventEmitter): Promise<Buffer>;
export declare function spawnAsync(opts: SpawnOptions): Promise<void>;
export declare function spawnWithPipeAsync(opts: SpawnOptions): Promise<Buffer>;
export declare function addCmd(name: string): string;
export declare function runNpmAsync(...args: string[]): Promise<void>;
export interface NpmRegistry {
    _id: string;
    _name: string;
    "dist-tags": pxt.Map<string>;
    "versions": pxt.Map<any>;
}
export declare function npmRegistryAsync(pkg: string): Promise<NpmRegistry>;
export declare function runNpmAsyncWithCwd(cwd: string, ...args: string[]): Promise<void>;
export declare function runGitAsync(...args: string[]): Promise<void>;
export declare function gitInfoAsync(args: string[], cwd?: string, silent?: boolean): Promise<string>;
export declare function currGitTagAsync(): Promise<string>;
export declare function needsGitCleanAsync(): Promise<void>;
export declare function sanitizePath(path: string): string;
export declare function readJson(fn: string): any;
export declare function readPkgConfig(dir: string): pxt.PackageConfig;
export declare function getPxtTarget(): pxt.TargetBundle;
export declare function pathToPtr(path: string): string;
export declare function mkdirP(thePath: string): void;
export declare function cpR(src: string, dst: string, maxDepth?: number): void;
export declare function cp(srcFile: string, destDirectory: string): void;
export declare function allFiles(top: string, maxDepth?: number, allowMissing?: boolean, includeDirs?: boolean): string[];
export declare function existsDirSync(name: string): boolean;
export declare function writeFileSync(p: string, data: any, options?: {
    encoding?: string | null;
    mode?: number | string;
    flag?: string;
} | string | null): void;
export declare function openUrl(startUrl: string, browser: string): void;
export declare function fileExistsSync(p: string): boolean;
export declare let lastResolveMdDirs: string[];
export declare function resolveMd(root: string, pathname: string): string;
export declare function lazyDependencies(): pxt.Map<string>;
export declare function lazyRequire(name: string, install?: boolean): any;
