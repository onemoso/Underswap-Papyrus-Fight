if (window.__mobileControlsLoaded) {
} else {
    window.__mobileControlsLoaded = true;

window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && e.reason.message ? e.reason.message : '';
    if (msg.indexOf('message channel closed') !== -1 || msg.indexOf('asynchronous response') !== -1) {
        e.preventDefault();
        e.stopPropagation();
    }
});

window.addEventListener('error', function(e) {
    if (e.message && e.message.indexOf('message channel closed') !== -1) {
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
});

(function() {
    var c2canvas = null;
    var mkCanvas = null;
    var sndMkEnable = null;
    var sndMkDisable = null;

    var GAME_W = 640;
    var GAME_H = 480;

    var ctx = null;

    var C_AQUA = [0, 200, 200];
    var C_ORANGE = [255, 140, 0];
    var C_GREEN = [0, 130, 0];
    var C_WHITE = [255, 255, 255];

    var BTN_ALPHA = 0.5;
    var SPRITE_A = 0.41;

    var spr = new Image();
    spr.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADVklEQVR42u1b63HDIAxWctnDS/i8CHOyiC9LeJL2R6McpQL0JG5T/WquttD36QEIfIFJsm3bh+T5fd8vM+wKG6QGvO/7hUsC9WwUIe5K0XAKxLIsLB3HcTQJ8SbCTRnlXS5gKSGeRJiVaL3sRYaVCPXLs4FHEXHVgscBl2WZDr4eV1JgaxGzVg70CuCUlNEgjQT2w97A6xD21sklgpUCdch7SUoJUkpu+jQpMWQJwW/b9uE5rdXAc86u0ybaPIqEG0chgj+O4zR53wP/sNEeARhGJWgrCZT3UaxRUNuGNaEXBc0aQIHH39TK7NVCOQZ/9+oBScAod7Qk9LwP8FUUtXp7kdMris0aMCp6Z6kJIxtG9eCHl1uhrzWgfI475XFrgcQBrXrAmgV6IomEnLN1OBX4nnxjQ+p9i0FlREirvxY8FQWqzRAls2YH77rzJMDi/VkkWMFT06JbBESTEDXjXJERz16bNwne4Mt1wXMW8NzslCRYdXqDr9cF7ilAkXAW8JSEEmAhYdYq8+qd/x4kzACPdeAGYMt/BDZ6n1sTJEtrzrgtW+BRB9QpcByHaH1fkmAFj4K7R0udEe8FcDBtL69Fgjbsy+U06g8hYARc6oVST0oJcs4mT2qJGBLA9bgmIu73OwAArOsqfr+1s5QSwaoBnq3rWcK1mZUCOeehQuleP6UE67qq3+fY7EIAhhAqbBEh3c+XpGoKWKteuNcAKREcw6mZwLp3CJ8FPIjgNDClJGiBo1wBvpaF0ikIj6e5ucYFJlk2YytNCh6PzgAAbpazdTTYC3xNAqPdrRbcA4XvBrV5PavHGEqARw8vmoQnAZo6EAk+ioQy/58EWOtAFPgoEsoeiHsKRDUzotLhWwoggLOB9yIh9GRoVg/POxLMp8Nc8JqFlnVManz302GJIZLjcQ5BHlFHdoO5UWA5Ee6Bj4o+qvvdrAGjdcEZbocA8BqtvbZ/8x+9KLCAj7ol1rJpdFOsGwGlAg/wkUJFAueaHOumaDmA153eqJuidcNldOrFWgdgPTij52tB8NzjPtZD0feFX3VPmE0AkoB//6Xr8m//wYR4L4ADePcPLOBLm6Tvv/1HU/+fzXkZ9rYfTraIeLtPZ1tEUCBG8qs/nuYSwiFhhl2fusb/5pAMofgAAAAASUVORK5CYII=';

    var state = { cz: 1, cx: 1, cg: 1, cu: 1, cd: 1, cl: 1, cr: 1, mubai: 1, dm: 1 };

    var debug_legally = 0;
    var touches = new Map();

    var gameX = 0;
    var gameY = 0;
    var gameScale = 1;
    var dpadActiveTouchId = null;
    var mkEnabled = true;
    var initialized = false;
    var animFrameId = null;
    var mouseDown = false;
    var mouseDpadActive = false;

    function ensureMkCanvas() {
        var canvas = document.getElementById('mk-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'mk-canvas';
            document.body.appendChild(canvas);
        }

        canvas.style.position = 'fixed';
        canvas.style.pointerEvents = 'none';
        canvas.style.background = 'transparent';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.zIndex = '500';
        canvas.style.transformOrigin = 'top left';
        canvas.style.filter = 'saturate(1.2) contrast(1.1) brightness(1)';

        return canvas;
    }

    function ensureAudio(id, src, type) {
        var audio = document.getElementById(id);
        if (audio) return audio;

        audio = document.createElement('audio');
        audio.id = id;
        audio.preload = 'auto';

        var source = document.createElement('source');
        source.src = src;
        source.type = type;
        audio.appendChild(source);
        document.body.appendChild(audio);

        return audio;
    }

    function loadMKState() {
        var saved = localStorage.getItem('mkEnabled');
        if (saved !== null) {
            mkEnabled = JSON.parse(saved);
        } else {
            mkEnabled = true;
        }
        updateMKVisibility();
    }

    function saveMKState() {
        localStorage.setItem('mkEnabled', JSON.stringify(mkEnabled));
    }

    function updateMKVisibility() {
        if (!mkCanvas) return;
        mkCanvas.style.display = mkEnabled ? 'block' : 'none';
    }

    function toggleMK() {
        mkEnabled = !mkEnabled;
        saveMKState();
        updateMKVisibility();

        if (mkEnabled) {
            if (!sndMkEnable) return;
            var sound = sndMkEnable.cloneNode(true);
            sound.play().catch(function(e) { console.log('Erro ao tocar som de ativacao:', e); });
        } else {
            if (!sndMkDisable) return;
            var sound = sndMkDisable.cloneNode(true);
            sound.play().catch(function(e) { console.log('Erro ao tocar som de desativacao:', e); });
        }
    }

    function rgba(rgb, a) {
        return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
    }

    function drawRoundRect(x1, y1, x2, y2, color, alpha) {
        var lx = Math.min(x1, x2);
        var rx = Math.max(x1, x2);
        var ty = Math.min(y1, y2);
        var by = Math.max(y1, y2);
        var w = rx - lx;
        var h = by - ty;
        var r = Math.min(6, w / 2, h / 2);

        ctx.save();
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.moveTo(lx + r, ty);
        ctx.lineTo(rx - r, ty);
        ctx.quadraticCurveTo(rx, ty, rx, ty + r);
        ctx.lineTo(rx, by - r);
        ctx.quadraticCurveTo(rx, by, rx - r, by);
        ctx.lineTo(lx + r, by);
        ctx.quadraticCurveTo(lx, by, lx, by - r);
        ctx.lineTo(lx, ty + r);
        ctx.quadraticCurveTo(lx, ty, lx + r, ty);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function pointDirection(dx, dy) {
        var a = Math.atan2(-dy, dx) * 180 / Math.PI;
        return a < 0 ? a + 360 : a;
    }

    function toGUI(touch) {
        if (gameScale === 0) return { x: 0, y: 0 };
        return {
            x: (touch.clientX - gameX) / gameScale,
            y: (touch.clientY - gameY) / gameScale
        };
    }

    function syncCanvas() {
        if (!c2canvas || !mkCanvas) return;
        var SW = window.innerWidth;
        var SH = window.innerHeight;

        var c2rect = c2canvas.getBoundingClientRect();
        var c2VisualW = c2rect.width;
        var c2VisualH = c2rect.height;

        var c2BufferW = c2canvas.width;
        var c2BufferH = c2canvas.height;

        var visualScale = c2VisualW / c2BufferW;

        var aspectRatio = c2VisualW / c2VisualH;

        var SF;
        var posX;
        var posY;

        if (Math.abs(c2VisualW - c2BufferW * visualScale) > c2BufferW * 0.1 ||
            (aspectRatio > 1.35 && aspectRatio < 1.78)) {
            var SX = SW / 960;
            var SY = SH / 540;
            SF = Math.min(SX, SY);

            var surfaceX = (SW - 960 * SF) / 2;
            var surfaceY = (SH - 540 * SF) / 2;

            posX = surfaceX + 160 * SF;
            posY = surfaceY + 30 * SF;

        } else {
            var SX2 = SW / GAME_W;
            var SY2 = SH / GAME_H;
            SF = Math.min(SX2, SY2);

            posX = (SW - GAME_W * SF) / 2;
            posY = (SH - GAME_H * SF) / 2;
        }

        gameX = posX;
        gameY = posY;
        gameScale = SF;

        mkCanvas.style.left = posX + 'px';
        mkCanvas.style.top = posY + 'px';
        mkCanvas.style.width = GAME_W + 'px';
        mkCanvas.style.height = GAME_H + 'px';
        mkCanvas.style.transform = 'scale(' + SF + ', ' + SF + ')';
    }

    function findNextDpadTouch() {
        var keys = touches.keys();
        var entry = keys.next();
        while (!entry.done) {
            var id = entry.value;
            var t = touches.get(id);
            if (id !== dpadActiveTouchId && t.x < 400) {
                return id;
            }
            entry = keys.next();
        }
        return null;
    }

    function step() {
        if (!mkEnabled) return;

        syncCanvas();
        var oldState = {};
        for (var k in state) {
            if (state.hasOwnProperty(k)) oldState[k] = state[k];
        }

        state.cz = state.cx = state.cg = state.cu = state.cd = state.cl = state.cr = state.mubai = state.dm = 1;

        var keys = touches.keys();
        var entry = keys.next();
        while (!entry.done) {
            var id = entry.value;
            var t = touches.get(id);
            var gx = t.x;
            var gy = t.y;

            if (debug_legally === 1 && gx >= 0 && gx <= 80 && gy <= 30) {
                state.dm = 0.5;
            } else if (gx >= 560 && gx <= 640 && gy <= 30) {
                state.mubai = 0.5;
            } else if (gx >= 560) {
                state.cz = 0.5;
            } else if (gx >= 480 && gx < 560) {
                state.cx = 0.5;
            } else if (gx >= 400) {
                state.cg = 0.5;
            } else if (gx < 400) {
                var dx = gx - 140;
                var dy = gy - 360;
                var da = pointDirection(dx, dy);

                if (da >= 292.5 || da <= 67.5) state.cr = 0.5;
                if (da >= 22.5 && da <= 157.5) state.cu = 0.5;
                if (da >= 112.5 && da <= 247.5) state.cl = 0.5;
                if (da >= 202.5 && da <= 337.5) state.cd = 0.5;
            }
            entry = keys.next();
        }

        if (state.mubai !== oldState.mubai) simulateKeyInternal(113, state.mubai < 1 ? 'keydown' : 'keyup');
        if (state.dm !== oldState.dm) [68, 66, 71].forEach(function(k) { simulateKeyInternal(k, state.dm < 1 ? 'keydown' : 'keyup'); });
        if (state.cu !== oldState.cu) simulateKeyInternal(38, state.cu < 1 ? 'keydown' : 'keyup');
        if (state.cd !== oldState.cd) simulateKeyInternal(40, state.cd < 1 ? 'keydown' : 'keyup');
        if (state.cl !== oldState.cl) simulateKeyInternal(37, state.cl < 1 ? 'keydown' : 'keyup');
        if (state.cr !== oldState.cr) simulateKeyInternal(39, state.cr < 1 ? 'keydown' : 'keyup');
        if (state.cg !== oldState.cg) simulateKeyInternal(67, state.cg < 1 ? 'keydown' : 'keyup');
        if (state.cx !== oldState.cx) simulateKeyInternal(88, state.cx < 1 ? 'keydown' : 'keyup');
        if (state.cz !== oldState.cz) simulateKeyInternal(90, state.cz < 1 ? 'keydown' : 'keyup');
    }

    function simulateKeyInternal(keyCode, type) {
        var event = new KeyboardEvent(type, {
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    var mkBackPressed = false;
    var mkBackTouchId = null;

    function isInMkBackButton(gx, gy) {
        return gx >= 0 && gx <= 80 && gy >= 0 && gy <= 30;
    }

    function drawMK() {
        if (!mkEnabled || !ctx) return;

        ctx.clearRect(0, 0, GAME_W, GAME_H);

        drawRoundRect(0, 0, 80, 30, C_WHITE, mkBackPressed ? BTN_ALPHA * 1.5 : BTN_ALPHA);
        drawRoundRect(560, 0, 640, 30, C_WHITE, BTN_ALPHA);

        drawRoundRect(400, 460, 480, 480, C_GREEN, BTN_ALPHA);
        drawRoundRect(480, 420, 560, 460, C_ORANGE, BTN_ALPHA);
        drawRoundRect(560, 420, 640, 460, C_AQUA, BTN_ALPHA);

        if (spr.complete && spr.naturalWidth) {
            ctx.globalAlpha = SPRITE_A;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(spr, 76, 296, spr.naturalWidth * 2, spr.naturalHeight * 2);
            ctx.globalAlpha = 1.0;
        }
    }

    function loop() {
        step();
        drawMK();
        animFrameId = requestAnimationFrame(loop);
    }

    function onMkTouchStart(e) {
        if (!mkEnabled) return;
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            var guiPos = toGUI(t);

            if (isInMkBackButton(guiPos.x, guiPos.y)) {
                mkBackPressed = true;
                mkBackTouchId = t.identifier;
                continue;
            }

            var touchData = { x: guiPos.x, y: guiPos.y, id: t.identifier };
            touches.set(t.identifier, touchData);

            if (guiPos.x < 400 && dpadActiveTouchId === null) {
                dpadActiveTouchId = t.identifier;
            }
        }
    }

    function onMkTouchMove(e) {
        if (!mkEnabled) return;
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];

            if (t.identifier === mkBackTouchId) {
                var guiPos2 = toGUI(t);
                if (!isInMkBackButton(guiPos2.x, guiPos2.y)) {
                    mkBackPressed = false;
                    mkBackTouchId = null;
                }
                continue;
            }

            var guiPos = toGUI(t);
            if (touches.has(t.identifier)) {
                touches.get(t.identifier).x = guiPos.x;
                touches.get(t.identifier).y = guiPos.y;
            }
        }
    }

    function onMkTouchEnd(e) {
        if (!mkEnabled) return;
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];

            if (t.identifier === mkBackTouchId) {
                if (mkBackPressed) {
                    mkBackPressed = false;
                    mkBackTouchId = null;
                    exitMkLayout();
                }
                continue;
            }

            touches.delete(t.identifier);

            if (dpadActiveTouchId === t.identifier) {
                dpadActiveTouchId = null;

                var nextDpad = findNextDpadTouch();
                if (nextDpad !== null) {
                    dpadActiveTouchId = nextDpad;
                }
            }
        }
    }

    function onMkTouchCancel() {
        touches.clear();
        dpadActiveTouchId = null;
        mkBackPressed = false;
        mkBackTouchId = null;
    }

    function onMkMouseDown(e) {
        if (!mkEnabled) return;
        var guiPos = toGUI(e);

        if (isInMkBackButton(guiPos.x, guiPos.y)) {
            mkBackPressed = true;
            return;
        }

        mouseDown = true;
        touches.set('mouse', { x: guiPos.x, y: guiPos.y, id: 'mouse' });

        if (guiPos.x < 400 && dpadActiveTouchId === null) {
            dpadActiveTouchId = 'mouse';
            mouseDpadActive = true;
        }
    }

    function onMkMouseMove(e) {
        if (!mkEnabled || !mouseDown) return;
        var guiPos = toGUI(e);
        if (touches.has('mouse')) {
            touches.get('mouse').x = guiPos.x;
            touches.get('mouse').y = guiPos.y;
        }
    }

    function onMkMouseUp() {
        if (mkBackPressed) {
            mkBackPressed = false;
            exitMkLayout();
            return;
        }

        mouseDown = false;
        touches.delete('mouse');
        if (mouseDpadActive) {
            dpadActiveTouchId = null;
            mouseDpadActive = false;
        }
    }

    function onMkKeyDown(e) {
        if (e.keyCode === 8) {
            e.preventDefault();
            toggleMK();
        }
    }

    function initMkNew() {
        if (initialized) return;

        c2canvas = document.getElementById('c2canvas');
        if (!c2canvas) return;

        mkCanvas = ensureMkCanvas();
        sndMkEnable = ensureAudio('snd-mk-enable', 'snd_save_sup.ogg', 'audio/ogg');
        sndMkDisable = ensureAudio('snd-mk-disable', 'snd_item_equip_mobile.wav', 'audio/wav');

        ctx = mkCanvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        mkCanvas.width = GAME_W;
        mkCanvas.height = GAME_H;

        mkBackPressed = false;
        mkBackTouchId = null;

        document.addEventListener('touchstart', onMkTouchStart, { passive: false });
        document.addEventListener('touchmove', onMkTouchMove, { passive: false });
        document.addEventListener('touchend', onMkTouchEnd, { passive: false });
        document.addEventListener('touchcancel', onMkTouchCancel);
        document.addEventListener('mousedown', onMkMouseDown);
        document.addEventListener('mousemove', onMkMouseMove);
        window.addEventListener('mouseup', onMkMouseUp);
        document.addEventListener('keydown', onMkKeyDown, true);

        initialized = true;
        mkEnabled = true;
        loadMKState();
        animFrameId = requestAnimationFrame(loop);
    }

    function destroyMkNew() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }

        document.removeEventListener('touchstart', onMkTouchStart);
        document.removeEventListener('touchmove', onMkTouchMove);
        document.removeEventListener('touchend', onMkTouchEnd);
        document.removeEventListener('touchcancel', onMkTouchCancel);
        document.removeEventListener('mousedown', onMkMouseDown);
        document.removeEventListener('mousemove', onMkMouseMove);
        window.removeEventListener('mouseup', onMkMouseUp);
        document.removeEventListener('keydown', onMkKeyDown, true);

        if (mkCanvas && mkCanvas.parentNode) {
            mkCanvas.parentNode.removeChild(mkCanvas);
        }
        mkCanvas = null;
        ctx = null;
        mkBackPressed = false;
        mkBackTouchId = null;

        [68, 66, 71, 37, 38, 39, 40, 90, 88, 67, 113].forEach(function(k) {
            simulateKeyInternal(k, 'keyup');
        });

        touches.clear();
        mouseDown = false;
        mouseDpadActive = false;
        dpadActiveTouchId = null;
        mkEnabled = false;
        initialized = false;
        c2canvas = null;
    }

    function enterMkLayout() {
        if (!initialized) {
            destroyOriginalControls();
            initMkNew();
            var kb = document.getElementById('keyboard-set');
            if (kb) kb.style.display = 'none';
            var tg = document.getElementById('toggle-button');
            if (tg) tg.style.display = 'none';
        }
    }

    function exitMkLayout() {
        if (initialized) {
            destroyMkNew();
            restoreOriginalControls();
        }
    }

    window.MkNewSystem = {
        init: initMkNew,
        destroy: destroyMkNew,
        isActive: function() { return initialized; },
        toggle: function() { initialized ? exitMkLayout() : enterMkLayout(); },
        enter: enterMkLayout,
        exit: exitMkLayout
    };
})();

(function() {
    var cursor = document.createElement('div');

    var mouse = {
        x: 0,
        y: 0,
        isDown: false,
        activeElement: null,
        moved: false,
        visible: false,
        touchId: null
    };

    function updateCursor(x, y) {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        mouse.x = x;
        mouse.y = y;
    }

    function dispatchMouseEvent(target, type, x, y) {
        if (!target) return;
        var event = new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            screenX: x + window.screenX,
            screenY: y + window.screenY,
            button: 0,
            buttons: mouse.isDown ? 1 : 0
        });
        target.dispatchEvent(event);
    }

    document.addEventListener('touchstart', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            var target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.closest('.no-mouse-sim')) {
                continue;
            }

            e.preventDefault();
            mouse.touchId = touch.identifier;
            updateCursor(touch.clientX, touch.clientY);
            cursor.style.display = 'block';
            mouse.visible = true;
            mouse.isDown = true;
            mouse.moved = false;
            mouse.activeElement = document.elementFromPoint(mouse.x, mouse.y);

            if (mouse.activeElement) {
                dispatchMouseEvent(mouse.activeElement, 'mousemove', mouse.x, mouse.y);
                dispatchMouseEvent(mouse.activeElement, 'mousedown', mouse.x, mouse.y);
            }
            break;
        }
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if (touch.identifier !== mouse.touchId) continue;

            e.preventDefault();
            updateCursor(touch.clientX, touch.clientY);
            mouse.moved = true;

            var newElement = document.elementFromPoint(mouse.x, mouse.y);

            if (mouse.activeElement && newElement !== mouse.activeElement) {
                dispatchMouseEvent(mouse.activeElement, 'mousemove', mouse.x, mouse.y);
                dispatchMouseEvent(mouse.activeElement, 'mouseleave', mouse.x, mouse.y);
                dispatchMouseEvent(newElement, 'mouseenter', mouse.x, mouse.y);
            }

            mouse.activeElement = newElement;

            if (mouse.activeElement) {
                dispatchMouseEvent(mouse.activeElement, 'mousemove', mouse.x, mouse.y);
                if (mouse.isDown) {
                    dispatchMouseEvent(mouse.activeElement, 'mousemove', mouse.x, mouse.y);
                }
            }
            break;
        }
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if (touch.identifier !== mouse.touchId) continue;

            e.preventDefault();
            updateCursor(touch.clientX, touch.clientY);
            var finalElement = document.elementFromPoint(mouse.x, mouse.y);

            if (mouse.moved && mouse.activeElement) {
                dispatchMouseEvent(mouse.activeElement, 'mouseup', mouse.x, mouse.y);
            } else if (finalElement) {
                dispatchMouseEvent(finalElement, 'mouseup', mouse.x, mouse.y);
                dispatchMouseEvent(finalElement, 'click', mouse.x, mouse.y);
            }

            mouse.isDown = false;
            mouse.activeElement = null;
            mouse.moved = false;
            mouse.visible = false;
            mouse.touchId = null;
            cursor.style.display = 'none';
            break;
        }
    }, { passive: false });

    document.addEventListener('mousemove', function (e) {
        if (!mouse.visible) {
            updateCursor(e.clientX, e.clientY);
        }
    });
})();

function simulateMouseEvent(event, simulatedType) {
    if (isSettingsMode)
        return;
    if (window.MkNewSystem && window.MkNewSystem.isActive())
        return;
    var touch = event.changedTouches[0];
    var simulatedEvent = new MouseEvent(simulatedType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: 0
    });
    touch.target.dispatchEvent(simulatedEvent);
}

document.addEventListener("touchstart", function(e) {
    simulateMouseEvent(e, "mousedown");
}, true);

document.addEventListener("touchmove", function(e) {
    simulateMouseEvent(e, "mousemove");
}, true);

document.addEventListener("touchend", function(e) {
    simulateMouseEvent(e, "mouseup");
}, true);

function handleGlobalClick(e) {
    var isButton = e.target.closest('.button, #arrow-up, #arrow-down, #arrow-left, #arrow-right, #joystick-container, #joystick-handle, #joystick-mk');
    var canvas = document.getElementById('c2canvas');

    if (e.target === canvas) return;
    if (isButton) return;

    var rect = canvas.getBoundingClientRect();
    var canvasX = e.clientX - rect.left;
    var canvasY = e.clientY - rect.top;

    var mouseEvent = new MouseEvent('click', {
        clientX: e.clientX,
        clientY: e.clientY,
        view: window,
        bubbles: true
    });
    canvas.dispatchEvent(mouseEvent);

    if (window.cr_getC2Runtime) {
        var runtime = window.cr_getC2Runtime();
        if (runtime && runtime.mouse) {
            runtime.mouse._mouseDown({
                isTouch: false,
                pageX: canvasX,
                pageY: canvasY,
                preventDefault: function() {}
            });
            setTimeout(function() {
                runtime.mouse._mouseUp({
                    isTouch: false,
                    pageX: canvasX,
                    pageY: canvasY,
                    preventDefault: function() {}
                });
            }, 50);
        }
    }
}

var c2canvasdiv = document.getElementById('c2canvasdiv');
if (c2canvasdiv) {
    c2canvasdiv.addEventListener('click', function (e) {
        if (!isSettingsMode)
            handleGlobalClick(e);
    });
    c2canvasdiv.addEventListener('touchstart', function(e) {
        if (!isSettingsMode)
            handleGlobalClick(e.touches[0]);
    });
}

function initializeButtonText() {
    var elements = document.querySelectorAll('.button, #arrow-up, #arrow-down, #arrow-left, #arrow-right, #joystick-container, #joystick-handle');
    elements.forEach(function(element) {
        var text = element.textContent.trim();
        if (!text) return;
        element.textContent = '';
        var span = document.createElement('span');
        span.textContent = text;
        element.appendChild(span);
    });
}

function dedupeElements(list) {
    var seen = new Set();
    return list.filter(function (el) {
        if (!el)
            return false;
        if (seen.has(el))
            return false;
        seen.add(el);
        return true;
    });
}

function computeAdjustableElements() {
    var draggableBase = Array.from(document.querySelectorAll('.button, .arrow')).filter(function (el) {
        return el.id && !NON_DRAGGABLE_IDS.has(el.id);
    });
    var joystickDraggables = JOYSTICK_IDS.filter(function(id) { return JOYSTICK_DRAGGABLE_IDS.has(id); })
        .map(function(id) { return document.getElementById(id); })
        .filter(Boolean);
    positionableElements = dedupeElements(draggableBase.concat(joystickDraggables));

    var generalScaleBase = Array.from(document.querySelectorAll('.button, .arrow')).filter(function (el) {
        return el.id && !NON_DRAGGABLE_IDS.has(el.id) && JOYSTICK_IDS.indexOf(el.id) === -1;
    });
    generalScaleElements = dedupeElements(generalScaleBase);

    joystickScaleElements = dedupeElements(JOYSTICK_IDS.map(function(id) { return document.getElementById(id); }).filter(Boolean));

    opacityElements = dedupeElements(generalScaleElements.concat(joystickScaleElements));
}

function tryLoadImage(filename, onSuccess, onError) {
    var img = new Image();
    img.src = 'button/' + filename;

    img.onload = function() {
        if (img.naturalWidth > 0) {
            onSuccess(img.src);
            return;
        }
        tryFallback();
    };

    img.onerror = tryFallback;

    function tryFallback() {
        var fb = new Image();
        fb.src = filename;
        fb.onload = function() {
            if (fb.naturalWidth > 0) {
                onSuccess(fb.src);
            } else if (onError) {
                onError();
            }
        };
        fb.onerror = function() {
            if (onError) onError();
        };
    }
}

function loadControlImages() {
    var joystickIds = new Set(['joystick-container', 'joystick-handle', 'joystick-mk']);
    var elements = Array.prototype.slice.call(document.querySelectorAll('.button, #arrow-up, #arrow-down, #arrow-left, #arrow-right'))
        .concat([document.getElementById('joystick-container'), document.getElementById('joystick-handle'), document.getElementById('joystick-mk')]);

    elements.forEach(function(element) {
        if (!element || !element.id) return;
        var id = element.id;

        tryLoadImage(id + '.png', function(src) {
            element.style.backgroundImage = 'url(' + src + ')';
            element.dataset.defaultImg = src;
            var span = element.querySelector('span');
            if(span) span.style.display = 'none';
            element.style.backgroundColor = 'transparent';

            if (joystickIds.has(id)) {
                element.dataset.hasPressed = false;
                return;
            }

            tryLoadImage(id + '1.png', function(pressedSrc) {
                element.dataset.pressedImg = pressedSrc;
                element.dataset.hasPressed = true;
            }, function() {
                element.dataset.hasPressed = false;
            });
        }, function() {
            element.style.backgroundImage = '';
            element.style.backgroundColor = id.indexOf('joystick') !== -1 ?
                (id.indexOf('container') !== -1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)') :
                'rgba(255,255,255,0.15)';
            var span = element.querySelector('span');
            if(span) span.style.display = 'block';
        });
    });
}

function addButtonFeedback() {
    document.querySelectorAll('.button:not(#toggle-button), #arrow-up, #arrow-down, #arrow-left, #arrow-right').forEach(function(element) {
        var handleEvent = function(state) {
            if (!element.dataset.hasPressed) return;
            element.style.backgroundImage = state ?
                'url(' + element.dataset.pressedImg + ')' :
                'url(' + element.dataset.defaultImg + ')';
        };

        element.addEventListener('touchstart', function() { handleEvent(true); });
        element.addEventListener('touchend', function() { handleEvent(false); });
        element.addEventListener('mousedown', function() { handleEvent(true); });
        element.addEventListener('mouseup', function() { handleEvent(false); });
        element.addEventListener('mouseleave', function() { handleEvent(false); });
        element.addEventListener('pointerdown', function() { handleEvent(true); });
        element.addEventListener('pointerup', function() { handleEvent(false); });
        element.addEventListener('pointerleave', function() { handleEvent(false); });
        element.addEventListener('pointercancel', function() { handleEvent(false); });
    });
}

function bindButtonAction(button, handler) {
    if (!button)
        return;
    var supportsPointer = "onpointerup" in window;
    if (supportsPointer) {
        button.addEventListener('pointerup', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handler(e);
        }, { passive: false });
    } else {
        ['touchend', 'mouseup', 'click'].forEach(function (evt) {
            button.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
            }, { passive: false });
        });
    }
}

function ensureElement(id, tag, parent, innerHTML) {
    var el = document.getElementById(id);
    if (!el) {
        el = document.createElement(tag);
        el.id = id;
        if (parent) parent.appendChild(el);
        if (innerHTML) el.innerHTML = innerHTML;
    }
    return el;
}

function ensureControlsDOM() {
    var body = document.body;

    var STYLE_ID = 'mobile-controls-css';
    if (!document.getElementById(STYLE_ID)) {
        var styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = ''
            + '#c2canvasdiv { position: relative; width: 100%; height: 100%; }'
            + '#joystick-container { '
            + 'position: absolute; '
            + 'width: 140px; '
            + 'height: 155px; '
            + 'background: rgba(255, 255, 255, 0.1);'
            + 'border-radius: 50%;'
            + 'left: -75px; '
            + 'bottom: 45px;'
            + 'background-size: cover;'
            + 'z-index: 1000;'
            + 'background-size: contain !important;'
            + 'background-repeat: no-repeat;'
            + 'background-position: center;'
            + 'image-rendering: -moz-crisp-edges;'
            + 'image-rendering: pixelated;'
            + 'opacity: 0.7;'
            + '}'
            + '#joystick-handle { '
            + 'position: absolute; '
            + 'width: 90px; '
            + 'height: 105px; '
            + 'background: rgba(255, 255, 255, 0.5);'
            + 'border-radius: 50%;'
            + 'left: 25px; '
            + 'bottom: 22.5px;'
            + 'background-size: cover;'
            + 'z-index: 1000;'
            + 'background-size: contain !important;'
            + 'background-repeat: no-repeat;'
            + 'background-position: center;'
            + 'image-rendering: -moz-crisp-edges;'
            + 'image-rendering: pixelated;'
            + 'opacity: 0.7;'
            + '}'
            + '#joystick-mk {'
            + 'position: absolute;'
            + 'width: 140px;'
            + 'height: 155px;'
            + 'left: -75px;'
            + 'bottom: 45px;'
            + 'z-index: 1000;'
            + 'background-size: contain !important;'
            + 'background-repeat: no-repeat;'
            + 'background-position: center;'
            + 'image-rendering: -moz-crisp-edges;'
            + 'image-rendering: pixelated;'
            + 'opacity: 0.8;'
            + 'display: none;'
            + '}'
            + '.arrow {'
            + 'position: absolute;'
            + 'z-index: 1000;'
            + 'width: 100px;'
            + 'height: 100px;'
            + 'background: rgba(255, 255, 255, 0.3);'
            + 'text-align: center;'
            + 'line-height: 70px;'
            + 'font-size: 40px;'
            + 'color: #fff;'
            + 'font-family: Arial, sans-serif;'
            + 'background-size: contain !important;'
            + 'background-repeat: no-repeat;'
            + 'background-position: center;'
            + 'image-rendering: -moz-crisp-edges;'
            + 'image-rendering: pixelated;'
            + 'opacity: 0.7;'
            + '}'
            + '#arrow-up { bottom: 150px; right: -65px; }'
            + '#arrow-left { bottom: 35px; left: -120px; }'
            + '#arrow-right { bottom: 35px; left: -10px; }'
            + '#arrow-down { bottom: 35px; right: -65px; }'
            + '.button {'
            + 'position: absolute;'
            + 'z-index: 1000;'
            + 'width: 70px;'
            + 'height: 70px;'
            + 'background: rgba(255, 255, 255, 0.3);'
            + 'text-align: center;'
            + 'line-height: 70px;'
            + 'font-size: 24px;'
            + 'color: #fff;'
            + 'font-family: Arial, sans-serif;'
            + 'background-size: contain !important;'
            + 'background-repeat: no-repeat;'
            + 'background-position: center;'
            + 'image-rendering: -moz-crisp-edges;'
            + 'image-rendering: pixelated;'
            + 'opacity: 0.7;'
            + '}'
            + '.button, .arrow {'
            + 'user-select: none;'
            + '-webkit-user-select: none;'
            + 'transform-origin: center center;'
            + '--btn-scale: 1;'
            + '--btn-translate-x: 0px;'
            + '--btn-translate-y: 0px;'
            + 'transform: translate(var(--btn-translate-x), var(--btn-translate-y)) scale(var(--btn-scale));'
            + '}'
            + '#joystick-container,'
            + '#joystick-handle,'
            + '#joystick-mk {'
            + 'transform-origin: center center;'
            + '--btn-scale: 1;'
            + '--btn-translate-x: 0px;'
            + '--btn-translate-y: 0px;'
            + 'transform: translate(var(--btn-translate-x), var(--btn-translate-y)) scale(var(--btn-scale));'
            + '}'
            + '#keyboard-set {'
            + 'width: 35px;'
            + 'height: 35px;'
            + 'right: 15px;'
            + 'top: 15px;'
            + 'line-height: 35px;'
            + 'font-size: 14px;'
            + 'display: block;'
            + 'z-index: 1300;'
            + 'color: #fff;'
            + 'background-color: rgba(255, 255, 255, 0.3);'
            + '-webkit-text-fill-color: #fff;'
            + 'forced-color-adjust: none;'
            + 'filter: none;'
            + '}'
            + '#settings-overlay {'
            + 'position: fixed;'
            + 'top: 0;'
            + 'left: 0;'
            + 'width: 100vw;'
            + 'height: 100vh;'
            + 'background: rgba(0, 0, 0, 0.6);'
            + 'z-index: 1100;'
            + 'display: none;'
            + 'pointer-events: none;'
            + '}'
            + '#settings-panel {'
            + 'position: absolute;'
            + 'top: 50%;'
            + 'left: 50%;'
            + 'width: 220px;'
            + 'height: 220px;'
            + 'transform: translate(-50%, -50%);'
            + 'display: none;'
            + 'z-index: 1400;'
            + 'align-items: center;'
            + 'justify-content: center;'
            + 'pointer-events: none;'
            + '}'
            + '.settings-button {'
            + 'position: absolute;'
            + 'width: 90px;'
            + 'height: 40px;'
            + 'line-height: 40px;'
            + 'font-size: 16px;'
            + 'pointer-events: auto;'
            + 'opacity: 1;'
            + '}'
            + '#text-scale { top: 15%; left: 50%; transform: translate(-50%, -50%); }'
            + '#text-opacity { top: 41.7%; left: 50%; transform: translate(-50%, -50%); }'
            + '#text-joystickscale { top: 58.3%; left: 50%; transform: translate(-50%, -50%); }'
            + '#text-reset { top: 85%; left: 50%; transform: translate(-50%, -50%); }'
            + '#toggle-button {'
            + 'position: absolute;'
            + 'top: 10px;'
            + 'left: 10px;'
            + 'z-index: 10;'
            + '}'
            + '.layout2 #button-z { width: 70px; height: 70px; }'
            + '.layout2 #button-x { width: 70px; height: 70px; }'
            + '.layout2 #button-c { width: 70px; height: 70px; }'
            + '#button-z { right: 60px; bottom: 30px; display: none; }'
            + '#button-x { right: -15px; bottom: 70px; display: none; }'
            + '#button-c { right: -90px; bottom: 110px; display: none; }'
            + '#button-f2 { left: -60px; top: 10px; display: none; }'
            + '#button-f1 { left: 81px; top: 10px; display: none; }'
            + '#button-debug { position: absolute; left: -130px; top: 10px; display: none; }'
            + '.layout2 #button-z { right: 60px; top: 30px; }'
            + '.layout2 #button-x { right: -15px; top: 30px; }'
            + '.layout2 #button-c { right: -90px; top: 30px; }'
            + '.layout2 #button-f2 { left: -60px; top: 10px; display: none; }'
            + '.layout2 #button-f1 { left: 81px; top: 10px; display: none; }'
            + '.layout2 #button-debug { position: absolute; left: -130px; top: 10px; display: none; }';
        document.head.appendChild(styleEl);
    }

    var c2div = document.getElementById('c2canvasdiv');
    var parent = c2div || body;

    ensureElement('toggle-button', 'div', parent, 'SET').className = 'button';
    var kbBtn = ensureElement('keyboard-set', 'div', parent, 'KB'); kbBtn.className = 'button';
    ensureElement('settings-overlay', 'div', parent, '');
    ensureElement('settings-panel', 'div', parent, '');

    var panel = document.getElementById('settings-panel');
    var tsBtn = ensureElement('text-scale', 'div', panel, 'SIZE'); tsBtn.className = 'button settings-button';
    var toBtn = ensureElement('text-opacity', 'div', panel, 'OPACITY'); toBtn.className = 'button settings-button';
    var tjBtn = ensureElement('text-joystickscale', 'div', panel, 'JOY SIZE'); tjBtn.className = 'button settings-button';
    var trBtn = ensureElement('text-reset', 'div', panel, 'RESET'); trBtn.className = 'button settings-button';

    var btnZ = ensureElement('button-z', 'div', parent, 'Z'); btnZ.className = 'button';
    var btnX = ensureElement('button-x', 'div', parent, 'X'); btnX.className = 'button';
    var btnC = ensureElement('button-c', 'div', parent, 'C'); btnC.className = 'button';
    var btnF2 = ensureElement('button-f2', 'div', parent, 'F2'); btnF2.className = 'button';
    var btnF1 = ensureElement('button-f1', 'div', parent, 'F1'); btnF1.className = 'button';
    var btnDbg = ensureElement('button-debug', 'div', parent, 'DBG'); btnDbg.className = 'button';

    var arrUp = ensureElement('arrow-up', 'div', parent, '\u2191'); arrUp.className = 'arrow';
    var arrLt = ensureElement('arrow-left', 'div', parent, '\u2190'); arrLt.className = 'arrow';
    var arrRt = ensureElement('arrow-right', 'div', parent, '\u2192'); arrRt.className = 'arrow';
    var arrDn = ensureElement('arrow-down', 'div', parent, '\u2193'); arrDn.className = 'arrow';

    ensureElement('joystick-container', 'div', parent, '');
    var joystickContainer = document.getElementById('joystick-container');
    ensureElement('joystick-handle', 'div', joystickContainer, '');
}

ensureControlsDOM();

var joystick = document.getElementById('joystick-container');
var joystickHandle = document.getElementById('joystick-handle');
var joystickMk = document.getElementById('joystick-mk');
var buttons = {
    z: document.getElementById('button-z'),
    x: document.getElementById('button-x'),
    c: document.getElementById('button-c'),
    f2: document.getElementById('button-f2'),
    f1: document.getElementById('button-f1'),
    debug: document.getElementById('button-debug')
};
var toggleButtonElement = document.getElementById('toggle-button');
var arrowIds = ['arrow-left', 'arrow-right', 'arrow-up', 'arrow-down'];
var arrowElements = arrowIds.map(function(id) { return document.getElementById(id); });
var primaryButtonIds = ['button-z', 'button-x', 'button-c', 'button-f2', 'button-f1', 'button-debug', 'toggle-button'];
var buttonElements = primaryButtonIds.map(function(id) { return document.getElementById(id); }).filter(Boolean);
var keyboardSetButton = document.getElementById('keyboard-set');
var textScaleButton = document.getElementById('text-scale');
var textOpacityButton = document.getElementById('text-opacity');
var textJoystickScaleButton = document.getElementById('text-joystickscale');
var textResetButton = document.getElementById('text-reset');
var settingsPanel = document.getElementById('settings-panel');
var settingsOverlay = document.getElementById('settings-overlay');
var NON_DRAGGABLE_IDS = new Set(['text-scale', 'text-opacity', 'text-reset', 'text-joystickscale']);
var SETTINGS_BUTTON_IDS = new Set(['keyboard-set', 'text-scale', 'text-opacity', 'text-reset', 'text-joystickscale']);
var JOYSTICK_IDS = ['joystick-container', 'joystick-handle', 'joystick-mk'];
var JOYSTICK_DRAGGABLE_IDS = new Set(['joystick-container', 'joystick-mk']);
var positionableElements = [];
var generalScaleElements = [];
var joystickScaleElements = [];
var opacityElements = [];
var JOYSTICK_THRESHOLD = 20;
var JOYSTICK_MAX_MAG = 50;
var JOYSTICK_OFFSET = 25;
var currentLayout = 1;
var joystickTouchId = null;
var joystickMouseActive = false;
var joystickCenter = { x: 0, y: 0 };

var joystickArea = {
    left: 0,
    right: 450,
    top: 100,
    bottom: 400
};

var keyMap = {
    'arrow-left': 37,
    'arrow-right': 39,
    'arrow-up': 38,
    'arrow-down': 40,
    'button-z': 90,
    'button-x': 88,
    'button-c': 67,
    'button-f2': 113,
    'button-f1': 112
};

function triggerKey(code, type) {
    simulateKey(type || 'keydown', code);
}

function isInJoystickArea(point) {
    if (!joystick || joystick.style.display !== 'block')
        return false;
    return point.clientX >= joystickArea.left && point.clientX <= joystickArea.right &&
           point.clientY >= joystickArea.top && point.clientY <= joystickArea.bottom;
}

function simulateKey(eventType, keyCode) {
    document.dispatchEvent(new KeyboardEvent(eventType, { keyCode: keyCode, bubbles: true, cancelable: true }));
}

function releaseDirectionalKeys() {
    [37, 38, 39, 40].forEach(function(k) { simulateKey('keyup', k); });
}

function setLayoutClass(cls) {
    document.body.classList.remove('layout2', 'layout3', 'layout4');
    if (cls)
        document.body.classList.add(cls);
}

function setButtonsVisible(visible) {
    buttonElements.forEach(function(el) {
        if (!el || el === toggleButtonElement)
            return;
        el.style.display = visible ? 'block' : 'none';
    });
    if (toggleButtonElement)
        toggleButtonElement.style.display = 'block';
}

function setArrowsVisible(visible) {
    arrowElements.forEach(function(el) {
        if (el)
            el.style.display = visible ? 'block' : 'none';
    });
}

function hideJoystickHardware() {
    if (joystick) joystick.style.display = 'none';
    if (joystickHandle) joystickHandle.style.display = 'none';
    resetJoystickPosition();
}

function hideAllOriginalControls() {
    hideJoystickHardware();
    if (joystickMk) joystickMk.style.display = 'none';
    setButtonsVisible(false);
    setArrowsVisible(false);
}

function restoreOriginalControls() {
    if (keyboardSetButton) keyboardSetButton.style.display = 'block';
    if (toggleButtonElement) toggleButtonElement.style.display = 'block';
    showLayout1();
}

function destroyOriginalControls() {
    hideAllOriginalControls();
    if (keyboardSetButton) keyboardSetButton.style.display = 'none';
    if (toggleButtonElement) toggleButtonElement.style.display = 'none';
    joystickMouseActive = false;
    joystickTouchId = null;
    releaseDirectionalKeys();
    deactivateAllActiveButtons();
    endActiveDrag();
}

function deactivateAllActiveButtons() {
    for (var key in activeButtonTouches) {
        if (activeButtonTouches.hasOwnProperty(key)) {
            deactivateButton(activeButtonTouches[key], null);
        }
    }
    var keys = Object.keys(activeButtonTouches);
    for (var i = 0; i < keys.length; i++) {
        delete activeButtonTouches[keys[i]];
    }
}

var STORAGE_KEY = 'c2_button_layouts_v1';
var SCALE_MIN = 0.5;
var SCALE_MAX = 1.5;
var SCALE_STEP = 0.1;
var OPACITY_MIN = 0.1;
var OPACITY_MAX = 1;
var OPACITY_STEP = 0.1;
var layoutSettings = loadLayoutSettings();
[1, 2, 4].forEach(ensureLayoutState);
var isSettingsMode = false;
var dragState = null;
var saveTimeoutId = null;

function loadLayoutSettings() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
            return JSON.parse(raw);
    } catch (err) {
        console.warn('Failed to parse layout settings', err);
    }
    return {};
}

function getDefaultLayoutState() {
    return { positions: {}, scale: 1, joystickScale: 1, opacity: 0.7 };
}

function ensureLayoutState(layout) {
    if (!layoutSettings[layout])
        layoutSettings[layout] = getDefaultLayoutState();
    var state = layoutSettings[layout];
    if (typeof state.scale !== 'number')
        state.scale = 1;
    if (typeof state.joystickScale !== 'number')
        state.joystickScale = 1;
    if (typeof state.opacity !== 'number')
        state.opacity = 0.7;
    if (!state.positions)
        state.positions = {};
    return state;
}

function saveLayoutSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutSettings));
    } catch (err) {
        console.warn('Failed to save layout settings', err);
    }
}

function scheduleSave() {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = setTimeout(saveLayoutSettings, 250);
}

function setElementTransformOffsets(element, x, y) {
    element.dataset.translateX = x;
    element.dataset.translateY = y;
    element.style.setProperty('--btn-translate-x', x + 'px');
    element.style.setProperty('--btn-translate-y', y + 'px');
}

function getElementTransformOffsets(element) {
    return {
        x: parseFloat(element.dataset.translateX || '0'),
        y: parseFloat(element.dataset.translateY || '0')
    };
}

function applyScale(elements, scale) {
    elements.forEach(function (el) {
        if (!el)
            return;
        el.style.setProperty('--btn-scale', scale);
    });
}

function applyOpacity(elements, opacity) {
    elements.forEach(function (el) {
        if (!el)
            return;
        el.style.opacity = opacity;
    });
}

function applyLayoutSettings(layout) {
    var state = ensureLayoutState(layout);
    positionableElements.forEach(function(el) {
        var stored = state.positions[el.id];
        if (stored)
            setElementTransformOffsets(el, stored.x, stored.y);
        else
            setElementTransformOffsets(el, 0, 0);
    });
    applyScale(generalScaleElements, state.scale);
    applyScale(joystickScaleElements, state.joystickScale);
    applyOpacity(opacityElements, state.opacity);
}

function recordElementPosition(element, x, y) {
    if (!element.id)
        return;
    var state = ensureLayoutState(currentLayout);
    state.positions[element.id] = { x: x, y: y };
    scheduleSave();
}

function canDragElement(element) {
    if (!element)
        return false;
    if (NON_DRAGGABLE_IDS.has(element.id))
        return false;
    return element.classList.contains('button') || element.classList.contains('arrow') || JOYSTICK_DRAGGABLE_IDS.has(element.id);
}

function beginDrag(element, clientX, clientY, pointerId, pointerType) {
    if (!isSettingsMode || dragState || !canDragElement(element))
        return false;
    var offsets = getElementTransformOffsets(element);
    dragState = {
        element: element,
        startX: clientX,
        startY: clientY,
        baseX: offsets.x,
        baseY: offsets.y,
        pointerId: pointerId,
        pointerType: pointerType
    };
    return true;
}

function updateDragPosition(clientX, clientY) {
    if (!dragState)
        return;
    var deltaX = clientX - dragState.startX;
    var deltaY = clientY - dragState.startY;
    var newX = dragState.baseX + deltaX;
    var newY = dragState.baseY + deltaY;
    setElementTransformOffsets(dragState.element, newX, newY);
    recordElementPosition(dragState.element, newX, newY);
}

function endActiveDrag(pointerId) {
    if (!dragState)
        return;
    if (pointerId !== undefined && dragState.pointerId !== pointerId)
        return;
    dragState = null;
}

function enterSettingsMode() {
    if (isSettingsMode)
        return;
    isSettingsMode = true;
    if (settingsOverlay) settingsOverlay.style.display = 'block';
    if (settingsPanel) settingsPanel.style.display = 'flex';
    document.body.classList.add('settings-mode');
    joystickMouseActive = false;
    joystickTouchId = null;
    resetJoystickPosition();
}

function exitSettingsMode(save) {
    if (!isSettingsMode)
        return;
    isSettingsMode = false;
    if (settingsOverlay) settingsOverlay.style.display = 'none';
    if (settingsPanel) settingsPanel.style.display = 'none';
    document.body.classList.remove('settings-mode');
    endActiveDrag();
    if (save)
        saveLayoutSettings();
}

function toggleSettingsMode() {
    if (isSettingsMode)
        exitSettingsMode(true);
    else
        enterSettingsMode();
}

function cycleScale() {
    var state = ensureLayoutState(currentLayout);
    var next = +(state.scale + SCALE_STEP).toFixed(2);
    if (next > SCALE_MAX)
        next = SCALE_MIN;
    state.scale = next;
    applyLayoutSettings(currentLayout);
    scheduleSave();
}

function cycleOpacity() {
    var state = ensureLayoutState(currentLayout);
    var next = +(state.opacity + OPACITY_STEP).toFixed(2);
    if (next > OPACITY_MAX)
        next = OPACITY_MIN;
    state.opacity = next;
    applyLayoutSettings(currentLayout);
    scheduleSave();
}

function cycleJoystickScale() {
    var state = ensureLayoutState(currentLayout);
    var next = +(state.joystickScale + SCALE_STEP).toFixed(2);
    if (next > SCALE_MAX)
        next = SCALE_MIN;
    state.joystickScale = next;
    applyLayoutSettings(currentLayout);
    scheduleSave();
}

function resetLayoutAdjustments() {
    var state = ensureLayoutState(currentLayout);
    state.positions = {};
    state.scale = 1;
    state.joystickScale = 1;
    state.opacity = 0.7;
    applyLayoutSettings(currentLayout);
    scheduleSave();
}

bindButtonAction(keyboardSetButton, toggleSettingsMode);
bindButtonAction(textScaleButton, function () {
    if (isSettingsMode)
        cycleScale();
});
bindButtonAction(textOpacityButton, function () {
    if (isSettingsMode)
        cycleOpacity();
});
bindButtonAction(textJoystickScaleButton, function () {
    if (isSettingsMode)
        cycleJoystickScale();
});
bindButtonAction(textResetButton, function () {
    if (isSettingsMode)
        resetLayoutAdjustments();
});

window.addEventListener('beforeunload', saveLayoutSettings);

function cacheJoystickCenter() {
    if (!joystick) return;
    var rect = joystick.getBoundingClientRect();
    joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

var lastAxisX = 0;
var lastAxisY = 0;

function setAxisState(delta, positiveKey, negativeKey, lastState) {
    var state = delta > JOYSTICK_THRESHOLD ? 1 : (delta < -JOYSTICK_THRESHOLD ? -1 : 0);
    if (state === lastState) return state;
    if (state === 1) {
        simulateKey('keydown', positiveKey);
        simulateKey('keyup', negativeKey);
    } else if (state === -1) {
        simulateKey('keydown', negativeKey);
        simulateKey('keyup', positiveKey);
    } else {
        simulateKey('keyup', positiveKey);
        simulateKey('keyup', negativeKey);
    }
    return state;
}

function applyJoystickDelta(deltaX, deltaY) {
    var magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    var scale = magnitude > JOYSTICK_MAX_MAG ? JOYSTICK_MAX_MAG / magnitude : 1;
    if (joystickHandle) {
        joystickHandle.style.left = JOYSTICK_OFFSET + deltaX * scale + 'px';
        joystickHandle.style.top = JOYSTICK_OFFSET + deltaY * scale + 'px';
    }
    lastAxisX = setAxisState(deltaX, 39, 37, lastAxisX);
    lastAxisY = setAxisState(deltaY, 40, 38, lastAxisY);
}

function updateJoystickFromPoint(clientX, clientY) {
    if (isSettingsMode)
        return;
    var deltaX = clientX - joystickCenter.x;
    var deltaY = clientY - joystickCenter.y;
    applyJoystickDelta(deltaX, deltaY);
}

function resetJoystickPosition() {
    lastAxisX = 0;
    lastAxisY = 0;
    if (joystickHandle) {
        joystickHandle.style.left = JOYSTICK_OFFSET + 'px';
        joystickHandle.style.top = JOYSTICK_OFFSET + 'px';
    }
    releaseDirectionalKeys();
}

function onJoystickMouseDown(e) {
    if (isSettingsMode || e.button !== 0 || !joystick || joystick.style.display === 'none')
        return;
    e.preventDefault();
    joystickMouseActive = true;
    cacheJoystickCenter();
    updateJoystickFromPoint(e.clientX, e.clientY);
    document.addEventListener('mousemove', onJoystickMouseMove);
    document.addEventListener('mouseup', onJoystickMouseUp);
}

function onJoystickMouseMove(e) {
    if (!joystickMouseActive || isSettingsMode)
        return;
    e.preventDefault();
    updateJoystickFromPoint(e.clientX, e.clientY);
}

function onJoystickMouseUp(e) {
    if (!joystickMouseActive)
        return;
    e.preventDefault();
    joystickMouseActive = false;
    resetJoystickPosition();
    document.removeEventListener('mousemove', onJoystickMouseMove);
    document.removeEventListener('mouseup', onJoystickMouseUp);
}

if (joystick) {
    joystick.addEventListener('mousedown', onJoystickMouseDown);
}

function initControls() {
    initializeButtonText();
    loadControlImages();
    computeAdjustableElements();
    addButtonFeedback();

    try {
        cr_createRuntime("c2canvas");
    } catch (err) {
        var errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'color: #fff; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;';
        errorMsg.innerHTML = 'Failed to load the game. Please ensure all game assets are correctly included.';
        document.body.appendChild(errorMsg);
    }
    showLayout1();
}

if (document.readyState === 'complete') {
    initControls();
} else {
    window.addEventListener('load', initControls);
}

function showLayout1() {
    if (window.MkNewSystem && window.MkNewSystem.isActive()) {
        window.MkNewSystem.destroy();
    }
    currentLayout = 1;
    setLayoutClass('');
    if (joystick) joystick.style.display = 'block';
    if (joystickHandle) joystickHandle.style.display = 'block';
    if (joystickMk) joystickMk.style.display = 'none';
    if (keyboardSetButton) keyboardSetButton.style.display = 'block';
    if (toggleButtonElement) toggleButtonElement.style.display = 'block';
    setButtonsVisible(true);
    setArrowsVisible(false);
    applyLayoutSettings(currentLayout);
}

function showLayout2() {
    if (window.MkNewSystem && window.MkNewSystem.isActive()) {
        window.MkNewSystem.destroy();
    }
    currentLayout = 2;
    setLayoutClass('layout2');
    hideJoystickHardware();
    if (joystickMk) joystickMk.style.display = 'none';
    if (keyboardSetButton) keyboardSetButton.style.display = 'block';
    if (toggleButtonElement) toggleButtonElement.style.display = 'block';
    setButtonsVisible(true);
    setArrowsVisible(true);
    applyLayoutSettings(currentLayout);
}

function showLayout4() {
    if (window.MkNewSystem && window.MkNewSystem.isActive()) {
        window.MkNewSystem.destroy();
    }
    currentLayout = 4;
    setLayoutClass('layout4');
    hideJoystickHardware();
    if (joystickMk) joystickMk.style.display = 'none';
    if (keyboardSetButton) keyboardSetButton.style.display = 'block';
    if (toggleButtonElement) toggleButtonElement.style.display = 'block';
    setButtonsVisible(false);
    setArrowsVisible(false);
    applyLayoutSettings(currentLayout);
}

function showMkLayout() {
    currentLayout = 3;
    if (window.MkNewSystem) {
        window.MkNewSystem.enter();
    }
}

function cycleLayout() {
    switch (currentLayout) {
        case 1:
            showLayout2();
            break;
        case 2:
            showMkLayout();
            break;
        case 3:
            showLayout4();
            break;
        default:
            showLayout1();
    }
}

var toggleCycleScheduled = false;

function triggerToggleCycle() {
    if (toggleCycleScheduled)
        return;
    toggleCycleScheduled = true;
    setTimeout(function () {
        toggleCycleScheduled = false;
        cycleLayout();
    }, 0);
}

function handleToggleButton(buttonElement, eventType) {
    if (eventType === 'touchstart' || eventType === 'mousedown') {
        if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
            buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.pressedImg + ')';
        } else {
            buttonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        }
    }
    else if (eventType === 'touchend' || eventType === 'mouseup' || eventType === 'touchcancel') {
        if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
            buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.defaultImg + ')';
        } else {
            buttonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }

        if (eventType === 'touchend' || eventType === 'mouseup')
            triggerToggleCycle();
    }
}

var activeButtonTouches = {};
var toggleButtonActive = false;
var debugButtonPressed = false;

if (toggleButtonElement) {
    var onTogglePointerDown = function (e) {
        e.preventDefault();
        toggleButtonActive = true;
        handleToggleButton(toggleButtonElement, 'mousedown');
    };
    var onTogglePointerUp = function (e) {
        if (!toggleButtonActive)
            return;
        e.preventDefault();
        handleToggleButton(toggleButtonElement, 'mouseup');
        toggleButtonActive = false;
    };
    var onTogglePointerCancel = function (e) {
        if (!toggleButtonActive)
            return;
        e.preventDefault();
        handleToggleButton(toggleButtonElement, 'touchcancel');
        toggleButtonActive = false;
    };
    var supportsPointer = "onpointerup" in window;
    if (supportsPointer) {
        toggleButtonElement.addEventListener('pointerdown', onTogglePointerDown, { passive: false });
        toggleButtonElement.addEventListener('pointerup', onTogglePointerUp, { passive: false });
        toggleButtonElement.addEventListener('pointercancel', onTogglePointerCancel, { passive: false });
        toggleButtonElement.addEventListener('pointerleave', onTogglePointerCancel, { passive: false });
    } else {
        toggleButtonElement.addEventListener('touchstart', onTogglePointerDown, { passive: false });
        toggleButtonElement.addEventListener('touchend', onTogglePointerUp, { passive: false });
        toggleButtonElement.addEventListener('touchcancel', onTogglePointerCancel, { passive: false });
        toggleButtonElement.addEventListener('mousedown', onTogglePointerDown, { passive: false });
        toggleButtonElement.addEventListener('mouseup', onTogglePointerUp, { passive: false });
        toggleButtonElement.addEventListener('mouseleave', onTogglePointerCancel, { passive: false });
    }
}

function getButtonUnderTouch(touch) {
    var element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && (element.classList.contains('button') ||
                    element.classList.contains('arrow') ||
                    element.id === 'joystick-container' ||
                    element.id === 'joystick-handle' ||
                    element.id === 'joystick-mk')) {
        if (element.id === 'joystick-handle') {
            return document.getElementById('joystick-container');
        }
        return element;
    }
    return null;
}

function activateButton(buttonElement, touch) {
    if (!buttonElement) return;
    if (isSettingsMode && (!buttonElement.id || !SETTINGS_BUTTON_IDS.has(buttonElement.id))) {
        beginDrag(buttonElement, touch ? touch.clientX : 0, touch ? touch.clientY : 0, touch ? touch.identifier : null, touch ? 'touch' : 'mouse');
        return;
    }

    if (buttonElement.id === 'toggle-button') {
        handleToggleButton(buttonElement, 'touchstart');
        toggleButtonActive = true;
        return;
    }

    if (buttonElement.id === 'button-debug') {
        if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
            buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.pressedImg + ')';
        } else {
            buttonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        }

        triggerKey(68, 'keydown');
        triggerKey(66, 'keydown');
        triggerKey(71, 'keydown');
        return;
    }

    if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
        buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.pressedImg + ')';
    }

    var buttonId = buttonElement.id;
    if (keyMap[buttonId]) {
        simulateKey('keydown', keyMap[buttonId]);
    }
}

function deactivateButton(buttonElement, touch) {
    if (!buttonElement) return;
    if (isSettingsMode && (!buttonElement.id || !SETTINGS_BUTTON_IDS.has(buttonElement.id)))
        return;

    if (buttonElement.id === 'toggle-button') {
        handleToggleButton(buttonElement, 'touchend');
        toggleButtonActive = false;
        return;
    }

    if (buttonElement.id === 'button-debug') {
        if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
            buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.defaultImg + ')';
        } else {
            buttonElement.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }

        triggerKey(68, 'keyup');
        triggerKey(66, 'keyup');
        triggerKey(71, 'keyup');
        return;
    }

    if (buttonElement.dataset && buttonElement.dataset.hasPressed === "true") {
        buttonElement.style.backgroundImage = 'url(' + buttonElement.dataset.defaultImg + ')';
    }

    var buttonId = buttonElement.id;
    if (keyMap[buttonId]) {
        simulateKey('keyup', keyMap[buttonId]);
    }
}

document.addEventListener("touchstart", function(e) {
    if (window.MkNewSystem && window.MkNewSystem.isActive())
        return;

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        var button = getButtonUnderTouch(touch);
        var buttonId = button ? button.id : '';

        if (isSettingsMode) {
            if (button && SETTINGS_BUTTON_IDS.has(buttonId)) {
                continue;
            }
            if (button && beginDrag(button, touch.clientX, touch.clientY, touch.identifier, 'touch')) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            continue;
        }

        if (isInJoystickArea(touch)) {
            activateJoystick(touch);
            e.preventDefault();
            continue;
        }

        if (button) {
            if (SETTINGS_BUTTON_IDS.has(buttonId))
                continue;
            activeButtonTouches[touch.identifier] = button;
            activateButton(button, touch);
            e.preventDefault();
        }
    }
}, { passive: false, capture: true });

function activateJoystick(touch) {
    if (isSettingsMode)
        return;
    joystickTouchId = touch.identifier;
    cacheJoystickCenter();
    updateJoystickFromPoint(touch.clientX, touch.clientY);
}

document.addEventListener("touchmove", function(e) {
    if (window.MkNewSystem && window.MkNewSystem.isActive())
        return;

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];

        if (dragState && dragState.pointerType === 'touch' && dragState.pointerId === touch.identifier) {
            updateDragPosition(touch.clientX, touch.clientY);
            e.preventDefault();
            e.stopImmediatePropagation();
            continue;
        }

        if (isSettingsMode) {
            e.preventDefault();
            e.stopImmediatePropagation();
            continue;
        }

        if (touch.identifier === joystickTouchId) {
            if (isInJoystickArea(touch)) {
                updateJoystickFromPoint(touch.clientX, touch.clientY);
            } else {
                joystickTouchId = null;
                resetJoystickPosition();
            }
            e.preventDefault();
            continue;
        }

        var currentButton = activeButtonTouches[touch.identifier];
        var newButton = getButtonUnderTouch(touch);

        if (isInJoystickArea(touch)) {
            if (currentButton) {
                deactivateButton(currentButton, touch);
                delete activeButtonTouches[touch.identifier];
            }
            activateJoystick(touch);
            e.preventDefault();
            continue;
        }

        if (currentButton && newButton && currentButton !== newButton) {
            deactivateButton(currentButton, touch);
            activateButton(newButton, touch);
            activeButtonTouches[touch.identifier] = newButton;
        }
        else if (currentButton && !newButton) {
            deactivateButton(currentButton, touch);
            delete activeButtonTouches[touch.identifier];
        }
        else if (!currentButton && newButton) {
            activateButton(newButton, touch);
            activeButtonTouches[touch.identifier] = newButton;
        }

        e.preventDefault();
    }
}, { passive: false, capture: true });

document.addEventListener("touchend", function(e) {
    if (window.MkNewSystem && window.MkNewSystem.isActive())
        return;

    for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];

        if (dragState && dragState.pointerType === 'touch' && dragState.pointerId === touch.identifier) {
            endActiveDrag(touch.identifier);
            e.preventDefault();
            e.stopImmediatePropagation();
            continue;
        }

        if (isSettingsMode) {
            e.preventDefault();
            e.stopImmediatePropagation();
            continue;
        }

        if (touch.identifier === joystickTouchId) {
            joystickTouchId = null;
            resetJoystickPosition();
            continue;
        }

        var button = activeButtonTouches[touch.identifier];
        if (button) {
            deactivateButton(button, touch);
            delete activeButtonTouches[touch.identifier];
        }
        e.preventDefault();
    }
}, { passive: false, capture: true });

document.addEventListener('mousedown', function (e) {
    if (!isSettingsMode)
        return;
    var target = e.target.closest('.button, .arrow, #joystick-container, #joystick-mk');
    if (target && SETTINGS_BUTTON_IDS.has(target.id))
        return;
    if (target && beginDrag(target, e.clientX, e.clientY, null, 'mouse')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
}, true);

document.addEventListener('mousemove', function (e) {
    if (!isSettingsMode)
        return;
    if (dragState && dragState.pointerType === 'mouse') {
        updateDragPosition(e.clientX, e.clientY);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
}, true);

document.addEventListener('mouseup', function (e) {
    if (!isSettingsMode)
        return;
    if (dragState && dragState.pointerType === 'mouse') {
        endActiveDrag();
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
}, true);

function setDebugVisualState(isPressed) {
    if (!buttons.debug) return;
    if (buttons.debug.dataset && buttons.debug.dataset.hasPressed === "true") {
        buttons.debug.style.backgroundImage = 'url(' + (isPressed ? buttons.debug.dataset.pressedImg : buttons.debug.dataset.defaultImg) + ')';
    } else {
        buttons.debug.style.backgroundColor = isPressed ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)';
    }
}

function handleDebugPress(e) {
    e.preventDefault();
    if (debugButtonPressed)
        return;
    debugButtonPressed = true;
    setDebugVisualState(true);
    triggerKey(68, 'keydown');
    triggerKey(66, 'keydown');
    triggerKey(71, 'keydown');
}

function handleDebugRelease(e) {
    e.preventDefault();
    if (!debugButtonPressed)
        return;
    debugButtonPressed = false;
    setDebugVisualState(false);
    triggerKey(68, 'keyup');
    triggerKey(66, 'keyup');
    triggerKey(71, 'keyup');
}

if (buttons.debug) {
['touchstart', 'mousedown'].forEach(function(evt) {
    buttons.debug.addEventListener(evt, handleDebugPress, { passive: false });
});
['touchend', 'mouseup', 'mouseleave'].forEach(function(evt) {
    buttons.debug.addEventListener(evt, handleDebugRelease, { passive: false });
});
}

Object.keys(keyMap).forEach(function(id) {
    var element = document.getElementById(id);
    if (!element) return;
    var keyCode = keyMap[id];
    var activeTouchId = null;
    var activeMouseDown = false;

    element.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (activeTouchId === null) {
            activeTouchId = e.changedTouches[0].identifier;
            simulateKey('keydown', keyCode);
        }
    }, { passive: false, capture: false });

    element.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                simulateKey('keyup', keyCode);
                activeTouchId = null;
                break;
            }
        }
    }, { passive: false, capture: false });

    element.addEventListener('touchcancel', function(e) {
        simulateKey('keyup', keyCode);
        activeTouchId = null;
    });

    element.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!activeMouseDown) {
            simulateKey('keydown', keyCode);
            activeMouseDown = true;
        }
    });

    element.addEventListener('mouseup', function(e) {
        e.preventDefault();
        simulateKey('keyup', keyCode);
        activeMouseDown = false;
    });

    element.addEventListener('mouseleave', function(e) {
        if (activeMouseDown) {
            simulateKey('keyup', keyCode);
            activeMouseDown = false;
        }
    });

    element._keyMapReleaseTouch = function(touchId) {
        if (activeTouchId === touchId) {
            simulateKey('keyup', keyCode);
            activeTouchId = null;
        }
    };
});

document.addEventListener('touchend', function(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
        var tid = e.changedTouches[i].identifier;
        Object.keys(keyMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el._keyMapReleaseTouch) {
                el._keyMapReleaseTouch(tid);
            }
        });
    }
});

document.addEventListener('touchcancel', function(e) {
    Object.keys(keyMap).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el._keyMapReleaseTouch) {
            el._keyMapReleaseTouch(-1);
        }
    });
});

document.addEventListener('touchmove', function(e) {
    if (Object.keys(activeButtonTouches).length > 0 || joystickTouchId !== null || (dragState && dragState.pointerType === 'touch')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('keydown', function(e) {
    if ([37, 38, 39, 40, 90, 88, 67, 112, 113, 68, 66, 71].indexOf(e.keyCode) !== -1) {
        e.preventDefault();
    }
}, true);

}
