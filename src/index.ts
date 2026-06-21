import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { DisposableDelegate } from '@lumino/disposable';

const COMMAND = 'jupyter-run-init-cells:run';
const TAG = 'init';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-run-init-cells',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker, palette: ICommandPalette | null) => {
    const { commands } = app;

    commands.addCommand(COMMAND, {
      label: 'Run All Init Cells',
      caption: `Run all cells tagged "${TAG}"`,
      isEnabled: () => !!tracker.currentWidget,
      execute: async () => {
        const panel = tracker.currentWidget;
        if (!panel) {
          return;
        }
        await panel.context.ready;
        await panel.context.sessionContext.ready;
        const nb = panel.content;
        const { sessionContext } = panel.context;
        if (!sessionContext.session?.kernel) {
          return;
        }

        const initCells: CodeCell[] = [];
        for (const cell of nb.widgets) {
          const sharedModel = cell.model.sharedModel;
          const tags = (sharedModel.getMetadata('tags') as string[]) ?? [];
          if (Array.isArray(tags) && tags.includes(TAG) && cell instanceof CodeCell) {
            const isReadOnly = sharedModel.getMetadata('editable') === false;
            const isFrozen = sharedModel.getMetadata('frozen') === true;
            if (isReadOnly || isFrozen) {
              continue;
            }
            const code = sharedModel.getSource();
            if (!code.trim()) {
              continue;
            }
            cell.model.clearExecution();
            cell.outputHidden = false;
            cell.model.executionState = 'running';
            cell.model.trusted = true;
            initCells.push(cell);
          }
        }

        let nextCellIndex = 0;
        try {
          for (; nextCellIndex < initCells.length; nextCellIndex++) {
            const cell = initCells[nextCellIndex];
            const reply = await CodeCell.execute(cell, sessionContext);
            cell.model.executionState = 'idle';
            if (reply?.content.status !== 'ok') {
              nextCellIndex++;
              break;
            }
          }
        } finally {
          for (; nextCellIndex < initCells.length; nextCellIndex++) {
            initCells[nextCellIndex].model.executionState = 'idle';
          }
        }
      }
    });

    if (palette) {
      palette.addItem({ command: COMMAND, category: 'Notebook Operations' });
    }

    app.docRegistry.addWidgetExtension(
      'Notebook',
      new (class implements DocumentRegistry.IWidgetExtension<NotebookPanel, any> {
        createNew(panel: NotebookPanel, _context: DocumentRegistry.IContext<any>) {
          const button = new ToolbarButton({
            iconClass: 'jp-RunIcon',
            tooltip: 'Run all init cells',
            onClick: () => void app.commands.execute(COMMAND)
          });
          panel.toolbar.insertItem(10, 'jupyterRunInitCells', button);
          return new DisposableDelegate(() => button.dispose());
        }
      })()
    );
  }
};

export default plugin;
