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
        //myUID: '', //universal unique ID
        myInfo: {
            name:'',
            //id:'',
            move:"",
            win:0,
            loss:0,
        },
        oppInfo: {
            name:'',
            //id:'',
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
                            //check existing players when you load the page
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
                            //
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
                        self.setMyPID((data.p1) ? 'p1' : 'p2');
                        self.myInfo.name = self.myName;
                        self.updateFB('playersObj', self.myPID, self.myInfo);
                        self.hideShow([`#${self.myPID}Controls`], false);
                        self.hideShow(['#userInfo'], true);
                        $(`#${self.myPID}Title`).text(self.myInfo.name);
                    }
                    else
                    {
                        self.isSpotOpen(data).then(function(sObj)
                        {
                            if (sObj.bool)
                            {
                                //self.myPID = sObj.spot;
                                self.setMyPID(sObj.spot);
                                self.myInfo.name = self.myName;
                                self.updateFB('playersObj', self.myPID, self.myInfo);
                                self.hideShow([`#${self.myPID}Controls`], false);
                                self.hideShow(['#userInfo'], true);
                                $(`#${self.myPID}Title`).text(self.myInfo.name);
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

            this.updateFB('playerProp','move',type)
        },
        changePlayerValue: function(key,value){
            /* this.fbObj[this.myPID][key] = value;
            this.updateFB(key, value); */
        },
        isMyTurn: function(){
            /* return this.fbObj.whosTurn === this.myPID; */ 
        },
        nextTurn: function(){

        },
        makeMove: function(type){
            /* this.changePlayerValue('move', type);
            //this.whosTurn = (this.myPID === 'p1') ? 'p2' : 'p1';
            this.updateFB('whosTurn', this.whosTurn); */
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
        updateThis: function(){

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
                    //p1 exists and p2 doesn't exist
                    self.getFBVal('playersObj',self.oppPID).then(function(pObj){
                        self.oppInfo = pObj;
                        //self.setMyPID('p2');
                        self.showPlayerInfo('opp');                        
                    })
                }
                /* else if (!pObj.p1 && pObj.p2)
                {
                    //p2 exists and p2 doesn't exist
                    self.getFBVal('playersObj','p2').then(function(p2Obj){
                        self.oppInfo = p2Obj;
                        self.setMyPID('p1');
                        self.showPlayerInfo('opp');                        
                    })
                } */
            });
        },
        showPlayerInfo: function(type){
            var self = this,
                id = (type === 'me') ? self.myPID : self.oppPID
                info = (type === 'me') ? self.myInfo : self.oppInfo;
            self.updateFB('playersObj', id, info);
            self.hideShow([`#${id}Controls`], false);
            self.hideShow(['#userInfo'], (type === 'me') ? true : false);

            $(`#${id}Title`).text(info.name);
        },
        setMyPID: function(id){
            this.myPID = id;
            this.oppPID = (id === 'p1') ? 'p2' : 'p1';
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
