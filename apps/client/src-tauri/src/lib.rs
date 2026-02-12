#[cfg_attr(mobile, tauri::mobile_entry_point)]
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[derive(Default)]
struct SidecarState {
    process: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
}

#[tauri::command]
fn start_sidecar(
    app: tauri::AppHandle,
    state: tauri::State<SidecarState>,
) -> Result<String, String> {
    let mut process_lock = state.process.lock().map_err(|e| e.to_string())?;

    // Se já está rodando, retorna
    if process_lock.is_some() {
        return Ok("already_running".to_string());
    }

    // Obtém o diretório de dados do app
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    // Cria o diretório se não existir
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let data_dir_str = app_data_dir
        .to_str()
        .ok_or("Invalid app data dir path")?;

    println!("[Sidecar] App data dir: {}", data_dir_str);

    // Tenta obter o caminho do node do PATH atual
    let node_path = std::env::var("PATH").unwrap_or_default();
    println!("[Sidecar] Current PATH: {}", node_path);

    // Spawna o sidecar
    let sidecar = app
        .shell()
        .sidecar("openprofia-server")
        .map_err(|e| format!("Failed to get sidecar command: {}", e))?;

    println!("[Sidecar] Spawning sidecar with env vars...");

    let (mut rx, child) = sidecar
        .env("SIDECAR_MODE", "1")
        .env("OPENPROFIA_DATA_DIR", data_dir_str)
        .env("PORT", "3000")
        .env("PATH", &node_path) // Passa o PATH para garantir que encontre o node
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    println!("[Sidecar] Sidecar spawned successfully, PID: {:?}", child.pid());

    // Armazena o processo
    *process_lock = Some(child);

    // Lê output em background (não-bloqueante)
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                    let output = String::from_utf8_lossy(&line);
                    println!("[Sidecar STDOUT] {}", output);
                    
                    // Quando vê a mensagem READY, considera que iniciou com sucesso
                    if output.contains("OPENPROFIA_SERVER_READY") {
                        println!("[Sidecar] ✅ Server is ready and listening");
                    }
                }
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    eprintln!("[Sidecar STDERR] {}", String::from_utf8_lossy(&line));
                }
                tauri_plugin_shell::process::CommandEvent::Error(err) => {
                    eprintln!("[Sidecar ERROR] {}", err);
                }
                tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                    eprintln!("[Sidecar TERMINATED] code: {:?}, signal: {:?}", payload.code, payload.signal);
                }
                _ => {}
            }
        }
        println!("[Sidecar] Event listener ended");
    });

    Ok("started".to_string())
}

#[tauri::command]
fn stop_sidecar(state: tauri::State<SidecarState>) -> Result<String, String> {
    let mut process_lock = state.process.lock().map_err(|e| e.to_string())?;

    if let Some(child) = process_lock.take() {
        child.kill().map_err(|e| format!("Failed to kill sidecar: {}", e))?;
        Ok("stopped".to_string())
    } else {
        Ok("not_running".to_string())
    }
}

#[tauri::command]
fn is_sidecar_running(state: tauri::State<SidecarState>) -> Result<bool, String> {
    let process_lock = state.process.lock().map_err(|e| e.to_string())?;
    Ok(process_lock.is_some())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .manage(SidecarState::default())
        .invoke_handler(tauri::generate_handler![
            start_sidecar,
            stop_sidecar,
            is_sidecar_running
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                // Abre o DevTools automaticamente em modo debug
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                println!("[Tauri] DevTools opened");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
