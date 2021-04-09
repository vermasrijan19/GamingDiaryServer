const express = require('express')
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const app = express()
const saltRounds = 10;
const database = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "Diary"
})
const cookieParser = require("cookie-parser");
const session = require("express-session");
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
    session({
        key: "userId",
        secret: "anything",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60*60 * 60 * 24,
        },
    })
);
app.post("/api/user", (req, res) => {
    const id = req.body.id;
    console.log(id)
    // res.send("ok");
    database.query(
        "Select Datatype,Data from diary.platform_accounts where userID=?;",
        id,
        (err, result) => {
            if (err) {
                res.send({err: err});
            }
            res.send(result)
            console.log(result)
        }
    )
})
app.post("/api/get", (req, res) => {
    if(req.body.cat_id)
    {
        database.query(
            "Select *from diary.forum_posts inner join accounts on user_id=id where cat_id=? order by post_no desc;",
            req.body.cat_id,
            (err, result) => {
                if (err) {
                    res.send({err: err});
                }
                res.send(result)
                console.log(result)
            }
        )
        console.log(req.body.cat_id)
    }
    else
    {
        const query = "Select *from diary.forum_posts inner join accounts on user_id=id order by post_no desc;"
        database.query(query, (err, result) => {
            res.send(result);
        })
        // res.send("hello world")
    }
});
app.post("/api/reg", (req, res) => {
    // console.log("here")
    const username = req.body.username;
    const password = req.body.password.trim();

    bcrypt.hash(password, saltRounds, (err, hash) => {
        console.log(hash)
        if (err) {
            console.log(err);
        }

        database.query(
            "INSERT INTO accounts (username, password) VALUES (?,?)",
            [username, hash],
            (err, result) => {
                console.log(err);
            }
        );
    })
});
app.post("/api/log", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    database.query(
        "SELECT * FROM accounts WHERE username = ?;",
        username,
        (err, result) => {
            if (err) {
                res.send({err: err});
            }
            console.log(result[0].username)
            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if (response) {
                        req.session.user = result;
                        console.log(req.session.user);
                        res.send(result);
                    } else {
                        res.send({message: "Wrong username/password combination!"});
                    }
                });
            } else {
                res.send({message: "User doesn't exist"});
            }
        }
    );
});

app.get("/login", (req, res) => {
    if (req.session.user) {
        res.send({loggedIn: true, user: req.session.user});
    } else {
        res.send({loggedIn: false});
    }
});
app.post("/api/createp", (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const id = req.session.user[0].id;
    const cat_id=req.body.cat_id;
    console.log(id);
    // console.log(req.body);
    database.query(
        "INSERT INTO forum_posts (post_title, post_desc,user_id,cat_id) VALUES (?,?,?,?)",[title,description,id,cat_id],
        (err, result) => {
            if (err) {
                res.send({err: err});
            }
        }

    )
});
app.post("/replies", (req, res) => {
    if (req.body.post_id) {
        const post_no = req.body.post_id.id;

        console.log(post_no);
        database.query(
            "SELECT * FROM forum_posts INNER JOIN replies r on forum_posts.post_no = r.post_no INNER JOIN accounts a on r.user_id = a.id where r.post_no=?;", post_no,
            (err, result) => {
                if (err) {
                    res.send({err: err});
                } else {
                    res.send(result);
                }
            }
        )
    }
});
app.get("/api/get/posts", (req, res) => {
    database.query(
        "SELECT *FROM forum_posts WHERE user_id=//?) order by  post_no desc ;",req.session.user[0].id,
        (err, result) => {
            if (err) {
                res.send({err: err});
            }
            else{
                res.send(result);
            }
        }
    )
});

app.post("/api/spc", (req, res) => {
    console.log(req.body)

    if (req.body.post_id) {
        console.log("This is the user post ")
        database.query(
            "Select *from diary.forum_posts where post_no=? order by post_no desc",
            [req.body.post_id.id],
            (err, result) => {
                if (err) {
                    // console.log("this peice of shit is here")
                    console.log(err)
                    res.send({err: err});
                }
                res.send(result)

                console.log(result)

            }
        )

    }
});
app.post("/submit_reply", (req, res) => {

    const description = req.body.description;
    console.log(description)
    const post_no = req.body.post_no;

    // console.log(id);
    // console.log(req.body);
    database.query(
        "INSERT INTO replies (post_no, reply,user_id) VALUES (?,?,?)",[post_no,description,req.session.user[0].id],
        (err, result) => {
            if (err) {
                res.send({err: err});
            }
        }

    )
    res.send("ok")
});
app.listen(3001, () => {
        console.log("running on port 3001")
    }
)
