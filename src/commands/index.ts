import * as vscode from 'vscode';
import { configureDirectories } from './configureDirectories';
import { openFeatureFiles } from './openFeatureFiles';
import { openImportedFiles } from './openImportedFiles';
import { closeRelatedFiles } from './closeRelatedFiles';
import { copyFeatureChain } from './copyFeatureChain';

export const registerCommands = (context: vscode.ExtensionContext): void => {
	context.subscriptions.push(
		vscode.commands.registerCommand('featureflow.openFeatureFiles', openFeatureFiles),
		vscode.commands.registerCommand('featureflow.openImportedFiles', openImportedFiles),
		vscode.commands.registerCommand('featureflow.closeRelatedFiles', closeRelatedFiles),
		vscode.commands.registerCommand('featureflow.copyFeatureChain', copyFeatureChain),
		vscode.commands.registerCommand('featureflow.configureDirectories', configureDirectories),
	);
};
