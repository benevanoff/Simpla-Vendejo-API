require('dotenv').config()
const express = require('express');
var mysql = require('mysql');
const monerojs = require('monero-javascript');

const app = express();
const port = 5000;

const wallet_file = process.env.WALLET_FILE;
const wallet_pwd = process.env.WALLET_PWD;
const daemon_uri = process.env.MONERO_DAEMON_URI;

let wallet;

const run_wallet = async function(file, pwd, uri, db) {
  await monerojs.LibraryUtils.loadFullModule();

  wallet = await monerojs.MoneroWalletFull.openWallet(
      wallet_file,
      wallet_pwd,
      monerojs.MoneroNetworkType.MAINNET,
      daemon_uri // daemon uri
   );

  await wallet.sync(new class extends monerojs.MoneroWalletListener {
    onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      console.log("Wallet Sync progress " + percentDone*100 + "%");
    }
  });

  await wallet.startSyncing(30000);

  await wallet.addListener(new class extends monerojs.MoneroWalletListener {
    async onOutputReceived(output) {
      let txHash = output.getTx().getHash();
      console.log("Found " + txHash)

      let addresses_paid = [];
      db.query('SELECT * FROM payments WHERE seen IS NULL', async function (error, unpaid_invoices, fields) {
        if (error) {
          console.log(error);
          return;
        }
        let incoming_txs = await wallet.getIncomingTransfers();
        console.log(incoming_txs);
        incoming_txs.forEach(transfer => {
          let transfer_addr = transfer.getAddress();
          unpaid_invoices.forEach(db_payments_row => {
            if (transfer_addr == db_payments_row["address"]) addresses_paid.push(transfer_addr);
          });
        });
      });

      addresses_paid.forEach(address => {
        db.query('UPDATE payments SET seen=1 WHERE address="'+ address +'"', function (error, results, fields) {
          if (error) {
            console.log(error);
            return;
          }
        });
      });
    }
  });
}

let db = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWD,
    database : process.env.DB_NAME,
  });

run_wallet(wallet_file, wallet_pwd, daemon_uri, db);

app.use(express.urlencoded());
app.post('/create_invoice', (req, res) => {
    console.log(req.body);
    const order_id = req.body.order_id === undefined ? Math.floor(Math.random()*100000) : req.body.order_id;
    console.log(order_id);
    db.query('SELECT COUNT(ALL order_id) FROM payments', async function (error, results, fields) {
      if (error) throw error;
      //console.log(results);
      let order_idx = results[0]["COUNT(ALL order_id)"];
      console.log('order idx ' + order_idx);
      let order_addr = await wallet.getAddress(0, order_idx); // this endpoint will be essentially blocked until the wallet is sync'd
      //console.log('INSERT INTO payments (order_id, address) VALUES (' + order_id + ', "' + order_addr + '")');
      db.query('INSERT INTO payments (order_id, address) VALUES (' + order_id + ', "' + order_addr + '")', function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        console.log(fields);
      });
    });

    res.sendStatus(200);
  });

app.post('/payment_status', (req, res) => {
    if (req.body.order_id) {
      const order_id = req.body.order_id;
      let seen = false;
      let tenConf = false;
      db.query('SELECT * FROM payments WHERE order_id='+order_id, function (error, results, fields) {
        if (error) {
          console.log(error);
          res.send(500);
        }
        console.log(results);
        if (results[0]["seen"] != null) seen = results[0]["seen"];
        if (results[0]["10conf"] != null) tenConf = results[0]["10conf"];
        res.send('{ seen : '+seen+', 10conf :'+tenConf+'}');
      });
    } else res.sendStatus(500);
  });

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})