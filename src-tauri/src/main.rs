// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::sync::Mutex;
use std::collections::HashMap;

use serde::Serialize;

use tauri::CustomMenuItem;
use tauri::Menu;
use tauri::Submenu;
use tauri::Window;
use tauri::Manager;
use tauri::api::dialog;

use uuid::Uuid;

#[derive(Clone, serde::Serialize)]
struct Feature {
    //id: usize,
    lng: f32,
    lat: f32,
    attributes: Vec<String>,
}

#[derive(Clone, serde::Serialize)]
struct FilePayload {
    uuid: String,
    filename: String,
    features: Vec<Feature>,
}

#[derive(Clone, serde::Serialize)]
struct Table {
    columns: Vec<String>,
    rows: Vec<Feature>,
}

#[derive(Clone, serde::Serialize)]
struct Field {
    name: String,
    value: String,
}

#[derive(Serialize)]
pub(crate) struct LayerState {
    layers: HashMap<String, Vec<Vec<String>>>
}

impl Default for LayerState {
    fn default() -> Self {
        Self {
            layers: HashMap::new(),
        }
    }
}

struct Storage {
    store: Mutex<HashMap<String, Table>>,
}

#[derive(Clone, serde::Serialize)]
struct InitialPayload {
    uuid: String,
    filename: String,
    features: Vec<Feature>,
}

#[tauri::command]
async fn create_table_window(app_handle: tauri::AppHandle, layer_id: String) {
    let mut url = "/table/".to_string();
    url.push_str(&layer_id);

    tauri::WindowBuilder::new(
        &app_handle,
        layer_id,
        tauri::WindowUrl::App(url.parse().unwrap())
    ).build().unwrap();
}

#[tauri::command]
async fn get_layer_attributes(app_handle: tauri::AppHandle, layer_id: String) -> Vec<Vec<String>> {
    let layer = app_handle.try_state::<Storage>()
        .unwrap()
        .store
        .lock()
        .unwrap()
        .get(&layer_id)
        .unwrap()
        .clone();

    let attributes = layer.rows
        .into_iter()
        .map(|x| x.attributes);

    let head = layer.columns;
    let tail = Vec::from_iter(attributes);

    let mut result = vec![head];
    result.extend(tail);

    return result;
}

fn load_file(window: Window) {
    dialog::FileDialogBuilder::default()
        .add_filter("csv", &["csv"])
        .pick_file(move |filepath| match filepath {
            Some(x) => {
                let x_copy = x.clone();
                let filepath = x.to_str().expect("this be string right?");
                let filename = filepath.split("/").last().expect("omg just split");
                let contents = fs::read_to_string(x_copy).expect("srsly now");

                let uuid = Uuid::new_v4();

                let columns: Vec<String> = contents.lines()
                    .next()
                    .unwrap()
                    .split(";")
                    .skip(2)
                    .map(|s| s.to_string())
                    .collect();

                let features: Vec<Feature> = contents.lines()
                    .skip(1)
                    .map(|l| l.split(";").map(|s| s.to_string()))
                    .enumerate()
                    .map(|mut r| Feature { 
                        lng: r.1.next().unwrap().parse::<f32>().unwrap(),
                        lat: r.1.next().unwrap().parse::<f32>().unwrap(),
                        attributes: Vec::from_iter(r.1),
                    })
                    .collect();

                window.app_handle()
                    .try_state::<Storage>()
                    .expect("oh noes!")
                    .store
                    .lock()
                    .expect("woe is me!")
                    .insert(uuid.to_string(), Table { columns, rows: features.clone() });

                let _ = window.emit(
                    "create_layer",
                    InitialPayload {
                        uuid: uuid.to_string(),
                        filename: filename.to_string(),
                        features,
                    }
                );
            }
            None => println!("oh no!")
        })          
}

#[tauri::command]
fn delete_layer(app_handle: tauri::AppHandle, layer_id: String) {
    app_handle.try_state::<Storage>()
        .expect("oh noes!")
        .store
        .lock()
        .expect("woe is me!")
        .remove(&layer_id);
}

#[tauri::command]
fn get_feature_attributes(app_handle: tauri::AppHandle, layer_id: String, feature_id: usize) -> Vec<Field> {
    let state = app_handle.try_state::<Storage>().expect("oh noes!");
    let layers = state
        .store
        .lock()
        .expect("woe is me!");
    let table = layers
        .get(&layer_id)
        .expect("dang it");
    let columns = &table.columns;
    let attributes = &table.rows[feature_id].attributes;

    return columns.iter()
        .zip(attributes.iter())
        .map(|x| Field{ 
            name: x.0.to_string(), 
            value: x.1.to_string() 
        })
        .collect();
}

fn main() {
    let menu_item = CustomMenuItem::new("file_import".to_string(), "Import");
    let submenu = Submenu::new("Files", Menu::new().add_item(menu_item));
    let menu = Menu::new().add_submenu(submenu);

    tauri::Builder::default()
        .manage(Storage { store: Default::default() } )
        .menu(menu)
        .on_menu_event(move |event| {
            match event.menu_item_id() {
                "file_import" => {
                    load_file(event.window().clone());
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            create_table_window,
            get_layer_attributes,
            delete_layer,
            get_feature_attributes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
