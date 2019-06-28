var express = require('express');
var router = express.Router();

var moment = require('moment');

var unirest = require('unirest');
//var rfid = require('node-rfid');


var mysql = require('mysql')


const apiKey = "1a2b3c4d5e6d"
const contTitle = "ระบบจัดการโปรแกรม"
const contFnTitle = "ระบบงานแจ้งซ่อม"
let login


//**** data Service  */
var db_config = {
  host: 'localhost',
  user: 'root',
  password: 'comp@113',
  database: 'db_service'
};
var conn;

function handleDisconnect() {
  conn = mysql.createConnection(db_config); // Recreate the connection, since
  // the old one cannot be reused.

  conn.connect(function (err) { // The server is either down
    if (err) { // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  conn.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}
handleDisconnect();
/**** End Data Service */
//**** data Personal  */
var db_config_per = {
  host: 'localhost',
  user: 'root',
  password: 'comp@113',
  database: 'dbpersonal'
};
var connPer;

function handleDisconnect2() {
  connPer = mysql.createConnection(db_config_per); // Recreate the connection, since
  // the old one cannot be reused.

  connPer.connect(function (err) { // The server is either down
    if (err) { // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect2, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connPer.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect2(); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}
handleDisconnect2();
/**** End Data Personal */


/***** RFID */




// create an instance of the rpi-mfrc522 class using the default settings
router.get('/readCard', (req, res) => {
  const RPiMfrc522 = require('rpi-mfrc522');

  let mfrc522 = new RPiMfrc522();

  // initialize the class instance then start the detect card loop
  mfrc522.init()
    .then(() => {
      loop();
    })
    .catch(error => {
      console.log('ERROR:', error.message)
    });


  // loop method to start detecting a card
  function loop() {
    console.log('Loop start...');
    cardDetect()
      .catch(error => {
        console.log('ERROR', error.message);
      });
  }


  // delay then call loop again
  function reLoop() {
    setTimeout(loop, 25);
  }

  // call the rpi-mfrc522 methods to detect a card
  async function cardDetect() {
    // use the cardPresent() method to detect if one or more cards are in the PCD field
    if (!(await mfrc522.cardPresent())) {
      console.log('No card')
      return reLoop();
    }
    // use the antiCollision() method to detect if only one card is present and return the cards UID
    let uid = await mfrc522.antiCollision();
    if (!uid) {
      // there may be multiple cards in the PCD field
      console.log('Collision');
      return reLoop();
    }
    console.log('Card detected, UID ' + uidToString(uid));
    await mfrc522.resetPCD()
    reLoop();
  }


  // convert the array of UID bytes to a hex string
  function uidToString(uid) {
    return uid.reduce((s, b) => {
      return s + (b < 16 ? '0' : '') + b.toString(16);
    }, '');
  }
  /***** END RFID */

})




let dateNow = new Date();
// Conver Time
function convertDateInDBFormate(timestamp) {
  //If input date is not valid date then assign a default value
  if ((new Date(timestamp)).getTime() > 0) {
    var date = new Date(timestamp);
    return (date.getFullYear() + '-' + (date.getMonth() + 01) + '-' + date.getDate());
  } else {
    return '1900-01-01';
  }
}



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express2'
  });
});

router.get('/:apiKey/dataJobMode', (req, res) => {
  let key = req.params.apiKey
  if (key == apiKey) {
    sql = "SELECT * FROM job_mode"
    conn.query(sql, (err, result) => {
      res.send(result)
    })
  } else {
    res.send("ติดต่อขอ API ที่ Admin")
  }
})

router.get('/:apiKey/dataCause', (req, res) => {
  let key = req.params.apiKey
  if (key == apiKey) {
    sql = "SELECT * FROM cause"
    conn.query(sql, (err, result) => {
      res.send(result)
    })
  } else {
    res.send("ติดต่อขอ API ที่ Admin")
  }
})


router.get('/:apiKey/dataJob', (req, res) => {
  let key = req.params.apiKey
  if (key == apiKey) {
    sql = "SELECT * FROM job"
    conn.query(sql, (err, result) => {
      res.send(result)
    })
  } else {
    res.send("ติดต่อขอ API ที่ Admin")
  }
})

router.get('/:apiKey/dataService', (req, res) => {
  let key = req.params.apiKey
  if (key == apiKey) {
    sql = "SELECT * FROM service"
    conn.query(sql, (err, result) => {
      res.send(result)
    })
  } else {
    res.send("ติดต่อขอ API ที่ Admin")
  }
})

router.get('/:apiKey/dataUserService', (req, res) => {
  let key = req.params.apiKey
  if (key == apiKey) {
    sql = "SELECT * FROM user_service"
    conn.query(sql, (err, result) => {
      res.send(result)
    })
  } else {
    res.send("ติดต่อขอ API ที่ Admin")
  }
})

router.get('/admin', (req, res) => {
  let statusLogin = req.cookies['loginCookie']
  //console.log('xx =' + statusLogin);
  if (statusLogin == 'yes') {
    res.render('admin', {
      title: contTitle,
      subTitle: 'ระบบงานแจ้งซ่อม'
    })
  } else {
    res.redirect('login')
  }
})

router.get('/account', (req, res) => {
  let xx = req.cookies['loginCookie']
  console.log('xx =' + xx);

  if (xx == 'yes') {
    res.render('account', {
      title: contTitle,
      //title: xx,
      subTitle: 'ทะเบียนผู้ใช้',
      statusLongin: 'noLogin'
    })
  }
  res.redirect('login')
})

router.post('/adminLogin', (req, res) => {
  let getData = req.body
  console.log(getData.name);

  sql = "SELECT * FROM admin WHERE name_admin = '" + getData.name + "' AND pass_admin = '" + getData.password + "'"
  console.log(sql);

  conn.query(sql, (err, result) => {
    console.log(result);
    if (result != "") {
      res.cookie('loginCookie', 'yes')
      console.log("OK Login");
      login = 1
      res.render('admin', {
        title: contTitle,
        subTitle: 'Login'
      })
    } else {
      res.redirect('login')
    }
  })
})

router.get('/login', (req, res) => {
  let statusLogin = req.cookies['loginCookie']
  //console.log('xx =' + statusLogin);
  if (statusLogin == 'yes') {
    res.redirect('account')
  } else {
    res.render('login', {
      title: contTitle,
      subTitle: 'Login'
    })
  }
})


router.get('/job', (req, res) => {
  let statusLogin = req.cookies['loginCookie']
  if (statusLogin == 'yes') {
    res.render('job', {
      title: contTitle,
      subTitle: 'แบบฟอร์มแจ้งซ่อม',
      moment: moment,
      dateNow: dateNow
    })
  } else {
    res.render('login', {
      title: contTitle,
      subTitle: 'Login'
    })
  }
})


router.get('/logout', (req, res) => {
  res.clearCookie("loginCookie");
  res.redirect('login')
  //res.send('test')
})

router.post('/addJob', (req, res) => {
  let data = req.body
  console.log(data);

  // let sql = "INSERT INTO job (mode_id,detail_job,user_id,date_job,time_job,tel_job,service)"
  // sql += "VALUES("
  // sql += "'"+data.+"',"
  // sql += ")"

  res.render('jobSuccess', {
    title: contTitle,
    subTitle: 'กำลังบันทึก'
  })

})

router.get('/jobSuccess2', (req, res) => {
  //console.log(data);

  res.render('jobSuccess2', {
    title: contTitle,
    subTitle: 'บันทึกสำเร็จ'
  })
})

router.get('/fn-login', (req, res) => {
  res.render('fnLogin', {
    title: contFnTitle,
    subTitle: "login"
  })
})

router.get('/xx', (req, res) => {
  res.render('fnLogin', {
    title: contFnTitle,
    subTitle: "login"
  })
})

router.post('/fn-chkLogin', (req, res) => {
  let data = req.body
  sql = "SELECT personal.`name`,personal.surname,`user`.username_user,depart.namedp,`user`.password_user,md5login.passmd5,`user`.idper "
  sql += " FROM depart"
  sql += " INNER JOIN`user` ON`user`.depart = depart.id_dp"
  sql += " INNER JOIN personal ON`user`.idper = personal.id_pro"
  sql += " INNER JOIN md5login ON`user`.id_user = md5login.iduser"
  sql += " WHERE md5login.passmd5 = '" + data.password + "'"
  sql += " AND username_user = '" + data.user + "'"
  console.log(sql);
  connPer.query(sql, (err, result) => {
    console.log(result);

    if (result != "") {
      //res.send('chkLogin')
      res.cookie('userCookie', 'yes')
      res.cookie('idUser', result[0].idper)
      res.cookie('nameUser', result[0].name)
      res.cookie('surnameUser', result[0].surname)
      res.redirect('fn-service')
    } else {
      //res.redirect('fn-login')
      res.send("no data post")
    }
  })
  //console.log(data);
})

router.get('/fn-chkLogin/:user/:pass', (req, res) => {
  //let data = req.body
  let dataUser = req.params.user
  let dataPass = req.params.pass
  sql = "SELECT personal.`name`,personal.surname,`user`.username_user,depart.namedp,`user`.password_user,md5login.passmd5,`user`.idper "
  sql += " FROM depart"
  sql += " INNER JOIN`user` ON`user`.depart = depart.id_dp"
  sql += " INNER JOIN personal ON`user`.idper = personal.id_pro"
  sql += " INNER JOIN md5login ON`user`.id_user = md5login.iduser"
  sql += " WHERE md5login.passmd5 = '" + dataPass + "'"
  sql += " AND username_user = '" + dataUser + "'"
  console.log(sql);
  connPer.query(sql, (err, result) => {
    console.log(result);

    if (result != "") {
      //res.send('chkLogin')
      console.log("Login Ok");
      res.cookie('userCookie', 'yes')
      res.cookie('idUser', result[0].idper)
      res.cookie('nameUser', result[0].name)
      res.cookie('surnameUser', result[0].surname)
      res.redirect('fn-service')
    } else {
      //res.redirect('fn-login')
      res.send("no data post")
    }
  })
  //console.log(data);
})

router.get('/fn-service', (req, res) => {
  let statusUserCookie = req.cookies['userCookie']
  let getIdUser = req.cookies['idUser']
  if (statusUserCookie == 'yes') {

    sql = "SELECT personal.`name`,personal.surname,`user`.username_user,depart.namedp,`user`.password_user,md5login.passmd5,`user`.idper"
    sql += " FROM depart"
    sql += " INNER JOIN`user` ON`user`.depart = depart.id_dp"
    sql += " INNER JOIN personal ON`user`.idper = personal.id_pro"
    sql += " INNER JOIN md5login ON`user`.id_user = md5login.iduser"
    sql += " WHERE idper = '" + getIdUser + "'"

    connPer.query(sql, (err, result) => {
      res.render('fnService', {
        title: contFnTitle,
        subTitle: "ฟอร์มแจ้งซ่อม",
        moment: moment,
        dateNow: dateNow,
        dataIdUser: getIdUser,
        dataName: result[0].name,
        dataSurname: result[0].surname,
        dataNameDp: result[0].namedp
      })
    })
  } else {
    res.redirect('fn-login')
  }
})

router.post('/sendJob', (req, res) => {
  let data = req.body
  console.log(data);
  res.send("ok")
})

router.get('/rfid', (req, res) => {
  rfid.readintime(5000, function (err, result) {
    if (err) console.log("Sorry, some hardware error occurred"); //some kind of hardware/wire error
    if (result == "timeout") {
      console.log("Sorry, You timed out"); //check if time exceeded the time you passed as argument and print timeout message
    } else {
      console.log(result); //print rfid tag UID
    }
  });
  res.send("RFID2")
})


router.get('/service-', (req, res) => {
  let url = "http://taladsrimuang.com:4300/1a2b3c4d5e6d/dataJobMode"
  unirest.get(url).end((response) => {
    //make sure response should be a JSON object
    res.status(200).send(response)
  });
});



module.exports = router;