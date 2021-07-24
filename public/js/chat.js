const socket = io();

const $messageForm = document.querySelector('#form1');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true});

const autoScroll = () => {
    // new messag element
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //Visible height

    const visibleHeight = $messages.offsetHeight;

    //Height of message container

    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;

    }
}

socket.on('message', (message) => {
     console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//locationmessage shared

socket.on('locationMessage', (location) => {
    console.log(location);
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', () => {
    event.preventDefault();
    //disable form

    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = event.target.elements.message.value;
    socket.emit('sendMessage', message,(error) => {
        //enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value ='';
        $messageFormInput.focus();
    
        if (error) {
            return console.log(error);
        }
        console.log('The message was delivered');
    })
});

const $sendButton = document.querySelector('#send-location')
$sendButton.addEventListener('click', () => {
   if (!navigator.geolocation) {
       return alert('Geolocation is not supported by your browser')
   }
   $sendButton.setAttribute('disabled', 'disabled');
   navigator.geolocation.getCurrentPosition((position) => {
       socket.emit('sendLocation', {
           'latitude' : position.coords.latitude,
           'longitude': position.coords.longitude
        }, (ackMessage) => {
            $sendButton.removeAttribute('disabled')
            console.log(ackMessage);
        });

   })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/';
    }
});