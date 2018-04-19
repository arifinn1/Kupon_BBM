var knex = require('knex')({
    client: 'postgres',
    // Uncomment to enable SQL query logging in console.
    // debug   : true,
    connection: {
        host    : 'geloragroup.com',
        user    : 'postgres',
        password: 'G3lora!',
        database: 'k_bbm',
        charset : 'utf8',
    },
    connection2: {
        host    : '127.0.0.1',
        user    : 'postgres',
        password: 'arifin',
        database: 'gelora',
        charset : 'utf8',
    }
});

var DB = require('bookshelf')(knex);

module.exports.DB = DB;