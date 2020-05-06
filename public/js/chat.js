const socket = io();

// elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationFormButton = document.querySelector("#send-location");

const $messages = document.querySelector("#messages");

// template
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
    "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// optios
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

// methods

const autoscroll = () => {
    console.log("autoscroll is called ");

    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

// listners

// location
socket.on("locationMessage", (locationMessage) => {
    const { username, text, createdAt } = locationMessage;
    console.log(`loc: ${createdAt} - ${text} - ${username}`);
    const html = Mustache.render(locationMessageTemplate, {
        username,
        locationMessage: text,
        createdAt: moment(createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

// message
socket.on("message", (message) => {
    const { username, text, createdAt } = message;
    console.log(`msg: ${createdAt} - ${text} - ${username}`);

    const html = Mustache.render(messageTemplate, {
        username,
        message: text,
        createdAt: moment(createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML = html;
});

// submit
$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    //disabled the button
    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;

    socket.emit("sendMessage", message, (error, ackMsg) => {
        //enabled the button
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.error(error);
        }

        console.log("Message delivered ", ackMsg);
    });
});

// loc buttom
$locationFormButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $locationFormButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position.coords);
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };

        socket.emit("sendLocation", location, (error, ackMsg) => {
            $locationFormButton.removeAttribute("disabled");
            if (error) {
                return console.error(error);
            }
            console.log("Location Shared ", ackMsg);
        });
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});