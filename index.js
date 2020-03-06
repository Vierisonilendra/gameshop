const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const secretKey = ' thisisverysecretkey'
const app = express()
const port = 3000;

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "gameshop"
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const isAuthorized = (request, result, next) => {

    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }


    let token = request.headers['x-api-key']

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })  
    next()
}

/********  Login ********/

app.post('/login', (request, result) => {
    let data = request.body
    var username = data.username;
    var password = data.password;

    if ( username && password) {
        db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
        
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

            result.json ({
            success: true,
            message: 'Login Success',
            token: token
            });
        
            } else {
            result.json ({
            success: false,
            message: 'Login Failed'
              });
            }

            result.end();
        });
    }
});
        

/********  CRUD Users ********/

app.get('/users', isAuthorized, (req, res) => {
    let sql = `
        select username, created_at from users
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get all user",
            data: result
        })
    })
})

app.post('/users', isAuthorized, (req, res) => {
    let data = req.body
    data.forEach(element=> {
    let sql = `
        insert into users (username, password)
        values ('`+element.username+`', '`+element.password+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "user created",
            element: result
        })
    })
})
})

app.get('/users/:id', isAuthorized, (req, res) => {
    let sql = `
        select * from users
        where id = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get user's detail",
            data: result[0]
        })
    })
})

app.put('/users/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update users
        set username = '`+data.username+`', password = '`+data.password+`'
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "data has been updated",
            data: result
        })
    })
})

app.delete('/users/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from users
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "data has been deleted",
            data: result
        })
    })
})

/********  CRUD Games ********/

app.get('/games', isAuthorized, (req, res) => {
    let sql = `
        select title, genre, year, created_at from games
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get all games",
            data: result
        })
    })
})

app.post('/games', isAuthorized, (req, res) => {
    let data = req.body
    data.forEach(element =>{ 
    let sql = `
        insert into games (title, genre, year, stock)
        values ('`+element.title+`', '`+element.genre+`', '`+element.year+`', '`+element.stock+`')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "games created",
            element: result
        })
    })
})
})

app.get('/games/:id', isAuthorized, (req, res) => {
    let sql = `
        select * from games
        where id = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get game detail",
            data: result[0]
        })
    })
})

app.put('/games/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update games
        set title = '`+data.title+`', genre = '`+data.genre+`', year = '`+data.year+`', stock = '`+data.stock+`'
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "data has been updated",
            data: result
        })
    })
})

app.delete('/games/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from games
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "data has been deleted",
            data: result
        })
    })
})

/********** Transaksi Peminjaman **********/

app.post('/gameuser/:id/take', isAuthorized, (req, res) => {
    let data = req.body

    db.query(`
        insert into user_games (user_id, games_id)
        values ('`+data.user_id+`', '`+req.params.id+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update games
        set stock = stock - 1
        where id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Game has been bought by user"
    })
})

app.put('/gameuser/:id/update', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update user_games
        set user_id = '`+data.user_id+`', games_id = '`+data.games_id+`'
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Data updated",
            data: result
        })
    })
})


app.get('/gameuser/:id/refund', isAuthorized, (req, res) => {
    db.query(`
        select games.title, games.genre, games.year
        from users
        right join user_games on users.id = user_games.user_id
        right join games on user_games.games_id = games.id
        where users.id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "Game has been refunded",
            data: result
        })
    })
})

app.delete('/gameuser/:id/delete', isAuthorized, (req, res) => {
    let sql = `
        delete from user_games
        where id = '`+req.params.id+`'
    `
    
    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "data has been deleted",
            data: result
        })
    })
})



/********** Run Application **********/

app.listen(port, () => {
    console.log('App running on port ' + port)
})
