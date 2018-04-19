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
  },

  format_money: function (value) {
    let ret = value.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
    return isNaN(ret) ? 0 : ret;
  },

  ucwords: function (value) {
    return value.toLowerCase().replace(/\b[a-z]/g, function(letter) {
      return letter.toUpperCase();
    });
  },

  conv_date: function (value) {
    let options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return value.toLocaleDateString('id-ID', options);
  },

  terbilang: function (bilangan) {
 
    bilangan    = String(bilangan);
    var angka   = new Array('0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0');
    var kata    = new Array('','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan');
    var tingkat = new Array('','Ribu','Juta','Milyar','Triliun');
    
    var panjang_bilangan = bilangan.length;
    
    /* pengujian panjang bilangan */
    if (panjang_bilangan > 15) {
      kaLimat = "Diluar Batas";
      return kaLimat;
    }
    
    /* mengambil angka-angka yang ada dalam bilangan, dimasukkan ke dalam array */
    for (i = 1; i <= panjang_bilangan; i++) {
      angka[i] = bilangan.substr(-(i),1);
    }
    
    i = 1;
    j = 0;
    kaLimat = "";    
    
    /* mulai proses iterasi terhadap array angka */
    while (i <= panjang_bilangan) {
      subkaLimat = "";
      kata1 = "";
      kata2 = "";
      kata3 = "";
    
      /* untuk Ratusan */
      if (angka[i+2] != "0") {
        if (angka[i+2] == "1") {
          kata1 = "Seratus";
        } else {
          kata1 = kata[angka[i+2]] + " Ratus";
        }
      }
    
      /* untuk Puluhan atau Belasan */
      if (angka[i+1] != "0") {
        if (angka[i+1] == "1") {
          if (angka[i] == "0") {
            kata2 = "Sepuluh";
          } else if (angka[i] == "1") {
            kata2 = "Sebelas";
          } else {
            kata2 = kata[angka[i]] + " Belas";
          }
        } else {
          kata2 = kata[angka[i+1]] + " Puluh";
        }
      }
    
      /* untuk Satuan */
      if (angka[i] != "0") {
        if (angka[i+1] != "1") {
          kata3 = kata[angka[i]];
        }
      }
    
      /* pengujian angka apakah tidak nol semua, lalu ditambahkan tingkat */
      if ((angka[i] != "0") || (angka[i+1] != "0") || (angka[i+2] != "0")) {
        subkaLimat = kata1+" "+kata2+" "+kata3+" "+tingkat[j]+" ";
      }
    
      /* gabungkan variabe sub kaLimat (untuk Satu blok 3 angka) ke variabel kaLimat */
      kaLimat = subkaLimat + kaLimat;
      i = i + 3;
      j = j + 1;
    }
    
    /* mengganti Satu Ribu jadi Seribu jika diperlukan */
    if ((angka[5] == "0") && (angka[6] == "0")) {
      kaLimat = kaLimat.replace("Satu Ribu","Seribu");
    }
    
    return kaLimat + "Rupiah";
  }
}