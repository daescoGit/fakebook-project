const express = require("express")
const app = express()
const path = require("path")
const formidable = require("formidable")
var jwt = require('jsonwebtoken')
// use Mongo client files
const mongoClient = require("mongodb").MongoClient
// Point to the host URL
const mongoUrl = "mongodb://localhost:27017"
// Database vars setup
let db = ''
let usersCollection = ''
// Connect
mongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, response) => {
    if(err){console.log('Cannot connect to Mongo'); return}
    console.log('connected to mongo')
    db = response.db("company")
    usersCollection = db.collection("users")
})

// ANTI SERVER CRASH HERE (make snippet)
// ##################################

app.listen(80, err => {
    if(err){console.log('Server not listening'); return}
    console.log('Server listening')
})

// SIGNUP
// ##################################

app.get("/signup", (req, res) => {
    // this is a static page example
    res.sendFile(path.join(__dirname, "views", "signup.html"))
})

app.post("/signup", (req, res) => {
    try{
        const form = formidable({ multiples: true })

        form.parse(req, (err, fields, files) => {
            let username = fields.username
            let password = fields.password
            usersCollection.insertOne({"name":username, "password":password}, (err, jMongoRes) => {
                // naming res 'jMongoRes' to avoid outer res conflict
                console.log(jMongoRes)
                res.send(`${username} ${password} Inserted id: ${jMongoRes.insertedId}`)
            })
        });

        // usersCollection.find().toArray( (err, jMongoRes) => {
        //     // naming res 'jMongoRes' to avoid outer res conflict
        //     res.json(jMongoRes)
        // })
    }catch(err){
        console.log("error message"); return
    }
})

// LOGIN
// ##################################
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"))
})

app.post("/login", (req, res) => {
    try{
        const form = formidable({ multiples: true })

        form.parse(req, (err, fields, files) => {
            let username = fields.username
            let password = fields.password
            // password should be encrypted
            usersCollection.findOne({"name":username, "password":password}, (err, jMongoRes) => {
                if(err){ console.log("Database error"); return }
                if(jMongoRes==undefined){ res.send('incorrect'); return }
                var token = jwt.sign({
                    id: `${jMongoRes._id}`,
                    name: `${jMongoRes.name}`,
                }, 
                'the jwt secret key');
                //console.log(token)
                res.send(token)
            })
        });
     
    }catch(err){
        res.status(500).send(err)
    }
})
 
// ADMIN
// ##################################
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin.html"))
})

// USER PAGE
// ##################################
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
})

// USER AUTH MIDDLEWARE
// ##################################
const isAuthenticated = (req, res, next) => {
    let reqUser = req.query.jwt // will come from post request (req.query.jwt) // needs to be decoded or in header?
    console.log(reqUser)
    usersCollection.findOne({"name":reqUser}, (err, jMongoRes) => {
        if(err) { console.log("Database error"); return}
        if(jMongoRes==undefined){ res.send('incorrect'); return }
        //res.send(jMongoRes.name)
        console.log(jMongoRes.name)
        if(reqUser==jMongoRes.name){ return next() }
        return res.send("error")
    })
}

// VERIFY & GET PROFILE PAGE DATA REQUEST WITH JWT
// ##################################
app.get("/data", (req, res) => {
    // find "jwt" in request (querystring)
    let theJWT = req.query.jwt
  
    jwt.verify(theJWT, 'the jwt secret key', function(err, decoded) {
        if(err || decoded==undefined){
            console.log('error in jwt'); 
            res.status(500).json({"error":"error in jwt"}); 
            return
        }

        //console.log(decoded)
        let jData = {
            "contacts":[],
            "groups":[], 
            "friendRequests":[{},{}], 
            "unreadMessages":[
                {"id":1, "body": "abc"}
            ],
            "unreadPosts":[
                {"id":2, "title":"test"}
            ]
        }
        // SSE
        // .set = allow to set many headers (alt: .header)
        res.set("Access-Control-Allow-Origin", "*") 
        res.set("Content-type", "text/event-stream")

        setInterval( () => {
            res.status(200).write(`data: ${JSON.stringify(jData)}\n\n`)
        }, 1000)
    }); 
})

// GET ALL SINGLE USER DATA
// ##################################
app.get("/getAllDataForThisUser", (req, res) => {
    // TODO: Connect to the DB and get all unread messages
    // res.header("Access-Control-Allow-Origin", "*")
    // let jData = {"friendRequests":[{},{}], "unreadMessages":[
    //     {"id":1, "message":"a"},
    //     {"id":2, "message":"b"},
    //     {"id":3, "message":"c"},
    // ]}
    // res.status(200).json(jData)

    // WITH  SSE
    // .set = allow to set many headers (alt: .header)
    res.set("Access-Control-Allow-Origin", "*") 
    res.set("Content-type", "text/event-stream")

    let jData = 
    {
        "friendRequests":[{},{}], 
        "unreadMessages":[

        ],
        "unreadPosts":[
            {"id":2, "title":"test"}
        ]
    }

    // interval to override default interval
    // .write will not close connection (like .send)
    // SSE can only sent text (not obj)
    setInterval( () => {
        res.status(200).write(`data: ${JSON.stringify(jData)}\n\n`)
    }, 1000)
})
