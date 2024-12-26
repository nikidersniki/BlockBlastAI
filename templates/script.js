var socket = io.connect('http://127.0.0.1:5000/', {
    path: '/socket.io',
    transports: ['websocket']
});

let grid = document.getElementById("grid");
let x = 8;
let y = 8;
for (let iX = 0; iX < x; iX++) {
    for (let iY = 0; iY < y; iY++) {
        let block = document.createElement("div");       
        block.style.width = "12.5%";
        block.style.height = "12.5%";
        block.id = "slot" + iX + "-" + iY;
        block.classList.add("gridSlot");
        block.setAttribute("onmouseover", "hoverSlot("+ iX + "," + iY + ");");
        block.setAttribute("onClick", "clickSlot("+ iX + "," + iY + ");");
        grid.append(block);
    }
}

socket.on('connect', function() {
    console.log('Connected to server');
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
});

socket.on('buildMap', function(data) {
    console.log('Received buildMap event:', data);
});

socket.on("sendBlock", function(data) {
    console.log('Received sendBlock event:', data);
    let block = document.getElementById("slot" +data.x + "-" + data.y);
    block.classList.add("filled");
    block.style.outline = "10px outset "+data.color; 
    block.style.backgroundColor = data.color;
});

document.getElementById("addSquare").addEventListener("click", function(event) {
    col = document.getElementById("add-color").value
    x = document.getElementById("add-x").value
    y = document.getElementById("add-y").value
    socket.emit('requestBlock', x, y, col); 
    console.log('Requested block:', x, y, col);
});

document.getElementById("addShape").addEventListener("click", function(event) {
    shape = document.getElementById("shape-id").value
    x = document.getElementById("add-shape-x").value
    y = document.getElementById("add-shape-y").value
    socket.emit('requestShape', shape, x, y); 
    console.log('Requested Shape:', shape, x, y);
});

function hoverSlot(X, Y){
    X = X -2;
    Y = Y -2;
    drawList = [];
    console.log("Hovering over slot: ", X, Y);
    try {
        shapeArr = shapes[document.getElementById("shape-id").value].shape;
    } catch (error) {
        console.log("Error: No shape selected");
        return;
    }
    console.log("Shape: ", shapeArr);
    document.querySelectorAll(".hover").forEach(function(slot) {
        slot.classList.remove("hover");
    });
    for (let i = 0; i < shapeArr.length; i++) {
        for (let j = 0; j < shapeArr[i].length; j++) {
            if (shapeArr[i][j] === 1) {
                console.log(`Server arr at pos X: ${parseInt(X) + j}, Y: ${parseInt(Y) + i} is 1`);
                drawList.push([parseInt(X) + j, parseInt(Y) + i]);
            }
        }
    }
    drawList.forEach(function(slot) {
        item = document.getElementById("slot" + slot[0] + "-" + slot[1]);
        document.getElementById("slot" + slot[0] + "-" + slot[1]).classList.add("hover");
    });
}
function getQueue(){
    socket.emit('getQueue');
}
getQueue();
selectedShape = NaN;
selectedQueue = NaN;
socket.on('sendQueue', function(data) {
    console.log(data);
    document.getElementById("queue").innerHTML = "";
    queueCounter = 0;
    data.queue.forEach(function(sShape) {
        let queueItem = document.createElement("div");
        queueItem.classList.add("queueItem");
        queueItem.classList.add("shape-"+sShape);
        queueItem.addEventListener("click", function(event) {
            selectedQueue = 0;
            selectedShape = sShape;
            document.getElementById("shape-id").value = sShape;
            document.querySelectorAll(".queueItem").forEach(function(item) {
                item.classList.remove("selectedShape");
            });
            queueItem.classList.add("selectedShape");
            selectedQueue = queueItem.id.replace("queueIndex", "");
        });
        queueItem.id = "queueIndex" + queueCounter;
        queueCounter++;
        shapes[sShape].shape.forEach(function(shape) {
            shape.forEach(function(slot) {
                let block = document.createElement("div");
                block.classList.add("queueSlot");
                block.style.backgroundColor = "transparent";
                if (slot === 1) {
                    block.style.backgroundColor = shapes[sShape].color;
                }
                queueItem.append(block);
            });
        });
        document.getElementById("queue").append(queueItem);
        });
});

socket.on('clearBlock', function(data) {
    console.log('Received clearBlock event:', data);
    let block = document.getElementById("slot" +data.x + "-" + data.y);
    block.style.backgroundColor = "#232c55";
    block.style.outline = "none"; 
    block.classList.remove("filled");

});

socket.on('setScore', function(data) {
    console.log('Received Score:', data.score);
    document.getElementById("score").innerHTML = data.score;
});

function clickSlot(X, Y){
    X = X -2;
    Y = Y -2;
    socket.emit('requestShape', document.getElementById("shape-id").value, X, Y); 
}
 
socket.on('cleanUp', function() {
    socket.emit('removeQueue', selectedQueue);
    selectedQueue = NaN; 
    document.getElementById("shape-id").value = NaN; 
    document.querySelectorAll(".hover").forEach(function(slot) {
        slot.classList.remove("hover");
    });
});

shapes = [
    {
        "name": "Small Square",
        "color": "#FF5733",  //Vibrant Orange
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Vertical Line",
        "color": "#33FF57",  //Bright Green
        "shape": [
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ]
    },
    {
        "name": "Horizontal Line",
        "color": "#3357FF",  //Bold Blue
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "C Left",
        "color": "#FFC300",  //Golden Yellow
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "C Right",
        "color": "#C70039",  //Crimson Red
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "C Up",
        "color": "#900C3F",  //Deep Maroon
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "C Down",
        "color": "#581845",  //Plum Purple
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Step Up",
        "color": "#DAF7A6",  //Soft Green
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Step Up 4",
        "color": "#FFAA33",  //Amber
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Step Up 2",
        "color": "#AAFF33",  //Lime
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Step Up 3",
        "color": "#33FFAA",  //Teal
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Big L Shape",
        "color": "#8C33FF",  //Purple
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Big L Shape Reverse",
        "color": "#FF33AA",  //Pink
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Big L Shape Variant 1",
        "color": "#FFA533",  //Orange
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Big L Shape Variant 2",
        "color": "#FF6F33",  //Coral
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "L Shape",
        "color": "#AA33FF",  //Violet
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Reverse L Shape",
        "color": "#FF3399",  //Magenta
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
    },
    {
        "name": "Large Square",
        "color": "#33FFFF",  //Cyan
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    }
]
