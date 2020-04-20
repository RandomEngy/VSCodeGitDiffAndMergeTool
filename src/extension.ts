// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	function getRelativeItemPath(projectPath: string, fullTargetFilePath: string): string | null {
  		var relativeFilePath = fullTargetFilePath.replace(projectPath, '');
		// remove first / or \
		if(relativeFilePath[0] === '/' || relativeFilePath[0] === '\\') {
			relativeFilePath = relativeFilePath.slice(1, relativeFilePath.length );
		}
	
		return relativeFilePath;
	}

	async function executeOperation(
		commandParam: any,
		gitArgumentsFunc: (targetFile: string) => string[],
		infoMessageFunc: (targetFile: string) => string): Promise<void> {
        const fullTargetFilePath: string = commandParam.resourceUri.fsPath;
        
		const simpleGit = await import('simple-git');
		if (vscode.workspace.workspaceFolders) {
            // Look through the workspace folders and find the one that has our file.
            for (let workspaceFolder of vscode.workspace.workspaceFolders) {
                const projectPath = workspaceFolder.uri.fsPath;
                if (fullTargetFilePath.startsWith(projectPath)) {
                    var targetFile = getRelativeItemPath(projectPath, fullTargetFilePath);
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
                    
                    return;
                }
            }

            vscode.window.showWarningMessage('Could not find workspace for ' + fullTargetFilePath);
		}
	}

	let diffCommand = vscode.commands.registerCommand('gitdiffandmergetool.diff', (param: any) => {
		executeOperation(
			param,
			(targetFile: string) => { return ['difftool', '-y', 'HEAD', targetFile]; },
			(targetFile: string) => { return 'Launching diff tool for ' + targetFile; });
	});

	let mergeCommand = vscode.commands.registerCommand('gitdiffandmergetool.merge', async (param: any) => {
		executeOperation(
			param,
			(targetFile: string) => { return ['mergetool', '-y', targetFile]; },
			(targetFile: string) => { return 'Launching merge tool for ' + targetFile; });
	});

	context.subscriptions.push(mergeCommand);
	context.subscriptions.push(diffCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
