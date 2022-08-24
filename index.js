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

// add cors to the app variable
app.use(router, cors(), express.json(),
    express.urlencoded({
        extended: true
    })
);

app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
    credentials: true
}));

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
// ___________________
// FUNCTIONS

// connect to database (TO MAKE SURE ITS CONNECTED).
db.connect((err) => {
    if (err) {
        console.log(`mySQL is not connected...<br>
        ${err}`)
    } else {
        console.log('mySQL connected...')
    }
});

// REGISTER & LOGIN

// register
app.post('/register', bodyParser.json(), async (req, res) => {
    try {
        const bd = req.body;

        // Encrypting a password
        // Default value of salt is 10. 
        bd.password = await hash(bd.password, 16);

        // mySQL query
        const strQry =
            `
        INSERT INTO users(fullName, email, gender, dateOfBirth, phoneNO, password, joinDate)
        VALUES(?, ?, ?, ?, ?, ?, NOW());
        `;

        db.query(strQry,
            [bd.fullName, bd.email, bd.gender, bd.dateOfBirth, bd.phoneNO, bd.password, bd.joinDate],
            (err, results) => {
                if (err) {
                    console.log(err);
                    res.send(`
                    ${err}
                    `)
                } else {
                    console.log(results);
                    res.send(`
                    ${results}
                    `)
                    // res.redirect('/logintest');
                }
            });
    } catch (e) {
        console.log(`FROM REGISTER: ${e.message}`);
    }
});

// Login
app.post('/login', bodyParser.json(),
    (req, res) => {
        try {
            // Get email and password
            const { email, password } = req.body;
            const strQry =
                `
        SELECT email, password
        FROM users 
        WHERE email = '${email}';
        `;
            db.query(strQry, async (err, results) => {
                if (err) throw err;
                // const key = jwt.sign(JSON.stringify(results[0]), process.env.secret);
                // res.json({
                //     status: 200,
                //     results: key,
                // });
                // localStorage.setItem('key', JSON.stringify(key));
                // key = localStorage.getItem('key');
                switch (true) {
                    case (await compare(password, results[0].password)):
                        res.send('logged in successfull')
                        break
                    default:
                        console.log("Loggin Failed.");
                    // res.send(`
                    // EMAIL/PASSWORD IS INCORRECT.
                    // `);
                }
            })
        } catch (e) {
            console.log(`From login: ${e.message}`);
        }
    });

// get all users
router.get('/users', (req, res) => {
    // mySQl query 
    const strQry = `SELECT * FROM users`;

    db.query(strQry, (err, results) => {
        if (err) {
            console.log(err);
            res.send(`
                <h1>${err}.</h1><br>
                <a href="/">Go Back.</a>
                `)
        } else {
            res.json({
                status: 200,
                results: results,
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
        if (err) throw err;
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
        if (err) throw err;
        res.send(`USERS WAS DELETED`);
    });
});

// Update user
router.put("/users/:id", bodyParser.json(), async (req, res) => {
    const { fullName, email, gender, dateOfBirth, phoneNO, password } = req.body;
    let sql = `UPDATE users SET ? WHERE id = ${req.params.id} `;
    const user = {
        fullName, email, gender, dateOfBirth, phoneNO, password
    };
    db.query(sql, user, (err) => {
        if (err) {
            console.log(err);
            res.send(`
        <h1>${err}.</h1><br>
        <a href="/register">Go Back.</a>
        `)
        } else {
            res.json({
                msg: "Updated user Successfully",
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
                        console.log(err);
                        res.send(
                            `
               <h1>${err}.</h1><br>
                <a href="/products1">Go back...</a>
                `);
                    } else {
                        res.send(`
                    number of affected row/s: ${results.affectedRows} <br>
                    <a href="/products">Go Back...</a>
                    `);
                    }

                })
        } catch (e) {
            console.log(`Create a new product: ${e.message}`);
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
        if (err) throw err;
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
        if (err) throw err;
        res.send(`${data.affectedRows} PRODUCT/S WAS DELETED`);
    });
});

// Update product
router.put("/products/:id", bodyParser.json(), async (req, res) => {
    const { Prod_name, category, price, description, img1, img2 } = req.body;
    // mySQL query
    let sql = `UPDATE products SET ? WHERE Prod_id = ${req.params.id} `;

    const product = {
        Prod_name, category, price, description, img1, img2
    };

    db.query(sql, product, (err) => {
        if (err) throw err;
        res.json({
            msg: "Updated Item Successfully",
        });
    });
});



// CART
//*ADD CART ITEMS FROM SPECIFIC USER*//
// app.post('/users/:id/cart', bodyParser.json(), (req, res) => {
//     db.getConnection((err, connected) => {
//         if (err) throw err; const check = `SELECT cart FROM users WHERE id = ?`;
//         connected.query(check, req.params.id, (err, results) => {
//             if (err) throw err;
//             if (results.length > 0) {
//                 let newCart;
//                 if (results[0].cart == null) { newCart = [] }
//                 else { newCart = JSON.parse(results[0].cart); }
//                 let product =
//                 {
//                     "Prod_id": newCart.length + 1,
//                     "Prod_name": req.body.Prod_name,
//                     "category": req.body.category,
//                     "price": req.body.price,
//                     "description": req.body.description,
//                     "img1": req.body.img1,
//                     "img2": req.body.img2,
//                     "dateAdded": req.body.dateAdded

//                 }
//                 newCart.push(product); const query = `UPDATE users SET cart = ? WHERE id=?`;
//                 connected.query(query, [JSON.stringify(newCart), req.params.id], (err, results) => {
//                     if (err) throw err;
//                     res.json({ status: 200, results: "Successfully added item to cart" })
//                 })
//             } else { res.json({ status: 400, result: `There is no user with that id` }) }
//         })
//         connected.release();
//     })
// })

//*GET CART ITEMS FROM SPECIFIC USER*
router.get("/users/:id/cart", (req, res) => {
    // Query
    const strQry = `
    SELECT *
    FROM users
    WHERE id = ?;
    `;
    db.query(strQry, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json({
            status: 200,
            results: results[0].cart,
        });
    });
});

//*DELETE CART ITEMS FROM SPECIFIC USER*
router.delete("/users/:id/cart", (req, res) => {
    // Query
    const strQry = `
    UPDATE users
    SET cart=null
    WHERE id=?
    `;
    db.query(strQry, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json({
            status: 200,
            results: results,
        });
    });
});