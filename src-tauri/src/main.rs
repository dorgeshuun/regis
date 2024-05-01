// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::sync::Mutex;
use std::collections::HashMap;
use std::path::PathBuf;

use serde::Serialize;

use tauri::CustomMenuItem;
use tauri::Menu;
use tauri::Submenu;
use tauri::Window;
use tauri::Manager;
use tauri::api::dialog::FileDialogBuilder;

use uuid::Uuid;

#[derive(Clone, serde::Serialize)]
struct Extent {
    west: f32,
    south: f32,
    east: f32,
    north: f32,
}

impl Extent {
    const DEFAULT: Extent = Extent {
        west: f32::INFINITY, 
        south: f32::INFINITY, 
        east: f32::NEG_INFINITY, 
        north: f32::NEG_INFINITY,
    };

    fn take(&self, point: Point) -> Extent {
        Extent {
            west: self.west.min(point.lng),
            south: self.south.min(point.lat),
            east: self.east.max(point.lng),
            north: self.north.max(point.lat),
        }
    }
}

impl FromIterator<Point> for Extent {
    fn from_iter<I: IntoIterator<Item=Point>>(iter: I) -> Self {
        let mut extent = Extent::DEFAULT;

        for point in iter {
            extent = extent.take(point);
        }

        extent
    }
}

impl std::fmt::Display for Extent {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{} {} {} {}", self.west, self.south, self.east, self.north)
    }
}

#[derive(Clone, serde::Serialize)]
struct Feature {
    lng: f32,
    lat: f32,
    attributes: Vec<String>,
}

#[derive(Clone, serde::Serialize)]
struct Layer {
    uuid: String,
    filename: String,
    features: Vec<Feature>,
}

#[derive(Serialize)]
pub(crate) struct LayerCollection {
    layers: HashMap<String, Layer>
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

struct Point {
    lng: f32,
    lat: f32,
}

#[derive(Clone, serde::Serialize)]
struct Field {
    name: String,
    value: String,
}

#[derive(Clone, serde::Serialize)]
struct Column {
    title: String,
    numeric: bool,
}

#[derive(Clone, serde::Serialize)]
struct Table {
    columns: Vec<Column>,
    rows: Vec<Feature>,
}

#[derive(Clone, serde::Serialize)]
struct InitialPayload {
    uuid: String,
    filename: String,
    features: Vec<Feature>,
    extent: Extent,
}

#[tauri::command]
async fn create_table_window(app_handle: tauri::AppHandle, layer_id: String) {
    let mut path = PathBuf::new();
    path.push("/table/");
    path.push(&layer_id);
    let url = tauri::WindowUrl::App(path);
    let _ = tauri::WindowBuilder::new(&app_handle, layer_id, url)
        .build()
        .expect("could not build window")
        .menu_handle()
        .hide();
}

#[tauri::command]
async fn get_layer_attributes(app_handle: tauri::AppHandle, layer_id: String, sort_col: usize, sort_dir: String) -> Vec<Vec<String>> {
    let layer = app_handle.try_state::<Storage>()
        .unwrap()
        .store
        .lock()
        .unwrap()
        .get(&layer_id)
        .unwrap()
        .clone();

    let attributes = layer.rows.into_iter().map(|x| x.attributes);
    let head = layer.columns.clone().into_iter().map(|c| c.title).collect();
    let mut tail = Vec::from_iter(attributes);

    if layer.columns[sort_col].numeric {
        tail.sort_unstable_by(
            |a, b| a[sort_col].parse::<u32>()
                .unwrap()
                .cmp(&b[sort_col].parse::<u32>().unwrap())
        );
    } else {
        tail.sort_unstable_by(|a, b| a[sort_col].cmp(&b[sort_col]));
    }

    match sort_dir.as_str() {
        "asc" => None,
        "desc" => Some(tail.reverse()),
        _ => panic!("crash and burn"),
    };

    let mut result = vec![head];
    result.extend(tail);

    return result;
}

fn get_columns(text: &String) -> Vec<Column> {
    let initial: Vec<Column> = text.lines()
        .next()
        .expect("file should contain at least a header")
        .split(";")
        .skip(2)
        .map(|s| Column { title: s.to_string(), numeric: true })
        .collect();

    text.lines()
        .skip(1)
        .map(|s| s.split(";")
            .skip(2)
            .map(|s| s.to_string())
            .map(|s| s.parse::<u32>())
            .map(|result| result.is_ok())
        )
        .fold(
            initial, 
            |x, y| y.enumerate()
                .map(|(i, val)| Column { 
                    title: x[i].title.clone(), 
                    numeric: if x[i].numeric { val } else { false }
                })
                .collect()
        )
}

fn get_points(text: &String) -> Vec<Point> {
    text.lines()
        .skip(1)
        .map(|l| l.split(";")
            .into_iter()
            .take(2)
            .map(|x| x.parse::<f32>().expect("cannot parse value into float"))
            .collect::<Vec<f32>>()
        )
        .map(|l| Point{ lng: l[0], lat: l[1] })
        .collect()
}

fn save_layer(window: &Window, uuid: String, table: Table) {
    window.app_handle()
        .try_state::<Storage>()
        .expect("oh noes!")
        .store
        .lock()
        .expect("woe is me!")
        .insert(uuid, table);
}

fn get_features(text: &String) -> Vec<Feature> {
    text.lines()
        .skip(1)
        .map(|l| {
            let result = l.split(";").collect::<Vec<_>>();
            let lng = result[0]
                .parse::<f32>()
                .expect("could not parse to float");
            let lat = result[1]
                .parse::<f32>()
                .expect("could not parse to float");
            let attributes = result[2..]
                .iter()
                .map(|x| String::from(*x))
                .collect();
            Feature { lng, lat, attributes }
        })
        .collect()
}

fn load_file(window: Window) {
    FileDialogBuilder::default()
        .add_filter("csv", &["csv"])
        .pick_file(move |filepath| match filepath {
            None => {},
            Some(x) => {
                let contents = fs::read_to_string(x.clone()).expect("srsly now");
                let filename = x.to_str()
                    .expect("this be string right?")
                    .split("/")
                    .last()
                    .expect("omg just split")
                    .to_string();

                let uuid = Uuid::new_v4().to_string();
                let columns = get_columns(&contents);
                let features = get_features(&contents);
                let points = get_points(&contents);
                let table = Table { columns, rows: features.clone() };
                save_layer(&window, uuid.clone(), table);

                let extent = Extent::from_iter(points);
                let payload = InitialPayload { uuid, filename, features, extent };
                let _ = window.emit("create_layer", payload);
            }
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
    println!("{} {}", layer_id, feature_id);
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
            name: x.0.title.to_string(), 
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
