import * as electron from 'electron';
const ipcRenderer:Electron.IpcRenderer = electron.ipcRenderer;

function update_data() {
  ipcRenderer.send('data-query');
}

ipcRenderer.on('data-reply', function(event:Electron.IpcRendererEvent, data:Array<number>) {
  let columns:NodeListOf<Element> = document.querySelectorAll('.column');
  for (let j = 0; j < columns.length; ++j) {
    columns[j].innerHTML = '';
  }

  let active_column:Element = columns.length > 0 ? columns[0] : null;
  if (active_column === null) {
    return;
  }

  function flush_row() {
    if (row_text !== '') {
      active_column.innerHTML = active_column.innerHTML + row_text;
      row_text = '';
    }
  }

  let row_text = '';
  for (let index = 0; index < data.length; ++index) {
    if (index % 16 === 0) {
      flush_row();
    }

    row_text += `<span class="cell">${data[index]}</span>`;
  }

  flush_row();
});

ipcRenderer.on('src-avail', function(event:Electron.IpcRendererEvent, ...args:any[]) {
  update_data();
});

update_data();

let hex_view = document.getElementById('hex_view');

hex_view.addEventListener('click', function(e:Event) {
  let target:HTMLElement = <HTMLElement>e.target;
  if (target !== null && target.classList.contains('cell')) {
    // deactivate currently active cells
    let active_cells = hex_view.querySelectorAll('.cell--active');
    for (let j = 0; j < active_cells.length; ++j) {
      active_cells[j].classList.remove('cell--active');
    }

    // and add active class to clicked cell
    target.classList.add('cell--active');
  }
});
