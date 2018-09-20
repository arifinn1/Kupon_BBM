function clearArray(arr) {
  for (var cell in arr){ arr[cell] = ""; }
}

module.exports = {
  database2: {
    user    : 'postgres',
    host    : 'localhost',
    database: 'gelora',
    password: 'arifin',
    port    : 5432
  },
  database: {
    user    : 'postgres',
    host    : 'geloragroup.com',
    database: 'k_bbm',
    password: 'G3lora!',
    port    : 5432
  },
  secretKey: 'arifin123',
  active: {
    dashboard   : '',
    instansi    : '',
    spbu        : '',
    profile     : '',
    akun        : '',
    bbm         : '',
    harga       : '',
    kupon       : '',
    jual        : '',
    tukar_uang  : '',
    tukar_kupon : '',
    seting      : ''
  },
  color: [ 'red', 'yellow', 'aqua', 'blue', 'light-blue', 'green', 'navy', 'teal', 'olive', 'lime', 'orange', 'fuchsia', 'purple', 'maroon', 'black' ],
  v_kupon: [ 2, 5, 10, 20 ],
  clearArray: clearArray
};