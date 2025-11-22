let scenario = 1;
let isPlaying = false;
let time = 0;
let failSafeMode = false;
let vehicleX = 0;
let vehicleY = 0;
let vehicleSpeed = 13.9;
let steadyStateSpeed = 13.9;
let isBraking = false;
let brakeActivationTime = null;
let pathCleared = false;
let hasCollision = false;
let stopped = false;
let lostTime = 0;
let pedX = 35;
let pedY = 0;
let pedSpeed = 0;
let pedDirection = 1;

const scenarios = [
    { 
        id: 1, 
        pedSpeed: 0, 
        pedYStart: 0, 
        pedDirection: 0,
        desc: "Static Pedestrian Center",
        detail: "Standing still at y=0m - direct path"
    },
    { 
        id: 2, 
        pedSpeed: 1.67, 
        pedYStart: -5, 
        pedDirection: 1,
        desc: "Pedestrian Crossing Into Path",
        detail: "Moving at 6 kph from y=-5m toward vehicle"
    },
    { 
        id: 3, 
        pedSpeed: 1.67, 
        pedYStart: 5, 
        pedDirection: -1,
        desc: "Pedestrian Moving Away",
        detail: "Moving at 6 kph from y=5m away from path"
    },
    { 
        id: 4, 
        pedSpeed: 1.67, 
        pedYStart: -7, 
        pedDirection: 1,
        desc: "Pedestrian Far Left Entry",
        detail: "Moving at 6 kph from y=-7m into path"
    },
    { 
        id: 5, 
        pedSpeed: 1.67, 
        pedYStart: 7, 
        pedDirection: 1,
        desc: "Pedestrian Far Right Entry",
        detail: "Moving at 6 kph from y=7m into path"
    },
    { 
        id: 6, 
        pedSpeed: 0, 
        pedYStart: -2, 
        pedDirection: 0,
        desc: "Static Pedestrian Left Side",
        detail: "Standing still at y=-2m near path edge"
    },
    { 
        id: 7, 
        pedSpeed: 0, 
        pedYStart: 2, 
        pedDirection: 0,
        desc: "Static Pedestrian Right Side",
        detail: "Standing still at y=2m near path edge"
    },
    { 
        id: 8, 
        pedSpeed: 3.33, 
        pedYStart: -3, 
        pedDirection: 1,
        desc: "Fast Pedestrian Crossing",
        detail: "Moving at 12 kph from y=-3m (maximum speed)"
    },
    { 
        id: 9, 
        pedSpeed: 1.67, 
        pedYStart: 0, 
        pedDirection: 1,
        desc: "Pedestrian At Center Moving",
        detail: "Moving at 6 kph starting from y=0m"
    },
    { 
        id: 10, 
        pedSpeed: 0.833, 
        pedYStart: -6, 
        pedDirection: 1,
        desc: "Slow Pedestrian Crossing",
        detail: "Moving at 3 kph from y=-6m (slow crossing)"
    }
];

function setup() {
    let canvas = createCanvas(1200, 600);
    canvas.parent('canvas-container');
    
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('resetBtn').addEventListener('click', resetSim);
    document.getElementById('prevBtn').addEventListener('click', () => changeScenario(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changeScenario(1));
    document.getElementById('failSafeCheck').addEventListener('change', (e) => {
        failSafeMode = e.target.checked;
        resetSim();
    });
    
    document.getElementById('scenarioSelect').addEventListener('change', (e) => {
        scenario = parseInt(e.target.value);
        resetSim();
        updateUI();
    });
    
    resetSim();
    updateUI();
}

function draw() {
    background(20, 20, 35);
    
    const scale = 12;
    const offsetX = 100;
    const offsetY = height / 2;
    
    drawRoad(scale, offsetX, offsetY);
    drawAxes(offsetX, offsetY);
    
    if (isPlaying && vehicleX < 80 && !hasCollision) {
        updateSimulation();
    } else if (vehicleX >= 80) {
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ Play Simulation';
    }
    
    drawCollisionZone(scale, offsetX, offsetY);
    drawPedestrian(scale, offsetX, offsetY);
    drawVehicle(scale, offsetX, offsetY);
    drawStats(offsetX, offsetY, scale);
}

function drawRoad(scale, offsetX, offsetY) {
    fill(35, 40, 50);
    noStroke();
    rect(offsetX, offsetY - scale * 1.5, width - offsetX, scale * 3);
    
    stroke(80, 80, 100);
    strokeWeight(2);
    for (let x = offsetX; x < width; x += 40) {
        line(x, offsetY, x + 20, offsetY);
    }
}

function drawAxes(offsetX, offsetY) {
    stroke(100, 110, 130);
    strokeWeight(3);
    line(offsetX, 0, offsetX, height);
    line(0, offsetY, width, offsetY);
    
    fill(160, 174, 192);
    noStroke();
    textSize(14);
    textAlign(LEFT);
    text('X-axis (vehicle path) →', offsetX + 15, offsetY + 25);
    text('↑ Y', offsetX - 35, 30);
    
    textAlign(CENTER);
    for (let i = 0; i <= 60; i += 10) {
        let x = offsetX + i * 12;
        if (x < width - 50) {
            stroke(100, 110, 130);
            line(x, offsetY - 5, x, offsetY + 5);
            noStroke();
            fill(160, 174, 192);
            text(i + 'm', x, offsetY + 40);
        }
    }
}

function drawCollisionZone(scale, offsetX, offsetY) {
    if (vehicleX < 50) {
        stroke(isBraking ? color(249, 115, 22, 200) : color(59, 130, 246, 150));
        strokeWeight(3);
        noFill();
        drawingContext.setLineDash([10, 10]);
        rect(
            offsetX + vehicleX * scale + scale * 2,
            offsetY - scale * 1.5,
            Math.max(0, (pedX - vehicleX - 2)) * scale,
            scale * 3
        );
        drawingContext.setLineDash([]);
    }
}

function drawPedestrian(scale, offsetX, offsetY) {
    const pedScreenX = offsetX + pedX * scale;
    const pedScreenY = offsetY - pedY * scale;
    
    fill(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    stroke(hasCollision ? color(200, 50, 50) : color(230, 170, 50));
    strokeWeight(3);
    circle(pedScreenX, pedScreenY, scale * 1);
    
    noFill();
    stroke(hasCollision ? color(239, 68, 68, 100) : color(251, 191, 36, 100));
    strokeWeight(2);
    circle(pedScreenX, pedScreenY, scale * 1.5);
    
    stroke(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    strokeWeight(4);
    line(pedScreenX, pedScreenY + scale * 0.3, pedScreenX, pedScreenY + scale * 0.8);
    
    if (pedSpeed > 0) {
        stroke(251, 191, 36);
        strokeWeight(3);
        noFill();
        let arrowY = pedScreenY - scale * 1.2;
        line(pedScreenX, arrowY, pedScreenX, arrowY - scale * 0.8);
        line(pedScreenX, arrowY - scale * 0.8, pedScreenX - scale * 0.2, arrowY - scale * 0.6);
        line(pedScreenX, arrowY - scale * 0.8, pedScreenX + scale * 0.2, arrowY - scale * 0.6);
    }
}

function drawVehicle(scale, offsetX, offsetY) {
    const vehScreenX = offsetX + vehicleX * scale;
    const vehScreenY = offsetY - vehicleY * scale;
    
    fill(isBraking ? color(249, 115, 22) : color(59, 130, 246));
    noStroke();
    rect(
        vehScreenX - scale * 1,
        vehScreenY - scale * 1.5,
        scale * 4,
        scale * 3
    );
}

function drawStats(offsetX, offsetY, scale) {
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT);
    
    let yPos = 30;
    text(`Time: ${time.toFixed(2)}s`, 15, yPos);
    yPos += 25;
    text(`Vehicle X: ${vehicleX.toFixed(1)}m`, 15, yPos);
    yPos += 25;
    text(`Speed: ${(vehicleSpeed * 3.6).toFixed(1)} kph`, 15, yPos);
    yPos += 25;
    text(`Pedestrian: (${pedX.toFixed(1)}m, ${pedY.toFixed(1)}m)`, 15, yPos);
    yPos += 25;
    text(`Ped Speed: ${(pedSpeed * 3.6).toFixed(1)} kph`, 15, yPos);
    yPos += 25;
    
    const distance = Math.sqrt(Math.pow(vehicleX - pedX, 2) + Math.pow(vehicleY - pedY, 2));
    text(`Distance to Ped: ${distance.toFixed(1)}m`, 15, yPos);
    yPos += 25;
    text(`Lost Time: ${lostTime.toFixed(2)}s`, 15, yPos);
    yPos += 30;
    
    if (stopped) {
        fill(255, 0, 0);
        textSize(18);
        text('⏸ STOPPED - Waiting for pedestrian', 15, yPos);
    } else if (isBraking) {
        fill(249, 115, 22);
        textSize(18);
        text('⚠ EMERGENCY BRAKING ACTIVE', 15, yPos);
        yPos += 25;
        fill(255);
        textSize(14);
        text(`Brake delay: ${failSafeMode ? '900ms' : '200ms'}`, 15, yPos);
    } else if (pathCleared) {
        fill(16, 185, 129);
        textSize(18);
        text('✓ Path Clear - Resuming Speed', 15, yPos);
    } else {
        fill(16, 185, 129);
        textSize(16);
        text('● Monitoring Path...', 15, yPos);
    }
    
    if (hasCollision) {
        fill(239, 68, 68);
        textSize(32);
        textAlign(CENTER);
        text('⚠ COLLISION DETECTED!', width / 2, 60);
        textSize(20);
        text('System Failed - Zero Collision Requirement Violated', width / 2, 95);
    }
    
    fill(failSafeMode ? color(239, 68, 68) : color(16, 185, 129));
    textSize(14);
    textAlign(RIGHT);
    text(failSafeMode ? 'FAIL-SAFE MODE (900ms)' : 'NORMAL MODE (200ms)', width - 15, 30);
    
    const responseTime = failSafeMode ? 0.9 : 0.2;
    fill(200, 200, 220);
    text(`Brake Response: ${(responseTime * 1000).toFixed(0)}ms`, width - 15, 55);
    text(`Max Decel: 0.7g`, width - 15, 80);
}

function updateSimulation() {
    const dt = 0.016;
    time += dt;
    
    const currentScenario = scenarios[scenario - 1];
    
    if (currentScenario.pedSpeed > 0) {
        pedY += currentScenario.pedSpeed * currentScenario.pedDirection * dt;
    }
    
    const responseTime = failSafeMode ? 0.9 : 0.2;
    const safetyBuffer = 4.0;
    
    let timeToReachPed = 999;
    if (vehicleSpeed > 0.1) {
        timeToReachPed = (pedX - vehicleX - 2) / vehicleSpeed;
    }
    
    const pedYAtIntersection = pedY + (currentScenario.pedSpeed * currentScenario.pedDirection * timeToReachPed);
    
    const collisionThreshold = 1.8;
    const willCollide = Math.abs(pedYAtIntersection) <= collisionThreshold && timeToReachPed > 0 && timeToReachPed < 10;
    
    const distanceToPed = pedX - vehicleX;
    
    const brakingDistance = (vehicleSpeed * vehicleSpeed) / (2 * 0.7 * 9.81);
    const requiredStopDistance = brakingDistance + (responseTime * vehicleSpeed) + safetyBuffer;
    
    if (currentScenario.pedSpeed === 0) {
        if (distanceToPed < requiredStopDistance && distanceToPed > 0) {
            if (!isBraking) {
                isBraking = true;
                brakeActivationTime = time;
            }
            
            if (time - brakeActivationTime >= responseTime) {
                const deceleration = 0.7 * 9.81;
                vehicleSpeed = Math.max(0, vehicleSpeed - deceleration * dt);
                
                if (distanceToPed < safetyBuffer) {
                    vehicleSpeed = 0;
                    stopped = true;
                    lostTime += dt;
                }
            }
        }
    } else {
        if (willCollide && distanceToPed < requiredStopDistance && distanceToPed > 0) {
            if (!isBraking) {
                isBraking = true;
                brakeActivationTime = time;
            }
            
            if (time - brakeActivationTime >= responseTime) {
                const deceleration = 0.7 * 9.81;
                vehicleSpeed = Math.max(0, vehicleSpeed - deceleration * dt);
                
                if (Math.abs(pedYAtIntersection) < collisionThreshold && distanceToPed < safetyBuffer) {
                    vehicleSpeed = 0;
                    stopped = true;
                    lostTime += dt;
                }
            }
        } else if (Math.abs(pedY) > collisionThreshold + 1) {
            if (isBraking || stopped) {
                pathCleared = true;
            }
            isBraking = false;
            stopped = false;
        }
    }
    
    if (!isBraking && vehicleSpeed < steadyStateSpeed) {
        const acceleration = 0.25 * 9.81;
        vehicleSpeed = Math.min(steadyStateSpeed, vehicleSpeed + acceleration * dt);
    }
    
    if (!stopped) {
        vehicleX += vehicleSpeed * dt;
    }
    
    const actualDistance = Math.sqrt(Math.pow(vehicleX - pedX, 2) + Math.pow(vehicleY - pedY, 2));
    if (actualDistance < 2.0 && Math.abs(vehicleX - pedX) < 2.5 && Math.abs(pedY) < 1.5) {
        hasCollision = true;
        isPlaying = false;
        vehicleSpeed = 0;
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play Simulation';
}

function resetSim() {
    isPlaying = false;
    time = 0;
    vehicleX = 0;
    vehicleY = 0;
    vehicleSpeed = steadyStateSpeed;
    isBraking = false;
    hasCollision = false;
    pathCleared = false;
    stopped = false;
    lostTime = 0;
    brakeActivationTime = null;
    
    const currentScenario = scenarios[scenario - 1];
    pedX = 35;
    pedY = currentScenario.pedYStart;
    pedSpeed = currentScenario.pedSpeed;
    pedDirection = currentScenario.pedDirection;
    
    document.getElementById('playBtn').textContent = '▶ Play Simulation';
    updateUI();
}

function changeScenario(direction) {
    scenario = constrain(scenario + direction, 1, 10);
    resetSim();
    updateUI();
}

function updateUI() {
    const currentScenario = scenarios[scenario - 1];
    document.getElementById('scenarioNum').textContent = `Scenario ${scenario}/10`;
    document.getElementById('scenarioDesc').textContent = currentScenario.desc;
    document.getElementById('scenarioSelect').value = scenario;
    
    document.getElementById('prevBtn').disabled = scenario === 1;
    document.getElementById('nextBtn').disabled = scenario === 10;
}

function keyPressed() {
    if (key === ' ') togglePlay();
    if (key === 'r' || key === 'R') resetSim();
}