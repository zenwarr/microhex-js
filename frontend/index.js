"use strict";

var ipc = require('ipc');

$(function() {
  ipc.on('data-reply', function(data) {
    var $column = $('.column');
    $column.html('');

    function flush_row() {
      if (row_text != '') {
        $column.append($('<div class="row">' + row_text + '</div>'));
        row_text = '';
      }
    }

    var row_index = 0;
    var row_text = '';
    for (var index = 0; index < data.length; ++index) {
      if (index % 16 == 0) {
        flush_row();
      }

      row_text += '<span class="cell">' + data[index].text + '</span>';
    }

    flush_row();

    $('.cell').click(function() {
      $('.cell').removeClass('active');
      $(this).addClass('active');
    });
  });

  ipc.on('src-avail', function(data) {
    update_data();
  });

  function update_data() {
    ipc.send('data-query');
  }
});
