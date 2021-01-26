const express = require("express")
const app = express()
const path = require("path")
const formidable = require("formidable")
const detect = require("detect-file-type")
// Needs to be de-structured for some reason // npm uuid
const { v1: uuidv1 } = require("uuid")
// Serving public dir
var publicDir = require('path').join(__dirname, '../public');
app.use(express.static(publicDir));
// For moving temp files (media)
const fs = require("fs")
// JWT
var jwt = require('jsonwebtoken')

//const { on } = require("process")

// For ID obj creation
const ObjectID = require('mongodb').ObjectID
// Use Mongo client files
const mongoClient = require("mongodb").MongoClient
// Point to the host URL
const mongoUrl = process.env.MONGO_DB_URI || "mongodb+srv://dan:mongodbatlaspassword@cluster0.fktn2.mongodb.net/fakebook?retryWrites=true&w=majority";
// Database vars setup
let db = ''
let usersCollection = ''
let postsCollection = ''

let globalVersion = 0
let onlineUsers = []
// Connect
// Using connection pool = not needed to open new con in all routes
mongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, response) => {
    if (err) { console.log('Cannot connect to Mongo'); return }
    console.log('connected to mongo')
    db = response.db("fakebook")
    usersCollection = db.collection("users")
    postsCollection = db.collection("posts")
})


// ANTI SERVER CRASH
// ##################################
process.on("uncaughtException", (err, data) => {
    if (err) { console.log("critical error, yet system keeps running", err); return }
})

let port = process.env.PORT;
if (port == null || port == "") {
    port = 8000;
}

app.listen(port, err => {
    if (err) { console.log('Server port issue'); return }
    console.log('Server listening at port ' + port)
})

// SIGNUP
// ##################################

app.get("/signup/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signup.html"))
})

app.post("/signup/", (req, res) => {
    try {
        const form = formidable({ multiples: true })

        form.parse(req, (err, fields, files) => {
            let username = fields.username
            let password = fields.password
            let email = fields.email
            // password should be encrypted
            usersCollection.insertOne({
                "name": username,
                "password": password,
                "email": email,
                "image": "defaultProfile.jpg",
                "friends": [],
                "friendRequests": [],
                "groups": [],
                "myMessages": [],
                "unreadMessages": [],
                "posts": [],
                "unreadPosts": [],
                "unreadComments": []
            }, (err, jMongoRes) => {
                // naming res 'jMongoRes' to avoid outer res conflict
                if (err) { console.log("Database object response error", err); res.status(500); return }
                console.log(jMongoRes)
                res.redirect('/login?registered')
                return
                //res.send(`${username} ${password} Inserted id: ${jMongoRes.insertedId}`)
            })
        });

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// LOGIN
// ##################################
app.get("/login/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"))
})

app.post("/login/", (req, res) => {
    try {
        const form = formidable({ multiples: true })

        form.parse(req, (err, fields, files) => {
            //let username = fields.username
            let username = new RegExp(fields.username, 'i') // case insensitive
            let password = fields.password
            // password should be encrypted
            usersCollection.findOne({ "name": username, "password": password }, (err, jMongoRes) => {
                if (err) { console.log("Database error"); return }
                if (jMongoRes == undefined) { res.send('incorrect'); return }
                var token = jwt.sign({
                    id: `${jMongoRes._id}`,
                    name: `${jMongoRes.name}`
                }, 'the jwt secret key')
                res.json({ 'token': token, 'uid': jMongoRes._id })
            })
        });

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// LOGOUT
// ##################################
app.get("/logout/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "logout.html"))
})

// USER AUTH MIDDLEWARE
// ##################################
const verifyToken = (req, res, next) => {
    let method
    req.method == 'GET' ? method = req.params.jwt : method = req.get('X-Custom-Header')
    try {
        //console.log(req.headers)
        jwt.verify(method, 'the jwt secret key', function (err, decoded) {
            if (err || decoded == undefined) {
                console.log('error in jwt post:', err.message);
                res.status(500).send()
                return
            } else {
                //console.log(decoded)
                console.log('middleware passed, token validated', req.method)
                token = decoded
                next()
            }
        });
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

// USER PAGE 
// ##################################
app.get("/profile/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
})


// GET PROFILE PAGE DATA (SSE)
// ##################################
app.get("/sse-data/:jwt", verifyToken, (req, res) => {
    // toggle user online
    if (!onlineUsers.includes(token.id)) {
        onlineUsers.push(token.id)
        //console.log('pushed', token.name)
    }

    // increase global ver to force initial load
    globalVersion++
    //local client data version
    let localVersion = 0
    const uid = token.id

    res.writeHead(200, {
        "Content-type": "text/event-stream",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
        // defaulted to "chunked" causing errors with sse
        "Transfer-Encoding": "identity"
    });

    // interval to override default interval
    // .write will not close connection (like .send)
    // SSE can only sent text (not obj)
    const sseInterval = setInterval(() => {
        if (localVersion < globalVersion) {
            try {
                // user data
                usersCollection.findOne({ _id: new ObjectID(uid) }, (err, jMongoRes) => { //token.id
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    // mapping friend id's and appending own id to use with $in operator
                    let friends = jMongoRes.friends.map((i) => i._id)
                    let onlineFriends = onlineUsers.filter((i) => { return friends.includes(i) })
                    // posts (find user id belonging to this user or user's friends)
                    postsCollection.find({ userId: { $in: [uid, ...friends] } }).toArray((err, jMongoRes2) => {
                        if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                        // appending filtered posts + online friends to user data and send
                        let data = { ...jMongoRes, "posts": jMongoRes2, "onlineFriends": onlineFriends }
                        res.status(200).write("data:" + JSON.stringify(data) + "\n\n")
                        //console.log('data sent')
                        localVersion = globalVersion
                        return
                    })
                    // res.status(200).write(`data: ${JSON.stringify(jMongoRes)}\n\n`)
                    // localVersion = globalVersion
                })
            } catch (err) {
                console.log(err)
                res.status(500).send(err)
            }
        }
    }, 100) //100

    // client closes connection
    req.on('close', () => {
        onlineUsers = onlineUsers.filter((i) => { return i != uid })
        globalVersion++
        clearInterval(sseInterval)
        //res.end()
        console.log(`SSE to user: ${uid} ended`)
        //console.log('route closed', uid , onlineUsers)
    });
})

// UPDATE USER'S UNREAD POSTS
// ##################################
app.patch("/update-notifications/:uid", verifyToken, (req, res) => {
    let data = req.get('X-Custom-Header-Data')
    data = JSON.parse(data)
    postID = data[1]
    let userId = new ObjectID(token.id)
    // if type = post
    if (data[0] == 1) {
        try {
            usersCollection.updateOne(
                // id needs to be an object here
                { _id: userId },
                // $ = mongo command
                { $pull: { unreadPosts: { _id: new ObjectID(postID) } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.json(jMongoRes)
                    console.log('removed post')
                    globalVersion++
                    return
                }
            )
        } catch (err) {
            console.log(err)
            res.status(500).send(err)
        }
        // if type = comment
    } else if (data[0] == 2) {
        try {
            usersCollection.updateOne(
                { _id: userId },
                { $pull: { unreadComments: { _id: new ObjectID(postID) } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.json(jMongoRes)
                    console.log('removed comment')
                    globalVersion++
                    return
                }
            )
        } catch (err) {
            console.log(err)
            res.status(500).send(err)
        }
        // if type = clear all
    } else {
        try {
            usersCollection.updateOne(
                { _id: userId },
                { $set: { unreadComments: [], unreadPosts: [] } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.json(jMongoRes)
                    console.log('removed all')
                    globalVersion++
                    return
                }
            )
        } catch (err) {
            console.log(err)
            res.status(500).send(err)
        }
    }
})

// UPDATE USER'S UNREAD MESSAGES
// ##################################
app.patch("/update-msg-notifications/:uid", verifyToken, (req, res) => {
    try {
        let userId = new ObjectID(token.id)
        usersCollection.findOneAndUpdate(
            { _id: userId },
            { $set: { unreadMessages: [] } },
            (err, jMongoRes) => {
                if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                res.json(jMongoRes)
                globalVersion++
                return
            }
        )
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// POST LIKES
// ##################################
app.patch("/like-post/:pid", verifyToken, (req, res) => {
    try {
        const postData = req.get('X-Custom-Header-Data')
        const status = JSON.parse(postData)
        const postID = req.params.pid
        let userID = token.id

        if (status) {
            postsCollection.updateOne(
                { _id: new ObjectID(postID) },
                //{ $inc: { "posts.$[elem].likes": status ? 1 : -1 } }, // abusable
                // addToSet only "push" if not already in
                { $addToSet: { likes: { userId: userID } } },
                //{ arrayFilters: [ { "post._id": postID } ] },  //, { "user._id": userID } ], multi: true        
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send("Post updated")
                    globalVersion++
                    return
                }
            )
        } else {
            // remove like obj (if status == false)
            postsCollection.updateOne(
                { _id: new ObjectID(postID) },
                { $pull: { likes: { userId: userID } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send("Post updated")
                    globalVersion++
                    return
                }
            )
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// COMMENT LIKES
// ##################################
app.patch("/like-comment/:pid/:cid", verifyToken, (req, res) => {
    try {
        const status = JSON.parse(req.get('X-Custom-Header-Data'))
        const postID = req.params.pid
        const commentID = req.params.cid
        let userID = token.id

        if (status) {
            postsCollection.updateOne(
                { _id: new ObjectID(postID) },
                { $addToSet: { "comments.$[cid].likes": { userId: userID } } },
                { arrayFilters: [{ "cid._id": new ObjectID(commentID) }] },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    console.log(jMongoRes.matchedCount, jMongoRes.modifiedCount)
                    res.status(200).send("Post updated")
                    globalVersion++
                    return
                }
            )
        } else {
            postsCollection.updateOne(
                { _id: new ObjectID(postID) },
                { $pull: { "comments.$[cid].likes": { userId: userID } } },
                { arrayFilters: [{ "cid._id": new ObjectID(commentID) }] },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    console.log(jMongoRes.matchedCount, jMongoRes.modifiedCount)
                    res.status(200).send("Post updated")
                    globalVersion++
                    return
                }
            )
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// CREATE POST
// ##################################
app.post("/posts", verifyToken, (req, res) => {
    const newPostID = new ObjectID() //.toString()
    const userID = token.id
    // function to dry
    function createPost(mediaName, message, profilePic) {
        try {
            // posts document
            postsCollection.insertOne({
                _id: newPostID,
                userId: userID,
                message: message,
                name: token.name,
                mediaName,
                comments: [],
                likes: [],
                profilePic
            },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    // other's (unread) posts
                    usersCollection.updateMany(
                        { "friends._id": token.id },
                        { $push: { unreadPosts: { _id: newPostID, userId: token.id, message, name: token.name, mediaName, comments: [], likes: [], profilePic } } },
                        (err, jMongoRes2) => {
                            if (err || jMongoRes2 == undefined) { console.log("Database object response error", err); res.status(500); return }
                            res.status(200).send("Post created")
                            globalVersion++
                            return
                        }
                    )
                }
            )
        } catch (err) {
            // mb. email admin
            console.log(err)
            return res.status(500).send("System under maintenance")
        }
    }
    try {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            // No media upload
            //console.log(files.media.size)
            if (files.media.size == 0) {
                createPost('', fields.message, fields.profilePic)
            } else {
                // With media upload
                try {
                    detect.fromFile(files.media.path, (err, result) => {
                        if (err) { console.log(err); res.send("Error in file"); return }
                        const mediaName = uuidv1() + "." + result.ext
                        const allowedImageTypes = ["jpg", "jpeg", "png", "gif"]
                        if (!allowedImageTypes.includes(result.ext)) {
                            return res.send("File type not allowed")
                        }
                        const oldPath = files.media.path
                        const newPath = path.join(__dirname, "../public/media", mediaName)
                        // moving pic from temp path to public folder (callback)
                        fs.rename(oldPath, newPath, err => {
                            if (err) { console.log(err); res.send("Could not move file"); return }
                            createPost(mediaName, fields.message, fields.profilePic)
                        })
                    })
                } catch (err) {
                    console.log(err)
                    return res.send("Could not upload image")
                }
            }
        });
    } catch (err) {
        console.log("Error retrieving form:", err)
        res.status(500).send(err)
    }
})

// CREATE COMMENT
// ##################################
app.patch("/posts/:pid", verifyToken, (req, res) => {
    const parentID = new ObjectID(req.params.pid)
    const parentUserID = new ObjectID(req.get('X-Custom-Header-Data'))
    const userID = token.id
    const newCommentID = new ObjectID()
    try {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            // posts document
            postsCollection.updateOne(
                { _id: parentID },
                // each+position to append to front of array
                {
                    $push: {
                        comments: {
                            $each: [{
                                _id: newCommentID,
                                userId: userID,
                                message: fields.message,
                                name: token.name,
                                likes: [],
                                profilePic: fields.profilePic
                            }], $position: 0
                        }
                    }
                },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    // parent comment's owner's (unread) comments
                    if (parentUserID != userID) {
                        usersCollection.updateOne(
                            { _id: parentUserID },
                            { $push: { unreadComments: { _id: newCommentID, userId: token.id, message: fields.message, name: token.name, likes: [], profilePic: fields.profilePic } } },
                            (err, jMongoRes2) => {
                                if (err || jMongoRes2 == undefined) { console.log("Database object response error", err); res.status(500); return }
                                console.log('465', jMongoRes2.matchedCount, jMongoRes2.modifiedCount)
                                res.status(200).send("Post created")
                                globalVersion++
                                return
                            }
                        )
                    } else {
                        console.log('472', jMongoRes.matchedCount, jMongoRes.modifiedCount)
                        res.status(200).send("Post created")
                        globalVersion++
                        return
                    }
                }
            )
        });
    } catch (err) {
        console.log("Error retrieving form:", err)
        res.status(500).send(err)
    }
})

// DELETE COMMENT
// ##################################
app.patch("/posts/:pid/:cid", verifyToken, (req, res) => {
    const parentID = new ObjectID(req.params.pid)
    const commentID = new ObjectID(req.params.cid)
    const commentUserID = req.get('X-Custom-Header-Data')
    const userID = token.id
    try {
        postsCollection.updateOne(
            { _id: parentID },
            { $pull: { comments: { _id: new ObjectID(commentID), userId: userID } } },
            (err, jMongoRes) => {
                if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                // todo: if parent comment's owner's (unread) comments remove...
                console.log(jMongoRes.matchedCount, jMongoRes.modifiedCount)
                res.status(200).send("Post created")
                globalVersion++
                return
            }
        )
    } catch (err) {
        console.log("Error retrieving form:", err)
        res.status(500).send(err)
    }
})

// DELETE POST
// ##################################
app.delete("/delete-post/:pid", verifyToken, (req, res) => {
    try {
        let userID = token.id
        // finding posts matching route + token id
        postsCollection.deleteOne(
            { _id: new ObjectID(req.params.pid), userId: userID },
            (err, jMongoRes) => {
                if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                console.log('delete successful ' + jMongoRes.deletedCount)
                res.status(200).send("Post deleted")
                globalVersion++
                return
                // update in unread posts
            }
        )
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// GET ALL USERS
// ##################################
app.get("/get-users", (req, res) => {
    try {
        usersCollection.find({}, { projection: { name: 1, image: 1 } }).toArray((err, jMongoRes) => {
            if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
            //console.log(JSON.stringify(jMongoRes))
            res.status(200).send(jMongoRes)
        })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// ADD FRIEND
// ##################################
app.patch("/add-friend", verifyToken, (req, res) => {
    try {
        let postData = req.get('X-Custom-Header-Data')
        console.log(postData)
        let jPostData = JSON.parse(postData)
        let jFriend = jPostData[0]
        let jReqType = jPostData[1]
        let jImage = jPostData[2]
        let friendId = new ObjectID(jFriend._id)
        let userId = new ObjectID(token.id)
        // Friendship request
        if (jReqType == 0) {
            usersCollection.findOneAndUpdate(
                { _id: friendId },
                { $addToSet: { friendRequests: { _id: token.id, name: token.name, image: jImage } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send('ok')
                    globalVersion++
                    return
                }
            )
            // Accepting friendship request
        } else if (jReqType == 1) {
            // Insert into my friends and remove from requests
            usersCollection.findOneAndUpdate(
                { _id: userId },
                { $addToSet: { friends: jFriend }, $pull: { friendRequests: { _id: jFriend._id } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    // Insert into friend's friends
                    usersCollection.findOneAndUpdate(
                        { _id: friendId },
                        { $addToSet: { friends: { _id: token.id, name: token.name, image: jImage } } },
                        (err, jMongoRes2) => {
                            if (err || jMongoRes2 == undefined) { console.log("Database object response error", err); res.status(500); return }
                            res.status(200).send('ok')
                            globalVersion++
                            return
                        }
                    )
                }
            )
            // Rejecting friendship request
        } else if (jReqType == 2) {
            usersCollection.findOneAndUpdate(
                { _id: userId },
                { $pull: { friendRequests: { _id: jFriend._id } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    res.status(200).send('ok')
                    globalVersion++
                    return
                }
            )
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// SEND CHAT MESSAGE
// ##################################
app.patch("/chat-message", verifyToken, (req, res) => {
    try {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let senderId = fields.senderId
            let receiverId = fields.receiverId
            let message = fields.message
            let name = fields.name
            let _id = new ObjectID().toString()

            usersCollection.findOneAndUpdate(
                { _id: new ObjectID(senderId) },
                { $push: { myMessages: { _id, senderId, receiverId, name, message } } },
                (err, jMongoRes) => {
                    if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                    usersCollection.findOneAndUpdate(
                        { _id: new ObjectID(receiverId) },
                        { $push: { myMessages: { _id, senderId, receiverId, name, message }, unreadMessages: { _id, senderId, receiverId, name, message } } },
                        (err, jMongoRes) => {
                            if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                            res.send('ok')
                            globalVersion++
                            return
                        }
                    )
                }
            )
        });
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// PROFILE PICTURE UPLOAD
// ##################################
app.patch("/profile-image", verifyToken, (req, res) => {
    try {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            try {
                detect.fromFile(files.profile.path, (err, result) => {
                    if (err) { console.log(err); res.send("Error in file"); return }
                    const mediaName = uuidv1() + "." + result.ext
                    const allowedImageTypes = ["jpg", "jpeg", "png"]
                    if (!allowedImageTypes.includes(result.ext)) {
                        return res.send("File type not allowed")
                    }
                    const oldPath = files.profile.path
                    const newPath = path.join(__dirname, "../public/media", mediaName)
                    // moving pic from temp path to public folder (callback)
                    fs.rename(oldPath, newPath, err => {
                        if (err) { console.log(err); res.send("Could not move file"); return }
                        let userId = new ObjectID(token.id)
                        // update own
                        usersCollection.findOneAndUpdate(
                            { _id: userId },
                            { $set: { image: mediaName } },
                            (err, jMongoRes) => {
                                if (err || jMongoRes == undefined) { console.log("Database object response error", err); res.status(500); return }
                                // add to posts retroactively
                                postsCollection.updateMany(
                                    { userId: token.id },
                                    { $set: { profilePic: mediaName } },
                                    (err, jMongoRes2) => {
                                        if (err || jMongoRes2 == undefined) { console.log("Database object response error", err); res.status(500); return }
                                        // add to comments retroactively
                                        postsCollection.updateMany(
                                            { "comments.userId": token.id },
                                            { $set: { "comments.$[uid].profilePic": mediaName } },
                                            { arrayFilters: [{ "uid.userId": token.id }] },
                                            (err, jMongoRes3) => {
                                                if (err || jMongoRes3 == undefined) { console.log("Database object response error", err); res.status(500); return }
                                                console.log(jMongoRes3.matchedCount, jMongoRes3.modifiedCount)
                                                // add to friends retroactively
                                                usersCollection.updateMany(
                                                    { "friends._id": token.id },
                                                    { $set: { "friends.$[friends].image": mediaName } },
                                                    { arrayFilters: [{ "friends._id": token.id }] },
                                                    (err, jMongoRes4) => {
                                                        if (err || jMongoRes4 == undefined) { console.log("Database object response error", err); res.status(500); return }
                                                        res.status(200).send("Post updated")
                                                        globalVersion++
                                                        return
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    })
                })
            } catch (err) {
                console.log(err)
                return res.send("Could not upload image")
            }
        });
    } catch (err) {
        console.log("Error retrieving form:", err)
        res.status(500).send(err)
    }
})
