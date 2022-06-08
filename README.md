## Simpla Vendejo API
This app runs a view-only Monero wallet to verify payments and keeps track of them in a MySQL database.

### /create_invoice
* Method: POST
* Parameter: order_id (optional)
A new row will be added to the MySQL table with a column for the order_id (a random one will be generated if not provided as POST data), a unique Monero subaddress, as well as null columns for "seen" and "10conf" indicating that no payment has been found on the blockchain.

### /payment_status
* Method: POST
* Parameter: order_id
Returns a JSON object with two values: `seen` and `10conf`. If not null they should contain the amount of XMR found paid to the address associated with that order id.
