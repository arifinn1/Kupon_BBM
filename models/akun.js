var DB = require('../db/config2').DB,
  knex = DB.knex;

var Akun = DB.Model.extend({
  tableName: 'akun',
  idAttribute: 'kd',
});

// ------------------------------
// createNewAkun
// ------------------------------
// Makes a new akun in the database with 
// automatic incremented Kd. Then, returns
// that akun's Kd after the akun is created.
function createNewAkun(callback) {
  new Akun().save().then(function (akun) {
    callback(akun.toJSON().kd);
  });
}

function kodeGen(callback) {
  knex('akun').max('kd as maxkd')
    .from('akun').then(function (row) {
      row = row[0];
      callback(null, row.maxkd + 1);
    });
}

function grabAkunCredentials(kdAkun, callback) {
  // Skeleton JSON
  var loginAkun = {
    local: {
      kd: null,
      nip: null,
      nama: null,
      akses: null
    }
  };

  // SQL joins to get all credentials/tokens of a single akun
  // to fill in loginAkun JSON.
  // knex.select('nip', 'nama', 'password')
  knex.select('kd', 'nip', 'nama', 'akses')
    .from('akun')
    .where('kd', '=', kdAkun).then(function (row) {
      row = row[0];

      if (!row) {
        callback('Could not find akun with that Kd', null);
      } else {
        // Fill in loginAkun JSON
        loginAkun.local.kd = row.kd;
        loginAkun.local.nip = row.nip;
        loginAkun.local.nama = row.nama;
        loginAkun.local.akses = row.akses;
        //loginAkun.local.password    = row.password;

        callback(null, loginAkun);
      }
    });
};

module.exports = {
  createNewAkun: createNewAkun,
  grabAkunCredentials: grabAkunCredentials,
  Akun: Akun,
  kodeGen: kodeGen
};