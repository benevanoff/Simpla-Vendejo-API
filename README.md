## Simpla Vendejo API
This app runs a view-only Monero wallet to verify payments and keeps track of them in a MySQL database.

### /create_invoice
* Method: POST
* Parameter: order_id (optional)
A new row will be added to the MySQL table with a column for the order_id (a random one will be generated if not provided as POST data), a unique Monero subaddress, as well as null columns for "seen" and "10conf" indicating that no payment has been found on the blockchain.

### /payment_status
* Method: GET
* Parameter: order_id
Returns a JSON object with two values: `seen` and `10conf`. If not null they should contain the amount of XMR found paid to the address associated with that order id.

## Setup

### The Database
This application will manage a single table in a MySQL database. The table will have a primary key column `order_id`, a column `address` with a unique subaddress associated with the order, a column `seen` storing the decimal value of XMR seen in the transaction pool associated with that order, as well as a column `10conf` storing the decimal value of money found at least 10 blocks deep in the blockchain that is associated with the row's order.

After logging into your MySQL database, such a table can be created with the following query: `CREATE TABLE payments (order_id INT PRIMARY KEY, address VARCHAR(95), seen DOUBLE, 10conf DOUBLE);`

### Creating a Monero wallet
This application will take a password protected Monero wallet .keys file containing a view-keypair to watch the blockchain for transactions paid to you.
Monero wallet software can be found at https://www.getmonero.org/downloads/ and a guide to creating a new wallet can be found [here](https://github.com/monero-ecosystem/monero-GUI-guide/blob/master/monero-GUI-guide.md#create-a-wallet) and a guide to creating a view-only wallet can be found [here](https://www.getmonero.org/resources/user-guides/view_only.html). For security's sake, only a view-only wallet should be stored on the server machine.

### The .env config
A `.env` file is used to quickly configure environment variables. An example has been provided in the root directory of this repo but you should edit it with the appropriate values for your server.
* `WALLET_FILE` The path to your view-only wallet cache file. The .keys file should be in the same directory as the cache file.
* `WALLET_PWD` The password for your view-only wallet.
* `MONERO_DAEMON_URI` The uri to the monero node to use to verify payments on the blockchain. A third party node can be used but for commercial use it is highly recommended that you validate payments with your own instance of `monerod`.
* `DB_HOST` The IP address of your MySQL database.
* `DB_USER` The username to use to access the MySQL database.
* `DB_NAME` The name of the database to use.

### Running the node.js app
This app utilizes [Node.js](https://nodejs.org/en/). After Node.js and NPM have been installed you can install this app's node module dependencies with `npm install`.
The app can be run by executing `node app.js`
