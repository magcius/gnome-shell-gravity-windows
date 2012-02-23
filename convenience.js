
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

function getSettings() {
    let schemaDir = Extension.dir.get_child('schemas').get_path();
    let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
								   Gio.SettingsSchemaSource.get_default(),
								   false);
    let schema = schemaSource.lookup('org.gnome.shell.extensions.gravity-windows', false);
    return new Gio.Settings({ settings_schema: schema });
}
