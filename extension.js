// Based off of the famous "Gravity Tutorial" by Keith Peters, 2001:
// http://www.bit-101.com/tutorials/gravity.html

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;

const PhysicsSettings = {};

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

const GravityWindow = new Lang.Class({
    Name: 'GravityWindow',

    _init: function(metaWindow) {
        this.metaWindow = metaWindow;

        this.velX = 0;
        this.velY = 0;

        this.oldX = 0;
        this.oldY = 0;

        this.grabbed = false;
        this.resting = false;
    },

    grab: function() {
        this.velX = 0;
        this.velY = 0;

        let rect = this.metaWindow.get_outer_rect();
        this.oldX = rect.x;
        this.oldY = rect.y;
        this.grabbed = true;
    },

    ungrab: function() {
        this.grabbed = false;
    },

    step: function() {
        if (this.metaWindow.get_maximized() || this.metaWindow.is_fullscreen() || this.metaWindow.is_override_redirect())
            return;

        let rect = this.metaWindow.get_outer_rect();
        if (this.grabbed) {
            this.velX = this.velX / 4 + (rect.x - this.oldX);
            this.velY = this.velY / 4 + (rect.y - this.oldY);

            this.oldX = rect.x;
            this.oldY = rect.y;
            return;
        }

        this.velX = this.velX * PhysicsSettings.DRAG;
        this.velY = this.velY * PhysicsSettings.DRAG + PhysicsSettings.GRAVITY;

        let x = Math.floor(rect.x + this.velX);
        let y = Math.floor(rect.y + this.velY);

        this.metaWindow.move_frame(false, x, y);

        let newRect = this.metaWindow.get_outer_rect();

        // If the new position isn't where we wanted it to be,
        // then assume that it was constrained, so we need to
        // bounce it.
        if (newRect.x != x) {
            this.velX = -this.velX * PhysicsSettings.BOUNCE;
            this.velY *= PhysicsSettings.FRICTION;
        }

        if (newRect.y != y) {
            this.velY = -this.velY * PhysicsSettings.BOUNCE;
            this.velX *= PhysicsSettings.FRICTION;
        }

        if (Math.abs(this.velX) < 0.02)
            this.velX = 0;

        if (Math.abs(this.velY) < 0.02)
            this.velY = 0;
    },
});

const GravityWindows = new Lang.Class({
    Name: 'GravityWindows',

    _init: function() {
        this._timeline = new Clutter.Timeline({ duration: 100,
                                                repeat_count: -1 });
        this._timeline.connect('new-frame', Lang.bind(this, this._newFrame));

        this._gravityWindows = [];

        this._settings = Convenience.getSettings();
        ['gravity', 'drag', 'friction', 'bounce'].forEach(function(key) {
            this._settings.connect('changed::' + key, Lang.bind(this, this._physicsChanged));
            PhysicsSettings[key.toUpperCase()] = this._settings.get_double(key);
        }, this);
    },

    _physicsChanged: function(settings, key) {
        PhysicsSettings[key.toUpperCase()] = settings.get_double(key);
    },

    _newFrame: function() {
        this._gravityWindows.forEach(function(gw) {
            gw.step();
        });
    },

    _getGravityWindow: function(window) {
        for (let i = 0; i < this._gravityWindows.length; i++)
            if (this._gravityWindows[i].metaWindow == window)
                return this._gravityWindows[i];
        return null;
    },

    _onBeginGrabOp: function(display, op, window) {
        let gw = this._getGravityWindow(window);
        if (gw) gw.grab();
    },

    _onEndGrabOp: function(display, op, window) {
        let gw = this._getGravityWindow(window);
        if (gw) gw.ungrab();
    },

    _onWindowCreated: function(display, window) {
        this._addWindow(window);
    },

    _addWindow: function(window) {
        let gw = new GravityWindow(window);
        this._gravityWindows.push(gw);
        window.connect('unmanaged', Lang.bind(this, function() {
            this._gravityWindows.splice(this._gravityWindows.indexOf(gw), 1);
        }));
    },

    enable: function() {
        this._timeline.start();

        this._beginGrabOpId = global.display.connect('begin-grab-op', Lang.bind(this, this._onBeginGrabOp));
        this._endGrabOpId = global.display.connect('end-grab-op', Lang.bind(this, this._onEndGrabOp));
        this._windowCreatedId = global.display.connect('window-created', Lang.bind(this, this._onWindowCreated));

        global.get_window_actors().forEach(Lang.bind(this, function(actor) {
            this._addWindow(actor.get_meta_window());
        }));
    },

    disable: function() {
        this._timeline.stop();
        global.display.disconnect(this._beginGrabOpId);
        global.display.disconnect(this._endGrabOpId);
        global.display.disconnect(this._windowCreatedId);
    },
});

function init() {
    return new GravityWindows();
}
