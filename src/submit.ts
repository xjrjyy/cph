import { getProblem } from './parser';
import * as vscode from 'vscode';
import { storeSubmitCodeForcesProblem, submitKattisProblem } from './companion';
import { getJudgeViewProvider } from './extension';
import telmetry from './telmetry';

export const submitToKattis = async () => {
    globalThis.reporter.sendTelemetryEvent(telmetry.SUBMIT_TO_KATTIS);
    const srcPath = vscode.window.activeTextEditor?.document.fileName;
    if (!srcPath) {
        vscode.window.showErrorMessage(
            'Active editor is not supported for submission',
        );
        return;
    }

    const textEditor = await vscode.workspace.openTextDocument(srcPath);
    await vscode.window.showTextDocument(textEditor, vscode.ViewColumn.One);
    await textEditor.save();

    const problem = getProblem(srcPath);

    if (!problem) {
        vscode.window.showErrorMessage('Failed to parse current code.');
        return;
    }

    let url: URL;
    try {
        url = new URL(problem.url);
    } catch (err) {
        console.error(err);
        vscode.window.showErrorMessage('Not a kattis problem.');
        return;
    }

    if (url.hostname !== 'open.kattis.com') {
        vscode.window.showErrorMessage('Not a kattis problem.');
        return;
    }

    submitKattisProblem(problem);
    getJudgeViewProvider().extensionToJudgeViewMessage({
        command: 'waiting-for-submit',
    });
};

export const submitToCodeForces = async () => {
    const srcPath = vscode.window.activeTextEditor?.document.fileName;

    if (!srcPath) {
        vscode.window.showErrorMessage(
            'Active editor is not supported for submission',
        );
        return;
    }

    const textEditor = await vscode.workspace.openTextDocument(srcPath);
    await vscode.window.showTextDocument(textEditor, vscode.ViewColumn.One);
    await textEditor.save();

    const problem = getProblem(srcPath);

    if (!problem) {
        vscode.window.showErrorMessage('Failed to parse current code.');
        return;
    }

    let url: URL;
    try {
        url = new URL(problem.url);
    } catch (err) {
        console.error(err);
        vscode.window.showErrorMessage('Not a codeforces problem.');
        return;
    }

    if (url.hostname !== 'codeforces.com') {
        vscode.window.showErrorMessage('Not a codeforces problem.');
        return;
    }

    storeSubmitCodeForcesProblem(problem);
    getJudgeViewProvider().extensionToJudgeViewMessage({
        command: 'waiting-for-submit',
    });
};

/** Get the problem name ( like c ) for a given URL string. */
export const getProblemShortName = (problemUrl: string): string | null => {
    if (new URL(problemUrl).hostname === 'codeforces.com') {
        const parts = problemUrl.split('/');
        return parts[parts.length - 1].toLowerCase();
    }
    if (new URL(problemUrl).hostname === 'atcoder.jp') {
        const parts = problemUrl.split('/');
        const name = parts[parts.length - 1];
        return name.charAt(name.length - 1).toLowerCase();
    }
    // TODO

    return null;
};

/** Get the problem name ( like 144C ) for a given Codeforces URL string. */
export const getCodeForcesProblemName = (problemUrl: string): string => {
    const parts = problemUrl.split('/');
    let problemName: string;

    if (parts.find((x) => x == 'contest')) {
        // Url is like https://codeforces.com/contest/1398/problem/C
        problemName = parts[parts.length - 3] + parts[parts.length - 1];
    } else {
        // Url is like https://codeforces.com/problemset/problem/1344/F
        problemName = parts[parts.length - 2] + parts[parts.length - 1];
    }

    return problemName;
};
