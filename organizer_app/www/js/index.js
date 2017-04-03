document.addEventListener("deviceready", onDeviceReady, false);


function onDeviceReady() {

	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(provider).then(function(result) {
var selectedImage = null;
	var imageUrl = null;
	var ids = null;
	var config = {
		apiKey: "AIzaSyBFluYW_DWuVeaEzCMNFzAaHlVQnK8Qzk8",
		authDomain: "notifications-b01a3.firebaseapp.com",
		databaseURL: "https://notifications-b01a3.firebaseio.com",
		storageBucket: "notifications-b01a3.appspot.com",
		messagingSenderId: "385399873291"
	};
	QRScanner.prepare(function (err, status) {
		console.log(err);
		console.log(status);
	});
	var sendPush = false;
	var sendUpdate = false;
	var uiResetLockCount = 0;
	var goHomeOnBack = false;
	document.addEventListener("backbutton", function() {
		if (goHomeOnBack) {
			QRScanner.cancelScan(function(status) {
				console.log("cancel scan: " + status);
			});
			QRScanner.hide();
			$("body").css("visibility", "visible");
    		$("body").css("background-color", "white");
    		$("#scanner-data").html("");
    		$("#all-content").css('display', 'block');
    		goHomeOnBack = false;
    	}
    	else {
    		navigator.app.exitApp();
    	}
		console.log("back button pressed");
	}, false);

	$("#enableNotification").click(function() {
		if( $(this).is(':checked') ) {
			sendPush = true;
		}
		else {
			sendPush = false;
		}
	});

	$("#enableUpdate").click(function() {
		if( $(this).is(':checked') ) {
			sendUpdate = true;
		}
		else {
			sendUpdate = false;
		}
	});

	firebase.initializeApp(config);
	$("#send").click(function(event) {
		event.preventDefault();
		ids = {
			"browser": [],
			"Android": [],
            "iOS": []
		}
		if (sendUpdate || sendPush) {
			if (sendUpdate && selectedImage == null) {
				alert("You are required to have an image with a live update. Nothing sent");
			}
			else {
				navigator.notification.confirm(
					getConfirmMessage(),
					function(confirmIndex) {
						if (confirmIndex == 1) {
							if (firebase) {
								imageUrl = null;

								if (sendUpdate) {
									if (selectedImage != null) {

										var storageRef = firebase.storage().ref();
										var uuid = guid();
										var newUpload = storageRef.child($("#titleInput").val() + '-' + uuid + '.jpg');

										selectedImage = selectedImage.replace(/\s/g, '');
										var uploadTask = newUpload.putString(selectedImage, 'base64', {contentType:'image/jpg'});
										uploadTask.on('state_changed', function(snapshot) {
										}, function(error) {
											console.log("Image could not be uploaded to firebase");
											alert("Image Upload Failed");
										}, function() {
											imageUrl = uploadTask.snapshot.downloadURL;

											var updates = firebase.database().ref('updates');

											var newUpdate = updates.push();
											newUpdate.set({
												"date": Date.now(),
												"title": $("#titleInput").val(),
												"body": $("#bodyInput").val(),
												"url": imageUrl
											});

											if (sendPush) {
												pushNotification();
												alert("Push notification and update sent");
											}
											else {
												alert("Update sent");
												resetNotificationUI(uiResetLockCount);
											}
										});
									}
									else {
									}
								}
							}

							if (sendPush && !sendUpdate) {
								pushNotification();
								alert("Push notification sent");
							}
						}
					},
					'Confirm Send',           // title
	    		[	'Confirm','Cancel']
	    		);
			}
		}
		else {
			alert("Please select options for notification or update");
		}
	});

	function getConfirmMessage() {
		var message = "";
		if (sendPush) {
			message += "Sending push notification...\n";
		}
		if (sendUpdate) {
			message += "Send live update...\n";
		}
		message += "Title: " + $("#titleInput").val() + "\n";
		message += "Body: " + $("#bodyInput").val();

		return message;
	}

	function resetNotificationUI(resetLockCount) {
		if (resetLockCount == 0) {
			clearActiveButton();
			$("#titleInput").val("");
			$("#bodyInput").val("");
			if (sendUpdate) {
				$("#enableUpdate").click();
			}
			if (sendPush) {
				$("#enableNotification").click();
			}
			selectedImage = null;
		}
	}

	function pushNotification() {
		uiResetLockCount = 2;
		$.get( 'https://api.mlab.com/api/1/databases/push-notification-registrations/collections/registrations?apiKey=Y9MYB5bt3fAyPmJ99eXfiRIJGZK9N-hz&q={"platform":"browser"}', function( data ) {
			 for (var i = 0; i < data.length; i++) {
				ids.browser.push(data[i]._id);
			 }
			 var notification = initNotification();
			 notification.registration_ids = ids.browser;
			 notification.notification.click_action = "https://notifications-b01a3.firebaseapp.com/";
			 notification.notification.icon = "https://notifications-b01a3.firebaseapp.com/assets/images/hackpsulogo.png";
			 if (notification.registration_ids.length > 0) {
				$.ajax({
					url: 'https://fcm.googleapis.com/fcm/send',
					type: "POST",
					processData : false,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Content-Type', 'application/json');
						xhr.setRequestHeader('Authorization', 'key=AAAAWbufXws:APA91bHfXsEZoJ7x4Zqe9qctxnL_73gknZfmznmP7f666KwkULCZ0yrTcueBVPWtZbfNTzK0y9kGWQy4M7h6hw6AESf6TGlgO2YVkJEj-HUDD1GksNtZsJ0mzeroaEodL8wq8oX__luN');
					},
					data: JSON.stringify(notification),
					success: function () {
						uiResetLockCount--;
						resetNotificationUI(uiResetLockCount);
					},
					error: function(error) {
						uiResetLockCount--;
						alert("Error getting registered id's for desktop: " + error);
						resetNotificationUI(uiResetLockCount);
						console.log(error);
					}
				});
			 }

		});
		$.get( 'https://api.mlab.com/api/1/databases/push-notification-registrations/collections/registrations?apiKey=Y9MYB5bt3fAyPmJ99eXfiRIJGZK9N-hz&q={"platform":"Android"}', function( data ) {
			for (var i = 0; i < data.length; i++) {
			 	ids.Android.push(data[i]._id);
			}
			var notification = initNotification();
			notification.registration_ids = ids.Android;
			notification.notification.click_action = "FCM_PLUGIN_ACTIVITY";
			if (notification.registration_ids.length > 0) {
				$.ajax({
					url: 'https://fcm.googleapis.com/fcm/send',
					type: "POST",
					processData : false,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Content-Type', 'application/json');
						xhr.setRequestHeader('Authorization', 'key=AAAAWbufXws:APA91bHfXsEZoJ7x4Zqe9qctxnL_73gknZfmznmP7f666KwkULCZ0yrTcueBVPWtZbfNTzK0y9kGWQy4M7h6hw6AESf6TGlgO2YVkJEj-HUDD1GksNtZsJ0mzeroaEodL8wq8oX__luN');
					},
					data: JSON.stringify(notification),
					success: function () {
						uiResetLockCount--;
						resetNotificationUI(uiResetLockCount);
					},
					error: function(error) {
						uiResetLockCount--;
						resetNotificationUI(uiResetLockCount);
						alert("Error getting registered id's for android: " + error);
					}
				});
			}
		});

    /*
	    $.get( 'https://api.mlab.com/api/1/databases/push-notification-registrations/collections/registrations?apiKey=Y9MYB5bt3fAyPmJ99eXfiRIJGZK9N-hz&q={"platform":"iOS"}', function( data ) {
			console.log(data);
			for (var i = 0; i < data.length; i++) {
			 	ids.iOS.push(data[i]._id);
				console.log("MOBILE PUSHING: " + data[i]._id);
			}
			console.log(ids.iOS);
			var notification = {

				"notification":{
				    "title": $("#titleInput").val(),
				    "body": $("#bodyInput").val(),
				    "sound":"default",
				    "click_action":"FCM_PLUGIN_ACTIVITY",
				    "icon": null
				  },
				  "data":{
				    "title": $("#titleInput").val(),
				    "body": $("#bodyInput").val()
				  },
				  "registration_ids": ids.iOS
				
            };
			if (notification.registration_ids.length > 0) {
				console.log("pushing mobile notifications");
				$.ajax({
					url: 'https://fcm.googleapis.com/fcm/send',
					type: "POST",
					processData : false,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Content-Type', 'application/json');
						xhr.setRequestHeader('Authorization', 'key=AAAAWbufXws:APA91bHfXsEZoJ7x4Zqe9qctxnL_73gknZfmznmP7f666KwkULCZ0yrTcueBVPWtZbfNTzK0y9kGWQy4M7h6hw6AESf6TGlgO2YVkJEj-HUDD1GksNtZsJ0mzeroaEodL8wq8oX__luN');
					},
					data: JSON.stringify(notification),
					success: function () {
						console.log("Mobile Success");
					},
					error: function(error) {
						console.log(error);
					}
				});
			}
		});*/
	}

	function initNotification() {
		var notification = { "notification": {
				"title": $("#titleInput").val(),
				"body": $("#bodyInput").val(),
				"sound":"default",
				"click_action" : null,
				"icon": null
			},
			"priority": "high",
			"data": {
				"title": $("#titleInput").val(),
				"body": $("#bodyInput").val()
			},
			"registration_ids" : null
		};
		return notification;
	}

	$("#takePicture").click(function() {
		navigator.camera.getPicture(function(imageURI) {
			selectedImage = imageURI;
			clearActiveButton($("#choosePicture"));
			setActiveButton($("#takePicture"));
		}, function(message) {
			console.log("Taking picture failed: " + message);
			alert("Taking picture Failed");
		}, {
			destinationType: Camera.DestinationType.DATA_URL,
		    sourceType: Camera.PictureSourceType.CAMERA,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
		});
	});

	$("#choosePicture").click(function() {
		navigator.camera.getPicture(function(imageURI) {
			selectedImage = imageURI;
			clearActiveButton($("#takePicture"));
			setActiveButton($("#choosePicture"));
		}, function(message) {
			console.log("Image selection failed: " + message);
			alert("Image Selection Failed");
		}, {
		    destinationType: Camera.DestinationType.DATA_URL,
		    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
		});
	});

	function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}

	// Reposition the popover if the orientation changes.
	window.onorientationchange = function() {
	    var cameraPopoverHandle = new CameraPopoverHandle();
	    var cameraPopoverOptions = new CameraPopoverOptions(0, 0, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY);
	    cameraPopoverHandle.setPosition(cameraPopoverOptions);
	}
  $("#shirt").click(function(){
  			$("#all-content").css('display', 'none');
			scanIt(1);
  });
  $("#checkin").click(function(){
  			$("#all-content").css('display', 'none');
			scanIt(2);
  });

	function scanIt(use){
	  QRScanner.show();
	  $("body").css("visibility", "hidden");
	  $("body").css("background-color", "transparent");
	  goHomeOnBack = true;
	  QRScanner.scan(function(err, text){
	    if(err){
	      switch(err){
	        case 0:
	          alert("An unexpected error!!");
	          break;
	        case 1:
	          alert("Camera access denied!!");
	          break;
	        case 2:
	          alert("Camera access is restricted");
	          break;
	        case 3:
	          alert("The back camera is unavailable.");
	          break;
	        case 4:
	          alert("The front camera is unavailable.");
	          break;
	        default:
	          console.log("error code: " + err);
	      }
	    }
	    else {
			if(use == 1){
				dataCheck(text);
			}else if(use == 2){
				registerPost(text);
				 $("#scanner-data").html("<h1> sent!! </h1> <button>Done</button>");
				 $("#scanner-data button").click(function(){
						$("#scanner-data").html("");
	  					$("#all-content").css('display', 'block');
	  					goHomeOnBack = false;
				 });
			}
			console.log(text);
		}
	    QRScanner.hide();
	    $("body").css("visibility", "visible");
	    $("body").css("background-color", "white");
	  });
	}
	// gets data from firebase
	function dataCheck(qrId){
		firebase.database().ref("test-hackers/registered-hackers/" + qrId ).once("value").then( function(snapshot){
				render(snapshot.val());
		});
	}
	// checks for requirements
	function logicCheck(data){
		if(!data){
			 return 0;
		}else if(data.rsvp === false){
			 return 1;
		}else if(data.got_shirt === true ){
			 return 2;
		}else if(data.rsvp === true && data.got_shirt === false){
			registerPost(data._id);
			 return 3;
		}else return 4;
	}
	// interacts with div
	function render(data){
		num = logicCheck(data);
	 var email = "<tr><td>email</td> <td>"+data.email + "</td></tr>";
	 var firstName = "<tr><td>first name</td> <td>"+data.first_name + "</td></tr>";
	 var lastName = "<tr><td>last name</td> <td>"+data.last_name + "</td></tr>";
	 var rsvp = "<tr><td>rsvp</td> <td>"+data.rsvp + "</td></tr>";
	 var gotTshirt = "<tr><td>got tshirt</td> <td>"+data.got_shirt + "</td></tr>";
	 var shirtSize = "<tr><td>shirt size</td> <td>"+ data.shirt_size + "</td></tr>";
	 var signedIn = "<tr><td>signed in</td> <td>"+data.signed_in + "</td></tr>";
	 var done = "<button>Done</button>";

	 if(num === 0){
		 $("#scanner-data").css("background-color", "red");
		 $("#scanner-data").html("<h1>Not Registered in DB</h1>" + done);
	 }else if(num == 1){
		 var heading = "<h1>did not RSVP</h1>"
		 var table = "<table>" + firstName + lastName + rsvp + shirtSize + "</table>";
		 $("#scanner-data").css("background-color", "red");
		 $("#scanner-data").html(heading + table + shirtSize + done);
	 }else if(num == 2){
		 var heading = "<h1> Signed in and / or got  t-shirt</h1>";
		 var table = "<table>" + firstName + lastName + rsvp + signedIn + gotTshirt + shirtSize +"</table>";
		 $("#scanner-data").css("background-color", "red");
		 $("#scanner-data").html(heading + table + done);
	 }else if(num == 3){
		 var heading = "<h1>All good Tshirt: " + data.shirt_size + "</h1>";
		 var table = "<table>" + firstName + lastName + rsvp + signedIn + gotTshirt + shirtSize + "</table>";
		 firebase.database().ref("test-hackers/registered-hackers/" + data._id ).update({
	 		signed_in: true,
			got_shirt: true
	 	});
		 $("#scanner-data").css("background-color", "green");
		 $("#scanner-data").html(heading + table + done);
	 }else if(num == 4){
		 var heading = "<h1> Warning!!: something is fishy</h1>";
		 var table = "<table>" + firstName + lastName + rsvp + signedIn + gotTshirt + shirtSize + "</table>";
		 $("#scanner-data").css("background-color", "red");
		 $("#scanner-data").html(heading + table + done);
	 }

	 $("#scanner-data button").click(function(){
			$("#scanner-data").html("");
	  		$("#all-content").css('display', 'block');
	  		goHomeOnBack = false;
	 });
	}

	function registerPost(id){
		firebase.database().ref("test-hackers/registered-hackers/" + id ).update({
			"signed_in": true
		});
	}

	function clearActiveButton(obj) {
		if (obj) {
			obj.removeClass("active-button");
			obj.addClass("button");
		}
		else {
			$(".active-button").each(function() {
				$(this).removeClass("active-button");
				$(this).addClass("button");
			});
		}
	}



	function setActiveButton(obj) {
		obj.removeClass("button");
		obj.addClass("active-button");
	}
	}).catch(function(error) {
		console.error(error);
	}) 
	


}

//end of device ready

