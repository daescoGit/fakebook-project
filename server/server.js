const express = require("express")
const app = express()
const path = require("path")
const formidable = require("formidable")
const detect = require("detect-file-type")
// Needs to be de-structured for some reason // npm uuid
const {v1: uuidv1} = require("uuid")
// Serving public dir
var publicDir = require('path').join(__dirname,'../public');
app.use(express.static(publicDir));
// For moving temp files (media)
const fs = require("fs")
// JWT
var jwt = require('jsonwebtoken')

const { on } = require("process")

// For ID obj creation
const ObjectID = require('mongodb').ObjectID
// Use Mongo client files
const mongoClient = require("mongodb").MongoClient
// Point to the host URL
const mongoUrl = "mongodb://localhost:27017"
// Database vars setup
let db = ''
let usersCollection = ''
globalVersion = 0
// Connect
// Using connection pool = not needed to open new con in all routes
mongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, response) => {
    if(err){console.log('Cannot connect to Mongo'); return}
    console.log('connected to mongo')
    db = response.db("fakebook")
    usersCollection = db.collection("users")
})

// ANTI SERVER CRASH
// ##################################
process.on("uncaughtException", (err, data) => {
    if(err){ console.log("critical error, yet system keeps running"); return }
})

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
                "unreadMessages":[],
                "posts":[],
                "unreadPosts":[]
            }, (err, jMongoRes) => {
                // naming res 'jMongoRes' to avoid outer res conflict
                if(err){ console.log("Database object response error", err); res.status(500); return }
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
                    image: `${jMongoRes.image}`,
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

// GET PROFILE PAGE DATA (SSE)
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
            // TODO: strange version related bug
            try{
                usersCollection.findOne({ _id: new ObjectID(token.id) }, (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    //console.log(jMongoRes.myPosts)
                    res.status(200).write(`data: ${JSON.stringify(jMongoRes)}\n\n`)
                    localVersion = globalVersion
                })
            }catch(err){
                console.log(err)
                res.status(500).send(err)
            }
        }
    }, 100)
})

// UPDATE POSTS IN DB (ORGANIZE)
// ##################################
app.post("/update-notifications", verifyToken, (req, res) => {
    try{
        let updated = req.get('X-Custom-Header-Data')
        let jUpdated = JSON.parse(updated)
        let userId = new ObjectID(token.id)
        usersCollection.findOneAndUpdate(
            // id needs to be an object
            { _id: userId },
            // $ = mongo command
            { $set: { posts: jUpdated, unreadPosts: [] } },
            (err, jMongoRes) => {
                if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                res.json(jMongoRes)
                globalVersion++
                return
            }
        )
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// UPDATE MESSAGES IN DB (ORGANIZE)
// ##################################
app.post("/update-msg-notifications", verifyToken, (req, res) => {
    try{
        let userId = new ObjectID(token.id)
        usersCollection.findOneAndUpdate(
            { _id: userId },
            { $set: { unreadMessages: [] } },
            (err, jMongoRes) => {
                if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                res.json(jMongoRes)
                globalVersion++
                return
            }
        )
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// POST LIKES
// ##################################
app.post("/like-post", verifyToken, (req, res) => {
    try{
        let postData = req.get('X-Custom-Header-Data')
        let jPostData = JSON.parse(postData)
        let postID = jPostData[1].postID
        let userID = token.id
        let status = jPostData[0].status

        // HOLY ¤%"="!¤ this was hard to figure out
        // dry later
        if(status){
            // insert user like obj (if status == true) into posts
            usersCollection.updateMany(
                { posts: { $elemMatch: { _id: postID } } },
                //{ $inc: { "posts.$[elem].likes": status ? 1 : -1 } }, // abusable
                { $addToSet: { "posts.$[post].likes": { userId: userID } } },
                { arrayFilters: [ { "post._id": postID } ] },  //, { "user._id": userID } ], multi: true        
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    // also into every unread instance
                    usersCollection.updateMany(
                        { unreadPosts: { $elemMatch: { _id: postID } } },
                        { $addToSet: { "unreadPosts.$[post].likes": { userId: userID } } },
                        { arrayFilters: [ { "post._id": postID } ] },     
                        (err, jMongoRes2) => {
                            if(err || jMongoRes2==undefined){ console.log("Database object response error", err); res.status(500); return }
                            //console.log(jMongoRes)
                            res.status(200).send("Post updated")
                            globalVersion++
                            return
                        }          
                    )
                }          
            )
        }else{
            // remove like obj (if status == false)
            usersCollection.updateMany(
                { posts: { $elemMatch: { _id: postID } } },  
                { $pull: { "posts.$[post].likes": { userId: userID } } },
                { arrayFilters: [ { "post._id": postID } ] },   
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    usersCollection.updateMany(
                        { unreadPosts: { $elemMatch: { _id: postID } } },
                        { $pull: { "unreadPosts.$[post].likes": { userId: userID } } },
                        { arrayFilters: [ { "post._id": postID } ] },     
                        (err, jMongoRes2) => {
                            if(err || jMongoRes2==undefined){ console.log("Database object response error", err); res.status(500); return }
                            //console.log(jMongoRes)
                            res.status(200).send("Post updated")
                            globalVersion++
                            return
                        }          
                    )
                }          
            ) 
        }
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// USER POSTS
// ##################################
app.post("/posts", verifyToken, (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {

            function makePost(mediaName){
                try{
                    let newPostID = new ObjectID().toString()
                    let userID = token.id
                    // own posts
                    usersCollection.findOneAndUpdate(
                        // id needs to be an object
                        { _id: new ObjectID(token.id) },
                        // $ = mongo command
                        { $push: { posts: { _id: newPostID, userId: userID, message: fields.message, name: token.name, mediaName, comments:[], likes:[] } } },
                        (err, jMongoRes) => {
                            if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                            // other's posts
                            usersCollection.updateMany(
                                { friends: { $elemMatch: { _id: token.id } } },
                                { $push: { unreadPosts: { _id: newPostID, userId: token.id, message: fields.message, name: token.name, mediaName, comments:[], likes:[] } } },
                                (err, jMongoRes2) => {
                                    if(err || jMongoRes2==undefined){ console.log("Database object response error", err); res.status(500); return }
                                    res.status(200).send("Post created")
                                    globalVersion++
                                    return
                                }          
                            )
                        }
                    )             
                }catch(err){
                    // mb. email admin
                    console.log(err)
                    return res.status(500).send("System under maintenance")
                }
            }

            // No media upload
            console.log(files.media.size)
            if(files.media.size == 0){
                makePost('')
            }else{
                // With media upload
                try{
                    detect.fromFile(files.media.path, (err, result) => {
                        if(err){ console.log(err); res.send("Error in file"); return}
                        const mediaName = uuidv1()+"."+result.ext
                        const allowedImageTypes = ["jpg","jpeg","png","gif"]
                        if( ! allowedImageTypes.includes(result.ext)) {
                            return res.send("File type not allowed")
                        }
                        const oldPath = files.media.path
                        const newPath = path.join(__dirname, "../public/media", mediaName)
                        // moving pic from temp path to public folder (callback)
                        fs.rename(oldPath, newPath, err => {
                            if(err){ console.log(err); res.send("Could not move file"); return}
                            makePost(mediaName)
                        })
                    })
                }catch(err){
                    console.log(err)
                    return res.send("Could not upload image")
                }
            }
        });
    }catch(err){
        console.log("Error retrieving form:", err)
        res.status(500).send(err)
    }
})

// GET ALL USERS
// ##################################
app.post("/get-users", (req, res) => {
    try{
        usersCollection.find({}, { projection: { name: 1, image: 1 }}).toArray((err, jMongoRes) => { //{ name: 1, image: 1 },
            if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
            console.log(JSON.stringify(jMongoRes))
            res.status(200).send(jMongoRes)
        })

        // db.collection("users").find().toArray( (err, res) => {
        //     if(err){console.log("error reading user"); return}
        //     console.log(res)
        // })
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }  
})

// ADD FRIEND
// ##################################
app.post("/add-friend", verifyToken, (req, res) => {
    try{
        let postData = req.get('X-Custom-Header-Data')
        console.log(postData)
        let jPostData = JSON.parse(postData)
        let jReqType = jPostData[1]
        let jFriend = jPostData[0]
        let friendId = new ObjectID(jFriend._id)
        let userId = new ObjectID(token.id)
        // Friendship request
        if(jReqType == 0){
            usersCollection.findOneAndUpdate(
                { _id: friendId },
                { $addToSet: { friendRequests: { _id: token.id, name: token.name, image: token.image } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send('ok')
                    globalVersion++
                    return
                }
            )
        // Accepting friendship request
        }else if(jReqType == 1){
             // Insert into my friends and remove from requests
            usersCollection.findOneAndUpdate(
                { _id: userId },
                { $addToSet: { friends: jFriend }, $pull: { friendRequests: { _id: jFriend._id } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    //Insert into friend's friends
                    usersCollection.findOneAndUpdate(
                        { _id: friendId },
                        { $addToSet: { friends: { _id: token.id, name: token.name, image: token.image } } },
                        (err, jMongoRes2) => {
                            if(err || jMongoRes2==undefined){ console.log("Database object response error", err); res.status(500); return }
                            res.status(200).send('ok')
                            globalVersion++
                            return
                        }
                    )
                }
            )
        // Rejecting friendship request
        }else if(jReqType == 2){
            usersCollection.findOneAndUpdate(
                { _id: userId },
                {  $pull: { friendRequests: { _id: jFriend._id } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send('ok')
                    globalVersion++
                    return
                }
            )
        }
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// SEND CHAT MESSAGE
// ##################################
app.post("/chat-message", verifyToken, (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let senderId = fields.senderId
            let receiverId = fields.receiverId
            let message = fields.message
            let name = fields.name

            usersCollection.findOneAndUpdate(
                { _id: new ObjectID(senderId)},
                { $push: { myMessages: { senderId, receiverId, name, message } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    usersCollection.findOneAndUpdate(
                        { _id: new ObjectID(receiverId)},
                        { $push: { myMessages: { senderId, receiverId, name, message }, unreadMessages: { senderId, receiverId, name, message } } },
                        (err, jMongoRes) => {
                            if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                            res.send('ok')
                            globalVersion++
                            return
                        }          
                    )
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
app.post("/api-post", (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let userId = fields.friendId
            let message = fields.message
            let name = fields.name

            // other's posts
            usersCollection.updateMany(
                {"friends":{$elemMatch:{ _id: userId }}},
                { $push: { unreadPosts: { userId, message, name } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    res.json(jMongoRes)
                    globalVersion++
                    return
                }          
            )
        });
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

// TEST API CHAT MESSAGE
// ##################################
app.post("/api-message", (req, res) => {
    try{
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let senderId = fields.senderId
            let receiverId = fields.receiverId
            let message = fields.message
            let name = fields.name

            usersCollection.findOneAndUpdate(
                { _id: new ObjectID(senderId)},
                { $push: { myMessages: { senderId, receiverId, name, message } } },
                (err, jMongoRes) => {
                    if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                    usersCollection.findOneAndUpdate(
                        { _id: new ObjectID(receiverId)},
                        { $push: { myMessages: { senderId, receiverId, name, message } } },
                        (err, jMongoRes) => {
                            if(err || jMongoRes==undefined){ console.log("Database object response error", err); res.status(500); return }
                            res.send('ok')
                            globalVersion++
                            return
                        }          
                    )
                }          
            )
        });
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})
