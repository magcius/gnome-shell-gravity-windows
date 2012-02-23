
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

let settings;

function init() {
}

function buildPrefs(grid, settings, label, min, max) {
    let key = label.toLowerCase();

    let labelWidget = new Gtk.Label({ label: label });
    grid.attach_next_to(labelWidget, null, Gtk.PositionType.BOTTOM, 1, 1);

    let adjustment = new Gtk.Adjustment({ lower: min, upper: max });
    let scale = new Gtk.Scale({ adjustment: adjustment, digits: 3, hexpand: true });
    settings.bind(key, adjustment, 'value', 0);
    grid.attach_next_to(scale, labelWidget, Gtk.PositionType.RIGHT, 1, 1);
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
                              border_width: 10 });

    let settings = Convenience.getSettings();

    let grid = new Gtk.Grid();
    buildPrefs(grid, settings, "Gravity", 0, 2);
    buildPrefs(grid, settings, "Drag", 0, 1);
    buildPrefs(grid, settings, "Friction", 0, 1);
    buildPrefs(grid, settings, "Bounce", 0, 1);

    frame.add(grid);
    frame.show_all();
    return frame;
}
