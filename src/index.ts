import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
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
        if (!panel) return;
        await panel.context.ready;
        const nb = panel.content;

        const originalIndex = nb.activeCellIndex;
        const scrollNode = nb.node.closest('.jp-WindowedPanel-outer') ?? nb.node;
        const scrollTop = scrollNode.scrollTop;

        for (let i = 0; i < nb.widgets.length; i++) {
          const cell = nb.widgets[i];
          const tags = (cell.model.sharedModel.getMetadata('tags') as string[]) ?? [];
          if (Array.isArray(tags) && tags.includes(TAG)) {
            nb.activeCellIndex = i;
            void NotebookActions.run(nb, panel.context.sessionContext);
          }
        }

        nb.activeCellIndex = originalIndex;
        scrollNode.scrollTop = scrollTop;
      }
    });

    if (palette) palette.addItem({ command: COMMAND, category: 'Notebook Operations' });

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
