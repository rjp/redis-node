var vows = require("vows"),
    usingClient = require("./utils").usingClient,
    assert = require("assert"),
    redis = require("../lib/redis");
var sys = require("sys");

vows.describe("Redis Transactions").addBatch({
    'with proper syntax': usingClient({
        topic: function (client) {
            var simultClient = redis.createClient();
            simultClient.select(6);
            var self = this;
            client.transaction( function () {
                client.rpush("txn1", 1);
                client.rpush("txn1", 2);
                client.rpush("txn1", 3, self.callback);
            });
        },
        'should result in changes': function (err, count) {
            assert.equal(count, 3);
        }
    }),
    'nested': usingClient({
        topic: function (client) {
            var self = this;
            client.transaction( function () {
                client.rpush("nested-txn", "a");
                client.transaction( function () {
                    client.rpush("nested-txn", "b");
                });
                client.rpush("nested-txn", "c");
                client.rpush("nested-txn", "d", self.callback);
            });
        },
        'should result in changes': function (err, count) {
            assert.equal(count, 4);
        }
    }),
    'with improper syntax': usingClient({
        topic: function (client) {
            client.transaction( function () {
                client.rpush("txn-invalid", 1);
                client.rpush("txn-invalid", 2);
                client.rpush("txn-invalid");
        //        simultClient.rpush("txn", 4, function (err, count) {
        //            if (err) throw new Error(err);
        //            checkEqual(count, 4, "Commands from other clients should fire after a transaction from a competing client");
        //        });
            });
            client.exists("txn-invalid", this.callback);
        },
        // Atomicity
        'should roll back the transaction': function (err, result) {
            assert.equal(result, 0);
        }
        // TODO Should throw an error to notify user of failed transaction
    })
}).export(module, {});