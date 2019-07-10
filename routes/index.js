var express = require('express');
var router = express.Router();

var moment = require('moment');

var unirest = require('unirest');
//var rfid = require('node-rfid');

var shell = require('shelljs');
var exec = require('child_process').exec;



var mysql = require('mysql')

var http = require('http');
var io = require('socket.io')(http)

//var server = http.createServer(app);


//setInterval(() => {
//console.log("set 10000");
io.sockets.on('connection', function (socket) {
  socket.on('msg', function (data) {
    console.log("test indexแแแแ");
  })
})

//}, 1000);
//console.log("test0001");


const apiKey = "1a2b3c4d5e6d"
const contTitle = "ระบบจัดการโปรแกรม"
//const contFnTitle = "ระบบงานแจ้งซ่อม"
const contFnTitle = "ระบบงานรับแจ้งซ่อม"
const subTitle = "รายการแจ้งซ่อม"
let login

var {
  urlChkLogin
} = require('../Config/dataConfig')
var {
  urlChkListService,
  urlUpdateService
} = require('../Config/dataConfig')

var {
  urlSendJob
} = require('../Config/dataConfig')

var {
  urlJobDetail
} = require('../Config/dataConfig')

var {
  urlAnsService
} = require('../Config/dataConfig')

var {
  urlGetJobDetail
} = require('../Config/dataConfig')

var {
  urlJobPreview
} = require('../Config/dataConfig')

//console.log(urlChkLogin);



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

var timeNow = new Date();
timeNow.toLocaleString(); // -> "2/1/2013 7:37:08 AM"
timeNow.toLocaleDateString(); // -> "2/1/2013"
timeNow.toLocaleTimeString(); // -> "7:38:05 AM"


/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('serviceProject')
  // res.render('index', {
  //   title: 'Express2'
  // });
});

router.get('/serviceProject', (req, res) => {
  let val_statusLogin = req.cookies['statusLogin']
  let val_idUserLogin = req.cookies['idUserLogin']
  console.log("val cookies = " + val_statusLogin);
  console.log("val cookies = " + val_idUserLogin);
  res.render('serviceProject', {
    title: contFnTitle
  })
})



router.get('/logout', (req, res) => {

  async function main() {
    await clearCookies();
    //await logCookies();
    await setRedire();
  }

  function clearCookies() {

    res.clearCookie('statusLogin', {
      path: '/'
    })
    res.clearCookie('idUserLogin', {
      path: '/'
    })
    console.log("clear");

  }

  function logCookies() {
    console.log("show");
    let val_statusLogin = req.cookies['statusLogin']
    let val_idUserLogin = req.cookies['idUserLogin']
    console.log("val cookies = " + val_statusLogin);
    console.log("val cookies = " + val_idUserLogin);
  }

  function setRedire() {
    res.redirect('serviceProject')
  }

  main()


  //res.send('test')
})




// ส่งเช็ค User password
router.post('/service-chkLogin', (req, res) => {
  let data = req.body
  let user = data.user
  let password = data.password
  //console.log(data);

  const response = new Promise(resolve => {
    unirest.post(urlChkListService)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send(data)
      .end(function (response) {
        resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
        //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
      });
  });

  response.then(function (resp) {
    console.log(resp);
    if (resp.statusLogin == 'autPass') {

      //res.cookie('statusLogin', resp.statusLogin)
      res.cookie('statusLogin', resp.statusLogin, {
        path: '/'
      })
      //res.cookie('idUserLogin', resp.idUser)
      res.cookie('idUserLogin', resp.idUser, {
        path: '/'
      })
      //res.send('okPass')
      let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin
      console.log(val_statusLogin);
      res.render('serviceList', {
        title: contFnTitle,
        subTitle: subTitle,
        moment: moment,
        dateNow: dateNow,
        dataUserService: resp.dataUser,
        data: resp.dataJob
      })
      //res.redirect('service-chkLogin')
    } else {
      res.redirect('serviceProject')
    }
    // expected output: "Success!"
  });
})


router.get('/serviceList', (req, res) => {

})

router.get('/serviceDetail/:id', (req, res) => {
  let jobId = req.params.id
  console.log(jobId);
  let val_statusLogin = req.cookies['statusLogin']
  let val_idUserLogin = req.cookies['idUserLogin']

  console.log("cookie = " + val_statusLogin);


  if (val_statusLogin == "autPass") {
    console.log(jobId);
    const response = new Promise(resolve => {
      unirest.post(urlJobDetail)
        .headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        })
        .send({
          "idUserLogin": val_idUserLogin,
          "JobId": jobId
        })
        .end(function (response) {
          resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
          //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
        });
    });

    response.then(function (resp) {
      console.log(resp);
      if (resp.statusLogin == 'autPass') {

        res.cookie('statusLogin', resp.statusLogin)
        //res.send('okPass')
        let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin
        //console.log("Cookie....");
        //console.log(val_statusLogin);
        res.render('serviceDetail', {
          title: contFnTitle,
          subTitle: "รายละเอียดงานแจ้งซ่อม",
          moment: moment,
          dateNow: dateNow,
          timeNow: timeNow,
          dataJob: resp.detailJob,
          dataUser: resp.detailUser,
          dataUserLogin: resp.dataUserLogin
        })
        //res.redirect('service-chkLogin')
      } else {
        res.redirect('serviceProject')
      }
      // expected output: "Success!"
    });

  } else {
    res.redirect('serviceProject')
  }
})


router.get('/jobDetail_preview/:id', (req, res) => {
  let id = req.params.id
  let idUser = req.cookies['idUserLogin']
  console.log("idUser = " + idUser);

  // async function main() {
  //   await sendData();
  //   await getData();
  // }

  //function sendData() {
  console.log("send DATA for preview" + id);

  const response = new Promise(resolve => {
    unirest.get(urlJobPreview)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send({
        id: id, // job id
        idUser: idUser

      })
      .end((response, response2, response3) => {
        resolve(response.body)
      })
  });

  //response.then((dataManSend, dataManService, dataJob) => {
  response.then((resp, reject) => {
    let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin);
    console.log("cookie = " + val_statusLogin);

    //console.log(dataManSend);
    // console.log(dataManService);
    console.log(resp);
    //res.end()

    res.render('jobDetail_preview', {
      title: contFnTitle,
      subTitle: "รายละเอียด",
      moment: moment,
      dateNow: dateNow,
      timeNow: timeNow,
      //

      dataJob: resp.dataJob,
      dataMan: resp.dataManService,
      dataManSend: resp.dataManSend
      //dataCause: resp.dataCause

    })
  })

})
router.post('/submitRecService', (req, res) => {
  let data = req.body
  console.log(data);

  const response = new Promise(resolve => {
    unirest.post(urlUpdateService)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send(data)
      .end(function (response) {
        resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
        //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
      });
  });
  response.then(function (resp) {
    console.log(resp);
    if (resp.statusLogin == 'autPass') {
      res.cookie('statusLogin', resp.statusLogin)
      let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin
      console.log(val_statusLogin);
      res.render('updateData', {
        title: contFnTitle,
        subTitle: "กำลังอัฟเดทข้อมูล โปรดรอสักครู่",
        moment: moment,
        dateNow: dateNow,
        timeNow: timeNow
      })
      //res.redirect('service-chkLogin')
    } else {
      res.redirect('serviceProject')
    }
    // expected output: "Success!"
  });

})

router.get('/updateSuccess', (req, res) => {
  res.send('OK success')
})


router.get('/serviceAns/:id', (req, res) => {
  let idJob = req.params.id

  res.render('serviceAns', {
    idJob: idJob,
    title: contFnTitle,
    subTitle: "แจ้งผลการซ่อม",
    manCommentTitle: "สาเหตุของการเสีย",
    moment: moment,
    dateNow: dateNow,
    timeNow: timeNow
  })
  //res.send("ans")
})

router.post('/submitAnsService', (req, res) => {
  let data = req.body
  console.log(data);
  const response = new Promise(resolve => {
    unirest.post(urlAnsService)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send(data)
      .end(function (response) {
        resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
        //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
      });
  });
  response.then(function (resp) {
    console.log(resp);
    if (resp.statusLogin == 'autPass') {

      res.cookie('statusLogin', resp.statusLogin)
      //res.send('okPass')
      let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin
      console.log(val_statusLogin);
      res.render('updateData', {
        title: contFnTitle,
        subTitle: "กำลังอัฟเดทข้อมูล โปรดรอสักครู่",
        moment: moment,
        dateNow: dateNow,
        timeNow: timeNow
      })
      //res.redirect('service-chkLogin')
    } else {
      res.redirect('serviceProject')
    }
    // expected output: "Success!"
  });
  //res.end()
})


router.get('/jobDetail/:id', (req, res) => {
  let id = req.params.id
  // async function main() {
  //   await sendData();
  //   await getData();
  // }

  //function sendData() {
  console.log("send DATA" + id);

  const response = new Promise(resolve => {
    unirest.get(urlGetJobDetail)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send({
        id: id
      })
      .end((response) => {
        resolve(response.body)
      })
  });

  //response.then((dataManSend, dataManService, dataJob) => {
  response.then((resp, reject) => {
    let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin);
    console.log("cookie = " + val_statusLogin);

    //console.log(dataManSend);
    // console.log(dataManService);
    console.log(resp);

    res.render('jobDetail', {
      title: contFnTitle,
      subTitle: "รายละเอียด",
      moment: moment,
      dateNow: dateNow,
      timeNow: timeNow,
      //
      dataJob: resp.dataJob,
      dataMan: resp.dataManService,
      dataManSend: resp.dataManSend,
      dataCause: resp.dataCause

    })
  })

})


router.get('/sh', (req, res) => {
  //hell.shutdown
  exec('pkill chromium', function (error, stdout, stderr) {})
  exec('shutdown now', function (error, stdout, stderr) {
    callback(stdout);
  });
  res.send('restart')
})

router.get('/re', (req, res) => {
  //hell.shutdown
  exec('pkill chromium', function (error, stdout, stderr) {})
  setTimeout(() => {
    exec('shutdown -r now', function (error, stdout, stderr) {
      callback(stdout);
    });
  }, 1500);
  res.send('shutdow')
})


module.exports = router;