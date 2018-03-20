$(document).ready(function () {
  $('.date-picker').each(function () {
    $(this).datepicker({
      templates: {
        leftArrow: '<i class="now-ui-icons arrows-1_minimal-left"></i>',
        rightArrow: '<i class="now-ui-icons arrows-1_minimal-right"></i>'
      }
    }).on('show', function () {
      $('.datepicker').addClass('open');

      datepicker_color = $(this).data('datepicker-color');
      if (datepicker_color.length != 0) {
        $('.datepicker').addClass('datepicker-' + datepicker_color + '');
      }
    }).on('hide', function () {
      $('.datepicker').removeClass('open');
    }).on('changeDate', function(e){ 
      $(this).parent('.label-floating').removeClass('is-empty'); 
    });
  });
});

js_fun = {
  show_alert: function (id, pesan, alert) {
    $(id).hide();
    $(id).html('<div class="alert alert-' + alert + ' alert-dismissable" role="alert"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' + pesan + '</div>');
    $(id).show('slow');
  },

  show_notif: function (from, align, color, icon, message) {
    if (icon == 'bell') icon = 'now-ui-icons ui-1_bell-53';
    else if (icon == 'idea') icon = 'now-ui-icons business_bulb-63';
    else if (icon == 'smile') icon = 'now-ui-icons emoticons_satisfied';
    else if (icon == 'warning') icon = 'now-ui-icons media-2_sound-wave';

    $.notify({
      icon: icon,
      message: message

    }, {
      type: color,
      timer: 1000,
      placement: {
        from: from,
        align: align
      }
    });
  }
}