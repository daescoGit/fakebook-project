const express = require("express")
const app = express()
const path = require("path")
const formidable = require("formidable")
var jwt = require('jsonwebtoken')
// For insertions
const ObjectID = require('mongodb').ObjectID
// Use Mongo client files
const mongoClient = require("mongodb").MongoClient
// Point to the host URL
const mongoUrl = "mongodb://localhost:27017"
// Database vars setup
let db = ''
let usersCollection = ''
// Connect
// Using connection pool = not needed to open new con in all routes
mongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, response) => {
    if(err){console.log('Cannot connect to Mongo'); return}
    console.log('connected to mongo')
    db = response.db("fakebook")
    usersCollection = db.collection("users")
    globalVersion = 0
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
    res.sendFile(path.join(__dirname, "views", "signup.html"))
})

app.post("/signup", (req, res) => {
    try{
        const form = formidable({ multiples: true })

        form.parse(req, (err, fields, files) => {
            let username = fields.username
            let password = fields.password
            let email = fields.email
            // password should be encrypted
            usersCollection.insertOne({
                "name":username,
                "password":password,
                "email":email,
                "image": "",
                "friends":[],
                "friendRequests":[], 
                "groups":[], 
                "myMessages":[],
                "friendMessages":[],
                "myPosts":[],
                "friendPosts":[]
            }, (err, jMongoRes) => {
                // naming res 'jMongoRes' to avoid outer res conflict
                console.log(jMongoRes)
                res.redirect('/login?registered')
                return
                //res.send(`${username} ${password} Inserted id: ${jMongoRes.insertedId}`)
            })
        });

    }catch(err){
        console.log(err)
        res.status(500).send(err)
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
            //let username = fields.username
            let username = new RegExp(fields.username, 'i') // case insensitive
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
        console.log(err)
        res.status(500).send(err)
    }
})

// LOGOUT
// ##################################
app.get("/logout", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "logout.html"))
})
 
// ADMIN
// ##################################
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin.html"))
})

// USER AUTH MIDDLEWARE
// ##################################
const verifyToken = (req, res, next) => {
    try {
        if(req.method === 'POST') {
            //console.log(req.headers)
            console.log(req.get('X-Custom-Header'));
            jwt.verify(req.get('X-Custom-Header'), 'the jwt secret key', function(err, decoded) {
                if(err || decoded == undefined){ 
                    console.log('error in jwt:', err.message);
                    res.status(500).send()   
                    return              
                }
                //console.log(decoded)
                console.log('middleware passed, token validated')
                token = decoded
                next()
            }); 
        // TODO: replace get query string (problematic with sse)
        }else{
            jwt.verify(req.query.jwt, 'the jwt secret key', function(err, decoded) {
                if(err || decoded == undefined){ 
                    console.log('error in jwt:', err.message);
                    res.status(500).send()   
                    return              
                }
                console.log('middleware passed, token validated')
                token = decoded
                next()
            }); 
        }
    }catch (err){
        console.log(err)
        res.status(500).send(err)
    }
}

// USER PAGE
// ##################################
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
})

// VERIFY & GET PROFILE PAGE DATA REQUEST WITH JWT
// ##################################
app.get("/sse-data", verifyToken, (req, res) => {
    // increase global ver to force initial load
    globalVersion++
    //local client data version
    var localVersion = 0
    console.log(token)

    // SSE
    res.writeHead(200, {
        "Content-type": "text/event-stream",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
    });
    res.write('\n');

    // interval to override default interval
    // .write will not close connection (like .send)
    // SSE can only sent text (not obj)
    setInterval( () => {
        if(localVersion < globalVersion){
            // TODO: skip/limit posts, try catch, strange version related bug
            usersCollection.findOne({"name":token.name}, (err, jMongoRes) => {
                if(err || jMongoRes==undefined){ console.log("Database object response error"); return }
                //console.log(jMongoRes)
                res.status(200).write(`data: ${JSON.stringify(jMongoRes)}\n\n`)
                localVersion = globalVersion
            })
        }
    }, 100)
})

// UPDATE DATA (post or patch or put?)
// ##################################


// USER POSTS
// ##################################

app.post("/posts", verifyToken, (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let userId = token.id
            let message = fields.message
            let name = token.name
            let media = fields.media
            // own posts
            usersCollection.findOneAndUpdate(
                // id needs to be an object
                { _id: new ObjectID(userId) },
                // $ = mongo command
                { $push: { myPosts: { userId, message, name, media } } },
                (err, jMongoRes) => {
                    if(err){ res.json(err) }
                    //res.json(jMongoRes)
                    globalVersion++
                }
            )
    
            // other's posts
            usersCollection.updateMany(
                {"friends":{$elemMatch:{ _id: userId }}},
                { $push: { friendPosts: { userId, message, name, media } } },
                (err, jMongoRes) => {
                    if(err){ res.json(err) }
                    res.json(jMongoRes)
                    globalVersion++
                }          
            )
        });
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// TEST API USER POSTS
// ##################################

app.post("/api-posts", (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let userId = fields.friendId
            let message = fields.message
            let name = fields.name

            // other's posts
            usersCollection.updateMany(
                {"friends":{$elemMatch:{ _id: userId }}},
                { $push: { friendPosts: { userId, message, name } } },
                (err, jMongoRes) => {
                    if(err){ res.json(err) }
                    res.json(jMongoRes)
                    globalVersion++
                }          
            )
        });
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})
