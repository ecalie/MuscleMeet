/*$(function(){
  var socket =io.connect("http://localhost:3000");
  var message = $("#message")
  var username =  $("#username")
  var send_message =  $("#send_message")
  var send_username =  $("#send_username")
  var chatroom =  $("#chat")
  
  send_message.click(function(){
    socket.emit("new_message",{message:message.val()});
  })
  socket.on("new_message",(data)=> {
    console.log(data);
    chatroom.append("<p chass='message'>"+data.username+": "+data.message+"</p>")
  })
  send_username.click(function(){
    console.log(username.val())
    socket.emit("change_username", {username : username.val()})
  })
});
*/
function startChat (user)
{
    // global io
    var socket = io.connect();

    
    socket.on('broadcast-msg', function(data) {
      console.log('Get broadcast msg: ', data);
      var msg = data + '<br/>';
      $('#chat').append(msg);
      $('#chat')[0].scrollTop = $('#chat')[0].scrollHeight;
    });

    //print new data to #users
    socket.on('updateUsers', function(data) {
      console.log('Get user msg: ', data);
      $('#users').html('');
      var msg = ''
      for (user in data){
        msg += data[user] + '<br/>';
      }  
      $('#users').append(msg);
    });

    //create new socket connection
    socket.on('connect', function(){

      socket.emit('setUserName', user);

      $('#msg-input').change(function() {
        var txt = $(this).val();
        $(this).val('');
        socket.emit('emit-msg', txt, function(data) {
          console.log('Emit Broadcast Msg: ', data);
        });
      });
    });
};
