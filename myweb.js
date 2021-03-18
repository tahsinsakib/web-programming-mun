// COMP 3100, Final Project, Tahsin Ahmed Sakib, 201653763, 08/04/20

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database( __dirname + '/databases/users.db',
    function(err)
    {
        if (!err)
        {
            db.serialize(function(){
                createDBtable(db);
                initializeDB(db, "Regular User", "regular@mun.ca", "1234", 0);
                initializeDB(db, "Tahsin Ahmed Sakib", "tasakib@mun.ca", "4321", 1);
                initializeDB(db, "Admin User", "admin@mun.ca", "12345", 1);
                initializeDB(db, "Random User", "random@mun.ca", "123456", 0);
            });
            console.log('opened database: users.db');
        }
        else
        {
            console.log(err.message);
        }
    });

let db0 = new sqlite3.Database( __dirname + '/databases/spreadsheets.db',
    function(err)
    {
        if (!err)
        {
            db.serialize(function(){
                createDBtable0(db0);
                initializeDB0(db0, "monthlyexpenses", "Regular User", 1, JSON.stringify([["Food", "Rent", "Auto Insurance", "Phone Bill"],[320, 650, 222, 85],[250, 700, 355, 115],[215, 1100, 298, 70]]));
                initializeDB0(db0, "covid19cases", "Tahsin Ahmed Sakib", 1, JSON.stringify([["NL", "SK", "MB", "BC"],[10, 2, 6, 58],[18, 6, 14, 69],[42, 18, 32, 115]]));
                initializeDB0(db0, "xyz", "Admin User", 0, JSON.stringify([["X", "Y", "Z", "A"],[1, 4, 3, 6],[5, 3, 3, 2],[8, 5, 15, 10]]));
                initializeDB0(db0, "taxcredit", "Random User", 1, JSON.stringify([["Family 1", "Family 2", "Family 3", "Family 4"],[500, 650, 450, 520],[550, 650, 480, 550],[520, 690, 510, 500]]));
            });
            console.log('opened database: spreadsheets.db');
        }
        else
        {
            console.log(err.message);
        }
    });

function createDBtable(db)
{
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        password TEXT,
        admin INTEGER
    )`);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uniqueUser on accounts(email)`);
}

function createDBtable0(db)
{
    db.run(`CREATE TABLE IF NOT EXISTS sheets (
        id INTEGER PRIMARY KEY,
        sheetname TEXT,
        ownername TEXT,
        sharable INTEGER,
        sheet TEXT
    )`);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uniqueSheet on sheets(sheetname)`);
}

function initializeDB(db, nm, em, pw, ad)
{
    db.run(`INSERT OR IGNORE INTO accounts(name, email, password, admin) VALUES(?, ?, ?, ?)`, [nm, em, pw, ad]);
}

function initializeDB0(db0, sn, on, shr, sh)
{
    db0.run(`INSERT OR IGNORE INTO sheets(sheetname, ownername, sharable, sheet) VALUES(?, ?, ?, ?)`, [sn, on, shr, sh]);
}

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const CSV = require('csv-string');
const textBody = bodyParser.text();
const app = express();
app.use(session({
	secret: 'myverysecretcode',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
const jsonParser = bodyParser.json();
app.use('/public', express.static(__dirname + '/public'));
const port = process.env.PORT || 3000;

app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/views/login.html', () => console.log('login.html sent'))
});

app.post('/auth', function(req, res)
{
	let email = req.body.email;
	let password = req.body.password;
    if (email && password)
    {
        db.all('SELECT * FROM accounts WHERE email = ? AND password = ?', [email, password], function(error, results, fields)
        {
            if (results.length > 0 && results[0].admin==0)
            {
				req.session.loggedin = true;
                req.session.email = email;
                res.redirect('/success');
            }
            else if (results.length > 0 && results[0].admin==1)
            {
                req.session.loggedin = true;
                req.session.email = email;
                res.redirect('/successadmin');
            }
            else
            {
                res.send('Incorrect email and/or password. Please try again.');
                res.end();
            }
		});
    } 
    else
    {
		res.send('Login cannot be processed without email/password. Please enter required information.');
		res.end();
	}
});

app.get('/regpage', function(req, res)
{
    res.sendFile(__dirname + '/views/registration.html', () => console.log('registration.html sent'))
});

app.post('/reg', function(req, res)
{
    let name = req.body.name;
	let email = req.body.email;
    let password = req.body.password;
    let checkbox = req.body.checkbox;
    if (name && email && password)
    {
        db.run(`INSERT OR IGNORE INTO accounts(name, email, password, admin) VALUES(?, ?, ?, ?)`, [name, email, password, (checkbox ? 1 : 0)]);
        res.sendFile(__dirname + '/views/regsuccess.html', () => console.log('regsuccess.html sent'));
    }
    else
    {
		res.send('Information missing. Please enter all required details for registration.');
		res.end();
	}
});

app.post('/update', function(req, res)
{
    let name = req.body.name;
    let password = req.body.password;
    if (name || password)
    {
        if (name)
        {
            db.run(`UPDATE accounts SET name=? WHERE email=?`, [name, req.session.email]);
        }
        if (password)
        {
            db.run(`UPDATE accounts SET password=? WHERE email=?`, [password, req.session.email]);
        }
        res.send('Update successful!');
        res.end();
    }
    else
    {
		res.send('Update information missing! Please enter required details.');
		res.end();
	}
});

app.get('/next', function(req, res)
{
    res.sendFile(__dirname + '/views/updateinfo.html', () => console.log("updateinfo.html sent"))
});

app.get('/success', function(req, res)
{
    if (req.session.loggedin)
    {
        res.sendFile(__dirname + '/views/loginsuccess.html', () => console.log('loginsuccess.html sent'));
    }
    else
    {
        res.send('Please login to view this page!');
        res.end();
	}
});

app.get('/successadmin', function(req, res)
{
    if (req.session.loggedin)
    {
        res.sendFile(__dirname + '/views/loginsuccessadmin.html', () => console.log('loginsuccessadmin.html sent'));
    }
    else
    {
        res.send('Please login to view this page!');
        res.end();
	}
});

app.get('/logout', function(req, res)
{
    req.session.loggedin = false;
    res.redirect('/');
});


// following are required functions for administrator's
// access to local database that we created earlier

function makeDBhtml(li)
{
    let databasePage = `\
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            ul{ list-style-type:square; background: #ff9999; }
        </style>
    </head>
    <body>
        <br>
        <ul>
            ${li}
            <li>
                <form method=post>
                    name: <input type=text name="name" size=20>
                    email: <input type=email name="email" size=16>
                    password: <input type=password name="password" size=20>
                    admin?: <input type="checkbox" name="admin" value="admin">
                    <input type=submit name="button" value="add entry">
                </form>
            </li>
        </ul>
    </body>
    </html>
    `
    return databasePage;
}

function addExistingData(accounts)
{
    let data = '';
    for(let account of accounts)
    {
        const id = account.id;
        const name = account.name;
        const email = account.email;
        const password = account.password;
        const admin = ((account.admin == 1) ? 'checked' :  '');
        data += '<li>';
        data += '<form method=post>';
        data += ` name: <input type=text name="name" value="${name}" size=20>`;        
        data += ` email: <input type=text name="email" value="${email}" size=16>`;
        data += ` password: <input type=text name="password" value="${password}" size=20>`;
        data += ` admin: <input type=checkbox name="admin" ${admin} value="admin">`;
        data += ' <input type=submit name="button" value="update">';
        data += ' <input type=submit name="button" value="remove entry">';
        data += `<input type=hidden name="user" value="${id}">`;
        data += '</form>';
        data += '</li>\n';
    }
    return makeDBhtml(data);
}

function generateMain(res)
{
    db.all('SELECT * FROM accounts', [], function(err, rows)
    {
        if (!err)
        {
            res.type('.html');
            res.send(addExistingData(rows));
        }
        else
        {
            console.log(err);
        }
    } );
}

app.get('/admin', function(req, res)
{
    generateMain(res);
});

app.post('/admin', function(req, res)
{
    const data = req.body;

    if (data.button === 'add entry')
    {
        console.log('adding entry:', data);
        if (data.name && data.email && data.password)
        {
            db.run('INSERT INTO accounts(name, email, password, admin) VALUES(?, ?, ?, ?)', [data.name, data.email, data.password, (data.admin ? 1 : 0)],
            function(err)
            {
                if (!err)
                {
                    res.redirect('/admin');
                } 
            });
        }
        else
        {
            res.redirect('/admin');
        }
    }
    else if (data.button === 'update')
    {
        console.log('updating entry:', data);
        let userid = parseInt(data.user);
        let admin = data.hasOwnProperty('admin');
        db.run('UPDATE accounts SET name=?, email=?, password=?, admin=? WHERE id=?',
            [data.name, data.email, data.password, (admin ? 1 : 0), userid],
            function(err)
            {
                if (!err)
                {
                    res.redirect('/admin');
                }
            }
        );
    }
    else if (data.button === 'remove entry')
    {
        console.log('removing entry', data);
        let userid = parseInt(data.user);
        db.run('DELETE FROM accounts WHERE id=?',
        [userid],
        function(err)
        {
            if (!err)
            {
                res.redirect('/admin');
            }
        }
        );
    }

});

function makeDBhtml0(li)
{
    let databasePage = `\
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            ul{ list-style-type:square; background: green; }
            p{ font-size:0.9em; }
        </style>
    </head>
    <body>
        <br>
        <ul>
            ${li}
            <li>
                <form method=post>
                    sheetname: <input type=text name="sheetname" size=20>
                    ownername: <input type=text name="ownername" size=16>
                    sharable?: <input type="checkbox" name="sharable" value="sharable">
                    sheet: <input type=text name="sheet" size=50>
                    <input type=submit name="button" value="add entry">
                </form>
            </li>
        </ul>
        <p>Note: to add new entries, you must use 4x4 array with values seperated by comma's (,) with first four values indicating the labels. For example, you may try adding "A,B,C,D,1,2,3,4,5,6,7,8,9,10,11,12" to the "sheet" textbox.</p>
        <h3><a href="/spreadsheet">Click here</a> to access the spreadsheet editor to view/edit/plot the data in the spreadsheets.</h3><br>
        
    </body>
    </html>
    `
    return databasePage;
}

function addExistingData0(sheets)
{
    let data = '';
    for(let sh of sheets)
    {
        const id = sh.id;
        const sheetname = sh.sheetname;
        const ownername = sh.ownername;
        const sharable = ((sh.sharable == 1) ? 'checked' :  '');
        const sheet = JSON.parse(sh.sheet);
        data += '<li>';
        data += '<form method=post>';
        data += ` sheetname: <input type=text name="sheetname" value="${sheetname}" size=20>`;        
        data += ` ownername: <input type=text name="ownername" value="${ownername}" size=16>`;
        data += ` sharable: <input type=checkbox name="sharable" ${sharable} value="sharable">`;
        data += ` sheet: <input type=text name="sheet" value="${sheet}" size=50>`;
        data += ' <input type=submit name="button" value="update">';
        data += ' <input type=submit name="button" value="delete">';
        data += `<input type=hidden name="sheetid" value="${id}">`;
        data += '</form>';
        data += '</li>\n';
    }
    return makeDBhtml0(data);
}

function generateMain0(res)
{
    db0.all('SELECT * FROM sheets', [], function(err, rows)
    {
        if (!err)
        {
            res.type('.html');
            res.send(addExistingData0(rows));
        }
        else
        {
            console.log(err);
        }
    } );
}

app.get('/adminss', function(req, res)
{
    generateMain0(res);
});

app.post('/adminss', function(req, res)
{
    const data = req.body;

    if (data.button === 'add entry')
    {
        let sh = data.sheet.split(',');
        let shArr = [];
        for(let i=0; i<sh.length/4; i++)
        {
            let shArrRow = [];
            for(let j=i*4; j<((i*4)+4); j++)
            {
                if(sh[j]!=null)
                {
                    if(!isNaN(sh[j]))
                    {
                        shArrRow.push(parseInt(sh[j]));
                    }
                    else
                    {
                        shArrRow.push(sh[j]);
                    }
                }
            }
            shArr.push(shArrRow);
        }
        console.log('adding entry:', data);
        if (data.sheetname && data.ownername && data.sheet)
        {
            db0.run('INSERT INTO sheets(sheetname, ownername, sharable, sheet) VALUES(?, ?, ?, ?)', [data.sheetname, data.ownername, (data.sharable ? 1 : 0), JSON.stringify(shArr)],
            function(err)
            {
                if (!err)
                {
                    res.redirect('/adminss');
                }
            });
        }
        else
        {
            res.redirect('/adminss');
        }
    }
    else if (data.button === 'update')
    {
        console.log('updating entry:', data);
        let sheetid = parseInt(data.sheetid);
        let sharable = data.hasOwnProperty('sharable');
        db0.run('UPDATE sheets SET sheetname=?, ownername=?, sharable=?, sheet=? WHERE id=?',
            [data.sheetname, data.ownername, (sharable ? 1 : 0), JSON.stringify(data.sheet), sheetid],
            function(err)
            {
                if (!err)
                {
                    res.redirect('/adminss');
                }
            }
        );
    }
    else if (data.button === 'delete')
    {
        console.log('deleting entry', data);
        let sheetid = parseInt(data.sheetid);
        db0.run('DELETE FROM sheets WHERE id=?',
        [sheetid],
        function(err)
        {
            if (!err)
            {
                res.redirect('/adminss');
            }
        }
        );
    }

});

app.get('/spreadsheet', function(req, res)
{
    res.sendFile(__dirname + '/views/spreadsheet.html', () => console.log('spreadsheet.html sent'))
});

app.get('/sheet/:sheetname', function(req, res) {
    const name = req.params.sheetname;
    db0.get('SELECT sheet FROM sheets where sheetname = ?', [name], function(err, row) {
            if (!err)
            {
                res.send(row.sheet);
            }
            else
            {
                res.send({err:err});
            }
        }
    );
});

app.get('/sheet-list', function(req, res) {
    db0.all('SELECT sheetname FROM sheets', [],
        function(err, rows) {
            if (!err)
            {
                const names = rows.map((x) => x.sheetname);
                res.send(names);
            }
            else
            {
                res.send({err:err});
            }
        }
    );
});

app.put('/sheet/:name', jsonParser, (req,res) => {
    let name = req.params.name;
    name += Math.round(Math.random()*10);
    const values = req.body;
    console.log("creating new sheet: ", name);
    const strValues = JSON.stringify(values);
    db0.run(`INSERT INTO sheets (sheetname,sheet) VALUES(?,?)`,
        [name,strValues],
        function(err) {
            if (!err)
            {
                res.send({ok:true});
            }
            else
            {
                res.send({ok:false});
            }
        }
    );
});

app.get('/csv-export/:name', (req, res) => {
    const name = req.params.name;
    db0.get('SELECT sheet FROM sheets where sheetname = ?', [name], function(err, row) {
            if (!err)
            {
                let values = JSON.parse(row.sheet);
                let csv = '';
                for(let row of values)
                {
                    csv += CSV.stringify(row); 
                }
                res.set('Content-Type', 'text/plain');
                res.set('Content-Disposition', `attachment; filename="${name}.csv"`);
                res.send(csv);
            }
            else
            {
                res.status(404).send("not found1");
            }
        }
    );
});

app.put('/csv-import', textBody, (req,res) => {
    const sheet = [];
    CSV.forEach(req.body, ',', function(row, index) {
        sheet.push(row);
    });
    const strValues = JSON.stringify(sheet);
    res.send(strValues);
});

app.listen(port, () => console.log("listening now on port: " + port));