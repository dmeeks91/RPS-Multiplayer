var app = new Framework7({
    name: 'My App',
    smartSelect: {
        openIn: 'popover',
        closeOnSelect: true,
      }
  });

  app.on('initSmartSelect', function (data) {
      $.each(data, function(key, smartSlct) {
        if (smartSlct.obj.valueEl.innerHTML === '')
        {
            smartSlct.obj.valueEl.innerHTML = smartSlct.init;
        }
      })
  });
  
var mainView = app.views.create('.view-main');

    