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
        whosTurn:'',
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
                    if (data.p1 || data.p2)
                    {
                        //already playing  
                        //This happens if user types in the same name as existing player
                        self.setMyPID((data.p1) ? 'p1' : 'p2');                        
                        self.myInfo.name = self.myName;
                        self.showPlayerInfo('me');
                    }
                    else
                    {
                        self.isSpotOpen(data).then(function(sObj)
                        {
                            if (sObj.bool)
                            {
                                self.setMyPID(sObj.spot);
                                self.myInfo.name = self.myName;
                                self.showPlayerInfo('me');
                            }

                            else
                            {
                                //startNew Game

                            }
                        })
                    }
                })
        },
        greetPlayer: function(){

        },
        displayMove: function(srcPath)
        {
            $(`#${this.myPID}Move`).html(`<img class="bigMove" src="${srcPath}">`);

            var a = srcPath.lastIndexOf('/')+1,
                b = srcPath.indexOf('_'),
                type = srcPath.substring(a, b);

            this.updateFB('playerProp','move', type);
        },
        changePlayerValue: function(key,value){
        },
        isMyTurn: function(){
        },
        nextTurn: function(){

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
        startUp: function(){
            var self = this;

            self.hideShow(['#p1Controls', '#p2Controls'], true);

            $('#p1Title').text('...Waiting for Player 1...');
            $('#p2Title').text('...Waiting for Player 2...');

            self.getPlayers(true).then(function(pObj){
                if(pObj.p1 && pObj.p2)
                {
                    self.hideShow(['#gameZone', '#userInfo'], true);
                    console.log('only 2 people can play at a time');
                }
                else if(pObj.p1 && !pObj.p2)
                {
                    self.setMyPID((pObj.p1 && !pObj.p2) ? 'p2' : 'p1');
                    self.getFBVal('playersObj',self.oppPID).then(function(pObj){
                        self.oppInfo = pObj;
                        self.showPlayerInfo('opp');                        
                    })
                }
            });
        },
        showPlayerInfo: function(type){
            var self = this,
                id = (type === 'me') ? self.myPID : self.oppPID
                info = (type === 'me') ? self.myInfo : self.oppInfo;

            self.updateFB('playersObj', id, info);
            self.hideShow([`#${id}Controls`], (type != 'me'));
            self.hideShow(['#userInfo'],(self.myName != ''));

            $(`#${id}Title`).text(info.name);
        },
        setMyPID: function(id){
            this.myPID = id;
            this.oppPID = (id === 'p1') ? 'p2' : 'p1';
        },
        regPlayerChange: function(type, pInfo, key)
        {
            if (type === 'blank') return;           

            if (type === 'NA')
            {
                this.setMyPID(key); 
                type = 'opp';
            }

            this[(type === 'me') ? 'myInfo' : 'oppInfo'] = pInfo;

            /* switch (type)
            {
                case 'blank':
                    return;
                case 'me':
                    this.myInfo = pInfo;
                    break;
                case 'NA': //opp has logged in but you haven't
                    this.setMyPID(key); 
                    type = 'opp'; 
                    //no break on purpoe  
                case 'opp':
                    this.oppInfo = pInfo;    
                    break;
            } */

            this.showPlayerInfo(type);
        }
    };

    /* db.ref().onDisconnect().remove(function(){
        //console.log(rpsGame.myPID);
    }); */

    db.ref('game').once("value").then(function(snapshot) {
        if(snapshot.val() === null)
        {            
            /* var gameObj = {
                players: null,
                turn:0
            };
            db.ref().set({game: {turn:0}}); */
        }
        else
        {
            //setUpGame with UserDetails
        }
    });

    db.ref('game/players').on('child_added', function(snapshot) {
        var player = snapshot.val();
        if(player.name != "")//player != null &&
        {
            //someone has already joined the game on page load
            rpsGame.setMyPID((snapshot.key === 'p1') ? 'p2' : 'p1')       
        }

        //console.log('which player: ' + snapshot.key);
        //console.log(`myPID: ${rpsGame.myPID}, myName: ${rpsGame.myName}`);
    });

    /* db.ref('game/players').on('value', function(snapshot) {
        console.log(snapshot.val());
    }) */

    //setRef to track p1 changes
    db.ref('game/players').child('p1').on('value', function(snapshot) {
        var player = snapshot.val(),
            pKey = snapshot.key;
            type = (player.name != "" && rpsGame.myName != "" && rpsGame.myPID != "") ? 
                   ((pKey != rpsGame.myPID) ? 'opp' : 'me') : 
                   (player.name != "" && player.name != rpsGame.myName) ? 'NA' :'blank';
            
            rpsGame.regPlayerChange(type, player, 'p2');
            if (type != 'blank')console.log(`change to ${type}`);  
    });

    //setRef to track p2 changes
    db.ref('game/players').child('p2').on('value', function(snapshot) {
        var player = snapshot.val(),
            type =  (player.name != "" && rpsGame.myName != "" && rpsGame.myPID != "") ? 
                    ((snapshot.key != rpsGame.myPID) ? 'opp' : 'me') : 
                    (player.name != "" && player.name != rpsGame.myName) ? 'NA' : 'blank';

            rpsGame.regPlayerChange(type, player, 'p1');
            if (type != 'blank')console.log(`change to ${type}`);
    });

    $(".btnRPS").on('click', function(){
        var path = $(this).children().attr("src");
        rpsGame.displayMove(path);
    })

    $("#myName").on('change', function(){
        //rpsGame.addRemoveClass(['.myBtn', 'disabled', false]);
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
