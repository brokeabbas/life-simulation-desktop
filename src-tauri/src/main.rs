#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init()) // ✅ FS only
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
