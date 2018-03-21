$(document).ready(function(){
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBSWfZiQRYQ-Vw6gC6frjxa1GrK09LJ02I",
    authDomain: "myrpsmultiplayergame.firebaseapp.com",
    databaseURL: "https://myrpsmultiplayergame.firebaseio.com",
    projectId: "myrpsmultiplayergame",
    storageBucket: "myrpsmultiplayergame.appspot.com",
    messagingSenderId: "521429384280"
  };

  firebase.initializeApp(config);

  var db = firebase.database();

    var rpsGame = {
        moves: ['rock', 'scissors', 'paper'],
        myPID: '', //playerID
        myName: '',
        oppPID: '',//opponent playerID
        nullInfo: {
            name:'',
            move:"",
            win:0,
            loss:0,
        },
        myInfo: {
            name:'',
            move:"",
            win:0,
            loss:0,
        },
        oppInfo: {
            name:'',
            move: "",
            win: 0,
            loss: 0,
        },
        ties: 0,
        pTurn:0,
        hideShow: function(arr, hide) {
            $.each(arr, function(key, $slct){
                (hide) ? $($slct).hide() : $($slct).show();
            });            
        },
        addRemoveClass: function(arr, className, add){
            $.each(arr, function(key, $slct){
                (add) ? $($slct).addClass(className) : $($slct).removeClass(className);
            })            
        },
        isSpotOpen: function(data){
            var self = this;
            
            return new Promise(
                function(resolve, reject) {

                    resolve((!data.p1 && data.pObj.p1.name === "") ? {bool: true, spot:'p1'} :
                            (!data.p2 && data.pObj.p2.name === "") ? {bool: true, spot:'p2'} :
                            {bool: false, spot: null});
                });
        },
        getPlayers: function(init){
            var self = this;

            return new Promise(
                function(resolve, reject) {
                    self.getFBVal('gameProp','players').then(function(pObj)
                    {

                        if (init)
                        {
                            //Check existing players when you load the page
                            var p1Exists = false,
                            p2Exists = false;
                            
                            if(pObj.p1 != null)
                            {
                                p1Exists = (pObj.p1.name != "") ? true : false;
                            }

                            if(pObj.p2 != null)
                            {
                                p2Exists = (pObj.p2.name != "") ? true : false;
                            }

                            resolve({p1: p1Exists, p2: p2Exists});
                        }
                        else
                        {
                            //Check existing players after clicking play
                            var p1IsMe = false,
                                p2IsMe = true;

                            if(pObj.p1 != null)
                            {
                                p1IsMe = (pObj.p1.name === self.myName) ? true : false;
                            }

                            if(pObj.p2 != null)
                            {
                                p2IsMe = (pObj.p2.name === self.myName) ? true : false;
                            }

                            resolve({p1: p1IsMe, p2: p2IsMe, 'pObj': pObj });
                        }                        
                    });
                });
        },
        login: function(nameStr){
            var self = this;
                self.myName = nameStr;

            self.getPlayers(false).then(function(data)
                {
                    var pObj = data.pObj;
                    if (data.p1 || data.p2)
                    {
                        //already playing  
                        //This happens if user types in the same name as existing player
                        self.notify({
                            title: `Please enter a different name`,
                            closeTimeout: 2500,
                            closeOnClick: true,
                            text: 'Each player must have a unique name'
                        })
                    }
                    else
                    {
                        self.isSpotOpen(data).then(function(sObj)
                        {
                            if (sObj.bool)
                            {
                                pObj[sObj.spot].name = self.myName;
                                self.setMyPID(sObj.spot);
                                self.myInfo.name = self.myName;
                                self.showPlayerInfo('me');
                                self.notify({
                                    title: `Welcome, ${self.myInfo.name}`,
                                    closeTimeout: 5000,
                                    closeOnClick: true,
                                    text: (pObj.p1.name === "") ? 'Waiting for Player# 1 to join' :
                                              (pObj.p2.name === "") ? 'Waiting for Player# 2 to join' :
                                              `Let's play! It's ${(pObj.p1.name === self.myInfo.name) ? 'your'
                                                : pObj.p1.name + "'s"} turn first`
                                })
                                
                                if ((pObj.p1.name != "") && (pObj.p2.name != ""))
                                {
                                    //startGame if both p1 & p2 exist
                                    db.ref('game/turn').set(-1);
                                    db.ref('game/status').set('startGame');
                                    
                                }
                                //ref to clear player info on disconnect
                                db.ref(`game/players/${self.myPID}`).onDisconnect().set(rpsGame.nullInfo);                                

                            }
                        })
                    }

                })
        },
        displayMove: function(srcPath)
        {
            $(`#${this.myPID}Move`).html(`<img class="bigMove" src="${srcPath}">`);

            var a = srcPath.lastIndexOf('/') + 1,
                b = srcPath.indexOf('_'),
                type = srcPath.substring(a, b);

            //Set move in FB
            db.ref(`game/players/${rpsGame.myPID}/move`).set(type);

            //Set next Turn 
            db.ref(`game/turn`).set((this.myPID==='p1') ? 'p2' : 'score');
        },
        makeMove: function(type){
        },
        getFBRef: function(type, key)
        {
            var thisRef = null

            switch(type)
            {
                case 'gameObj':
                    thisRef = db.ref('game');
                    break;
                case 'gameProp':
                    thisRef =  db.ref(`game/${key}`)
                    break;      
                case 'playersObj':
                    thisRef = db.ref(`game/players/${key}`)
                    break;
                case 'playerProp':
                    thisRef =  (this.myPID != null) ? db.ref(`game/players/${this.myPID}/${key}`) : null;
                    break;
            }

            return thisRef;

        },
        getFBVal: function(type, key)
        {
            var self = this,
                thisRef = this.getFBRef(type,key);

            return new Promise(
                function(resolve, reject) {
                    if(thisRef != null)
                    {
                        thisRef.once("value").then(function(snapshot){
                            resolve(snapshot.val());
                        })
                    }
                    else
                    {
                        reject({Error: `Unable to find key (${key})`});
                    }
                });
            
        },
        updateFB: function(type, key, value)
        {
            var thisRef = this.getFBRef(type, key);           

            if (thisRef != null) thisRef.update(value);
        },
        notify: function(obj) {
            var params = {};
            $.each(obj, function(key, value){
                params[key] = value;
            })
            var notif = app.notification.create(params);

            notif.open();
        },
        initRPS: function(){
            var self = this;

            self.hideShow(['#p1Controls', '#p2Controls'], true);

            $('#p1Title').text('... Waiting for Player #1 ...');
            $('#p2Title').text('... Waiting for Player #2 ...');

            //Check that FB is setup properly 
            self.checkFBStruct().then(function(bool){
                //check to see if a player has already joined the game
                self.getPlayers(true).then(function(pObj){
                    if(pObj.p1 && pObj.p2)
                    {
                        self.hideShow(['#gameZone', '#userInfo'], true);
    
                        self.notify({
                            title: 'Access Denied',                        
                            text: `Only 2 people can play at a time. Multi-Game Feature coming-soon`,
                            closeButton: true,
                        });
                    }
                    else 
                    {
                        if((pObj.p1 && !pObj.p2) || (!pObj.p1 && pObj.p2))
                        {
                            self.setMyPID((pObj.p1) ? 'p2' : 'p1');
                            self.getFBVal('playersObj',self.oppPID).then(function(pObj){
                                self.oppInfo = pObj;
                                self.showPlayerInfo('opp');                        
                            })
                        }
                    }
                });
            })            
        },
        checkFBStruct: function() {
            var self = this;

            return new Promise(
                function(resolve, reject) {
                    //check if players obj exists in DB
                    self.getFBVal('gameProp','players').then(function(data) {
                        if (data === null)
                        {
                            self.updateFB('playersObj','p1', self.nullInfo);
                            self.updateFB('playersObj','p2', self.nullInfo);
                        }
                        resolve(true);
                    })
                });
        },
        showPlayerInfo: function(type){
            var self = this,
                id = (type === 'me') ? self.myPID : self.oppPID,
                info = (type === 'me') ? self.myInfo : self.oppInfo;

            if (self.pTurn === 0)
            {
                //actions that only need to take place on initialization
                self.hideShow([`#${id}Controls`], (type != 'me'));
                self.hideShow(['#userInfo'],(self.myName != ''));
                $(`#${id}Title`).text(info.name);

            }

            self.updateFB('playersObj', id, info);       
            
            $(`#${id}Win`).text(info.win);
            $(`#${id}Lose`).text(info.loss);
        },
        startGame: function() {
            if (this.pTurn === -1)
            {
                db.ref('game/status').set('playing');
                db.ref('game/turn').set('p1');
            }
        },
        enableControls: function() {
            rpsGame.addRemoveClass([`#${rpsGame.myPID}BtnRock`,
                                    `#${rpsGame.myPID}BtnPaper`,
                                    `#${rpsGame.myPID}BtnScissors`], 'disabled', (rpsGame.pTurn != rpsGame.myPID));
        },
        endTurn: function() {
            var self = this;            
            setTimeout(function(){                
                db.ref(`game/players/${self.myPID}`).update(self.myInfo);
                db.ref(`game/status`).set('nextTurn'); 
            },2500);
        },
        scoreTurn: function() {
            var self = this;
            if (self.myInfo.move != "" && self.oppInfo.move != "")
            {
                var myMoveIndex = self.moves.indexOf(self.myInfo.move),
                    oppMoveIndex = self.moves.indexOf(self.oppInfo.move),
                    result = self.getResult(myMoveIndex, oppMoveIndex, self.myInfo.move);
                    //display image in center, increment win/loss
                    $('.gRContentRow').html(`<img class="gRImage" src="assets/images/${result.img}">`);


                //show oppMove
                var imgPath = `<img class="bigMove"src="assets/images/`,
                    imgFile = `${self.oppInfo.move}_${(self.oppPID != 'p1') ? 'R' : 'L'}.png">`;
                $(`#${self.oppPID}Move`).html(imgPath + imgFile);

                //alert user of outcome
                var msg = (result.type === "win") ? "You Won!" : (result.type === "loss") ? "You Loss" : "Tie Game";
                var tType = (result.type === "win") ? "success" : (result.type === "loss") ? "error" : "info";
                rpsGame.updateToastOptions({"positionClass": "toast-center",
                                            "closeButton": false,    
                                            "timeOut": "1800"});
                toastr[tType](msg);

                //increment win loss
                if (result.type != "tie") self.myInfo[result.type] ++;                
                
                //setTimeout(function(){
                self.endTurn();
                //},2500)
                
                
            }
        },
        getResult: function(mv1, mv2, mv1String) {
            switch (mv1 - mv2)
            {
                case 0:
                    return {type: 'tie', img: 'rpsLogo.png'};
                    break;
                case -1:
                case 2:
                    return {type: 'win', img: `${mv1String}Win.png`};    
                    break;
                case 1:
                case-2:
                    var whoWon = (mv1String === 'rock') ? "paper" : 
                                 (mv1String === 'paper') ? "scissors" : "rock";
                    return {type: 'loss', img: `${whoWon}Win.png`};
                    break;
            }

            
        },
        setMyPID: function(id){
            this.myPID = id;
            this.oppPID = (id === 'p1') ? 'p2' : 'p1';
        },
        regPlayerChange: function(type, pInfo, key)
        {   
            var self = this;

            if (type === 'blank') 
            {
                if (pInfo.name != "")
                {
                    self.notify({
                        title: `${pInfo.name} joined the game`,
                        closeTimeout: 2500,
                        closeOnClick: true,
                        text: `Enter your name and click 'Play' to start playing.`
                    });
                }
                else if (self.oppPID != "")
                {
                    var oldOppName = $(`#${self.oppPID}Title`).text();
                    var myName = $(`#${self.myPID}Title`).text();
                    if (oldOppName != "" && oldOppName.substring(0,5) != '... W' && myName.substring(0,5) != '... W') 
                    {
                        self.notify({
                            title: `${oldOppName} left the game`,
                            closeTimeout: 2500,
                            closeOnClick: true,
                            text: `Enter your name and click 'Play' to join. 
                                   Your game will start once another player joins`
                        });
                    }
                    $(`#${self.oppPID}Title`).text(`... Waiting for Player #${self.oppPID[1]} ...`);
                    //db.ref(`game/players/${self.myPID}/move`).set("");
                }
                return;           
            }

            if (type === 'NA')
            {
                self.setMyPID(key); 
                if (pInfo.name != "")  
                {
                    self.notify({
                        title: `${pInfo.name} joined the game`,
                        closeTimeout: 2500,
                        closeOnClick: true,
                        text: `Enter your name and click 'Play' to start playing.`
                    });
                }
                type = 'opp';
            }
            else if (type === 'opp' && self.pTurn === 0)
            {
                self.notify({
                    title: `${pInfo.name} joined your game`,
                    closeTimeout: 2500,
                    closeOnClick: true,
                    text: `Let's play! It's ${(self.myPID === 'p1') ? 'your' : pInfo.name + "'s"} turn first.`
                });
            }
            else if (type === 'oppExit')
            {
                self.notify({
                    title: `${self.oppInfo.name} left the game`,
                    closeTimeout: 2500,
                    closeOnClick: true,
                    text: `Wait here until another player comes to play.`
                });
            }            

            self[(type === 'me') ? 'myInfo' : 'oppInfo'] = pInfo;
            self.showPlayerInfo(type);
        },
        regChange: function(snapshot){
            var self = this, 
                player = snapshot.val(),
                pKey = snapshot.key,
                oppKey = (pKey != 'p1') ?  'p1' : 'p2',
                type =  (player.name != "" && self.myName != "" && self.myPID != "") ? 
                        ((pKey != self.myPID) ? 'opp' : 'me') :                         
                        (player.name != "" && player.name != self.myName) ? 'NA' :
                        (player.name != "" && self.myName === "") ? 'oppEnter': 'blank';
            
            self.regPlayerChange(type, player, oppKey);
        },
        updateToastOptions: function(params)
        {
            $.each(params, function(key, value){
                toastr.options[key] = value;
            })
        }
    };

    db.ref('game').once("value").then(function(snapshot) {   
        db.ref('game/turn').set(0);
        db.ref('game/status').set('init');
    });

    db.ref('game/players').on('child_added', function(snapshot) {
        var player = snapshot.val();
        if(player.name != "")
        {
            //someone has already joined the game on page load
            rpsGame.setMyPID((snapshot.key === 'p1') ? 'p2' : 'p1')       
        }
    });

    //setRef to track p1 changes
    db.ref('game/players').child('p1').on('value', function(snapshot) {
        if (snapshot.val() != null) rpsGame.regChange(snapshot); 
    });

    //setRef to track p2 changes
    db.ref('game/players').child('p2').on('value', function(snapshot) {
        if (snapshot.val() != null) rpsGame.regChange(snapshot);
    });    
    
    //setRef to track status
    db.ref('game/status').on('value', function(snapshot) {
        if (snapshot.val() === 'startGame')
        {
            rpsGame.startGame();
        }
        else if (snapshot.val() === 'nextTurn')
        {
            $('#p1Move').empty();
            $('#p2Move').empty();
            $('.gRContentRow').html(`<img class="gRImage" src="assets/images/rpsLogo.png">`);
            db.ref('game/status').set('playing');
            db.ref('game/turn').set('p1');
        }
    });

    db.ref('game/turn').on('value', function(snapshot) {
        rpsGame.pTurn = snapshot.val(); 
        if (rpsGame.pTurn === 'score')
        {
            //Clear arrows
            $(`.turnColOdd`).empty();
            $(`.turnColEven`).empty();
            rpsGame.addRemoveClass(['#p1Zone', '#p2Zone'], 'activePlayer', false);
            rpsGame.scoreTurn();            
            rpsGame.enableControls();
        }
        else if (typeof rpsGame.pTurn === 'string')
        {
            //Show arrows
            $(`.turnColOdd`).html(`<img src="assets/images/${rpsGame.pTurn}Odd.png">`);
            $(`.turnColEven`).html(`<img src="assets/images/${rpsGame.pTurn}Even.png">`);

            //Highlight Active Player Zone
            rpsGame.addRemoveClass([`#${rpsGame.pTurn}Zone`], 'activePlayer', true);            
            rpsGame.addRemoveClass([`#${(rpsGame.pTurn === 'p1') ? 'p2' : 'p1'}Zone`], 'activePlayer', false);
            rpsGame.enableControls();         
        }
        else
        {
            //Clear arrows
            $(`.turnColOdd`).empty();
            $(`.turnColEven`).empty();
            rpsGame.addRemoveClass(['#p1Zone', '#p2Zone'], 'activePlayer', false);
        }            
    });

    $(".btnRPS").on('click', function(){
        var id = $(this)[0].id,
            path = $(`#${id} img`).attr("src");
        rpsGame.displayMove(path);
    })

    $(".myBtn").on('click', function(){
        var nameStr = $('#myName').val();
        if( nameStr != "")
        {
            rpsGame.login(nameStr);
        }
    })

    rpsGame.initRPS();    

    $(window).resize(function(){
        var width = window.screen.width,
            height = window.screen.height;

        toastr.clear();

        if (width < 650 && width< height)
        {
            rpsGame.updateToastOptions({"positionClass": "toast-bottom-center",
                                        "closeButton": true,
                                        "timeOut": "1500000"});
            toastr["info"]("You'll have a better game experience if you turn this device on its side.");
            console.log($('#toast-container'));
        }
    })

    toastr.options = {
        "preventDuplicates": true,        
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    
});

