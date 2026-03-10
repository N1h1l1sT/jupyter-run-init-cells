import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { DisposableDelegate } from '@lumino/disposable';

const COMMAND = 'run-init-cells:run';
const TAG = 'init';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'run-init-cells',
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
        const kernel = panel.context.sessionContext.session?.kernel;
        if (!kernel) {
          return;
        }

        for (const cell of nb.widgets) {
          const tags = (cell.model.sharedModel.getMetadata('tags') as string[]) ?? [];
          if (
            Array.isArray(tags) &&
            tags.includes(TAG) &&
            cell instanceof CodeCell
          ) {
            const code = cell.model.sharedModel.getSource();
            if (!code.trim()) {
              continue;
            }
            const cellId = { cellId: cell.model.sharedModel.getId() };
            cell.model.clearExecution();
            cell.outputHidden = false;
            cell.setPrompt('*');
            cell.model.trusted = true;
            const future = kernel.requestExecute(
              { code, stop_on_error: false },
              false,
              cellId
            );
            cell.outputArea.future = future;
            void future.done.then(reply => {
              cell.model.executionCount =
                reply?.content.status === 'ok'
                  ? (reply.content as any).execution_count
                  : null;
            });
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
          panel.toolbar.insertItem(10, 'runInitCells', button);
          return new DisposableDelegate(() => button.dispose());
        }
      })()
    );
  }
};

export default plugin;
