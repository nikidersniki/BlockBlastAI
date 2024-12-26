import json
from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit
import random

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def root():
    return render_template('index.html')

from flask import send_from_directory

@app.route('/templates/<path:path>')
def send_report(path):  
    return send_from_directory('templates', path)

# Websockets
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('buildMap', {'message': 'Welcome!'}, room=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def sendBlock(x, y, color):
    serverGrid[int(x)][int(y)] = 1
    socketio.emit('sendBlock', {'x': x, 'y': y, 'color': color})

@socketio.on('requestBlock')
def requestBlock(x, y, color):
    sendBlock(x, y, color)
    print(str(serverGrid))

@socketio.on('getQueue')
def getQueue():
    global shapes
    if len(queue) < 1:
        queue.append(random.randint(0, len(shapes)-1))
        queue.append(random.randint(0, len(shapes)-1))
        queue.append(random.randint(0, len(shapes)-1))
        queue.append(random.randint(0, len(shapes)-1))
    socketio.emit('sendQueue', {'queue': queue})

@socketio.on('removeQueue')
def removeQueue(data):
    print('Removing from queue:', data)
    global queue
    del queue[int(data)]
    socketio.emit('sendQueue', {'queue': queue})
    if len(queue) < 1:
        getQueue()

def sendShape(shape, x, y):
    print('Sending shape:', shape)
    check_shape_fit(serverGrid, shape, x, y)
    check_and_clear(serverGrid)

def check_shape_fit(serverGrid, shape, pos_x, pos_y):
    draw_list = []
    shapeArr = shapes[int(shape)]["shape"]
    for i in range(len(shapeArr)):
        for j in range(len(shapeArr[i])):
            if shapeArr[i][j] == 1:
                print("Server arr at pos X: " + str(int(pos_x) + j) + "Y: "  + str(int(pos_y) + i) + ":   " + str(serverGrid[int(pos_x) + j][int(pos_y) + i]))
                if int(serverGrid[int(pos_x) + j][int(pos_y) + i]) == 1:
                    print("Shape does not fit")
                    return False
                else:
                    draw_list.append([int(pos_x) + j, int(pos_y) + i, shapes[int(shape)]["color"]])
    print("Shape fits")
    for i in range(len(draw_list)):
        sendBlock(draw_list[i][0], draw_list[i][1], draw_list[i][2])
    socketio.emit('cleanUp')
    return True

def clear(x, y):
    # Placeholder function: Replace with your desired behavior
    print(f"Clearing position ({x}, {y})")
    serverGrid[x][y] = 0
    socketio.emit('clearBlock', {'x': x, 'y': y})

def check_and_clear(serverGrid):
    rows, cols = len(serverGrid), len(serverGrid[0])
    cleared = 0
    # Check for rows filled with 1
    for i in range(rows):
        if all(cell == 1 for cell in serverGrid[i]):
            for j in range(cols):
                clear(i, j)
                cleared += 1

    # Check for columns filled with 1
    for j in range(cols):
        if all(serverGrid[i][j] == 1 for i in range(rows)):
            for i in range(rows):
                clear(i, j)
                cleared += 1
    add_score(cleared*24)

score = 0
def add_score(scoreL):
    global score
    score = score + scoreL
    emit('setScore', {'score': score})

calcPos = [
    [[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2]],
    [[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1]],
    [[-2,0],[-1,0],[0,0],[1,0],[2,0]],
    [[-2,1],[-1,1],[0,1],[1,1],[2,1]],
    [[-2,2],[-1,2],[0,2],[1,2],[2,2]]
]

def draw_shape(serverGrid, shape, pos_x, pos_y):
    ptint('Drawing shape:', shape)

@socketio.on('requestShape')
def requestShape(shape, x, y):
    sendShape(shape,x, y)

if __name__ == '__main__':
    socketio.run(app, debug=True)

serverGrid = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
]


shapes = [
    {
        "name": "Small Square",
        "color": "#FF5733",  # Vibrant Orange
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
        "color": "#33FF57",  # Bright Green
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
        "color": "#3357FF",  # Bold Blue
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
        "color": "#FFC300",  # Golden Yellow
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
        "color": "#C70039",  # Crimson Red
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
        "color": "#900C3F",  # Deep Maroon
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
        "color": "#581845",  # Plum Purple
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
        "color": "#DAF7A6",  # Soft Green
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
        "color": "#FFAA33",  # Amber
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
        "color": "#AAFF33",  # Lime
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
        "color": "#33FFAA",  # Teal
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
        "color": "#8C33FF",  # Purple
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
        "color": "#FF33AA",  # Pink
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
        "color": "#FFA533",  # Orange
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
        "color": "#FF6F33",  # Coral
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
        "color": "#AA33FF",  # Violet
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
        "color": "#FF3399",  # Magenta
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
        "color": "#33FFFF",  # Cyan
        "shape": [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
        ]
    }
]

queue = []
queue.append(random.randint(0, len(shapes)-1))
queue.append(random.randint(0, len(shapes)-1))
queue.append(random.randint(0, len(shapes)-1))
queue.append(random.randint(0, len(shapes)-1))