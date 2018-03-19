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
                (add) ? $(target).addClass(className) : $(target).addClass(className);
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
                                    closeTimeout: 2500,
                                    closeOnClick: true,
                                    text: (pObj.p1.name === "") ? 'Waiting for Player# 1 to join' :
                                              (pObj.p2.name === "") ? 'Waiting for Player# 2 to join' :
                                              `Let's play! It's ${(pObj.p1.name === self.myInfo.name) ? 'your'
                                                : pObj.p1.name + "'s"} turn first`
                                })
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

            this.updateFB('playerProp','move', type);
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
        startUp: function(){
            var self = this;

            self.hideShow(['#p1Controls', '#p2Controls'], true);

            $('#p1Title').text('...Waiting for Player 1...');
            $('#p2Title').text('...Waiting for Player 2...');

            //Check that FB is setup properly 
            self.checkFBStruct().then(function(bool){
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
                        toastr['info'](`Enter your name and click 'Play' to begin`);
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
                            self.updateFB('playersObj','p1', self.myInfo);
                            self.updateFB('playersObj','p2', self.myInfo);
                        }
                        resolve(true);
                    })
                });
        },
        showPlayerInfo: function(type){
            var self = this,
                id = (type === 'me') ? self.myPID : self.oppPID
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
        setMyPID: function(id){
            this.myPID = id;
            this.oppPID = (id === 'p1') ? 'p2' : 'p1';
        },
        regPlayerChange: function(type, pInfo, key)
        {   
            var self = this;

            if (type === 'blank') return;           

            if (type === 'NA')
            {
                self.setMyPID(key); 
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

                if (self.myPID === 'p1') setTimeout(function(){},500);
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
                type = (player.name != "" && self.myName != "" && self.myPID != "") ? 
                    ((pKey != self.myPID) ? 'opp' : 'me') : 
                    (player.name != "" && player.name != self.myName) ? 'NA' :
                    (player.name === "" && self.myName != "" && self.myPID !="") ? 'oppExit' : 'blank';
            
            self.regPlayerChange(type, player, oppKey);
        }
    };

    db.ref('game').once("value").then(function(snapshot) {
        if(snapshot.val() === null)
        {   
            db.ref().set({game: {turn:0}});
        }
        else
        {
            //setUpGame with UserDetails
        }
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

    //setRef to track move changes
    db.ref('game/turn').on('value', function(snapshot) {

    })

    $(".btnRPS").on('click', function(){
        var path = $(this).children().attr("src");
        rpsGame.displayMove(path);
    })

    $(".myBtn").on('click', function(){
        var nameStr = $('#myName').val();
        if( nameStr != "")
        {
            rpsGame.login(nameStr);
        }
    })

    rpsGame.startUp();    

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-center",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2500",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    
});
