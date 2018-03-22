js_fun = {
  show_alert: function (id, pesan, alert) {
    $(id).hide();
    $(id).html('<div class="alert alert-' + alert + ' alert-dismissable" role="alert"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' + pesan + '</div>');
    $(id).show('slow');
  },

  show_notif: function (message, type, delay = 3000) {
    $.notify({
      message: message
    },{
      type: type,
      delay: delay,
      offset: { x: 15, y: 65 }, 
      template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0} alert-dismissable" role="alert">' +
        '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
        '<span data-notify="message">{2}</span>' +
      '</div>' 
    });
  }
}