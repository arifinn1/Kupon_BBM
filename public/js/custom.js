$(function() {
  Stripe.setPublishableKey('pk_test_MxbUSicIaELKd90eDIO4OQDT');

  var opts = {
    lines: 13, // The number of lines to draw
    length: 38, // The length of each line
    width: 17, // The line thickness
    radius: 45, // The radius of the inner circle
    scale: 1, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#ffffff', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    opacity: 0.25, // Opacity of the lines
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    fps: 20, // Frames per second when using setTimeout() as a fallback in IE 9
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    position: 'absolute' // Element positioning
  };

  $('#search_term').keyup(function() {
    var search_term = $(this).val();

    $.ajax({
      method: 'POST',
      url: '/api/search',
      data: {
        search_term
      },
      dataType: 'json',
      success: function(json) {
        var data = json.hits.hits.map(function(hit) {
          return hit;
        });

        $('#search_result').empty();
        for (var i = 0; i < data.length; i++) {
          $('#search_result').append(`<div class="col-md-4">
            <a href="/product/`+data[i]._source._id+`">
              <div class="thumbnail">
                <img src="`+data[i]._source.image+`" alt="">
                <div class="caption">
                  <h3>`+data[i]._source.name+`</h3>
                  <p>`+data[i]._source.category.name+`</p>
                  <p>`+data[i]._source.price+`</p>
                </div>
              </div>
            </a>
          </div>`);
        }
      },
      error: function(err) {
        console.log(err);
      }
    });
  });

  $('#plus').on('click', function(e) {
    e.preventDefault();
    var priceValue = parseFloat($('#priceValue').val());
    var quantity = parseInt($('#quantity').val());

    priceValue += parseFloat($('#priceHidden').val());
    quantity += 1;

    $('#quantity').val(quantity);
    $('#priceValue').val(priceValue.toFixed(2));
    $('#total').html(quantity);
  });

  $('#minus').on('click', function(e) {
    e.preventDefault();
    var priceValue = parseFloat($('#priceValue').val());
    var quantity = parseInt($('#quantity').val());

    if (quantity > 0){
      priceValue -= parseFloat($('#priceHidden').val());
      quantity -= 1;
    }

    $('#quantity').val(quantity);
    $('#priceValue').val(priceValue.toFixed(2));
    $('#total').html(quantity);
  });
});

function stripeResponseHandler(status, response) {
  var $form = $('#payment-form');

  if (response.error) {
    $form.find('.payment-errors').text(response.error.message);
    $form.find('button').prop('disabled', false);
  } else {
    var token = response.id;
    $form.append($('<input type="hidden" name="stripeToken"/>').val(token));
    
    //var spinner = new Spinner(opts).spin();
    //$('#loading').appendChild(spinner.el);
    
    $form.get(0).submit();
  }
}

$('#payment-form').submit(function(event) {
  var $form = $(this);

  $form.find('button').prop('disabled', true);
  Stripe.card.createToken($form, stripeResponseHandler);

  return false;
});