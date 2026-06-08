import * as vscode from 'vscode';
import { configureDirectories } from './configureDirectories';
import { openFeatureFiles } from './openFeatureFiles';
import { openImportedFiles } from './openImportedFiles';
import { closeRelatedFiles } from './closeRelatedFiles';
import { copyFeatureChain } from './copyFeatureChain';

export const registerCommands = (context: vscode.ExtensionContext): void => {
	context.subscriptions.push(
		vscode.commands.registerCommand('devflow.openFeatureFiles', openFeatureFiles),
		vscode.commands.registerCommand('devflow.openImportedFiles', openImportedFiles),
		vscode.commands.registerCommand('devflow.closeRelatedFiles', closeRelatedFiles),
		vscode.commands.registerCommand('devflow.copyFeatureChain', copyFeatureChain),
		vscode.commands.registerCommand('devflow.configureDirectories', configureDirectories),
	);
};
