// import
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./config/dbconn');
const { compare, hash } = require('bcrypt');
const { stringify } = require('querystring');
const jwt = require('jsonwebtoken');
const cp = require('cookie-parser');

// _______________
// Configuration
const port = parseInt(process.env.PORT) || 4000;
// variable add express
const app = express();
// express router
const router = express.Router();

// activate server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// __________________
// allow access to fetch data from the api externally by  Seting header
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-*", "*");
    next();
});

app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
    credentials: true
}));

// add cors to the app variable
app.use(router, express.json(),
    express.urlencoded({
        extended: true
    })
);

// __________________
// NAV ROUTER

// home
router.get('/', (req, res) => {
    res.status(200).sendFile('./views/index.html', { root: __dirname });
});

// login
router.get('/logintest', (req, res) => {
    res.status(200).sendFile('./views/login.html', { root: __dirname });
});

// register
router.get('/registertest', (req, res) => {
    res.status(200).sendFile('./views/register.html', { root: __dirname });
});

// __________________
// FUNCTIONS

// REGISTER & LOGIN

// register
app.post('/register', bodyParser.json(), async (req, res) => {
    try {
        const bd = req.body;

        // Encrypting a password
        // Default value of salt is 10. 
        bd.password = await hash(bd.password, 16);

        // mySQL query
        const strQry = `
        INSERT INTO users(fullName, email, gender, dateOfBirth, phoneNO, password, joinDate)
        VALUES(?, ?, ?, ?, ?, ?, NOW());
        `;

        db.query(strQry,
            [bd.fullName, bd.email, bd.gender, bd.dateOfBirth, bd.phoneNO, bd.password, bd.joinDate],
            (err, results) => {
                if (err) {
                    res.json({
                        status: 400,
                        msg: "Register Failed."
                    })
                } else {
                    res.json({
                        status: 200,
                        msg: "Register Successfull "
                    })
                };
            });

    } catch (e) {
        res.json({
            status: 400,
            msg: "Please register, or try again"
        })
    }
});

// Login
app.post('/login', bodyParser.json(),
    (req, res) => {
            // Get email and password
            const { email, password } = req.body;
            const strQry = `
        SELECT *
        FROM users 
        WHERE email = '${email}';
        `;
            db.query(strQry, async (err, results) => {

                if (err) throw err;
                if (results.length === 0) {
                    res.json({
                        status: 400,
                        msg: "Email not found."
                    })
                } else {
                    if (await compare(password, results[0].password) == false) {
                        res.json({
                            status: 400,
                            msg: "Password is incorrect."
                        })
                    } else {
                        jwt.sign(JSON.stringify(results[0]), process.env.secret, (err, token) => {
                            if (err) throw err;
                            res.json({
                                status: 200,
                                user: results,
                                token: token
                            })
                        });
                    }
                }

            });
        });

            // get all users
            router.get('/users', (req, res) => {
                // mySQl query 
                const strQry = `SELECT * FROM users`;

                db.query(strQry, (err, results) => {
                    if (err) {
                        res.json({
                            status: 400,
                            results: err,
                            msg: "Getting users failed"
                        })
                    } else {
                        res.json({
                            status: 200,
                            results: results,
                            msg: "Getting users successfull"
                        })
                    }
                })
            });

            // get 1 user
            router.get('/users/:id', (req, res) => {
                // mySQL query
                const strQry =
                    `
SELECT * FROM users WHERE id = ?;    
    `;

                db.query(strQry, [req.params.id], (err, results) => {
                    if (err)
                        res.json({
                            status: 400,
                            results: `${err}`
                        });
                    res.json({
                        status: 200,
                        results: (results.length <= 0) ? 'Sorry no product was found.' : results
                    })
                })
            });

            // delete user
            app.delete('/users/:id', (req, res) => {
                // mySQL query
                const strQry =
                    `
    DELETE FROM users WHERE id = ?;
    ALTER TABLE users AUTO_INCREMENT = 1;
    `;

                db.query(strQry, [req.params.id], (err, results) => {
                    if (err)
                        res.json({
                            status: 400,
                            msg: `${err}`
                        })
                            ;
                    // else
                    res.json({
                        status: 200,
                        msg: `Deleted Successfully`
                    });
                });
            });

            // Update user
            router.put("/users/:id", bodyParser.json(), async (req, res) => {
                const { fullName, email, gender, dateOfBirth, phoneNO, userRole, password } = req.body;
                let sql = `UPDATE users SET ? WHERE id = ${req.params.id} `;
                const user = {
                    fullName, email, gender, dateOfBirth, phoneNO, userRole, password
                };
                db.query(sql, user, (err) => {
                    if (err) {
                        res.json({
                            status: 400,
                            msg: "Edit Failed.",
                        });
                    } else {
                        res.json({
                            status: 200,
                            msg: "Edit Successfull.",
                        });
                    }
                });
            });

            // ___________________________
            //   PRODUCTS

            // create product
            app.post('/products', bodyParser.json(),
                (req, res) => {
                    try {

                        const { Prod_name, category, price, description, img1, img2, dateAdded } = req.body;

                        //     // mySQL query
                        const strQry =
                            `
    INSERT INTO products (Prod_name, category, price, description, img1, img2, dateAdded) values (?, ?, ?, ?, ?, ? , NOW())
    `;
                        //
                        db.query(strQry,
                            [Prod_name, category, price, description, img1, img2, dateAdded],
                            (err, results) => {
                                if (err) {
                                    res.json({
                                        status: 400,
                                        msg: `Product create failed ${err}`,
                                    });
                                } else {
                                    res.json({
                                        status: 200,
                                        msg: "Product create Successfull",
                                    });
                                }

                            })
                    } catch (e) {
                        res.json({
                            status: 400,
                            msg: "Product create failed",
                        });
                    }
                });

            // get all products
            router.get('/products', (req, res) => {
                // mysql query
                const strQry = `
    SELECT * from products;
    `;

                // error controll
                db.query(strQry, (err, results) => {
                    if (err) throw err;
                    res.json({
                        status: 200,
                        results: results
                    })
                    console.log(err)
                })

            });

            // get 1 product
            router.get('/products/:id', (req, res) => {
                // mysql query
                const strQry = `
     SELECT * from products where Prod_id = ?;
     `;

                // error controll
                db.query(strQry, [req.params.id], (err, results) => {
                    if (err) res.json({
                        status: 400,
                        results: `${err}`
                    });
                    res.json({
                        status: 200,
                        results: (results.length <= 0) ? 'Sorry no product was found.' : results
                    })
                });

            });

            // Delete product
            app.delete("/products/:id", (req, res) => {
                // QUERY
                const strQry = `
    DELETE FROM products
    WHERE Prod_id = ?;
    ALTER TABLE products AUTO_INCREMENT = 1;
    `;
                db.query(strQry, [req.params.id], (err, data) => {
                    if (err)
                        res.json({
                            status: 400,
                            msg: `${err}`
                        })
                            ;
                    // else
                    res.json({
                        status: 200,
                        msg: `${data.affectedRows} PRODUCT/S WAS DELETED`
                    });
                });
            });

            // Update product
            router.put("/products/:id", bodyParser.json(), async (req, res) => {
                const { Prod_name, category, price, description, img1, img2 } = req.body;
                // mySQL query
                let sql = "UPDATE products SET ? WHERE Prod_id = ? ";

                const product = {
                    Prod_name, category, price, description, img1, img2
                };

                db.query(sql, [product, req.params.id], (err) => {
                    if (err) {
                        res.status(400).json({
                            msg: "Updated product failed",
                        });
                    } else {
                        res.status(200).json({
                            msg: "Updated product successfull",
                        });
                    }

                });
            });

            // CART

            // add to cart
            router.post('/users/:id/cart', bodyParser.json(), (req, res) => {

                // mySQL query
                let cart = `SELECT cart FROM users WHERE id = ${req.params.id};`;
                // function
                db.query(cart, (err, results) => {
                    if (err) throw err
                    if (results.length > 0) {
                        let cart;
                        if (results[0].cart == null) {
                            cart = []
                        } else {
                            cart = JSON.parse(results[0].cart)
                        }

                        let { Prod_id } = req.body;
                        // mySQL query
                        let product = `Select * FROM products WHERE Prod_id = ?`;
                        // function
                        db.query(product, Prod_id, (err, productData) => {
                            if (err) res.send(`${err}`)
                            let data = {
                                cart_id: cart.length + 1,
                                productData
                            }
                            cart.push(data)
                            console.log(cart);
                            let updateCart = `UPDATE users SET cart = ? WHERE id = ${req.params.id}`
                            db.query(updateCart, JSON.stringify(cart), (err, results) => {
                                if (err) res.json({
                                    status: 400,
                                    msg: `${err}`
                                })
                                res.json({
                                    status: 200,
                                    cart: results
                                })
                            })
                        })
                    }
                })
            });

            // get all cart data
            router.get("/users/:id/cart", (req, res) => {
                // Query
                const strQry = `
    SELECT *
    FROM users
    WHERE id = ?;
    `;
                db.query(strQry, [req.params.id], (err, results) => {
                    if (err)
                        res.json({
                            status: 400,
                            results: `${err}`,
                        });;
                    res.json({
                        status: 200,
                        results: JSON.parse(results[0].cart),
                    });
                });
            });

            // get single cart data
            router.get("/users/:id/cart/:cartId", (req, res) => {
                // Query
                const strQry = `
        SELECT *
        FROM users
        WHERE id = ?;
        `;
                db.query(strQry, [req.params.id], (err, results) => {
                    if (err) throw err;
                    let cartResults = JSON.parse(results[0].cart);
                    res.json({
                        status: 200,
                        results: cartResults.filter((item) => {
                            return item.cart_id == req.params.cartId
                        }),
                    });
                });
            });

            // delete all cart data
            router.delete("/users/:id/cart", (req, res) => {
                // Query
                const strQry = `
    UPDATE users
    SET cart=null
    WHERE id=?
    `;
                db.query(strQry, [req.params.id], (err, results) => {
                    if (err)
                        res.json({
                            status: 400,
                            msg: `${err}`
                        });
                    // else
                    res.json({
                        status: 200,
                        msg: "Cart cleared."
                    });
                });
            });

            // delete single cart data
            router.delete('/users/:id/cart/:cartId', (req, res) => {
                const delSingleCartId = `
        SELECT cart FROM users
        WHERE id = ${req.params.id}
    `
                db.query(delSingleCartId, (err, results) => {
                    if (err) throw err;
                    if (results.length > 0) {
                        if (results[0].cart != null) {
                            const result = JSON.parse(results[0].cart).filter((cart) => {
                                return cart.cart_id != req.params.cartId;
                            })
                            result.forEach((cart, i) => {
                                cart.cart_id = i + 1
                            });
                            const query = `
                    UPDATE users
                    SET cart = ?
                    WHERE id = ${req.params.id}
                `
                            db.query(query, [JSON.stringify(result)], (err, results) => {
                                if (err)
                                    res.json({
                                        status: 400,
                                        msg: `${err}`
                                    });
                                // else
                                res.json({
                                    status: 200,
                                    result: "Successfully deleted item from cart"
                                });
                            })
                        } else {
                            res.json({
                                status: 400,
                                result: "This user has an empty cart"
                            })
                        }
                    } else {
                        res.json({
                            status: 400,
                            result: "There is no user with that id"
                        });
                    }
                })
            })