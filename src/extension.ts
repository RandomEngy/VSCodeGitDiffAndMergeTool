// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { exec } from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	function getItemPath(projectPath: string, param: any): string | null
	{
  		var targetFile = param._resourceUri.fsPath.replace(projectPath, '');
		// remove first / or \
		if(targetFile[0] === '/' || targetFile[0] === '\\') {
			targetFile = targetFile.slice(1, targetFile.length );
		}
	
		return targetFile;
	}

	async function executeOperation(
		commandParam: any,
		gitArgumentsFunc: (targetFile: string) => string[],
		infoMessageFunc: (targetFile: string) => string) {
		const simpleGit = await import('simple-git');
		if (vscode.workspace.workspaceFolders) {
			const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
			var targetFile = getItemPath(projectPath, commandParam);
			if (targetFile === null) {
				vscode.window.showWarningMessage('Could not get target path.');
				return;
			}

			vscode.window.showInformationMessage(infoMessageFunc(targetFile));

			simpleGit(projectPath).raw(
				gitArgumentsFunc(targetFile),
				(err: any, result: any) => {
					if(err) {
						vscode.window.showWarningMessage(err);
					}
				});
		}
	}

	let diffCommand = vscode.commands.registerCommand('gitdiffandmergetool.diff', (param: any) => {
		executeOperation(
			param,
			(targetFile: string) => { return ['difftool', '-y', 'head', targetFile] },
			(targetFile: string) => { return 'Launching diff tool for ' + targetFile });
	});

	let mergeCommand = vscode.commands.registerCommand('gitdiffandmergetool.merge', async (param: any) => {
		executeOperation(
			param,
			(targetFile: string) => { return ['mergetool', '-y', targetFile] },
			(targetFile: string) => { return 'Launching merge tool for ' + targetFile });
	});

	context.subscriptions.push(mergeCommand);
	context.subscriptions.push(diffCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
