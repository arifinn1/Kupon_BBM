function clearArray(arr) {
  for (var cell in arr){ arr[cell] = ""; }
}

module.exports = {
  database: {
    user: 'postgres',
    host: 'localhost',
    database: 'gelora',
    password: 'arifin',
    port: 5432
  },
  secretKey: 'arifin123',
  active: {
    dashboard   : '',
    instansi    : '',
    profile     : '',
    akun        : '',
    bbm         : '',
    harga       : '',
    kupon       : '',
    jual        : '',
    tukar_uang  : '',
    tukar_kupon : ''
  },
  color: [ 'red', 'yellow', 'aqua', 'blue', 'light-blue', 'green', 'navy', 'teal', 'olive', 'lime', 'orange', 'fuchsia', 'purple', 'maroon', 'black' ],
  clearArray: clearArray
};